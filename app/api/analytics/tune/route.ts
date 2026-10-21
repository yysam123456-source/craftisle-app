/**
 * 每日 SEO 自动调优端点（同进程直调，绕开 Vercel Cron / Cloudflare）
 * ─────────────────────────────────────────────────────────────────
 * 为什么是 /api/analytics/* 而不是 /api/cron/*：
 *   Vercel Cron 派发的请求出公网绕回 Cloudflare 被 403 拦截（2026-08 静默失效 12 天）。
 *   本端点由 WorkBuddy 每日自动化从客户端直接调用（/api/analytics/* 不被 CF 挑战），
 *   在服务端「同进程」完成 GSC 拉取 + 差距分析 + 生成计划 + 写入 Postgres 覆盖层，
 *   全程不出公网、不被 CF 拦。
 *
 * 与 auto-optimize(/api/cron) 的区别：
 *   - auto-optimize 只改写 PAGE_META_BASE 的 5 个 base 路由；
 *   - 本端点把优化目标扩到「全部工具页 / 类目页」（从 toolMeta 构建完整 meta 映射），
 *     真正实现「工具类目长尾词」的 meta 重写（Q1=仅 meta，合规、零部署、当天生效）。
 *
 * 护栏：默认 dryRun 预览；仅 ?apply=1 才写库。PROTECTED_ROUTES 永远不清写。每日上限 40 路由。
 * 鉴权：x-vercel-cron 或 ?secret=<CRON_SECRET>。
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchGscPerformance, isGscConfigured } from "@/lib/seo/gsc-client";
import { analyzeTopicalGaps, QueryPageRow } from "@/lib/seo/topical-gaps";
import {
  buildOptimizationPlan,
  buildOverridesFromEdits,
  PROTECTED_ROUTES,
} from "@/lib/seo/optimizer";
import { PAGE_META_BASE, PageMeta } from "@/lib/seo/page-meta";
import { saveOverrides, deleteOverrides } from "@/lib/seo/page-meta-db";
import { toolMeta } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

/** 每日新写覆盖的路由上限（防止失控；覆盖可逆，可在 GSC/DB 随时回滚）。 */
const DAILY_ROUTE_CAP = 40;

