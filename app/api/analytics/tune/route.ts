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

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
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

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
