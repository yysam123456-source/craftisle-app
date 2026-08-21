/**
 * Vercel Cron：自动优化器（分析 → 改站 → 写入数据库覆盖层）
 * ───────────────────────────────────────────────
 * 触发：vercel.json 中的周级 cron（在 pull-gsc-data 之后，确保 GSC 数据最新）。
 * 鉴权：Vercel Cron 自动带 x-vercel-cron 头；手动触发用 ?secret=<CRON_SECRET>。
 *
 * 为什么落地到数据库而不是回写仓库：
 *   GSC Service Account 密钥只配置在 Vercel（敏感、不可导出），「拉 GSC」必须发生在
 *   Vercel；而回写仓库需要 GitHub PAT（也是用户凭证，且 GitHub Action 同样拿不到 GSC）。
 *   因此本路由把优化结果直接 upsert 进 Postgres 覆盖层（Vercel 已配 DATABASE_URL），
 *   页面通过 page-meta.ts 的 PAGE_META Proxy 自动读取——零新密钥、零迁移、零手动配置。
 *
 * 安全：默认 dryRun 预览；仅当 ?apply=1 且 applied>0 才写入数据库覆盖层。
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchGscPerformance, isGscConfigured } from "@/lib/seo/gsc-client";
import { analyzeTopicalGaps, QueryPageRow } from "@/lib/seo/topical-gaps";
import {
  buildOptimizationPlan,
  applyEditsToMeta,
  buildOverridesFromEdits,
  PROTECTED_ROUTES,
} from "@/lib/seo/optimizer";
import { PAGE_META_BASE } from "@/lib/seo/page-meta";
import { saveOverrides, deleteOverrides } from "@/lib/seo/page-meta-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = req.nextUrl.searchParams.get("secret");
  return !!(CRON_SECRET && secret === CRON_SECRET);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apply = req.nextUrl.searchParams.get("apply") === "1";

  // 1) 拉真实 GSC 数据（Vercel 环境已配置 GSC 密钥）
  let rows: QueryPageRow[] = [];
  let hasData = false;
  let source = "none";
  if (isGscConfigured()) {
    try {
      const end = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const r = await fetchGscPerformance(start, end, ["query", "page"], 5000);
      if (r.error) console.warn("[auto-optimize] GSC 错误：", r.error);
      rows = (r.rows || []).map((x) => ({
        query: x.query,
        page: x.page,
        impressions: x.impressions,
        clicks: x.clicks,
        ctr: x.ctr,
        position: x.position,
      }));
      hasData = rows.length > 0;
      source = hasData ? "GSC" : "none";
    } catch (e: any) {
      console.warn("[auto-optimize] GSC 拉取失败：", e?.message);
    }
  }

  // 2) 分析 + 生成计划 + 应用到「静态注册表」副本（一次计算，多处复用）
  //    以 PAGE_META_BASE 为基准（不含已有 DB 覆盖），保证每次都相对静态真值计算。
  const clusters = analyzeTopicalGaps(rows, hasData);
  const plan = buildOptimizationPlan(clusters);
  const { applied, errors } = applyEditsToMeta(PAGE_META_BASE, plan.edits);

  const summary = {
    ok: true,
    source,
    hasData,
    gscConfigured: isGscConfigured(),
    edits: plan.edits.length,
    applied,
    deferred: plan.deferred.length,
    totalPotentialClicks: plan.totalPotentialClicks,
    totalPotentialValue: plan.totalPotentialValue,
    apply,
    errors,
  };

  if (!apply) {
    return NextResponse.json({
      ...summary,
      note: "dryRun 预览，未写入数据库。加 ?apply=1 真实落库（覆盖层 + 页面自动生效）。",
    });
  }

  // 3) 护栏自愈:任何 apply 路径都先清除 PROTECTED_ROUTES(品牌门面)的历史覆盖,
  //    避免坏覆盖滞留(如曾把首页标题改写为仓库名)。即使本周无新改写也应执行。
  let cleanedOverrides = 0;
  try {
    cleanedOverrides = await deleteOverrides(Array.from(PROTECTED_ROUTES));
  } catch (e: any) {
    console.warn("[auto-optimize] 清理护栏路由覆盖失败：", e?.message);
  }

  if (applied === 0) {
    return NextResponse.json({
      ...summary,
      cleanedOverrides,
      note: `无字段被改写，跳过写入。(已清理护栏覆盖 ${cleanedOverrides} 条)`,
    });
  }

  try {
    const overrides = buildOverridesFromEdits(plan.edits);
    const saved = await saveOverrides(overrides);
    return NextResponse.json({
      ...summary,
      overrides: overrides.length,
      savedToDb: saved,
      cleanedOverrides,
      committed: saved > 0,
      note: saved > 0
        ? `已写入数据库覆盖层(${saved} 条,清理护栏覆盖 ${cleanedOverrides} 条)。注:静态 metadata 页面在下次部署构建时生效。`
        : `无新覆盖写入(清理护栏覆盖 ${cleanedOverrides} 条)。`,
    });
  } catch (e: any) {
    return NextResponse.json({ ...summary, ok: false, commitError: e?.message || String(e) });
  }
}