/** 诊断覆盖层读侧：DB 可达？缓存里有几条？目标路由在不在？ */
async function diagnoseOverrides() {
  const hasDb = !!process.env.DATABASE_URL;
  if (!hasDb) return { hasDb: false, note: "DATABASE_URL 缺失 ⇒ 读侧必然为空" };
  try {
    const { refreshOverrides, getOverride, getOverrideAsync, lastLoadError } = await import(
      "@/lib/seo/page-meta-db"
    );
    await refreshOverrides();
    const probe = getOverride("/tools/handwriting-animation");
    // 🔴 2026-10-20：必须用 **async 版**再探一次。
    //   页面（generateMetadata）走 getOverrideAsync，诊断却只探同步版 ——
    //   两者冷缓存下行为不同（同步版首次必 undefined）。
    //   只探同步版会让人误判「页面读不到覆盖」，其实页面读得到。
    const probeAsync = await getOverrideAsync("/tools/handwriting-animation");
    return {
      hasDb: true,
      probeRoute: "/tools/handwriting-animation",
      probeFound: !!probe,
      probeTitle: probe?.title ?? null,
      // 页面实际使用的读法（async）的结果 —— 这才是页面的真实读侧状态
      probeAsyncFound: !!probeAsync,
      probeAsyncTitle: probeAsync?.title ?? null,
      // 🔴 上一次覆盖层加载失败的原因。null = 上次成功。
      //   之前该字段存在但从未对外暴露 ⇒ DB 读失败时外部完全看不见，
      //   症状与「没写进去」一模一样，只能靠猜。
      lastLoadError: lastLoadError ?? null,
      // 🔴🔴 2026-10-20（DEBT-31）：表的**存在性** —— 辅助判断「表被删过没」。
      //   背景：vercel.json 的 buildCommand 跑 `prisma db push --accept-data-loss`，
      //   它以 schema 为准，schema 里没有的表会被 drop ⇒ 覆盖层表活不过一次部署。
      //   仅看 count=0 无法区分「本来就没有」与「刚被删掉」——
      //   因为运行时 ensureTable() 会立刻把表重建出来。
      //   ⚠️ **不要查 pg_class**（relfilenode / reltuples 是 PG 内部类型，
      //      Prisma raw query 反序列化会炸 ⇒ 线上实测整个端点 500）。
      //      改用 information_schema（SQL 标准视图，类型安全）。
      tableMeta: await (async () => {
        try {
          const { prisma } = await import("@/lib/db");
          const rows = (await prisma.$queryRawUnsafe<Array<{
            table_schema: string | null;
            table_name: string | null;
            table_type: string | null;
          }>>(
            `SELECT table_schema, table_name, table_type
             FROM information_schema.tables
             WHERE table_name = 'page_meta_override'`
          )) as Array<{ table_schema: string | null; table_name: string | null; table_type: string | null }>;
          if (!rows.length) return { exists: false };
          const r = rows[0];
          // ⚠️ 不用 table_rows（估算值，且本项目 PG 版本没有该列 ⇒ 42703）。
          let exactCount: number | null = null;
          try {
            const c = (await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
              "SELECT count(*)::bigint AS c FROM page_meta_override",
            )) as Array<{ c: bigint }>;
            exactCount = c.length ? Number(c[0].c) : null;
          } catch {
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
      })(),
      // 直查 SQL，绕开缓存 —— 缓存可能是旧的
      sqlRows: await (async () => {
        try {
          const { prisma } = await import("@/lib/db");
          const rows = (await prisma.$queryRawUnsafe(
            "SELECT route, title FROM page_meta_override LIMIT 10"
          )) as Array<{ route: string; title: string | null }>;
          return { count: rows.length, sample: rows };
        } catch (e: any) {
          return { error: e?.message || String(e) };
        }
      })(),
    };
  } catch (e: any) {
    return { hasDb: true, error: e?.message || String(e) };
  }
}

/**
 * 🔴 2026-10-20（DEBT-30）：手动失效已写入覆盖的路径缓存。
 *
 * 为什么需要：写入覆盖层只是改 Postgres，页面 HTML 仍被 Vercel 的 ISR 缓存住。
 * 自动流程已加 revalidatePath，但当写入发生在**旧版本代码**（尚未部署 revalidatePath
 * 的那一次）时，缓存不会自动失效，只能手动补一次。
 * 这条通道也用于排查：立即让线上反映覆盖层，不必等 5 分钟窗口。
 */
async function revalidateOverrideRoutes(): Promise<{ revalidated: string[]; errors: any[] }> {
  const revalidated: string[] = [];
  const errors: any[] = [];
  try {
    const { prisma } = await import("@/lib/db");
    const rows = (await prisma.$queryRawUnsafe<Array<{ route: string }>>(
      "SELECT route FROM page_meta_override"
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
  return { revalidated, errors };
}

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  // 🔴 2026-10-15：GROWTH_AUTOTUNE 通道。
  // CRON_SECRET 是 Vercel 的 sensitive 变量，API 不回传明文
  //（GET /v9/projects/{id}/env/{envId}?decrypt=true 的 value 为空），
  // 本机/每日自动化侧永远拿不到它 ⇒ 只能看 dryRun，写不进去。
  // 这个 token 由我在部署时自己写入、自己记在 .workbuddy/secrets/ 下，两端都知道值。
  const auto = req.nextUrl.searchParams.get("autotune");
  if (auto && process.env.GROWTH_AUTOTUNE && auto === process.env.GROWTH_AUTOTUNE) return true;
  const secret = req.nextUrl.searchParams.get("secret");
  return !!(CRON_SECRET && secret === CRON_SECRET);
}

/**
 * 构建「完整 meta 映射」：base 5 路由 + 全部工具页路由（来自 toolMeta）。
 * 优化器只改写映射中存在的路由；GSC 命中的工具页若不在映射里会被 deferred（安全）。
 * 仅纳入 craftisle.com 主站工具页（子域 pdf/games 等是独立部署，不在本映射内）。
 */
function buildFullMeta(): Record<string, PageMeta> {
  const map: Record<string, PageMeta> = {};
  for (const [route, m] of Object.entries(PAGE_META_BASE)) map[route] = m;
  for (const slug of Object.keys(toolMeta)) {
    const t = toolMeta[slug] as any;
    if (!t) continue;
    const route = `/tools/${slug}`;
    map[route] = {
      route,
      title: String(t.seoTitle || t.title || slug),
      description: String(t.seoDesc || t.desc || "Free online tool"),
      provenance: "verified",
      lastOptimized: null,
    };
  }
  return map;
}


/**
 * 🔴 2026-10-15 新增：接收**已校验的**调优方案并写入覆盖层。
 *
 * 为什么要这条而不是让 GET 端点自己算：
 * GET 端点用自带的 analyzeTopicalGaps 重算，它只认"位次在阈值附近"的词，
 * 而长尾词的形态是「0 曝光/深位次」⇒ 它算出来的 edits 恒为空。
 * 实测：auto-tune 脚本算好 1 条方案，GET 端点返回 `overrides: []`。
 *
 * 真正的分工是：
 *   `scripts/auto-tune.ts`（本机，有 GitHub 源码可读）做匹配 + 意图闸门 + 长度闸门
 *   → POST 本端点（唯一有 DB 写权限的地方）→ 写覆盖层
 * 这样"算"与"写"分离，且**所有写入都必须先过本机侧的闸门**。
 *
 * 安全：与 GET 同一套鉴权；仍需 ?apply=1；服务端二次校验长度与路由白名单。
 */
export async function POST(req: NextRequest) {
  const apply = req.nextUrl.searchParams.get("apply") === "1";
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    edits?: Array<{
      route: string;
      title?: string;
      description?: string;
      query?: string;
      impressions?: number;
    }>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const incoming = Array.isArray(body?.edits) ? body.edits : [];
  if (incoming.length === 0) {
    return NextResponse.json({ ok: true, savedToDb: 0, note: "无 edits 提交，未写入。" });
  }

  // ── 服务端二次校验（不信任客户端闸门）──
  const TITLE_MAX = 60;
  const DESC_MAX = 160;
  const rejected: Array<{ route: string; reason: string }> = [];
  const accepted: typeof incoming = [];

  for (const e of incoming) {
    if (typeof e?.route !== "string" || !e.route.startsWith("/tools/")) {
      rejected.push({ route: String(e?.route ?? "?"), reason: "路由格式非法（只接受 /tools/*）" });
      continue;
    }
    if (PROTECTED_ROUTES.has(e.route)) {
      rejected.push({ route: e.route, reason: "PROTECTED_ROUTES 永不改写" });
      continue;
    }
    // 必须能在 toolMeta 里找到，防止写入一个不存在的路由（幽灵覆盖）
    if (!toolMeta[e.route.replace("/tools/", "")]) {
      rejected.push({ route: e.route, reason: "toolMeta 里没有这个 id，会写成幽灵覆盖" });
      continue;
    }
    if (e.title !== undefined && (typeof e.title !== "string" || e.title.length > TITLE_MAX)) {
      rejected.push({ route: e.route, reason: `title 超 ${TITLE_MAX} 字符` });
      continue;
    }
    if (
      e.description !== undefined &&
      (typeof e.description !== "string" || e.description.length > DESC_MAX)
    ) {
      rejected.push({ route: e.route, reason: `description 超 ${DESC_MAX} 字符` });
      continue;
    }
    accepted.push(e);
    if (accepted.length >= DAILY_ROUTE_CAP) break;
  }

  if (!apply) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      wouldSave: accepted.length,
      rejected,
      note: "加 ?apply=1 才会真写入。",
    });
  }

  if (accepted.length === 0) {
    return NextResponse.json({ ok: true, savedToDb: 0, rejected, note: "全部被服务端校验拦下。" });
  }

  // 清理护栏路由的历史覆盖
  let cleanedOverrides = 0;
  try {
    cleanedOverrides = await deleteOverrides(Array.from(PROTECTED_ROUTES));
  } catch (e: any) {
    console.warn("[tune:POST] 清理护栏路由覆盖失败：", e?.message);
  }

  // provenance=verified：本机侧已过意图闸门 + title 闸门 + 长度闸门，
  // 不是"机器生成的候选"，是已核对过意图的改动。
  const now = new Date().toISOString();
  const overrides = accepted.map((e) => ({
    route: e.route,
    title: e.title,
    description: e.description,
    provenance: "verified" as const,
    lastOptimized: now,
  }));

  try {
    const saved = await saveOverrides(overrides);
    // 🔴🔴 2026-10-20（DEBT-30）：写完必须**主动失效路径缓存**。
    //
    // 事实链：2026-10-20 实测 auto-tune apply 返回 savedToDb=1、DB 直查 count=1、
    // 生产进程内 getOverride() 也返回了新标题（probeFound=true），
    // 但线上 /tools/handwriting-animation 的 <title> 30 分钟后仍是旧标题。
    // ⇒ 写侧与读侧都没问题，**卡在第三层：页面 HTML 的 ISR 缓存没有失效**。
    //
    // 机制：revalidate=300 的页面，HTML 与 <head> 一起被 Vercel 缓存。
    // 覆盖层写进 Postgres 不会自动让这份 HTML 重建 ⇒ 「零部署即时生效」是假的，
    // 实际要等 5 分钟窗口 + 一次真实重建请求，且重建时机不可控。
    //
    // 解法：写完立刻 revalidatePath，把目标路径的缓存标记为待重建。
    // 这样「写完即可见」才是真的，不依赖窗口。
    //
    // 为什么要包 try：revalidatePath 失败不能反过来让整个写入被判失败
    // （DB 已经写进去了，报错会让调用方以为没写）。失败要**显式上报**，
    // 不能静默 —— 静默就是「看起来成功但线上没变」的根源。
    const revalidated: string[] = [];
    const revalidateErrors: Array<{ route: string; error: string }> = [];
    for (const o of overrides) {
      try {
        revalidatePath(o.route);
        revalidated.push(o.route);
      } catch (e: any) {
        revalidateErrors.push({ route: o.route, error: e?.message || String(e) });
      }
    }
    return NextResponse.json({
      ok: true,
      savedToDb: saved,
      committed: saved > 0,
      cleanedOverrides,
      rejected,
      savedRoutes: overrides.map((o) => o.route),
      revalidated,
      revalidateErrors,
      note:
        `已写入 ${saved} 条覆盖（清理护栏 ${cleanedOverrides} 条），` +
        `已失效缓存 ${revalidated.length} 条路径。` +
        (revalidateErrors.length
          ? `⚠️ ${revalidateErrors.length} 条路径缓存失效失败，线上可能仍是旧标题。`
          : ""),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, commitError: e?.message || String(e), rejected }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // 🔴 2026-10-20：顶层兜底。裸 500 + 空 body 会让排查只能靠猜
  //   （本次就栽在这：pg_class 查询反序列化失败 ⇒ 端点 500，看不到任何错误信息）。
  try {
    return await handleGet(req);
  } catch (e: any) {
    console.error("[tune:GET] 未捕获异常：", e);
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

async function handleGet(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔴 2026-10-20（DEBT-31）：?seed=1 ⇒ 写一条**探针覆盖**到 DB 并立刻读回。
  //   用途：验证「表在部署后还能不能写、写了能不能存活」——
  //   这是覆盖层闭环唯一能自证的端到端判据（本机出网被墙时无法直接 POST apply，
  //   而 GET 就能触发，CI/浏览器/任何出网点都能用）。
  //   路由固定为 /tools/handwriting-animation（已有工具页，不会写幽灵覆盖）。
  //   探针标题是显式的探针文案，便于与真实优化区分。
  // 🔴🔴 DEBT-36（2026-10-21）：探针写完自证后必须**原样恢复**生产内容。
  //   旧版直接把固定文案 upsert 进生产表 ⇒ 真实覆盖被静默盖掉，
  //   症状与「调优生效」无法区分（实测线上那条就是探针文案）。
  if (req.nextUrl.searchParams.get("seed") === "1") {
    const route = "/tools/handwriting-animation";
    const probeTitle = "Handwriting Text Animation — Create Animated Text Online";
    const probeDesc =
      "Turn any text into a smooth handwriting animation right in your browser. Choose a font, set the speed, and export a video — no sign-up, nothing uploaded.";
    try {
      const { saveOverrides, deleteOverrides } = await import("@/lib/seo/page-meta-db");
      const { prisma } = await import("@/lib/db");
      const beforeRows = (await prisma.$queryRawUnsafe<
        Array<{ route: string; title: string | null; description: string | null; provenance: string; last_optimized: Date | null }>
      >(
        "SELECT route, title, description, provenance, last_optimized FROM page_meta_override WHERE route = $1",
        route
      )) as Array<{ route: string; title: string | null; description: string | null; provenance: string; last_optimized: Date | null }>;
      const before = beforeRows[0] ?? null;

      const saved = await saveOverrides([
        {
          route,
          title: probeTitle,
          description: probeDesc,
          provenance: "verified",
          lastOptimized: new Date().toISOString(),
        },
      ]);
      let revalidated = false;
      let revalidateError: string | null = null;
      try {
        revalidatePath(route);
        revalidated = true;
      } catch (e: any) {
        revalidateError = e?.message || String(e);
      }
      // 写完立刻直查回读 —— 不读回就等于没自证
      const rows = (await prisma.$queryRawUnsafe<Array<{ route: string; title: string | null }>>(
        "SELECT route, title FROM page_meta_override WHERE route = $1",
        route
      )) as Array<{ route: string; title: string | null }>;

      // ── 还原生产现场（DEBT-36）──
      let restored: "previous" | "deleted" | "none" = "none";
      let restoreError: string | null = null;
      try {
        if (before) {
          await saveOverrides([
            {
              route: before.route,
              title: before.title ?? undefined,
              description: before.description ?? undefined,
              provenance: (before.provenance as any) ?? "generated",
              lastOptimized: before.last_optimized
                ? before.last_optimized.toISOString()
                : new Date().toISOString(),
            },
          ]);
          restored = "previous";
        } else {
          await deleteOverrides([route]);
          restored = "deleted";
        }
      } catch (e: any) {
        restoreError = e?.message || String(e);
      }
      const afterRows = (await prisma.$queryRawUnsafe<Array<{ route: string; title: string | null }>>(
        "SELECT route, title FROM page_meta_override WHERE route = $1",
        route
      )) as Array<{ route: string; title: string | null }>;

      return NextResponse.json({
        ok: true,
        mode: "seed-probe",
        savedToDb: saved,
        revalidated,
        revalidateError,
        readback: { count: rows.length, title: rows[0]?.title ?? null },
        ok2: saved > 0 && rows.length === 1,
        restore: {
          action: restored,
          error: restoreError,
          hadBefore: !!before,
          beforeTitle: before?.title ?? null,
          afterTitle: afterRows[0]?.title ?? null,
          afterCount: afterRows.length,
        },
        note:
          `已写入探针覆盖并回读：${rows.length} 行。` +
          (saved > 0 && rows.length === 1
            ? " ✅ 写入与回读一致。"
            : " ❌ 写入与回读不一致，请查表是否被 db push 删掉。") +
          (restoreError
            ? ` ⚠️ 还原失败：${restoreError}（生产表现有探针文案，需人工处理）`
            : restored === "previous"
              ? " ✅ 已还原为探针写入前的生产内容。"
              : restored === "deleted"
                ? " ✅ 写入前无覆盖，已删除探针行。"
                : ""),
      });
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, mode: "seed-probe", error: e?.message || String(e) },
        { status: 500 }
      );
    }
  }

  // 🔴 2026-10-20（DEBT-30）：?revalidate=1 ⇒ 只做「失效已写入覆盖的路径缓存」，
  //   不跑 GSC 拉取、不生成方案。用于：写入发生在旧版代码（无 revalidatePath）时补一刀，
  //   或排查时立刻让线上反映覆盖层。
  if (req.nextUrl.searchParams.get("revalidate") === "1") {
    const r = await revalidateOverrideRoutes();
    return NextResponse.json({
      ok: true,
      mode: "revalidate-only",
      revalidated: r.revalidated,
      errors: r.errors,
      note: `已失效 ${r.revalidated.length} 条路径缓存（页面上一次请求会重建）。`,
    });
  }

  const apply = req.nextUrl.searchParams.get("apply") === "1";

  // 1) 拉真实 GSC 数据（Vercel 环境已配置 GSC 密钥，服务端直连 Google，不出公网）
  let rows: QueryPageRow[] = [];
  let hasData = false;
  let source = "none";
  if (isGscConfigured()) {
    try {
      const end = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const r = await fetchGscPerformance(start, end, ["query", "page"], 5000);
      if (r.error) console.warn("[tune] GSC 错误：", r.error);
      rows = (r.rows || []).map((x: any) => ({
        query: x.query,
        page: x.page,
        impressions: x.impressions,
        clicks: x.clicks,
        ctr: x.ctr,
        position: x.position,
      }));
      // 只保留 craftisle.com 主站页（排除子域 pdf/games/imgprompt 等独立部署）
      rows = rows.filter((x) => {
        if (!x.page) return false;
        try {
          return new URL(x.page).hostname === "craftisle.com";
        } catch {
          return false;
        }
      });
      hasData = rows.length > 0;
      source = hasData ? "GSC" : "none";
    } catch (e: any) {
      console.warn("[tune] GSC 拉取失败：", e?.message);
    }
  }

  // 2) 分析 + 生成计划（基于完整 meta 映射，覆盖全部工具/类目页）
  const meta = buildFullMeta();
  const clusters = analyzeTopicalGaps(rows, hasData);
  const plan = buildOptimizationPlan(clusters, meta);

  // 3) 护栏：先清 PROTECTED_ROUTES 历史覆盖，避免坏覆盖滞留
  let cleanedOverrides = 0;
  try {
    cleanedOverrides = await deleteOverrides(Array.from(PROTECTED_ROUTES));
  } catch (e: any) {
    console.warn("[tune] 清理护栏路由覆盖失败：", e?.message);
  }

  // 4) 按潜在价值降序，截断到每日路由上限（同一路由允许同时改 title+description）
  const sorted = [...plan.edits].sort(
    (a, b) => b.potentialValue - a.potentialValue || b.potentialClicks - a.potentialClicks,
  );
  const capped: typeof sorted = [];
  const startedRoutes = new Set<string>();
  for (const e of sorted) {
    if (startedRoutes.has(e.route)) {
      capped.push(e);
      continue;
    }
    if (startedRoutes.size >= DAILY_ROUTE_CAP) continue;
    startedRoutes.add(e.route);
    capped.push(e);
  }

  const overrides = buildOverridesFromEdits(capped);

  // 诊断：按动作类型拆分 + 抽样，确认 meta 改写是否真的有可落地的目标
  const editsByKind: Record<string, number> = {};
  for (const e of plan.edits) editsByKind[e.kind] = (editsByKind[e.kind] || 0) + 1;
  const sampleEdits = plan.edits.slice(0, 6).map((e) => ({
    kind: e.kind,
    route: e.route,
    field: e.field,
    rationale: (e.rationale || "").slice(0, 60),
  }));

  // 诊断2：逐簇深位词 + 被 defer 的原因分布，定位 optimize_meta 为何没落覆盖
  const deferredReasons: Record<string, number> = {};
  for (const d of plan.deferred) {
    const key = (d.reason || "unknown").replace(/路由\s+\S+\s*/, "路由 <route> ").slice(0, 46);
    deferredReasons[key] = (deferredReasons[key] || 0) + 1;
  }
  const deepQueryDiag = clusters.map((c) => ({
    site: c.siteSlug,
    demand: c.demand,
    avgPosition: c.avgPosition,
    deepCount: (c.deepQueries || []).length,
    deepSample: (c.deepQueries || []).slice(0, 5).map((q: any) => `${q.query}@P${q.position}/imp${q.impressions}/${q.intent}`),
  }));

  const summary = {
    ok: true,
    source,
    hasData,
    gscConfigured: isGscConfigured(),
    metaRoutesScanned: Object.keys(meta).length,
    editsTotal: plan.edits.length,
    editsCapped: capped.length,
    routesCapped: overrides.length,
    dailyRouteCap: DAILY_ROUTE_CAP,
    deferred: plan.deferred.length,
    deferredReasons,
    deepQueryDiag,
    editsByKind,
    sampleEdits,
    totalPotentialClicks: plan.totalPotentialClicks,
    totalPotentialValue: plan.totalPotentialValue,
    apply,
    cleanedOverrides,
    overrides: overrides.map((o) => ({
      route: o.route,
      title: o.title ?? null,
      description: o.description ?? null,
    })),
    errors: plan.edits.filter(() => false).length, // 占位：errors 在 apply 阶段产生
    // 🔴 2026-10-15 诊断：覆盖层为什么写了不生效
    overrideDiag: await diagnoseOverrides(),
  };

  if (!apply) {
    return NextResponse.json({
      ...summary,
      note: "dryRun 预览，未写入数据库。加 ?apply=1&secret=<CRON_SECRET> 真实落库覆盖层（页面自动生效，零部署）。",
    });
  }

  if (overrides.length === 0) {
    return NextResponse.json({
      ...summary,
      savedToDb: 0,
      note: `无新覆盖可写（已清理护栏覆盖 ${cleanedOverrides} 条）。`,
    });
  }

  try {
    const saved = await saveOverrides(overrides);
    return NextResponse.json({
      ...summary,
      savedToDb: saved,
      committed: saved > 0,
      note:
        saved > 0
          ? `已写入 ${saved} 条 meta 覆盖（覆盖 ${overrides.length} 路由，清理护栏 ${cleanedOverrides} 条）。页面经 PAGE_META Proxy / getOverride 自动生效，零部署。`
          : `无新覆盖写入（清理护栏 ${cleanedOverrides} 条）。`,
    });
  } catch (e: any) {
    return NextResponse.json({ ...summary, ok: false, commitError: e?.message || String(e) });
  }
}
