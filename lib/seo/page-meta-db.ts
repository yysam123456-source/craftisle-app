/**
 * SEO 页面元数据 —— 数据库覆盖层（零配置自动优化落地）
 * ───────────────────────────────────────────────
 * 自动优化器不再把改写回写仓库（那需要 GitHub PAT + 迁移密钥，且 Vercel 的
 * GSC 密钥不可导出，GitHub Action 也拿不到），改为把优化结果写入 Postgres
 * （Vercel 已配 DATABASE_URL）。页面读取时通过 page-meta.ts 的 PAGE_META
 * Proxy 自动叠加覆盖值，无需改任何页面代码。
 *
 * 设计要点：
 *   - 无需迁移：表在首次运行时惰性 CREATE TABLE IF NOT EXISTS。
 *   - 无需新密钥：复用现有 DATABASE_URL（与 cron 写 Postgres 同一套）。
 *   - 失败安全：DATABASE_URL 缺失或 DB 不可用时，加载被跳过，页面回退静态注册表。
 *   - 最终一致：覆盖层每 5 分钟从 DB 刷新一次（每周级优化，延迟可接受）。
 */

import { prisma } from "../db";

export type OverrideProvenance = "generated" | "verified" | "recommended";

export interface PageMetaOverride {
  route: string;
  title?: string;
  description?: string;
  provenance: OverrideProvenance;
  lastOptimized: string;
}

const TABLE = "page_meta_override";
const DIAG_TABLE = "seo_diag_log";
const TTL = 5 * 60 * 1000; // 5 分钟

let overrideCache = new Map<string, PageMetaOverride>();
let lastLoad = 0;
let refreshPromise: Promise<void> | null = null;

// ── DEBT-33：把「这一次加载」的成败写进 DB，让页面侧读侧状态对外可见 ──
// 页面（/tools/*）与探针端点（/api/analytics/*）是两类不同的函数：
// 探针读到覆盖 ≠ 页面能读到。此前页面里加载失败只 console.error，
// Vercel 运行时日志没有出口 ⇒ 外部只能猜。现在成败都落库。
const DIAG_INSTANCE =
  typeof process !== "undefined" && process.env.VERCEL_REGION
    ? `${process.env.VERCEL_REGION}-${Math.random().toString(36).slice(2, 8)}`
    : `local-${Math.random().toString(36).slice(2, 8)}`;
let lastDiagOkWrite = 0;
let lastDiagLookupWrite = 0;

async function writeDiag(
  kind: "load-ok" | "load-fail",
  rows: number | null,
  error: string | null,
  detail?: string
): Promise<void> {
  // 诊断自身失败绝不能影响主流程 —— 只 console.error，不往外抛。
  const insert = () =>
    prisma.$executeRawUnsafe(
      `INSERT INTO ${DIAG_TABLE} (kind, instance, region, rows, error, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      kind,
      DIAG_INSTANCE,
      process.env.VERCEL_REGION ?? null,
      rows,
      error,
      detail ?? null
    );
  try {
    await insert();
  } catch (e: any) {
    // 表还没建出来（schema push 未跑 / 被 drop 过）⇒ 自愈一次再写。
    if (isMissingTableError(e)) {
      try {
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${DIAG_TABLE} (
          id SERIAL PRIMARY KEY,
          ts TIMESTAMPTZ NOT NULL DEFAULT now(),
          kind VARCHAR(32) NOT NULL,
          instance VARCHAR(64),
          region VARCHAR(32),
          rows INTEGER,
          error TEXT,
          detail TEXT
        )`);
        await insert();
        return;
      } catch (e2: any) {
        console.error("[page-meta-db] 诊断日志自愈失败：", e2?.message || String(e2));
        return;
      }
    }
    console.error("[page-meta-db] 诊断日志写入失败（不影响主流程）：", e?.message || String(e));
  }
}

/** 读诊断日志（供 override-probe ?diag=1 使用；只读，不写）。 */
export async function getDiagLog(limit = 30): Promise<
  Array<{
    id: number;
    ts: Date;
    kind: string;
    instance: string | null;
    region: string | null;
    rows: number | null;
    error: string | null;
    detail: string | null;
  }>
> {
  try {
    const rows = (await prisma.$queryRawUnsafe<
      Array<{
        id: number;
        ts: Date;
        kind: string;
        instance: string | null;
        region: string | null;
        rows: number | null;
        error: string | null;
        detail: string | null;
      }>
    >(
      `SELECT id, ts, kind, instance, region, rows, error, detail
       FROM ${DIAG_TABLE} ORDER BY id DESC LIMIT $1`,
      limit
    )) as Array<{
      id: number;
      ts: Date;
      kind: string;
      instance: string | null;
      region: string | null;
      rows: number | null;
      error: string | null;
      detail: string | null;
    }>;
    return rows;
  } catch (e: any) {
    if (isMissingTableError(e)) return [];
    throw e;
  }
}

