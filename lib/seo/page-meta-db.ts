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
  } catch (e: any) {
    // 失败安全：保留旧缓存（或空），页面回退静态注册表
    console.warn("[page-meta-db] 覆盖层加载失败，回退静态注册表：", e?.message);
  }
}

function maybeRefresh(): void {
  if (Date.now() - lastLoad > TTL && !refreshPromise) {
    refreshPromise = refreshOverrides().finally(() => {
      refreshPromise = null;
    });
  }
}

/** 同步读取某路由的覆盖（触发惰性刷新，但不阻塞）。 */
export function getOverride(route: string): PageMetaOverride | undefined {
  maybeRefresh();
  return overrideCache.get(route);
}

/** 把优化结果写入 DB（幂等 upsert）。返回成功写入条数。 */
export async function saveOverrides(list: PageMetaOverride[]): Promise<number> {
  if (list.length === 0) return 0;
  try {
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
    return list.length;
  } catch (e: any) {
    console.warn("[page-meta-db] 保存覆盖失败：", e?.message);
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
