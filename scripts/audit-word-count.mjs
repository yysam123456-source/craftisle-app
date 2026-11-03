#!/usr/bin/env node
/**
 * audit:word-count —— 页面正文厚度闸门
 *
 * 🔴 2026-11-03 新增。此前 6 个 audit 脚本**没有一个检查正文长度**：
 *   · lib/seo/content-audit.ts 的 thinPages 用的是 **300 字符**（≈50 词）不是词数，
 *     且只统计不阻断；
 *   · scripts/geo-audit.ts:214 的 `< 300 词` 只是 P1 提示，默认只抽查 1 个页面。
 *
 * 🔴🔴 **为什么按「渲染组件实际读取的字段」统计，而不是正则抽字段**：
 *   2026-10-08 踩过这个坑 —— 「估算脚本（正则抽字段词数）不能替代实测页面抓取」，
 *   只数 description 会漏掉 howToUse / useCases / faq / 互链 4 个渲染块，
 *   差点得出「内容太薄」的错误结论。
 *   本脚本用 esbuild 加载**真实数据模块**，按渲染组件读取的字段逐字段累加；
 *   字段清单由 DRIFT_GUARD 守着 —— 组件一旦渲染了新字段而本脚本没跟上，
 *   直接报错，不会静默少算。
 *
 * 🔴 **基线机制（关键）**：这是一个**部署前**门禁，它必须拦「新写的薄页」，
 *   而不是让 CI 天天为既有欠账红。既有薄页记进基线文件（记为债务），
 *   只有**新增薄页**或**比基线更薄**才阻断。
 *
 * 阈值（按 2026-11-03 实测分布，不是拍脑袋）：
 *   工具页 ≥150 词   实测 mean 232 / min 7(external 桩) / max 912
 *   落地页 ≥250 词   实测 mean 360 / min 187 / max 1380
 *   对转页 ≥300 词   实测 mean 658 / min 362 / max 843（无既有页低于阈值）
 *   替代页 ≥800 词   实测 mean 771 / median 754 / max 2772
 *
 * 🔎 顺带发现（2026-11-03）：替代页簇 148 页里 **40 页 <300 词**（批量生成那批，
 *   3 个替代品 + 2 条 FAQ），而**有曝光的全是厚页**（google-workspace 2772 /
 *   microsoft-project / plausible 1577 / figma 1449 …，全在 ≥1200 的 19 页里）。
 *   ⇒ 「加厚已有页」比「多建页」有效，这条现在有量化依据了。
 */

import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// 🔴 基线文件必须放在**被 git 跟踪**的路径下 —— `.workbuddy/` 在 .gitignore 里
//   （第 74 行），放那儿 CI 拿不到基线 ⇒ 所有既有薄页都会被当成「新增薄页」⇒ CI 天天红。
const BASELINE_FILE = path.join(ROOT, "audit-baselines", "word-count.json");