async function ensureTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    route TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    provenance TEXT NOT NULL DEFAULT 'generated',
    last_optimized TIMESTAMPTZ
  )`);
}

/**
 * 🔴🔴 2026-10-20（DEBT-31）：表被删后自愈重建。
 *
 * 根因：vercel.json 的 buildCommand 跑 `prisma db push --accept-data-loss`，
 * 它以 schema.prisma 为准 —— schema 里没有的表会被 drop。
 * 覆盖层表此前是运行时 CREATE 出来的孤儿表 ⇒ 每次部署都被删。
 * 现在表已写进 schema（model PageMetaOverride），不会再被删。
 * 但这道兜底仍保留：万一有人手工 drop 掉表或回滚了 schema，
 * 读侧会立刻自愈重建，而不是静默返回空覆盖。
 *
 * 判别「表不存在」：Postgres 错误码 42P01（undefined_table）。
 */
function isMissingTableError(e: any): boolean {
  const code = e?.code || e?.meta?.code || e?.cause?.code;
  if (code === "42P01") return true;
  const msg = String(e?.message || "");
  return /does not exist|Undefined table|42P01/i.test(msg);
}

/** 从 DB 载入全部覆盖到内存缓存（失败安全）。无 DATABASE_URL 时直接跳过。 */
export async function refreshOverrides(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    lastLoad = Date.now(); // 无 DB 则不尝试，避免噪声连接
    return;
  }
  try {
    await ensureTable();
    let rows: Array<{
      route: string;
      title: string | null;
      description: string | null;
      provenance: string;
      last_optimized: Date | null;
    }>;
    try {
      rows = await prisma.$queryRawUnsafe<Array<{
        route: string;
        title: string | null;
        description: string | null;
        provenance: string;
        last_optimized: Date | null;
      }>>(`SELECT route, title, description, provenance, last_optimized FROM ${TABLE}`);
    } catch (qErr: any) {
      // 🔴 2026-10-20（DEBT-31）：表被删 ⇒ 自愈重建后重试一次。
      //   不这么做就是「静默返回空覆盖」：症状与「没写进去」一模一样。
      if (isMissingTableError(qErr)) {
        console.error(
          `[page-meta-db] 表 ${TABLE} 不存在（多半是 prisma db push 按 schema 删掉了它），重建中…`,
        );
        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${TABLE} (
          route TEXT PRIMARY KEY,
          title TEXT,
          description TEXT,
          provenance TEXT NOT NULL DEFAULT 'generated',
          last_optimized TIMESTAMPTZ
        )`);
        rows = await prisma.$queryRawUnsafe<Array<{
          route: string;
          title: string | null;
          description: string | null;
          provenance: string;
          last_optimized: Date | null;
        }>>(`SELECT route, title, description, provenance, last_optimized FROM ${TABLE}`);
      } else {
        throw qErr;
      }
    }

    const m = new Map<string, PageMetaOverride>();
    for (const r of rows) {
      m.set(r.route, {
        route: r.route,
        title: r.title ?? undefined,
        description: r.description ?? undefined,
        provenance: (r.provenance as OverrideProvenance) || "generated",
        lastOptimized: r.last_optimized ? r.last_optimized.toISOString() : new Date().toISOString(),
      });
    }
    overrideCache = m;
    lastLoad = Date.now();
    lastLoadError = null;
    // 成功心跳：每个实例每 60s 最多一条，避免 176 个页面每次渲染都写一行。
    if (Date.now() - lastDiagOkWrite > 60_000) {
      lastDiagOkWrite = Date.now();
      await writeDiag("load-ok", m.size, null);
    }
  } catch (e: any) {
    // 失败安全：保留旧缓存（或空），页面回退静态注册表
    // 🔴 2026-10-15：这里必须把失败**记录下来并对外可见**。
    // 之前只 console.warn，症状是「覆盖写了但页面不变」，
    // 而日志在 Vercel 里没人看 ⇒ 排查时完全看不出 DB 读失败。
    lastLoadError = e?.message || String(e);
    console.error("[page-meta-db] 覆盖层加载失败，回退静态注册表：", lastLoadError);
    // 🔴 DEBT-33：失败必须**无条件落库** —— 这就是页面侧读侧的唯一可见通道。
    await writeDiag("load-fail", null, lastLoadError);
  }
}

/** 最近一次加载失败的原因（供诊断端点读取；null = 上次成功）。 */
export let lastLoadError: string | null = null;

function maybeRefresh(): void {
  if (Date.now() - lastLoad > TTL && !refreshPromise) {
    refreshPromise = refreshOverrides().finally(() => {
      refreshPromise = null;
    });
  }
}

/**
 * 同步读取某路由的覆盖（触发惰性刷新，但不阻塞）。
 *
 * 🔴 2026-10-15：这个「同步 + 不阻塞」的组合有个致命后果 ——
 * **首次访问（或缓存 TTL 过期后的第一次）必然返回 undefined**。
 * 因为 refreshOverrides 是 async，此刻还在飞；本次请求已经错过了它。
 * `generateMetadata` 是 async 上下文，本可以 await 却没有。
 *
 * 实测症状：auto-tune 写入成功（savedToDb=1），线上 title 纹丝不动，
 * 且**每次都是原标题** —— 不是偶尔失效，是稳定失效。
 *
 * 所以给 async 调用方一条确定正确的路：await refreshOverrides() 后再读缓存。
 */
