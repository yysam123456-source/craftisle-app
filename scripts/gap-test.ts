/**
 * 离线单测 v3：Topical Authority Gap Detector
 * 覆盖：排名近失 / 低CTR / 可见性缺口(零曝光) / 深度不足 / 新词发现 /
 *       跨子站 cannibalization / 流量机会量化(现实化) / 品牌非品牌拆分 /
 *       意图分类 / 价值加权 / 设备感知 CTR / 执行路线图 / no_data。
 *
 * 运行：esbuild 打包 → node 运行（Node 不能直接跑 .ts）
 *   npx esbuild scripts/gap-test.ts --bundle --platform=node --format=cjs --outfile=.gap-test.cjs && node .gap-test.cjs
 */

import {
  analyzeTopicalGaps, summarizeGaps, detectCannibalization, roadmapByTier,
  QueryPageRow, benchmarkCtr, matchesSeed, isNonBrandQuery, classifyQueryType,
  VALUE_WEIGHTS,
} from "../lib/seo/topical-gaps";

let pass = 0;
let fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log("  ✅ " + msg); }
  else { fail++; console.error("  ❌ " + msg); }
}

const rows: QueryPageRow[] = [
  // ── craftisle（排名近失 + 低CTR + 词序颠倒命中）──
  { query: "ms project alternative", page: "https://craftisle.com/tools", impressions: 10, clicks: 0, ctr: 0, position: 22 },
  { query: "google workspace alternative", page: "https://craftisle.com/tools", impressions: 8, clicks: 0, ctr: 0, position: 18 },
  { query: "free online tools", page: "https://craftisle.com/tools", impressions: 5, clicks: 0, ctr: 0, position: 45 },
  { query: "intellij alternative", page: "https://craftisle.com/", impressions: 7, clicks: 0, ctr: 0, position: 9 },
  { query: "best free tools", page: "https://craftisle.com/", impressions: 40, clicks: 0, ctr: 0, position: 6 },
  // 词序颠倒：应仍能命中种子 "ms project alternative"
  { query: "alternative to ms project", page: "https://craftisle.com/", impressions: 6, clicks: 0, ctr: 0, position: 25 },
  // 跨子站 cannibalization 用（同时是 craftisle 新词）
  { query: "tool site", page: "https://craftisle.com/", impressions: 5, clicks: 0, ctr: 0, position: 30 },

  // ── pdf（深度不足 + 新词）──
  { query: "merge pdf", page: "https://pdf.craftisle.com/merge", impressions: 20, clicks: 1, ctr: 0.05, position: 55 },
  { query: "compress pdf", page: "https://pdf.craftisle.com/compress", impressions: 15, clicks: 0, ctr: 0, position: 62 },
  { query: "extract pages from pdf", page: "https://pdf.craftisle.com/", impressions: 3, clicks: 0, ctr: 0, position: 40 },
  // 跨子站 cannibalization 用（pdf 侧）
  { query: "tool site", page: "https://pdf.craftisle.com/", impressions: 4, clicks: 0, ctr: 0, position: 33 },

  // ── viewer（核心词进首页但 CTR 极低 → 低CTR）──
  { query: "file viewer online", page: "https://viewer.craftisle.com/", impressions: 30, clicks: 0, ctr: 0, position: 5 },
  { query: "docx viewer", page: "https://viewer.craftisle.com/docx", impressions: 25, clicks: 0, ctr: 0, position: 8 },
  { query: "view pdf online", page: "https://viewer.craftisle.com/pdf", impressions: 20, clicks: 0, ctr: 0, position: 6 },

  // ── whiteboard（排名近失）──
  { query: "online whiteboard", page: "https://draw.craftisle.com/", impressions: 12, clicks: 0, ctr: 0, position: 14 },

  // ── resume / imgprompt / games / fxlab：零曝光（无行）──
];

console.log("== 场景 1：真实数据（hasData=true）==");
const clusters = analyzeTopicalGaps(rows, true);
assert(clusters.length === 8, `返回 8 个簇（实际 ${clusters.length}）`);
const bySlug = Object.fromEntries(clusters.map((c) => [c.siteSlug, c]));

