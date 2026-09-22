/**
 * 外部趋势数据客户端（真实实现）
 *
 * 背景：本文件此前是**空实现**（fetchMultiKeywordTrends 恒返回空 Map），
 * 导致 pull-trends 定时任务即使被调用也只会写入 0 条数据 —— 整条「Google Trends
 * 管道」实际上从未产出任何信号。2026-09-22 起改为真实实现。
 *
 * 数据源（实测可从本机直连，无需 key）：
 *   1. Google Suggest（autocomplete）—— 返回真实长尾搜索需求，是「长尾词自动匹配」的主力。
 *      https://suggestqueries.google.com/complete/search?client=firefox&q=<seed>
 *   2. Google Trends Daily RSS —— 每日热榜话题（非按词时间序列）。
 *      https://trends.google.com/trending/rss?geo=US
 *
 * 注意：真正的「按关键词时间序列」（google-trends-api 那种）需要非官方端点/代理，
 * 未在本文件实现；因此 fetchKeywordTrend / fetchMultiKeywordTrends 保持「不伪造 DB 数据」的策略，
 * 仅返回空并在调用方（pull-trends 路由）留待接入。核心价值已由 Suggest + Daily RSS 提供。
 */

export interface TrendResult {
  query: string;
  date: string;
  value: number;
}

export interface DailyTrendItem {
  title: string;
  traffic: string | null;
  newsUrl: string | null;
}

const UA = "Mozilla/5.0 (compatible; CraftisleTrendBot/1.0)";

async function fetchWithTimeout(url: string, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": UA, Accept: "*/*" },
    });
  } finally {
    clearTimeout(t);
  }
}

/**
 * Google Suggest：给定种子词，返回真实的长尾补全词（按热度排序）。
 * 实测样例：seed="free online tool to" →
 *   "free online tool to convert pdf to word" / "...remove background from image" ...
 */
export async function fetchSuggestions(
  seed: string,
  opts: { lang?: string } = {}
): Promise<string[]> {
  const hl = opts.lang || "en";
  const url =
    "https://suggestqueries.google.com/complete/search?client=firefox" +
    `&hl=${encodeURIComponent(hl)}&q=${encodeURIComponent(seed)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    // Google 有时返回 ISO-8859-1，需先取 buffer 再按 utf-8 解码，避免中文/重音乱码
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString("utf-8");
    const data = JSON.parse(text);
    const list: string[] = Array.isArray(data?.[1]) ? data[1] : [];
    return list.filter((s) => typeof s === "string" && s.trim().length > 0);
  } catch {
    return [];
  }
}

/** 批量 Suggest：并发拉取多个种子词的补全，返回 seed → suggestions 映射。 */
export async function fetchSuggestionsForSeeds(
  seeds: string[],
  opts: { lang?: string; concurrency?: number } = {}
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  const concurrency = Math.max(1, opts.concurrency ?? 5);
  for (let i = 0; i < seeds.length; i += concurrency) {
    const batch = seeds.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((s) => fetchSuggestions(s, { lang: opts.lang }))
    );
    batch.forEach((s, idx) => out.set(s, results[idx]));
  }
  return out;
}

/** Google Trends 每日热榜（RSS）。缺省 geo=US。 */
export async function fetchDailyTrends(geo = "US"): Promise<DailyTrendItem[]> {
  const url = `https://trends.google.com/trending/rss?geo=${encodeURIComponent(geo)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const xml = await res.text();
    const items: DailyTrendItem[] = [];
    const itemBlocks = xml.split("<item>").slice(1);
    for (const block of itemBlocks) {
      const title = block.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
      if (!title) continue;
      const traffic =
        block.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() ??
        null;
      const newsUrl =
        block.match(/<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/)?.[1]?.trim() ??
        null;
      items.push({ title, traffic, newsUrl });
    }
    return items;
  } catch {
    return [];
  }
}

/**
 * 「相关查询」——用 Suggest 近似：rising 取靠前补全，top 取全部。
 * 该函数此前恒返回空数组，是 pull-trends 无产出的第二个原因。
 */
export async function fetchRelatedQueries(
  query: string,
  opts: { lang?: string } = {}
): Promise<{
  rising: Array<{ query: string; value: number }>;
  top: Array<{ query: string; value: number }>;
}> {
  const suggestions = await fetchSuggestions(query, opts);
  const scored = suggestions.map((q, i) => ({ query: q, value: 100 - i * 10 }));
  return { rising: scored.slice(0, 5), top: scored };
}

/** 保留接口：按周时间序列需非官方 API，未实现，返回空（不伪造数据入库）。 */
export async function fetchKeywordTrend(query: string): Promise<TrendResult[]> {
  void query;
  return [];
}

/** 保留接口：同上，返回空。核心长尾信号请用 fetchSuggestions / fetchSuggestionsForSeeds。 */
export async function fetchMultiKeywordTrends(
  queries: string[]
): Promise<Map<string, TrendResult[]>> {
  void queries;
  return new Map();
}

/**
 * 种子词 —— 与 craftisle 的工具类目/落地页对齐，作为每日长尾收割的入口。
 * 可用 seo:harvest 脚本扩展。
 */
export const TREND_SEED_QUERIES = [
  "craftisle",
  "free online tools",
  "free online tool to",
  "online image converter",
  "image background remover",
  "free pdf editor",
  "free json formatter",
  "password generator",
  "qr code generator",
  "handwriting animation",
  "free text to speech",
  "free video compressor",
  "free image upscaler",
  "AI watermark remover",
  "ID photo maker",
  "regex visualizer",
  "HTML editor online",
  "open source tools list",
  "best AI tools 2026",
  "free alternative to",
];
