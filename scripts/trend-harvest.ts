/**
 * trend-harvest —— 每日外部热词/长尾收割器
 *
 * 用途：替代「只复述 GSC 曝光/点击」的空转报告。拉取真实外部需求信号（Google Suggest），
 * 与站内 164 工具页 + 19 个 /l/ 落地页做粗匹配，输出「可对齐现有页(tune) / 疑似缺口(gap)」两类候选。
 *
 * 关键实测结论（2026-09-22）：
 *   - Google Suggest 直连可用，是长尾需求主力；
 *   - Google Trends Daily RSS 直连可用但内容是新闻/体育热榜，对工具站价值极低 → 仅作参考降权输出。
 *
 * 运行：npx tsx scripts/trend-harvest.ts
 * 输出：<repo>/.workbuddy/trends/trend-<YYYY-MM-DD>.{json,md}（TREND_OUT_DIR 可覆盖）+ stdout
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
import {
  fetchSuggestionsForSeeds,
  fetchDailyTrends,
  TREND_SEED_QUERIES,
} from "../lib/seo/trends-client";

const OUT_DIR =
  process.env.TREND_OUT_DIR || resolve(process.cwd(), "..", ".workbuddy", "trends");

/** 匹配语料 = 工具标题 + 工具 id + /l/ 落地页 h1/slug —— 避免把「已有页」误判为缺口。 */
function loadCorpus(): { key: string; text: string }[] {
  const out: { key: string; text: string }[] = [];

  const toolsPath = resolve(process.cwd(), "lib", "tools.ts");
  if (existsSync(toolsPath)) {
    const src = readFileSync(toolsPath, "utf-8");
    const re = /"([a-z0-9-]+)":\s*\{\s*\n\s*title:\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      out.push({ key: `/tools/${m[1]}`, text: `${m[2]} ${m[1].replace(/-/g, " ")}` });
    }
  }

  const lpPath = resolve(process.cwd(), "lib", "seo", "landing-pages.ts");
  if (existsSync(lpPath)) {
    const src = readFileSync(lpPath, "utf-8");
    const re = /slug:\s*"([a-z0-9-]+)"[\s\S]*?h1:\s*"([^"]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      out.push({ key: `/l/${m[1]}`, text: `${m[2]} ${m[1].replace(/-/g, " ")}` });
    }
  }

  return out;
}

const STOP = new Set([
  "free", "online", "tool", "tools", "the", "for", "and", "to", "of", "a", "in",
  "best", "generator", "maker", "converter", "editor", "download", "app", "how",
  "with", "that", "you", "your", "from", "into", "like", "com",
]);

/** 轻量词干化：让 converter/convert、editing/edit、tools/tool 归一。 */
function stem(w: string): string {
  return w.replace(/(ings|ing|ers|er|ors|or|ies|es|s)$/i, "").replace(/e$/, "");
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map(stem)
      .filter((w) => w.length > 2 && !STOP.has(w))
  );
}

/** 建议词与某条语料的词干重合数 ≥2 视为命中。 */
function matchCorpus(
  suggestion: string,
  corpus: { key: string; text: string }[]
): { key: string; score: number }[] {
  const t = tokens(suggestion);
  if (t.size === 0) return [];
  const hits: { key: string; score: number }[] = [];
  for (const c of corpus) {
    const ct = tokens(c.text);
    let score = 0;
    for (const w of ct) if (t.has(w)) score++;
    if (score >= 2) hits.push({ key: c.key, score });
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 3);
}

async function main() {
  const seeds = TREND_SEED_QUERIES;
  console.log(`[harvest] seeds=${seeds.length}`);

  const [suggestMap, dailyTrends, corpus] = await Promise.all([
    fetchSuggestionsForSeeds(seeds, { lang: "en", concurrency: 5 }),
    fetchDailyTrends("US"),
    Promise.resolve(loadCorpus()),
  ]);

  const allSuggestions = new Map<string, Set<string>>(); // suggestion -> seeds
  for (const [seed, list] of suggestMap.entries()) {
    for (const s of list) {
      const set = allSuggestions.get(s) || new Set<string>();
      set.add(seed);
      allSuggestions.set(s, set);
    }
  }

  const seedSet = new Set(seeds.map((s) => s.toLowerCase()));
  const matched: Array<{ suggestion: string; seeds: string[]; hits: { key: string; score: number }[] }> = [];
  const gaps: Array<{ suggestion: string; seeds: string[] }> = [];

  for (const [suggestion, fromSeeds] of allSuggestions.entries()) {
    if (seedSet.has(suggestion.toLowerCase())) continue; // 种子词本身不算发现
    const hits = matchCorpus(suggestion, corpus);
    const seedsArr = Array.from(fromSeeds);
    if (hits.length > 0) matched.push({ suggestion, seeds: seedsArr, hits });
    else gaps.push({ suggestion, seeds: seedsArr });
  }

  const cleanGaps = gaps.filter((g) => !/\bsite\b/i.test(g.suggestion));

  const date = new Date().toISOString().slice(0, 10);
  const payload = {
    generatedAt: new Date().toISOString(),
    seeds,
    corpusSize: corpus.length,
    suggestionCount: allSuggestions.size,
    matched,
    gaps: cleanGaps,
    dailyTrends,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, `trend-${date}.json`);
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf-8");

  const md: string[] = [];
  md.push(`# 每日趋势收割 — ${date}`);
  md.push("");
  md.push(
    `外部长尾建议 **${allSuggestions.size}** 条（来自 ${seeds.length} 个种子，语料 ${corpus.length} 条）；` +
      `可对齐现有页 ${matched.length} 条，疑似缺口 ${cleanGaps.length} 条。`
  );
  md.push("");
  md.push(`## 可对齐现有页（tune 候选，Top 30）`);
  for (const m of matched.slice(0, 30)) {
    md.push(`- "${m.suggestion}" → ${m.hits.map((h) => h.key).join(", ")}`);
  }
  md.push("");
  md.push(`## 疑似缺口（无对应工具页，Top 40）`);
  for (const g of cleanGaps.slice(0, 40)) {
    md.push(`- "${g.suggestion}"`);
  }
  md.push("");
  md.push(`## Google Trends 每日热榜（参考，价值低）`);
  for (const t of dailyTrends.slice(0, 10)) {
    md.push(`- ${t.title}${t.traffic ? `  [${t.traffic}]` : ""}`);
  }
  const mdText = md.join("\n");

  const mdPath = join(OUT_DIR, `trend-${date}.md`);
  writeFileSync(mdPath, mdText, "utf-8");

  console.log(mdText);
  console.log(`\n[harvest] wrote ${jsonPath} and ${mdPath}`);
}

main().catch((e) => {
  console.error("[harvest] failed:", e);
  process.exit(1);
});
