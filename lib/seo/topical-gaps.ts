/**
 * Topical Authority Gap Detector v3（流量量化 + 多维度 + 品牌/意图 + 价值加权 + 设备感知）
 * ─────────────────────────────────────────────────────────────────
 * v1：应覆盖 vs 实际覆盖（定性）。
 * v2：CTR 基准曲线 → potentialClicks 流量量化 + 低CTR + 行动蓝图 + 新词 + cannibalization + 路线图。
 * v3：在 v2 基础上修复算法缺陷并补齐维度：
 *
 *  缺陷修复：
 *   A1. 种子匹配改为「归一化 token 子集」（处理词序颠倒，降低 newQueries 误报）。
 *   A2. 近失流量用真实提升系数（不再假设 100% 到 P10）。
 *   A3. 零曝光代理需求在全簇无数据时回落全局均值（不再归零低估）。
 *   A4. CTR 基准支持设备系数（移动端 CTR 低于桌面），端点按设备占比加权。
 *
 *  维度补齐：
 *   B1. 品牌/非品牌拆分（isNonBrandQuery 已有，接入分析）。
 *   B2. 搜索意图分类（classifyQueryType 已有，接入分析，按意图给不同承接策略）。
 *   B3. 价值加权：potentialValue = potentialClicks × 各站转化价值系数。
 *
 *  纯函数、零 Next/Prisma 依赖，可离线单测。
 */

import { resolveSiteSlug, getSiteBySlug, SITES } from "./sites";

