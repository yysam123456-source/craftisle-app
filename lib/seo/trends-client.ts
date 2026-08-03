/**
 * Google Trends API 客户端（轻量封装）
 * 
 * 当前使用空实现（无外部依赖），后续 Phase 3 接入 google-trends-api。
 */

export interface TrendResult {
  query: string;
  date: string;
  value: number;
}

export async function fetchKeywordTrend(query: string): Promise<TrendResult[]> {
  console.log(`[Trends] (stub) fetchKeywordTrend: ${query}`);
  return [];
}

export async function fetchMultiKeywordTrends(queries: string[]): Promise<Map<string, TrendResult[]>> {
  console.log(`[Trends] (stub) fetchMultiKeywordTrends: ${queries.length} queries`);
  return new Map();
}

export async function fetchRelatedQueries(query: string): Promise<{
  rising: Array<{ query: string; value: number }>;
  top: Array<{ query: string; value: number }>;
}> {
  return { rising: [], top: [] };
}

export const TREND_SEED_QUERIES = [
  "craftisle",
  "online image converter",
  "free online tools",
  "AI watermark remover",
  "handwriting animation",
  "ID photo maker",
  "regex visualizer",
  "HTML editor online",
  "PDF tools online",
  "image background remover",
  "best free software directory",
  "open source tools list",
  "best AI tools 2026",
  "productivity tools free",
  "developer tools online",
];
