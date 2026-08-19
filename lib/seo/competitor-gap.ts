/**
 * 竞品差距检测 v1
 * ─────────────────────────────────────────────
 * 为什么是盲区：GSC 只给「我们」的表现，不给竞品。当前 craftisle 的净增流量池里，
 * 最大的一块是「竞品排名而我们完全没出现」的词——这一块 GSC 永远看不到。
 *
 * 数据来源（诚实原则：绝不编造竞品排名）：
 *   - 真实路径：通过 SERP API（SerpApi / SearchAPI / 自建爬虫）拉取我们种子词的
 *     竞品排名，调用 injectCompetitorData() 注入 → 计算 gap。
 *   - 无 key / 未注入：返回 { available:false }，看板显示「接入 SERP API 后启用」，
 *     不返回任何编造的数字。
 *
 * 纯函数 + 可选 fetch（SERP API），可离线单测（注入数据）。
 */

export interface CompetitorRow {
  query: string;
  /** 竞品域名（出现在前 10 的域名） */
  competitors: string[];
  /** 我们是否进入前 10 */
  weRank: boolean;
  /** 我们最佳排名（未进前 10 则为 null） */
  ourPosition: number | null;
}

export interface CompetitorGap {
  query: string;
  competitors: string[];
  ourPosition: number | null;
  /** 该词在我们的 TOPICAL_MAP 中归属的子站 */
  siteSlug: string;
  /** 竞品数量（越多越说明是红海/高价值） */
  competitorCount: number;
}

export interface CompetitorReport {
  available: boolean;
  reason?: string; // available=false 时说明
  source?: string;
  gaps: CompetitorGap[];
  /** 按竞品出现频次排序的竞品域名（谁在抢我们的话题） */
  topCompetitors: Array<{ domain: string; count: number }>;
  /** 净增流量池估算所需：缺失词数 */
  missingQueryCount: number;
}

import { TOPICAL_MAP } from "./topical-gaps";
import { resolveSiteSlug } from "./sites";

// 把查询归属到子站（用于呈现「这个差距属于哪个子站的话题簇」）
function classifyToSite(query: string): string {
  const q = query.toLowerCase();
  for (const cluster of TOPICAL_MAP) {
    if (cluster.seeds.some((s) => q.includes(s.toLowerCase()))) return cluster.siteSlug;
  }
  return "craftisle";
}

/**
 * 由注入的竞品数据计算差距。
 * 仅当 weRank=false（我们没进前 10）才计入 gap——这才是「竞品有、我们没有」的净增池。
 */
export function computeCompetitorGaps(rows: CompetitorRow[]): CompetitorReport {
  if (!rows || rows.length === 0) {
    return {
      available: false,
      reason: "未注入竞品数据。接入 SERP API（SerpApi / SearchAPI）后自动启用，绝不返回编造的竞品排名。",
      gaps: [],
      topCompetitors: [],
      missingQueryCount: 0,
    };
  }

  const gaps: CompetitorGap[] = [];
  const competitorCounts = new Map<string, number>();

  for (const r of rows) {
    for (const c of r.competitors) competitorCounts.set(c, (competitorCounts.get(c) ?? 0) + 1);
    if (!r.weRank) {
      gaps.push({
        query: r.query,
        competitors: r.competitors,
        ourPosition: r.ourPosition,
        siteSlug: classifyToSite(r.query),
        competitorCount: r.competitors.length,
      });
    }
  }

  gaps.sort((a, b) => b.competitorCount - a.competitorCount || (a.ourPosition ?? 999) - (b.ourPosition ?? 999));
  const topCompetitors = Array.from(competitorCounts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { available: true, source: "injected", gaps, topCompetitors, missingQueryCount: gaps.length };
}

/**
 * 可选：从 SERP API 拉取竞品数据并注入。
 * 需要 env：SERP_API_BASE + SERP_API_KEY（或 SearchAPI 等）。
 * 无 key 时直接返回 available:false（不编造）。
 * 返回的原始行交由 computeCompetitorGaps 计算。
 */
export async function fetchCompetitorData(
  queries: string[],
  f: typeof fetch = (globalThis as any).fetch,
  opts?: { apiBase?: string; apiKey?: string },
): Promise<CompetitorRow[]> {
  const apiKey = opts?.apiKey ?? process.env.SERP_API_KEY;
  const apiBase = opts?.apiBase ?? process.env.SERP_API_BASE;
  if (!apiKey || !apiBase || queries.length === 0) return [];

  // 这里以 SerpApi 风格为例；真实部署按所用 API 调整解析。
  const rows: CompetitorRow[] = [];
  for (const q of queries.slice(0, 50)) {
    try {
      const url = `${apiBase}?engine=google&q=${encodeURIComponent(q)}&api_key=${apiKey}&num=10`;
      const res = await f(url);
      if (!res.ok) continue;
      const json = await res.json();
      const organic = json?.organic_results ?? [];
      const competitors = organic.slice(0, 10).map((r: any) => {
        try { return new URL(r.link).hostname.replace(/^www\./, ""); } catch { return ""; }
      }).filter(Boolean);
      const ourHosts = ["craftisle.com", "pdf.craftisle.com", "resume.craftisle.com", "viewer.craftisle.com",
        "draw.craftisle.com", "imgprompt.craftisle.com", "game.craftisle.com", "fxlab.craftisle.com"];
      const ourIdx = organic.findIndex((r: any) => {
        try { return ourHosts.includes(new URL(r.link).hostname.replace(/^www\./, "")); } catch { return false; }
      });
      rows.push({ query: q, competitors, weRank: ourIdx >= 0 && ourIdx < 10, ourPosition: ourIdx >= 0 ? ourIdx + 1 : null });
    } catch { /* 单查询失败跳过 */ }
  }
  return rows;
}