/** 单条 GSC 行（query+page 维度）的最小形状 */
export interface QueryPageRow {
  query: string;
  page?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

// ── Topical Map：每个子站「应覆盖」的高意图种子词（源自已验证的真实清单）──
export const TOPICAL_MAP: Array<{ siteSlug: string; seeds: string[] }> = [
  {
    siteSlug: "craftisle",
    seeds: [
      "free online tools", "all in one tools", "ms project alternative", "microsoft project alternative",
      "google workspace alternative", "g suite alternative", "intellij alternative", "notion alternative",
      "figma alternative", "free software alternatives", "open source tools", "best free tools",
      "browser based tools", "client side tools",
    ],
  },
  {
    siteSlug: "pdf",
    seeds: [
      "merge pdf", "split pdf", "compress pdf", "pdf to word", "pdf converter", "rotate pdf",
      "pdf watermark", "pdf editor online", "free pdf tools", "pdf to excel", "unlock pdf", "pdf to jpg",
    ],
  },
  {
    siteSlug: "resume",
    seeds: [
      "resume builder", "ats resume", "resume template", "ai resume builder", "cv maker",
      "resume generator", "free resume builder", "ats friendly resume",
    ],
  },
  {
    siteSlug: "viewer",
    seeds: [
      "file viewer online", "view pdf online", "docx viewer", "open files online", "document viewer",
      "view documents in browser", "online file viewer", "pdf viewer online",
    ],
  },
  {
    siteSlug: "whiteboard",
    seeds: [
      "online whiteboard", "collaborative whiteboard", "draw online", "whiteboard app",
      "brainstorm tool", "infinite canvas", "team whiteboard", "free whiteboard",
    ],
  },
  {
    siteSlug: "imgprompt",
    seeds: [
      "midjourney prompts", "dalle prompt", "stable diffusion prompts", "ai image prompt generator",
      "prompt engineering", "image prompt generator", "midjourney prompt ideas", "prompt optimizer",
    ],
  },
  {
    siteSlug: "games",
    seeds: [
      "free browser games", "online games", "play games free", "puzzle games", "arcade games",
      "no download games", "browser games", "free games online",
    ],
  },
  {
    siteSlug: "fxlab",
    seeds: [
      "css generator", "regex tester", "code formatter", "html formatter", "json formatter",
      "frontend tools", "css box shadow generator", "regex tester online",
    ],
  },
];

export type GapType = "ranking" | "visibility" | "depth" | "healthy" | "no_data";
export type Priority = "critical" | "warning" | "info" | "ok";
export type ActionKind =
  | "push_position" | "optimize_ctr" | "build_page" | "cornerstone" | "index_fix" | "canonical";
export type Effort = "S" | "M" | "L";
/** 执行路线图分档 */
export type RoadmapTier = "quick_wins" | "foundation" | "authority";
/** 搜索意图分类 */
export type QueryIntent = "tools" | "directory" | "blog" | "other";

export interface RankingGapQuery {
  query: string;
  impressions: number;
  position: number;
  /** 该词实际排名的 GSC 页面（用于自动优化器定位要改的页） */
  page?: string;
}

export interface ObservedQuery {
  query: string;
  impressions: number;
  position: number;
  ctr: number;
  /** 是否品牌词（含 craftisle / craft isle） */
  isBrand: boolean;
  /** 搜索意图 */
  intent: QueryIntent;
  /** 该词实际排名的 GSC 页面 */
  page?: string;
}

export interface ActionItem {
  id: string;
  kind: ActionKind;
  siteSlug: string;
  /** 目标 URL（已有页优化）或计划新建的 slug */
  target: string;
  detail: string;
  effort: Effort;
  /** 预计每月新增点击（基于 CTR 基准曲线估算） */
  potentialClicks: number;
  /** 预计每月新增业务价值（美元，potentialClicks × 各站价值系数） */
  potentialValue: number;
  /** 是否非品牌（增长盘优先） */
  isNonBrand: boolean;
  /** 该行动对应的真实页面 URL（optimize_ctr / push_position 有；build_page 为计划新建路由） */
  pageUrl?: string;
  tier: RoadmapTier;
}

export interface ClusterGap {
  siteSlug: string;
  siteName: string;
  color: string;
  demand: number;
  capturedSeedCount: number;
  missingSeedCount: number;
  seedCoveragePct: number;
  /** 已覆盖的种子词（全量） */
  capturedSeeds: string[];
  /** 缺失的种子词（全量，应覆盖但零曝光） */
  missingSeeds: string[];
  rankingGapQueries: RankingGapQuery[];
  /** 前 10 名但 CTR 偏低的词（最大流量杠杆） */
  lowCtrQueries: ObservedQuery[];
  /** GSC 真实查询但未匹配任何种子词（话题自扩张） */
  newQueries: ObservedQuery[];
  avgPosition: number;
  avgCtr: number;
  /** 品牌 / 非品牌展示拆分 */
  brandImpressions: number;
  nonBrandImpressions: number;
  authorityScore: number;
  /** 全簇流量机会（月潜在新增点击，来自近失+低CTR+零曝光估算） */
  trafficOpportunity: number;
  /** 全簇潜在业务价值（美元） */
  potentialValue: number;
  gapScore: number;
  priority: Priority;
  gapType: GapType;
  recommendation: string;
  /** 可直接落地的行动清单 */
  actions: ActionItem[];
}

// ── CTR-by-position 基准曲线（Google 自然搜索聚合基准，桌面端近似）──
const CTR_TABLE: Array<[number, number]> = [
  [1, 0.28], [2, 0.155], [3, 0.10], [4, 0.07], [5, 0.052],
  [6, 0.04], [7, 0.032], [8, 0.027], [9, 0.022], [10, 0.019],
  [15, 0.012], [20, 0.007], [30, 0.004], [50, 0.002], [100, 0.001],
];

/** 设备 CTR 系数：移动端 CSC 自然 CTR 通常低于桌面（约 0.75×），平板居中 */
export const DEVICE_CTR_FACTOR: Record<"desktop" | "mobile" | "tablet", number> = {
  desktop: 1,
  mobile: 0.75,
  tablet: 0.85,
};

/**
 * 给定平均排名，返回基准 CTR（线性插值）。
 * @param deviceFactor 设备系数（默认桌面=1）。端点按真实设备占比加权后传入。
 */
export function benchmarkCtr(position: number, deviceFactor = 1): number {
  const base = rawBenchmarkCtr(position);
  return base * deviceFactor;
}

function rawBenchmarkCtr(position: number): number {
  if (position <= CTR_TABLE[0][0]) return CTR_TABLE[0][1];
  for (let i = 0; i < CTR_TABLE.length - 1; i++) {
    const [p1, c1] = CTR_TABLE[i];
    const [p2, c2] = CTR_TABLE[i + 1];
    if (position >= p1 && position <= p2) {
      const t = (position - p1) / (p2 - p1);
      return c1 + t * (c2 - c1);
    }
  }
  return CTR_TABLE[CTR_TABLE.length - 1][1];
}

/**
 * 近失词从 P(pos) 推到 P10 的现实提升系数。
 * 不是改个标题就稳到首页——需改写+内链+少量外链，且只有一部分能成。
 * 用「可达成的 CTR 增量 × 转化率」近似，避免 v2 的 100% 到 P10 高估。
 */
const NEAR_MISS_CONVERSION = 0.35;

function rankingQuality(position: number): number {
  if (position <= 3) return 1;
  if (position <= 10) return 0.75;
  if (position <= 20) return 0.5;
  if (position <= 30) return 0.35;
  if (position <= 60) return 0.2;
  return 0.08;
}

// ── 归一化匹配（修复 v2 substring 词序问题）──
const STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "to", "and", "or", "in", "on", "with",
  "is", "are", "do", "does", "my", "your", "how", "what", "best", "free", "online",
]);