export function getOverride(route: string): PageMetaOverride | undefined {
  maybeRefresh();
  return overrideCache.get(route);
}

/**
 * 🔴 2026-10-15 新增：**确保**覆盖层已加载后再读。
 * generateMetadata 必须用这个，不能用 getOverride ——
 * 后者在冷缓存下永远返回 undefined，导致覆盖层写了等于没写。
 */
export async function getOverrideAsync(route: string): Promise<PageMetaOverride | undefined> {
  await refreshOverrides();
  const ov = overrideCache.get(route);
  // 🔴🔴 DEBT-33 深挖：把「页面那一次查找」的结果也落库。
  //   已知页面侧 refreshOverrides() 成功（load-ok rows=2），但线上 title 仍是基础值
  //   ⇒ 只剩两种可能：查找键不中，或缓存键与页面请求的 route 不一致。
  //   这条日志直接给出答案（route + 结果 + 缓存里实际的键）。
  //   节流 10s/实例：/l/[slug] 等页面每次请求都会走这里，不节流会写爆。
  if (Date.now() - lastDiagLookupWrite > 10_000) {
    lastDiagLookupWrite = Date.now();
    await writeDiag(
      "lookup",
      overrideCache.size,
      null,
      `route=${route} => ${ov ? `FOUND title=${ov.title ?? "<null>"}` : "NOT-FOUND"} | cacheKeys=${[...overrideCache.keys()].join(" , ")}`,
      route
    );
  }
  return ov;
}

/** 把优化结果写入 DB（幂等 upsert）。返回成功写入条数。 */
/**
 * 保存覆盖（幂等 upsert）。返回成功写入条数。
 *
 * 🔴 2026-10-15：这里原来 catch 住异常只 `console.warn` 然后 `return 0`，
 * 而调用方（tune 端点 POST）把返回值当"写入成功"上报 ——
 * 实测端点返回 `savedToDb: 1`，但直查 SQL `count: 0`，
 * 页面 title 纹丝不动。**写入失败被伪装成了写入成功。**
 *
 * 这与 MEMORY 里「非原子写 + 无容错读 = 死锁」是同一类病：
 * 静默 catch 会把故障变成「看起来正常」。
 * 现在：失败必须抛，让调用方看到；调用方负责降级。
 */
export async function saveOverrides(list: PageMetaOverride[]): Promise<number> {
  if (list.length === 0) return 0;
  await ensureTable();
  for (const o of list) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO ${TABLE} (route, title, description, provenance, last_optimized)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (route) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         provenance = EXCLUDED.provenance,
         last_optimized = EXCLUDED.last_optimized`,
      o.route,
      o.title ?? null,
      o.description ?? null,
      o.provenance,
      new Date(o.lastOptimized),
    );
  }
  await refreshOverrides();
  // 🔴 自检：写完立刻确认行真的在。表不存在/权限不足/连接串指向别处时，
  // 这步会失败并把真实错误抛出去，而不是安静地返回"成功"。
  const rows = (await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT count(*)::bigint AS c FROM ${TABLE} WHERE route = $1`,
    list[0].route,
  )) as Array<{ c: bigint }>;
  if (!rows.length || Number(rows[0].c) === 0) {
    throw new Error(
      `saveOverrides 自检失败：写入返回成功但 ${TABLE} 中查不到 ${list[0].route}`,
    );
  }
  return list.length;
}

/** 删除指定路由的覆盖(护栏路由自愈:清除历史坏覆盖,页面回退静态注册表)。返回删除条数。 */
export async function deleteOverrides(routes: string[]): Promise<number> {
  if (routes.length === 0 || !process.env.DATABASE_URL) return 0;
  let deleted = 0;
  try {
    await ensureTable();
    for (const r of routes) {
      const rows = await prisma.$queryRawUnsafe<Array<{ route: string }>>(
        `DELETE FROM ${TABLE} WHERE route = $1 RETURNING route`,
        r,
      );
      deleted += rows.length;
    }
    if (deleted > 0) await refreshOverrides();
    return deleted;
  } catch (e: any) {
    console.warn("[page-meta-db] 删除覆盖失败：", e?.message);
    return 0;
  }
}

/** 测试钩子：直接注入缓存，便于离线验证合并逻辑（不触 DB）。传 null 清除。 */
export function __setOverrideForTest(route: string, ov: Partial<PageMetaOverride> | null): void {
  if (ov === null) overrideCache.delete(route);
  else {
    overrideCache.set(route, {
      route,
      provenance: "generated",
      lastOptimized: new Date().toISOString(),
      ...ov,
    });
  }
  lastLoad = Date.now();
}
