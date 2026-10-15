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
const TTL = 5 * 60 * 1000; // 5 分钟

let overrideCache = new Map<string, PageMetaOverride>();
let lastLoad = 0;
let refreshPromise: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS ${TABLE} (
    route TEXT PRIMARY KEY,
    title TEXT,
    description TEXT,
    provenance TEXT NOT NULL DEFAULT 'generated',
    last_optimized TIMESTAMPTZ
  )`);
}

/** 从 DB 载入全部覆盖到内存缓存（失败安全）。无 DATABASE_URL 时直接跳过。 */
export async function refreshOverrides(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    lastLoad = Date.now(); // 无 DB 则不尝试，避免噪声连接
    return;
  }
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<Array<{
      route: string;
      title: string | null;
      description: string | null;
      provenance: string;
      last_optimized: Date | null;
    }>>(`SELECT route, title, description, provenance, last_optimized FROM ${TABLE}`);

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
  } catch (e: any) {
    // 失败安全：保留旧缓存（或空），页面回退静态注册表
    // 🔴 2026-10-15：这里必须把失败**记录下来并对外可见**。
    // 之前只 console.warn，症状是「覆盖写了但页面不变」，
    // 而日志在 Vercel 里没人看 ⇒ 排查时完全看不出 DB 读失败。
    lastLoadError = e?.message || String(e);
    console.error("[page-meta-db] 覆盖层加载失败，回退静态注册表：", lastLoadError);
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
  return overrideCache.get(route);
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
