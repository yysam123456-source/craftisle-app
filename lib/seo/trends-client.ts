/**
 * Google Trends API 客户端（轻量封装）
 * 
 * 使用 google-trends-api 拉取搜索趋势数据。
 * 提供按关键词和按类别两种维度。
 */

import googleTrends from "google-trends-api";

export interface TrendResult {
  query: string;
  date: string;
  value: number;
}

/**
 * 拉取单个关键词的 90 天兴趣趋势（按周聚合）
 */
export async function fetchKeywordTrend(query: string): Promise<TrendResult[]> {
  try {
    const results = await googleTrends.interestOverTime({
      keyword: query,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      granularTimeResolution: true,
    });

    const data = JSON.parse(results);
    const timeline = data?.default?.timelineData || [];

    return timeline.map((item: any) => ({
      query,
      date: item.formattedAxisTime || item.formattedTime || "",
      value: item.value?.[0] || 0,
    }));
  } catch (error) {
    console.warn(`[Trends] Failed to fetch trend for "${query}":`, error);
    return [];
  }
}

/**
 * 批量拉取多个关键词的 90 天趋势（每次最多 5 个词，Google Trends 限制）
 */
export async function fetchMultiKeywordTrends(
  queries: string[],
): Promise<Map<string, TrendResult[]>> {
  const results = new Map<string, TrendResult[]>();
  
  // 批量拉取（每次 5 个）
  for (let i = 0; i < queries.length; i += 5) {
    const batch = queries.slice(i, i + 5);
    
    try {
      const result = await googleTrends.interestOverTime({
        keyword: batch,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      });

      const data = JSON.parse(result);
      const timeline = data?.default?.timelineData || [];

      for (const item of timeline) {
        const values = item.value || [];
        for (let j = 0; j < batch.length; j++) {
          const trendList = results.get(batch[j]) || [];
          trendList.push({
            query: batch[j],
            date: item.formattedAxisTime || item.formattedTime || "",
            value: values[j] || 0,
          });
          results.set(batch[j], trendList);
        }
      }
    } catch (error) {
      console.warn(`[Trends] Batch fetch failed for: ${batch.join(", ")}`, error);
    }

    // 避免频率限制
    if (i + 5 < queries.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return results;
}

/**
 * 拉取相关话题和查询（Related Topics & Queries）
 */
export async function fetchRelatedQueries(query: string): Promise<{
  rising: Array<{ query: string; value: number }>;
  top: Array<{ query: string; value: number }>;
}> {
  try {
    const result = await googleTrends.relatedQueries({ keyword: query });
    const data = JSON.parse(result);
    
    const defaultData = data?.default || {};
    const ranked = defaultData.rankedQuery || [];
    const rising = ranked.find((r: any) => r.rankedKeyword?.includes("rising"))
      ?.rankedKeyword?.map((item: any) => ({
        query: item.query,
        value: item.value,
      })).filter((q: any) => q) || [];
    const top = ranked.find((r: any) => r.rankedKeyword?.includes("top"))
      ?.rankedKeyword?.map((item: any) => ({
        query: item.query,
        value: item.value,
      })).filter((q: any) => q) || [];

    return { rising, top };
  } catch (error) {
    console.warn(`[Trends] Related queries fetch failed for "${query}"`);
    return { rising: [], top: [] };
  }
}

/**
 * 核心工具站 + 目录站的高价值关键词种子
 * 用于定期拉取 Google Trends 趋势数据
 */
export const TREND_SEED_QUERIES = [
  // 品牌词
  "craftisle",
  // 工具站核心词
  "online image converter",
  "free online tools",
  "AI watermark remover",
  "handwriting animation",
  "ID photo maker",
  "regex visualizer",
  "HTML editor online",
  "PDF tools online",
  "image background remover",
  // 目录站核心词
  "best free software directory",
  "open source tools list",
  "best AI tools 2026",
  "productivity tools free",
  "developer tools online",
];
