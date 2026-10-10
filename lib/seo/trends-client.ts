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
 *   2. Bing Suggest（osjson）—— **Google 主源的回退**，2026-10-10 加。
 *      https://api.bing.com/osjson.aspx?query=<seed>
 *      加它的原因：Google Suggest 在 10-08 / 10-09 / 10-10 **连续三天**从本机与
 *      部署环境不可达，而旧实现 `catch { return [] }` 把「源挂了」伪装成「无需求」，
 *      导致趋势管道恒写 0 条且无任何告警。取不到 ≠ 没有，必须能被观测。
 *   3. Google Trends Daily RSS —— 每日热榜话题（非按词时间序列）。
 *      https://trends.google.com/trending/rss?geo=US
 *
 * ⚠️ 口径提醒（读数据的人必须知道）：Suggest 给的是**需求广度**，不是搜索量。
 * 2026-10-10 实测 Google 与 Bing 的广度差异很大（Bing 明显更宽，含日文等
 * 本地化变体），所以**切换数据源会改变计数口径**，跨源的历史数字不可直接比较。
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

/** Suggest 实际命中的数据源。写进趋势记录，避免「换了源却看不出」的静默口径漂移。 */
export type SuggestSource = "google" | "bing" | "none";

export interface SuggestionsResult {
  suggestions: string[];
  source: SuggestSource;
  /** 主源失败原因（用于告警与排查）。 */
  primaryError?: string;
}

/** Bing Suggest：Google 主源不可达时的回退。返回 [query, string[]] 二元组。 */
async function fetchBingSuggestions(seed: string): Promise<string[]> {
  const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(seed)}`;
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`bing http ${res.status}`);
  const text = Buffer.from(await res.arrayBuffer()).toString("utf-8");
  const data = JSON.parse(text);
  const list: unknown[] = Array.isArray(data?.[1]) ? data[1] : [];
  return list.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
}

/**
 * Google Suggest：给定种子词，返回真实的长尾补全词（按热度排序）。
 * 实测样例：seed="free online tool to" →
 *   "free online tool to convert pdf to word" / "...remove background from image" ...
 *
 * 🔴 2026-10-10：Google 主源连续三天不可达时自动回退 Bing，并把实际命中的源
 * 一起返回。**原来这里 `catch { return [] }`，等于把「源挂了」说成「没需求」**
 * —— 趋势管道因此连续多日写入 0 条却毫无告警。
 */
export async function fetchSuggestionsDetailed(
  seed: string,
  opts: { lang?: string } = {}
): Promise<SuggestionsResult> {
  const hl = opts.lang || "en";
  const url =
    "https://suggestqueries.google.com/complete/search?client=firefox" +
    `&hl=${encodeURIComponent(hl)}&q=${encodeURIComponent(seed)}`;
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`google http ${res.status}`);
    // Google 有时返回 ISO-8859-1，需先取 buffer 再按 utf-8 解码，避免中文/重音乱码
    const buf = Buffer.from(await res.arrayBuffer());
    const data = JSON.parse(buf.toString("utf-8"));
    const list: unknown[] = Array.isArray(data?.[1]) ? data[1] : [];
    const out = list.filter((s): s is string => typeof s === "string" && s.trim().length > 0);
    // HTTP 200 但列表为空也算主源异常（实测过代理返回空壳的情况）—— 走回退
    if (out.length > 0) return { suggestions: out, source: "google" };
    throw new Error("google returned empty list");
  } catch (e) {
    const primaryError = e instanceof Error ? e.message : String(e);
    try {
      const suggestions = await fetchBingSuggestions(seed);
      if (suggestions.length > 0) {
        return { suggestions, source: "bing", primaryError };
      }
      return { suggestions: [], source: "none", primaryError };
    } catch (e2) {
      // 🔴 双源都挂必须喊出来，否则又会被当成「无需求」
      console.error(
        `[trends] Suggest 双源均失败 seed="${seed}" google=${primaryError} bing=${e2 instanceof Error ? e2.message : String(e2)}`
      );
      return {
        suggestions: [],
        source: "none",
        primaryError: `${primaryError} | bing: ${e2 instanceof Error ? e2.message : String(e2)}`,
      };
    }
  }
}

/** 兼容旧调用方：只要字符串数组。 */
export async function fetchSuggestions(
  seed: string,
  opts: { lang?: string } = {}
): Promise<string[]> {
  return (await fetchSuggestionsDetailed(seed, opts)).suggestions;
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
 * Suggest 广度快照（2026-10-10 新增，pull-trends 改用此函数）。
 *
 * 🔴 背景：`pull-trends` 路由此前**只**调用 `fetchMultiKeywordTrends`，
 * 而后者是刻意留空的桩（真正的周时间序列需要非官方端点）⇒
 * **该cron 无论跑多少次都写入 0 条趋势记录**，且返回 success、零告警。
 * 这是比「Google Suggest 不可达」更根本的原因：主源恢复也不会有任何数据。
 *
 * 口径诚实性（本函数只做能证明的事）：
 *   · Suggest 返回的是**长尾变体的条数**，不是搜索量。
 *   · 因此写库时 `count` = 该种子词的长尾变体条数，
 *     `source` 用**独立的 `"suggest"`** 标记，绝不复用 `google_trends`——
 *     否则会把「变体条数」伪装成「搜索次数」，污染趋势语义。
 *   · 同一个种子在 Google 与 Bing 下的变体条数不可比（口径不同，见文件头），
 *     所以额外返回 `provider`，由调用方决定是否写入，避免跨源周环比造假。
 */
export interface SuggestBreadthRow {
  seed: string;
  breadth: number;
  provider: SuggestSource;
  /** 换源时为 true —— 此时**不应**写入周环比，否则是拿两个口径相减。 */
  providerChanged: boolean;
  error?: string;
}

export async function fetchSuggestBreadth(
  seeds: string[],
  opts: { lang?: string; concurrency?: number; previousProvider?: string } = {}
): Promise<SuggestBreadthRow[]> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const rows: SuggestBreadthRow[] = [];
  for (let i = 0; i < seeds.length; i += concurrency) {
    const batch = seeds.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((s) => fetchSuggestionsDetailed(s, { lang: opts.lang }))
    );
    batch.forEach((s, idx) => {
      const r = results[idx];
      rows.push({
        seed: s,
        breadth: r.suggestions.length,
        provider: r.source,
        providerChanged: Boolean(opts.previousProvider && opts.previousProvider !== r.source),
        error: r.primaryError,
      });
    });
  }
  return rows;
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
