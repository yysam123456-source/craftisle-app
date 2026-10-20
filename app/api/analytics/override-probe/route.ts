/**
 * 覆盖层自证端点（DEBT-31）
 * ──────────────────────────────────────────────────────────────
 * 存在的理由：覆盖层闭环此前**无法端到端自证**。
 *
 * 背景（2026-10-20 实测）：
 *   auto-tune apply 返回 savedToDb=1、DB 直查 count=1、生产进程内
 *   getOverride() 也返回新标题（probeFound=true），
 *   但线上 <title> 30 分钟仍是旧的。逐层排查后定位到两个独立原因：
 *     ① 页面 HTML 的 ISR 缓存没被失效（写库不会让 Vercel 重建缓存）
 *     ② **vercel.json 的 buildCommand 跑 `prisma db push --accept-data-loss`，
 *        它以 schema.prisma 为准 —— schema 里没有的表会被 drop。
 *        page_meta_override 此前是运行时建出来的孤儿表
 *        ⇒ 每次 Vercel 部署都会把整张覆盖层表删掉。**
 *
 * 而这两件事的症状在「线上只看标题」时**完全一样**，
 * 且 count=0 也无法区分「本来就没有」与「刚被删掉」（运行时 ensureTable 会立刻重建表）。
 *
 * 所以本端点提供三个能自证的判据：
 *   ?seed=1  —— 写一条探针覆盖并**立刻回读**（GET 即可触发，不依赖 POST 通道）
 *   ?diag=1  —— 读 pg_class 的表身份元信息（relcreationtime / relfilenode）
 *   默认      —— 读侧全量诊断（同步版 + async 版 + SQL 直查 + 表元信息）
 *
 * 判据表被删没：
 *   relcreationtime 变成「最近」⇒ 表被删后重建过（db push 删的）
 *   relcreationtime 保持很久以前 ⇒ 表一直在
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  refreshOverrides,
  getOverride,
  getOverrideAsync,
  lastLoadError,
} from "@/lib/seo/page-meta-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

/** 探针用的固定路由 —— 必须是一个真实存在的工具页，不能写幽灵覆盖。 */
const PROBE_ROUTE = "/tools/handwriting-animation";
const PROBE_TITLE = "Handwriting Text Animation — Create Animated Text Online";
const PROBE_DESC =
  "Turn any text into a smooth handwriting animation right in your browser. Choose a font, set the speed, and export a video — no sign-up, nothing uploaded.";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const auto = req.nextUrl.searchParams.get("autotune");
  if (auto && process.env.GROWTH_AUTOTUNE && auto === process.env.GROWTH_AUTOTUNE) return true;
  const secret = req.nextUrl.searchParams.get("secret");
  return !!(CRON_SECRET && secret === CRON_SECRET);
}

/**
 * 表的存在性与规模 —— 判断「表被删过没」的辅助信息。
 *
 * 🔴 2026-10-20 修正：**不要查 pg_class**。
 *   线上实测：查 `pg_class`（relfilenode / reltuples / relcreationtime）会让端点 500。
 *   原因：这些列是 PG 内部类型（oid / real），Prisma 的 raw query 在结果反序列化阶段
 *   处理不了，且异常发生在 try/catch 之外 ⇒ 整个端点挂掉。
 *   而 `information_schema` 是 SQL 标准视图，列类型都是标准类型 ⇒ 安全。
 *
 *   `table_rows` 来自 information_schema.tables（PG 的估算值，可能为 null）。
 *   表被 DROP + CREATE 后，information_schema 里的行会重新出现 ⇒
 *   「表存在但没有数据」与「表刚被重建」仍需结合部署时点判断。
 */
async function readTableMeta() {
  try {
    // ⚠️ 只查 table_schema / table_name —— 这两列任何 PG 版本都有。
    //   实测本项目 PG 版本连 information_schema.tables.table_rows 都没有（42703），
    //   更不用说 pg_class 的 oid/real 列 ⇒ 一律别碰非标准列。
    const rows = (await prisma.$queryRawUnsafe<
      Array<{ table_schema: string | null; table_name: string | null; table_type: string | null }>
    >(
      `SELECT table_schema, table_name, table_type
       FROM information_schema.tables
       WHERE table_name = 'page_meta_override'`,
    )) as Array<{ table_schema: string | null; table_name: string | null; table_type: string | null }>;
    if (!rows.length) return { exists: false };
    const r = rows[0];
    // 精确行数用 count(*) —— 不用 table_rows（估算值 + 老版本没有该列）。
    let exactCount: number | null = null;
    try {
      const c = (await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
        "SELECT count(*)::bigint AS c FROM page_meta_override",
      )) as Array<{ c: bigint }>;
      exactCount = c.length ? Number(c[0].c) : null;
    } catch (e: any) {
      // 表不存在时 count 也会失败，忽略即可（exists 已判定）
    }
    return {
      exists: true,
      tableSchema: r.table_schema,
      tableName: r.table_name,
      tableType: r.table_type,
      exactCount,
    };
  } catch (e: any) {
    return { error: e?.message || String(e) };
  }
}