/** 小写、去标点、拆词、去停用词 */
function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !STOPWORDS.has(t));
}

/**
 * 种子匹配：种子全部 token 被查询覆盖（种子是查询的子短语）。
 * 例：「ms project alternative」种子 可匹配 「alternative to ms project」（词序颠倒）。
 * 不再用 includes，避免误报；也不过度匹配（要求种子 token 全在查询内）。
 */
export function matchesSeed(observedLower: string, seedLower: string): boolean {
  const oTok = new Set(tokenize(observedLower));
  const sTok = tokenize(seedLower);
  if (sTok.length === 0) return false;
  return sTok.every((t) => oTok.has(t));
}

// ── 品牌 / 意图分类（接入 gsc-client 既有逻辑，避免重复实现）──
export function isNonBrandQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return !lower.includes("craftisle") && !lower.includes("craft isle");
}
export function classifyQueryType(query: string): QueryIntent {
  const lower = query.toLowerCase();
  if (/\b(online|free|tool|convert|generator|maker|creator|editor|download)\b/.test(lower)) return "tools";
  if (/\b(best|top|alternative|review|list|directory|software|apps|website|open.source)\b/.test(lower)) return "directory";
  if (/\b(how|tutorial|guide|tips|vs|compare|learn)\b/.test(lower)) return "blog";
  return "other";
}

/**
 * 各站「每点击业务价值」系数（美元/点击，估算值，可配置）。
 * 用于把潜在点击折算成潜在价值，排序时优先高价值增长盘。
 */
export const VALUE_WEIGHTS: Record<string, number> = {
  craftisle: 0.08,
  pdf: 0.15,
  resume: 0.40,
  viewer: 0.10,
  whiteboard: 0.20,
  imgprompt: 0.25,
  games: 0.05,
  fxlab: 0.30,
};

/**
 * 跨子站 cannibalization 检测：同一查询词出现在多个子站 host。
 */
export function detectCannibalization(rows: QueryPageRow[]): Array<{ query: string; sites: string[]; impressions: number }> {
  const map = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!r.page) continue;
    const slug = resolveSiteSlug(r.page);
    if (!slug) continue;
    if (!map.has(r.query)) map.set(r.query, new Map());
    const inner = map.get(r.query)!;
    inner.set(slug, (inner.get(slug) ?? 0) + r.impressions);
  }
  const out: Array<{ query: string; sites: string[]; impressions: number }> = [];
  for (const [q, bySite] of map) {
    if (bySite.size > 1) {
      out.push({
        query: q,
        sites: Array.from(bySite.keys()),
        impressions: Array.from(bySite.values()).reduce((s, v) => s + v, 0),
      });
    }
  }
  return out.sort((a, b) => b.impressions - a.impressions);
}