/** 用 esbuild 打包 + 内存加载，拿到真实模块（与 audit:related 同一手法，不用正则解析 TS）。 */
async function loadModule(rel) {
  const out = await esbuild.build({
    entryPoints: [path.join(ROOT, rel)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "node18",
    alias: { "@": ROOT },
    logLevel: "silent",
  });
  const code = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

const wordCount = (v) => {
  if (v == null) return 0;
  if (Array.isArray(v)) return v.reduce((s, x) => s + wordCount(x), 0);
  if (typeof v === "object") return Object.values(v).reduce((s, x) => s + wordCount(x), 0);
  if (typeof v !== "string") return 0;
  return v.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
};

function countByFields(entry, fields) {
  let total = 0;
  for (const f of fields) {
    if (!(f in entry)) continue;
    total += wordCount(entry[f]);
  }
  return total;
}

// ─────────────────────────────────────────────────────────────
// DRIFT_GUARD：字段清单与渲染组件的一致性检查
//   组件里出现了该页型没列的**正文**字段 ⇒ 报错（否则会静默少算词数）
//
//   🔴 守卫是**页型级**而非组件级：同一个字段可能出现在多个组件里
//   （faq 在 ToolDetailSections 是可见正文、在 ToolDetailLayout 是 JSON-LD），
//   但**只该计一次**。按组件分别守卫会误报「faq 没列进 Layout 的清单」。
// ─────────────────────────────────────────────────────────────
const PAGE_TYPES = [
  {
    type: "tool",
    components: [
      { file: "components/tools/ToolDetailSections.tsx", varName: "meta" },
      { file: "components/tools/ToolDetailLayout.tsx", varName: "meta" },
    ],
    fields: ["description", "howToUse", "useCases", "faq", "desc"],
  },
  {
    type: "alternatives",
    components: [{ file: "app/(marketing)/directory/alternatives/[tool]/page.tsx", varName: "entry" }],
    fields: ["tagline", "pricing", "description", "whySwitch", "painPoints", "alternatives", "verdict", "migrationGuide", "faqs"],
  },
  {
    type: "pair",
    components: [{ file: "app/(marketing)/c/[pair]/page.tsx", varName: "pair" }],
    fields: ["phrase", "intro", "sizeLimitCta", "technicalNote", "whenToUse", "faqs"],
  },
  {
    type: "landing",
    components: [{ file: "app/l/[slug]/page.tsx", varName: "data" }],
    fields: ["h1", "intro", "sections", "faq", "internalLinks"],
  },
];

const IGNORE_FIELDS = new Set([
  "title", "url", "slug", "icon", "badge", "category", "from", "to",
  "paidTool", "paidToolUrl", "h1Override", "seoTitleOverride", "seoKeywords",
  "relatedTools", "featured", "length", "map", "resourceId",
]);

/**
 * 只看**渲染成正文**的字段访问 —— metadata 与 JSON-LD 不算正文。
 *
 * 为什么必须这么收窄：
 *   · l/[slug]/page.tsx 的 `data.description` / `data.keywords` 出现在
 *     generateMetadata 里（meta 标签，不是可见正文）；
 *   · c/[pair]/page.tsx 的 `pair.description` 同样只在 generateMetadata；
 *   · ToolDetailLayout.tsx 的 `meta.faq` 出现在 JSON-LD 的 <script> 里
 *     （同一个 faq 在 ToolDetailSections 里才是可见正文，只算一次）。
 *   把它们当正文会虚高；完全不查又会漏掉「组件新渲染了一个正文块」。
 *
 * 做法：剪掉 <script>…</script> 与自闭合 <script … />，再用**括号配对**
 * 剪掉 generateMetadata / buildXxxJsonLd 的整个函数体。
 * 🔴 不用正则去匹配函数尾 —— `generateMetadata({ params, }: { ... })` 里的
 *   `}: {` 会让 lazy 正则在 `\n}` 处提前截断，函数体后半截漏剪（实测踩到）。
 */
/**
 * 剪掉某个函数的整个函数体（按括号配对）。
 *
 * 🔴 两个坑都踩过：
 *   1) 不能用 lazy 正则找函数尾 —— `generateMetadata({ params, }: { ... })` 里的
 *      `}: {` 会让 `\n\}` 提前命中，函数体后半截漏剪。
 *   2) 不能从参数的 `{` 开始配对 —— 参数解构 `{ params, }` 自己就闭合了，
 *      深度会先归零。必须**先配平参数列表的圆括号**，再从其后的 `{` 开始配平花括号。
 */
function stripFunctionByBraces(src, namePattern) {
  const re = new RegExp(`(?:export\\s+)?(?:async\\s+)?function\\s+${namePattern}\\s*\\(`, "g");
  let out = src;
  let m;
  while ((m = re.exec(out)) !== null) {
    const start = m.index;
    const openParen = out.indexOf("(", start);
    // 配平参数列表
    let p = openParen;
    let parenDepth = 0;
    let inStr = null;
    for (; p < out.length; p++) {
      const c = out[p];
      if (inStr) {
        if (c === "\\") { p++; continue; }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "(") parenDepth++;
      else if (c === ")") { parenDepth--; if (parenDepth === 0) break; }
    }
    if (p >= out.length) break;
    // 从参数列表之后的第一个 { 开始配平函数体
    let i = out.indexOf("{", p);
    if (i < 0) break;
    let depth = 0;
    let end = -1;
    inStr = null;
    for (; i < out.length; i++) {
      const c = out[i];
      if (inStr) {
        if (c === "\\") { i++; continue; }
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { end = i + 1; break; }
      }
    }
    if (end < 0) break;
    out = out.slice(0, start) + " " + out.slice(end);
    re.lastIndex = 0;
  }
  return out;
}

function renderedFieldAccesses(src, varName) {
  let s = src;
  // 1) 去掉 JSX 里的 <script …>…</script> 与自闭合 <script … />
  s = s.replace(/<script[\s\S]*?<\/script>/gi, " ");
  s = s.replace(/<script[\s\S]*?\/>/gi, " ");
  // 2) 去掉只产出元数据的函数体（generateMetadata / buildXxxJsonLd）
  s = stripFunctionByBraces(s, "\\w*(?:[Mm]etadata|JsonLd)");
  // 3) 去掉 constructMetadata(...) 调用
  s = s.replace(/\bconstructMetadata\s*\([\s\S]*?\n\s*\);/g, " ");
  const used = new Set();
  const re = new RegExp(`\\b${varName}\\.([a-zA-Z_]\\w*)`, "g");
  let m;
  while ((m = re.exec(s)) !== null) used.add(m[1]);
  return used;
}

console.log("audit:word-count —— 页面正文厚度闸门\n");

const drift = [];
for (const pt of PAGE_TYPES) {
  const usedAll = new Set();
  for (const c of pt.components) {
    const p = path.join(ROOT, c.file);
    if (!fs.existsSync(p)) {
      drift.push({ file: c.file, fields: ["(组件文件不存在)"] });
      continue;
    }
    const src = fs.readFileSync(p, "utf8");
    for (const f of renderedFieldAccesses(src, c.varName)) usedAll.add(f);
  }
  const unknown = [...usedAll].filter((f) => !IGNORE_FIELDS.has(f) && !pt.fields.includes(f));
  if (unknown.length) drift.push({ file: `${pt.type} 页型`, fields: unknown });
}

// ─────────────────────────────────────────────────────────────
// 逐页型统计
// ─────────────────────────────────────────────────────────────
const results = [];
const FIELDS_OF = Object.fromEntries(PAGE_TYPES.map((p) => [p.type, p.fields]));
const MIN_OF = { tool: 150, landing: 250, pair: 300, alternatives: 800 };

async function auditTools() {
  const { toolMeta } = await loadModule("lib/tools.ts");
  const F = FIELDS_OF.tool;
  for (const [id, meta] of Object.entries(toolMeta)) {
    if (meta.external) continue; // 外链工具页按设计无正文（跳转到别的站）
    results.push({ type: "tool", id: `/tools/${id}`, words: countByFields(meta, F), min: MIN_OF.tool });
  }
}

async function auditLanding() {
  const { LANDING_PAGES } = await loadModule("lib/seo/landing-pages.ts");
  const F = FIELDS_OF.landing;
  for (const [slug, p] of Object.entries(LANDING_PAGES)) {
    results.push({ type: "landing", id: `/l/${slug}`, words: countByFields(p, F), min: MIN_OF.landing });
  }
}

async function auditPairs() {
  const { CONVERT_PAIRS } = await loadModule("lib/convert/pairs.ts");
  const F = FIELDS_OF.pair;
  for (const pair of CONVERT_PAIRS) {
    results.push({ type: "pair", id: `/c/${pair.slug}`, words: countByFields(pair, F), min: MIN_OF.pair });
  }
}

async function auditAlternatives() {
  const { getCombinedMap } = await loadModule("lib/alternatives.ts");
  const F = FIELDS_OF.alternatives;
  for (const [paidTool, entry] of Object.entries(getCombinedMap())) {
    const slug = paidTool.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-");
    results.push({ type: "alternatives", id: `/directory/alternatives/${slug}`, words: countByFields(entry, F), min: MIN_OF.alternatives });
  }
}

await auditTools();
await auditLanding();
await auditPairs();
await auditAlternatives();

// ── 分布 ──
const byType = {};
for (const r of results) {
  const b = (byType[r.type] ??= { n: 0, min: Infinity, max: 0, sum: 0, thin: 0 });
  b.n++;
  b.sum += r.words;
  b.min = Math.min(b.min, r.words);
  b.max = Math.max(b.max, r.words);
  if (r.words < r.min) b.thin++;
}
console.log("── 分布 ──");
for (const [t, b] of Object.entries(byType)) {
  const thr = results.find((r) => r.type === t).min;
  console.log(
    `  ${t.padEnd(13)} n=${String(b.n).padStart(4)}  mean=${String(Math.round(b.sum / b.n)).padStart(5)}  min=${String(b.min).padStart(5)}  max=${String(b.max).padStart(5)}  阈值=${thr}  低于阈值=${b.thin}`
  );
}

// ── 基线 ──
const currentThin = {};
for (const r of results) if (r.words < r.min) currentThin[r.id] = r.words;

let baseline = {};
let baselineCreated = false;
if (fs.existsSync(BASELINE_FILE)) {
  try {
    baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8")).thin ?? {};
  } catch {
    console.log("  ⚠ 基线文件损坏，按「无基线」处理（本次会重建）");
    baseline = {};
  }
} else {
  baselineCreated = true;
}

const P0 = [];
const P1 = [];

for (const d of drift) {
  P0.push(`字段清单漂移：${d.file} 里出现了本脚本未列的字段 [${d.fields.join(", ")}] —— 词数会被少算。修法：补进 audit-word-count.mjs 的 DRIFT_GUARD / FIELDS。`);
}

// 新增薄页（不在基线里）
for (const [id, w] of Object.entries(currentThin)) {
  const r = results.find((x) => x.id === id);
  if (baselineCreated) {
    // 首次运行：所有既有薄页一次性记为债务，不阻断（否则第一次跑就把 CI 拉红）
    P1.push(`既有薄页（债务，基线建立时录入）：${id} ${w} 词，阈值 ${r.min}`);
  } else if (!(id in baseline)) {
    P0.push(`新增薄页：${id}（${r.type}）仅 ${w} 词，阈值 ${r.min} —— 不过闸门不发布`);
  } else {
    P1.push(`既有薄页（债务）：${id} ${w} 词，阈值 ${r.min}`);
  }
}

// 比基线更薄 = 退化
for (const [id, baseWords] of Object.entries(baseline)) {
  if (!(id in currentThin)) continue; // 已修好
  const now = currentThin[id];
  if (now < baseWords) {
    P0.push(`内容退化：${id} 从 ${baseWords} 词降到 ${now} 词（基线 ${baseWords}）`);
  }
}

// 基线里已修好的
const fixed = Object.keys(baseline).filter((id) => !(id in currentThin));

console.log(`\n── 结果 ──`);
console.log(`  页面总数 ${results.length}｜新增薄页/退化 ${P0.length}｜既有薄页(债务) ${P1.length}｜已修复 ${fixed.length}`);
if (fixed.length) console.log(`  ✅ 本次修复的薄页：${fixed.slice(0, 20).join(", ")}${fixed.length > 20 ? " …" : ""}`);
if (P1.length) {
  console.log(`\n  既有薄页（债务，不阻断）：${P1.length} 条 —— 这批要靠「加厚」逐个补，不是靠 CI 拦`);
  P1.slice(0, 10).forEach((p) => console.log(`    · ${p}`));
  if (P1.length > 10) console.log(`    … 另有 ${P1.length - 10} 条`);
}

// ── 更新基线 ──
if (!baselineCreated || P0.length === 0) {
  fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
  fs.writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      {
        note: "audit:word-count 的既有薄页基线。新增薄页或比基线更薄 ⇒ P0 阻断；修好了会自动移出基线。",
        generatedAt: new Date().toISOString(),
        thresholds: Object.fromEntries(
          Object.entries(byType).map(([t]) => [t, results.find((r) => r.type === t).min])
        ),
        thin: currentThin,
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`\n  基线已更新：${BASELINE_FILE.replace(ROOT + path.sep, "")}（${Object.keys(currentThin).length} 条既有薄页）`);
} else {
  console.log(`\n  ⚠ 有 P0，基线未更新（避免把新问题固化进基线）`);
}

if (P0.length) {
  console.log("\n  P0（阻断）：");
  P0.forEach((p) => console.log(`    ✗ ${p}`));
  console.log("\n  ❌ 页面质量闸门未通过 —— 不过闸门不发布（一页废页的代价高于十页好页的收益）");
  process.exit(1);
}
if (baselineCreated) {
  console.log("\n✅ 基线已建立（首次运行），既有薄页记为债务不阻断；此后新增薄页会阻断");
} else {
  console.log("\n✅ 页面质量闸门通过");
}
process.exit(0);