export async function GET(req: NextRequest) {
  try {
    return await handle(req);
  } catch (e: any) {
    // 🔴 2026-10-20：顶层兜底。裸 500 + 空 body 会让排查只能靠猜
    //   （本次就栽在这：pg_class 查询反序列化失败 ⇒ 端点 500，看不到任何错误信息）。
    //   诊断端点的价值就在于**说出错误**，所以这里必须把错误带出来。
    console.error("[override-probe] 未捕获异常：", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || String(e),
        stack: typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 6).join("\n") : null,
      },
      { status: 500 },
    );
  }
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 模式 1：写探针 + 立刻回读（端到端自证）──
  if (req.nextUrl.searchParams.get("seed") === "1") {
    try {
      const { saveOverrides } = await import("@/lib/seo/page-meta-db");
      const saved = await saveOverrides([
        {
          route: PROBE_ROUTE,
          title: PROBE_TITLE,
          description: PROBE_DESC,
          provenance: "verified",
          lastOptimized: new Date().toISOString(),
        },
      ]);

      let revalidated = false;
      let revalidateError: string | null = null;
      try {
        revalidatePath(PROBE_ROUTE);
        revalidated = true;
      } catch (e: any) {
        revalidateError = e?.message || String(e);
      }

      // 写完立刻直查回读 —— 不读回就等于没自证
      const rows = (await prisma.$queryRawUnsafe<Array<{ route: string; title: string | null }>>(
        "SELECT route, title FROM page_meta_override WHERE route = $1",
        PROBE_ROUTE,
      )) as Array<{ route: string; title: string | null }>;

      return NextResponse.json({
        ok: true,
        mode: "seed-probe",
        savedToDb: saved,
        revalidated,
        revalidateError,
        readback: { count: rows.length, title: rows[0]?.title ?? null },
        consistent: saved > 0 && rows.length === 1,
        tableMeta: await readTableMeta(),
        note:
          saved > 0 && rows.length === 1
            ? "✅ 写入与回读一致（表在、写入生效）。"
            : "❌ 写入与回读不一致 —— 查表是否被 prisma db push 删掉。",
      });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, mode: "seed-probe", error: e?.message || String(e) },
        { status: 500 },
      );
    }
  }

  // ── 模式 2：只失效路径缓存（不写库）──
  if (req.nextUrl.searchParams.get("revalidate") === "1") {
    const revalidated: string[] = [];
    const errors: any[] = [];
    try {
      const rows = (await prisma.$queryRawUnsafe<Array<{ route: string }>>(
        "SELECT route FROM page_meta_override",
      )) as Array<{ route: string }>;
      for (const r of rows) {
        try {
          revalidatePath(r.route);
          revalidated.push(r.route);
        } catch (e: any) {
          errors.push({ route: r.route, error: e?.message || String(e) });
        }
      }
    } catch (e: any) {
      errors.push({ route: "*", error: e?.message || String(e) });
    }
    return NextResponse.json({
      ok: true,
      mode: "revalidate-only",
      revalidated,
      errors,
      note: `已失效 ${revalidated.length} 条路径缓存（页面上一次请求会重建）。`,
    });
  }

  // ── 模式 3（默认）：读侧全量诊断 ──
  const hasDb = !!process.env.DATABASE_URL;
  if (!hasDb) {
    return NextResponse.json({
      ok: false,
      hasDb: false,
      note: "DATABASE_URL 缺失 ⇒ 读侧必然为空",
    });
  }

  await refreshOverrides();
  const probeSync = getOverride(PROBE_ROUTE);
  // 页面（generateMetadata）走的是 async 版；两者冷缓存下行为不同
  const probeAsync = await getOverrideAsync(PROBE_ROUTE);

  const sqlRows = await (async () => {
    try {
      const rows = (await prisma.$queryRawUnsafe<Array<{ route: string; title: string | null }>>(
        "SELECT route, title FROM page_meta_override LIMIT 20",
      )) as Array<{ route: string; title: string | null }>;
      return { count: rows.length, sample: rows };
    } catch (e: any) {
      return { error: e?.message || String(e) };
    }
  })();

  return NextResponse.json({
    ok: true,
    mode: "diagnose",
    hasDb: true,
    probeRoute: PROBE_ROUTE,
    probeSyncFound: !!probeSync,
    probeSyncTitle: probeSync?.title ?? null,
    probeAsyncFound: !!probeAsync,
    probeAsyncTitle: probeAsync?.title ?? null,
    lastLoadError: lastLoadError ?? null,
    sqlRows,
    tableMeta: await readTableMeta(),
    note:
      "tableMeta.relcreationtime 若为「最近」⇒ 表被删后重建过（prisma db push 删的）；" +
      "若保持很久以前 ⇒ 表一直在。",
  });
}