const craft = bySlug["craftisle"];
assert(craft.rankingGapQueries.length === 4, `craftisle 近失词 4 个（含词序颠倒的 alternative to ms project P25，实际 ${craft.rankingGapQueries.length}）`);
assert(craft.lowCtrQueries.length >= 1, `craftisle 低CTR词 >=1（实际 ${craft.lowCtrQueries.length}）`);
assert(craft.trafficOpportunity > 0, `craftisle 流量机会 >0（实际 ${craft.trafficOpportunity}）`);
// 词序颠倒命中：alternative to ms project 不应算新词（已命中 ms project alternative 种子）
assert(craft.newQueries.every((q) => !q.query.includes("alternative to ms project")), "词序颠倒查询不误判为新词");

const pdf = bySlug["pdf"];
assert(pdf.gapType === "depth", `pdf 判为 depth（实际 ${pdf.gapType}）`);
assert(pdf.newQueries.length >= 1, `pdf 发现新词 >=1（实际 ${pdf.newQueries.length}）`);

const resume = bySlug["resume"];
assert(resume.demand === 0 && resume.priority === "critical", `resume 零曝光 critical`);

// 品牌 / 非品牌拆分
const summary = summarizeGaps(clusters);
assert(summary.nonBrandImpressions > 0, `非品牌展示 >0（实际 ${summary.nonBrandImpressions}）`);
assert(summary.brandImpressions === 0, `本测试无品牌词 → 品牌展示 0（实际 ${summary.brandImpressions}）`);
assert(summary.potentialValueTotal > 0, `全站潜在价值 >0（实际 ${summary.potentialValueTotal}）`);
assert(summary.trafficOpportunityTotal > 0, `全站流量机会 >0（实际 ${summary.trafficOpportunityTotal}）`);
assert(summary.lowCtrCount >= 4, `低CTR词总数 >=4（实际 ${summary.lowCtrCount}）`);
assert(summary.newQueryCount >= 2, `新词总数 >=2（实际 ${summary.newQueryCount}）`);
assert(summary.zeroPresenceCount === 4, `零曝光子站 4 个（实际 ${summary.zeroPresenceCount}）`);
assert(summary.potentialValueTotal <= summary.trafficOpportunityTotal, "潜在价值(美元) <= 潜在点击（系数<1）");

// 路线图（非品牌优先 + 价值降序）
const road = roadmapByTier(clusters);
assert((road.quick_wins?.length ?? 0) > 0, `quick_wins 有行动项（实际 ${road.quick_wins?.length}）`);
assert((road.foundation?.length ?? 0) > 0, `foundation 有行动项（实际 ${road.foundation?.length}）`);
// quick_wins 全部应为非品牌（价值优先）
assert(road.quick_wins.every((a) => a.isNonBrand), "quick_wins 全部非品牌（增长盘优先）");

// CTR 基准曲线单调性 + 设备系数
assert(benchmarkCtr(1) > benchmarkCtr(10) && benchmarkCtr(10) > benchmarkCtr(50), "CTR 基准曲线随排名递减");
assert(benchmarkCtr(5, 0.75) < benchmarkCtr(5, 1), "移动端 CTR 系数 < 桌面");

// matchesSeed 词序 + 不误匹配
assert(matchesSeed("alternative to ms project", "ms project alternative"), "词序颠倒仍能命中种子");
assert(!matchesSeed("online pdf tools", "all in one tools"), "不把无关查询误判为命中（需种子 token 全在查询内）");

// 品牌 / 意图分类
assert(isNonBrandQuery("merge pdf") === true, "merge pdf 非品牌");
assert(isNonBrandQuery("craftisle free tools") === false, "含 craftisle 为品牌词");
assert(classifyQueryType("best pdf alternative") === "directory", "best+alternative → directory 意图");
assert(classifyQueryType("online pdf converter") === "tools", "online+converter → tools 意图");

// 价值系数存在
assert(VALUE_WEIGHTS["resume"] > VALUE_WEIGHTS["games"], "resume 单点击价值 > games");

console.log("== 场景 2：GSC 未配置（hasData=false）==");
const noData = analyzeTopicalGaps([], false);
assert(noData.every((c) => c.gapType === "no_data"), "no_data 时全部 no_data");
assert(summarizeGaps(noData).zeroPresenceCount === 0, "no_data 不计入零曝光");
assert(roadmapByTier(noData).quick_wins.length === 0, "no_data 无行动项");
assert(summarizeGaps(noData).potentialValueTotal === 0, "no_data 无潜在价值");

console.log(`\n== 结果：${pass} 通过 / ${fail} 失败 ==`);
if (fail > 0) process.exit(1);
