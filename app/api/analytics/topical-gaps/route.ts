/**
 * GET /api/analytics/topical-gaps
 * Topical Authority Gap Detector v3 端点。
 *
 * 实时拉取 GSC query+page 维度（默认近 90 天），按站点归类后用 v3 引擎计算：
 *   - 排名近失 / 低 CTR / 可见性缺口 / 深度不足 四类差距
 *   - 流量机会量化（potentialClicks，月潜在新增点击）与业务价值（potentialValue，$/月）
 *   - 品牌 / 非品牌展示分拆、具体行动蓝图 + 价值加权执行路线图
 *   - 跨子站 cannibalization
 *
 * v3 新增（不依赖 GSC 凭证，真实抓取）：
 *   - 技术 SEO / 索引健康探针（robots / sitemap / HTTP / noindex）
 *   - 内容深度 / E-E-A-T 审计（正文长度 / JSON-LD / 作者组织 / H1）
 *   - 竞品差距（需 SERP_API_KEY，无则诚实返回 available:false，绝不编造）
 *
 * 性能：模块级内存缓存 6 小时，避免每次看板加载都打 GSC / 探针配额。
 */

import { NextResponse } from "next/server";
import { fetchGscPerformance, isGscConfigured } from "@/lib/seo/gsc-client";
import { analyzeTopicalGaps, summarizeGaps, roadmapByTier, detectCannibalization, QueryPageRow } from "@/lib/seo/topical-gaps";
import { runTechnicalProbe } from "@/lib/seo/technical-probe";
import { runContentAudit } from "@/lib/seo/content-audit";
import { computeCompetitorGaps, fetchCompetitorData } from "@/lib/seo/competitor-gap";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 小时

interface CacheEntry { at: number; payload: any; }
let _cache: CacheEntry | null = null;

/**
 * 真实抓取类信号（技术探针 / 内容审计 / 竞品差距）。
 * 三者并行且各自容错：任一失败不影响其它，也不拖垮主分析。
 */
async function buildSignals(): Promise<{
  technical: any;
  content: any;
  competitor: any;
}> {
  const [techRes, contentRes, compRowsRes] = await Promise.allSettled([
    runTechnicalProbe(),
    runContentAudit(),
    fetchCompetitorData([], undefined, {}),
  ]);
  const technical = techRes.status === "fulfilled" ? techRes.value : null;
  const content = contentRes.status === "fulfilled" ? contentRes.value : null;
  const competitor = computeCompetitorGaps(compRowsRes.status === "fulfilled" ? compRowsRes.value : []);
  return { technical, content, competitor };
}

export async function GET() {
  try {
    if (_cache && Date.now() - _cache.at < CACHE_TTL_MS) {
      return NextResponse.json({ ..._cache.payload, cached: true, cachedAt: new Date(_cache.at).toISOString() });
    }

    const configured = isGscConfigured();
    const signalsPromise = buildSignals();

    if (!configured) {
      const clusters = analyzeTopicalGaps([], false);
      const signals = await signalsPromise;
      const payload = {
        generatedAt: new Date().toISOString(),
        hasData: false,
        configured: false,
        summary: summarizeGaps(clusters),
        roadmap: roadmapByTier(clusters),
        cannibalization: [],
        clusters,
        ...signals,
      };
      _cache = { at: Date.now(), payload };
      return NextResponse.json(payload);
    }

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const [res, signals] = await Promise.all([
      fetchGscPerformance(startDate, endDate, ["query", "page"], 5000),
      signalsPromise,
    ]);
    const rows: QueryPageRow[] = (res.rows || []).map((r) => ({
      query: r.query, page: r.page,
      impressions: r.impressions, clicks: r.clicks, ctr: r.ctr, position: r.position,
    }));

    const hasData = rows.length > 0;
    const clusters = analyzeTopicalGaps(rows, hasData);
    const payload = {
      generatedAt: new Date().toISOString(),
      hasData,
      configured: true,
      gscError: res.error ?? null,
      summary: summarizeGaps(clusters),
      roadmap: roadmapByTier(clusters),
      cannibalization: hasData ? detectCannibalization(rows) : [],
      clusters,
      ...signals,
    };

    _cache = { at: Date.now(), payload };
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("[Topical Gaps] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