export interface AnalyzeOptions {
  /** 设备 CTR 系数（端点按真实设备占比加权后传入；默认桌面） */
  ctrFactor?: number;
  /** 零曝光代理需求全局 fallback（由调用方在两次分析间计算，避免无数据簇归零） */
  globalProxyImpPerSeed?: number;
}

/**
 * 核心分析。
 * @param rows GSC query+page 维度行
 * @param hasData GSC 是否配置且有数据
 * @param opts 设备系数 / 全局代理需求
 */
export function analyzeTopicalGaps(
  rows: QueryPageRow[],
  hasData: boolean,
  opts: AnalyzeOptions = {},
): ClusterGap[] {
  const ctrFactor = opts.ctrFactor ?? 1;
  const seedToCluster = new Map<string, string>();
  for (const cluster of TOPICAL_MAP) {
    for (const seed of cluster.seeds) seedToCluster.set(seed.toLowerCase(), cluster.siteSlug);
  }

  type Observed = { query: string; impressions: number; clicks: number; ctr: number; position: number; isBrand: boolean; intent: QueryIntent; page?: string };
  const observedByCluster = new Map<string, Observed[]>();
  for (const r of rows) {
    if (!r.page) continue;
    const slug = resolveSiteSlug(r.page);
    if (!slug) continue;
    let arr = observedByCluster.get(slug);
    if (!arr) { arr = []; observedByCluster.set(slug, arr); }
    const isBrand = !isNonBrandQuery(r.query);
    arr.push({
      query: r.query,
      impressions: r.impressions,
      clicks: r.clicks,
      ctr: r.ctr,
      position: r.position,
      isBrand,
      intent: classifyQueryType(r.query),
      page: r.page,
    });
  }

  const results: ClusterGap[] = [];

  for (const cluster of TOPICAL_MAP) {
    const site = getSiteBySlug(cluster.siteSlug);
    const name = site?.name ?? cluster.siteSlug;
    const color = site?.color ?? "#888888";
    const observed = observedByCluster.get(cluster.siteSlug) ?? [];
    const demand = observed.reduce((s, o) => s + o.impressions, 0);
    const brandImpressions = observed.filter((o) => o.isBrand).reduce((s, o) => s + o.impressions, 0);
    const nonBrandImpressions = demand - brandImpressions;

    // 命中种子词
    const capturedSeeds = new Set<string>();
    for (const o of observed) {
      const ol = o.query.toLowerCase();
      for (const seed of cluster.seeds) if (matchesSeed(ol, seed.toLowerCase())) capturedSeeds.add(seed.toLowerCase());
    }
    const capturedSeedCount = capturedSeeds.size;
    const missingSeedCount = cluster.seeds.length - capturedSeedCount;
    const seedCoveragePct = cluster.seeds.length > 0 ? Math.round((capturedSeedCount / cluster.seeds.length) * 100) : 0;
    const capturedSeedList = cluster.seeds.filter((s) => capturedSeeds.has(s.toLowerCase()));
    const missingSeedList = cluster.seeds.filter((s) => !capturedSeeds.has(s.toLowerCase()));

    // 近失词 position ∈ [11,30]
    const rankingGapQueries: RankingGapQuery[] = observed
      .filter((o) => o.position >= 11 && o.position <= 30 && o.impressions > 0)
      .map((o) => ({ query: o.query, impressions: o.impressions, position: Math.round(o.position * 10) / 10, page: o.page }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 12);

    // 低 CTR 词：前 10 但 CTR < 基准×0.5（基准已含设备系数）
    const lowCtrQueries: ObservedQuery[] = observed
      .filter((o) => o.position <= 10 && o.impressions > 0 && o.ctr < benchmarkCtr(o.position, ctrFactor) * 0.5)
      .map((o) => ({ query: o.query, impressions: o.impressions, position: Math.round(o.position * 10) / 10, ctr: Math.round(o.ctr * 1000) / 1000, isBrand: o.isBrand, intent: o.intent, page: o.page }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 12);

    // 新词：未匹配任何种子（v3 归一化匹配后误报显著降低）
    const newQueries: ObservedQuery[] = observed
      .filter((o) => {
        const ol = o.query.toLowerCase();
        return !cluster.seeds.some((s) => matchesSeed(ol, s.toLowerCase()));
      })
      .map((o) => ({ query: o.query, impressions: o.impressions, position: Math.round(o.position * 10) / 10, ctr: Math.round(o.ctr * 1000) / 1000, isBrand: o.isBrand, intent: o.intent, page: o.page }))
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10);

    let avgPosition = 0;
    let avgCtr = 0;
    if (demand > 0) {
      avgPosition = observed.reduce((s, o) => s + o.position * o.impressions, 0) / demand;
      avgCtr = observed.reduce((s, o) => s + o.ctr * o.impressions, 0) / demand;
    }

    let authorityScore = 0;
    if (demand > 0) {
      const coverageComp = seedCoveragePct / 100;
      const rankingComp = rankingQuality(avgPosition);
      authorityScore = Math.round(100 * (0.45 * coverageComp + 0.55 * rankingComp));
    }

    // ── 流量机会量化（修复 v2 高估/低估）──
    // 近失：当前排名 CTR 与首页 CTR 之差 × 转化率（非 100% 到 P10）
    const nearMissClicks = rankingGapQueries.reduce(
      (s, q) => s + q.impressions * Math.max(0, (benchmarkCtr(10, ctrFactor) - benchmarkCtr(q.position, ctrFactor))) * NEAR_MISS_CONVERSION,
      0,
    );
    // 低 CTR：补到基准 CTR
    const lowCtrClicks = lowCtrQueries.reduce(
      (s, q) => s + q.impressions * Math.max(0, benchmarkCtr(q.position, ctrFactor) - q.ctr),
      0,
    );
    // 零曝光种子：本簇代理需求；若无数据则回落全局均值（修复 v2 归零低估）
    const proxyImpPerSeed = capturedSeedCount > 0 ? demand / capturedSeedCount : (opts.globalProxyImpPerSeed ?? 0);
    const zeroExposureClicks = missingSeedCount * proxyImpPerSeed * benchmarkCtr(10, ctrFactor) * 0.4;
    const trafficOpportunity = Math.round(nearMissClicks + lowCtrClicks + zeroExposureClicks);

    // ── 具体行动蓝图 ──
    const valueWeight = VALUE_WEIGHTS[cluster.siteSlug] ?? 0.1;
    const actions: ActionItem[] = [];
    for (const q of rankingGapQueries.slice(0, 5)) {
      const pc = Math.round(q.impressions * Math.max(0, benchmarkCtr(10, ctrFactor) - benchmarkCtr(q.position, ctrFactor)) * NEAR_MISS_CONVERSION);
      actions.push({
        id: `${cluster.siteSlug}-push-${q.query}`.replace(/\s+/g, "-"),
        kind: "push_position",
        siteSlug: cluster.siteSlug,
        target: `优化承接页（${q.page ?? "当前曝光页"}）`,
        detail: `将「${q.query}」从 P${q.position} 推至首页：重写标题/H1 含该词、正文首段点题、主站内链 + 相关博客内链、轻微外链。`,
        effort: "S",
        potentialClicks: pc,
        potentialValue: Math.round(pc * valueWeight * 100) / 100,
        isNonBrand: isNonBrandQuery(q.query),
        pageUrl: q.page,
        tier: "quick_wins",
      });
    }
    for (const q of lowCtrQueries.slice(0, 5)) {
      const pc = Math.round(q.impressions * Math.max(0, benchmarkCtr(q.position, ctrFactor) - q.ctr));
      actions.push({
        id: `${cluster.siteSlug}-ctr-${q.query}`.replace(/\s+/g, "-"),
        kind: "optimize_ctr",
        siteSlug: cluster.siteSlug,
        target: `重写 ${q.query} 承接页 title/description（${q.page ?? "当前曝光页"}）`,
        detail: `排名 P${q.position} 但 CTR 仅 ${(q.ctr * 100).toFixed(1)}%（基准 ${(benchmarkCtr(q.position, ctrFactor) * 100).toFixed(1)}%）。把用户真实搜索意图写进标题/描述（意图：${q.intent}），提升点击。`,
        effort: "S",
        potentialClicks: pc,
        potentialValue: Math.round(pc * valueWeight * 100) / 100,
        isNonBrand: isNonBrandQuery(q.query),
        pageUrl: q.page,
        tier: "quick_wins",
      });
    }
    if (missingSeedCount > 0 && hasData) {
      const seedsToBuild = missingSeedList.slice(0, 5);
      const pc = Math.round(seedsToBuild.length * proxyImpPerSeed * benchmarkCtr(10, ctrFactor) * 0.4);
      actions.push({
        id: `${cluster.siteSlug}-build`,
        kind: "build_page",
        siteSlug: cluster.siteSlug,
        target: `新建落地页覆盖：${seedsToBuild.join(" / ")}`,
        detail: `当前零曝光。为每个种子词新建独立落地页（工具页或对比博客），标题直含该词、正文 800+ 字、主站内链导流。`,
        effort: "M",
        potentialClicks: pc,
        potentialValue: Math.round(pc * valueWeight * 100) / 100,
        isNonBrand: true,
        tier: "foundation",
      });
    }
    if (demand > 0 && avgPosition > 30) {
      const pc = Math.round(demand * (benchmarkCtr(20, ctrFactor) - benchmarkCtr(avgPosition, ctrFactor)) * 0.5);
      actions.push({
        id: `${cluster.siteSlug}-corner`,
        kind: "cornerstone",
        siteSlug: cluster.siteSlug,
        target: `写 3-5 篇 cornerstone 博客`,
        detail: `有需求但整簇平均排名 ${Math.round(avgPosition)}（权威弱）。围绕核心词写 1000+ 字 cornerstone 内容，内部互链到工具页，争取主题相关外链。`,
        effort: "L",
        potentialClicks: pc,
        potentialValue: Math.round(pc * valueWeight * 100) / 100,
        isNonBrand: true,
        tier: "authority",
      });
    }
    if (demand === 0 && hasData) {
      actions.push({
        id: `${cluster.siteSlug}-index`,
        kind: "index_fix",
        siteSlug: cluster.siteSlug,
        target: `GSC 索引急救`,
        detail: `整站零曝光。① GSC 添加该子站 URL-prefix property 并授权；② 提交 sitemap；③ 查 robots.txt / Cloudflare 是否拦截爬虫；④ 主站内链导流。`,
        effort: "M",
        potentialClicks: 0,
        potentialValue: 0,
        isNonBrand: true,
        tier: "foundation",
      });
    }

    // ── 差距判定 + 建议 ──
    let gapType: GapType;
    let priority: Priority;
    let gapScore: number;
    let recommendation: string;

    if (!hasData) {
      gapType = "no_data"; priority = "info"; gapScore = 0;
      recommendation = "GSC 数据未就绪（未配置凭证或无数据）——配置后自动产出差距分析与流量机会。";
    } else if (demand === 0) {
      gapType = "visibility"; priority = "critical"; gapScore = 100;
      recommendation = `整站 GSC 零曝光（${missingSeedCount} 个应覆盖话题全部缺失）。优先处理索引急救，否则任何内容都拿不到流量。`;
    } else if (rankingGapQueries.length > 0 || lowCtrQueries.length > 0) {
      gapType = rankingGapQueries.length > 0 ? "ranking" : "depth";
      priority = "warning";
      gapScore = Math.min(100, 60 + rankingGapQueries.length * 4 + lowCtrQueries.length * 4);
      const bits: string[] = [];
      if (rankingGapQueries.length > 0) bits.push(`${rankingGapQueries.length} 个近失词（推一把上首页）`);
      if (lowCtrQueries.length > 0) bits.push(`${lowCtrQueries.length} 个前 10 低 CTR 词（重写标题即可涨点击）`);
      recommendation = `Quick wins：${bits.join("；")}。这两类投入最小、见效最快，优先做——预计带来约 ${Math.round(nearMissClicks + lowCtrClicks)} 月新增点击。`;
    } else if (avgPosition > 30) {
      gapType = "depth"; priority = "warning";
      gapScore = Math.min(100, 40 + missingSeedCount * 4);
      recommendation = `有需求但整簇平均排名 ${Math.round(avgPosition)}（权威太弱）。需 cornerstone 内容建设（authority 档）。`;
    } else if (missingSeedCount > 0) {
      gapType = "visibility"; priority = "info";
      gapScore = Math.min(100, missingSeedCount * 6);
      recommendation = `已入首页区但仍有 ${missingSeedCount} 个应覆盖话题零曝光（内容缺口）。新建落地页覆盖，预计增量需求。`;
    } else {
      gapType = "healthy"; priority = "ok"; gapScore = 0;
      recommendation = "话题覆盖完整、排名健康，维持监控即可。";
    }

    const potentialValue = Math.round(actions.reduce((s, a) => s + a.potentialValue, 0) * 100) / 100;

    results.push({
      siteSlug: cluster.siteSlug, siteName: name, color,
      demand, capturedSeedCount, missingSeedCount, seedCoveragePct,
      capturedSeeds: capturedSeedList, missingSeeds: missingSeedList,
      rankingGapQueries, lowCtrQueries, newQueries,
      avgPosition: Math.round(avgPosition * 10) / 10,
      avgCtr: Math.round(avgCtr * 1000) / 1000,
      brandImpressions, nonBrandImpressions,
      authorityScore, trafficOpportunity, potentialValue, gapScore, priority, gapType,
      recommendation, actions,
    });
  }

  results.sort((a, b) => b.gapScore - a.gapScore || b.demand - a.demand);
  return results;
}

/** 跨簇汇总 */
export interface TopicalGapSummary {
  clusterCount: number;
  zeroPresenceCount: number;
  rankingGapCount: number;
  lowCtrCount: number;
  totalMissingSeeds: number;
  totalNearMissQueries: number;
  /** 全站流量机会（月潜在新增点击） */
  trafficOpportunityTotal: number;
  /** 全站潜在业务价值（美元/月） */
  potentialValueTotal: number;
  newQueryCount: number;
  actionCount: number;
  /** 品牌 / 非品牌展示 */
  brandImpressions: number;
  nonBrandImpressions: number;
}

export function summarizeGaps(clusters: ClusterGap[]): TopicalGapSummary {
  return {
    clusterCount: clusters.length,
    zeroPresenceCount: clusters.filter((c) => c.gapType === "visibility" && c.demand === 0).length,
    rankingGapCount: clusters.filter((c) => c.gapType === "ranking").length,
    lowCtrCount: clusters.reduce((s, c) => s + c.lowCtrQueries.length, 0),
    totalMissingSeeds: clusters.reduce((s, c) => s + c.missingSeedCount, 0),
    totalNearMissQueries: clusters.reduce((s, c) => s + c.rankingGapQueries.length, 0),
    trafficOpportunityTotal: clusters.reduce((s, c) => s + c.trafficOpportunity, 0),
    potentialValueTotal: Math.round(clusters.reduce((s, c) => s + c.potentialValue, 0) * 100) / 100,
    newQueryCount: clusters.reduce((s, c) => s + c.newQueries.length, 0),
    actionCount: clusters.reduce((s, c) => s + c.actions.length, 0),
    brandImpressions: clusters.reduce((s, c) => s + c.brandImpressions, 0),
    nonBrandImpressions: clusters.reduce((s, c) => s + c.nonBrandImpressions, 0),
  };
}

/** 按执行路线图分档聚合行动（非品牌优先、价值降序） */
export function roadmapByTier(clusters: ClusterGap[]): Record<RoadmapTier, ActionItem[]> {
  const out: Record<RoadmapTier, ActionItem[]> = { quick_wins: [], foundation: [], authority: [] };
  for (const c of clusters) for (const a of c.actions) out[a.tier].push(a);
  (Object.keys(out) as RoadmapTier[]).forEach((k) =>
    out[k].sort((a, b) => Number(b.isNonBrand) - Number(a.isNonBrand) || b.potentialValue - a.potentialValue),
  );
  return out;
}

export { SITES };
