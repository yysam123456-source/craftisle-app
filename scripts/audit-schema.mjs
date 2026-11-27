#!/usr/bin/env node
/**
 * audit-schema.mjs — 页面级 JSON-LD schema 存在性与完整性护栏
 *
 * 为什么必须有（2026-11-24 新增，源自 A3 IndexGuard 审计）：
 *   A3 规划里写「20 站 17 站缺 schema」，把它当成了事实。
 *   但 11-24 实测线上页面后，真实情况是**另一个问题**：
 *
 *     页面类型        实际输出的 schema                        缺失
 *     替代页          ItemList + FAQPage                      BreadcrumbList
 *     落地页 /l/*     SoftwareApplication + Offer + FAQPage   BreadcrumbList
 *     目录页/首页     （无 JSON-LD）                           全部
 *
 *   ⇒ 不是「缺 schema」，是**标记类型不全**。
 *     这个区别对 A3 很关键：产品要卖的是「补全标记类型」，不是「从零加标记」。
 *
 *   现有 `audit:sitemap` 查的是「sitemap 里的 URL 会不会 404」，
 *   `geo-audit` 查的是「robots/llms.txt/noindex/SSR 可读性」——
 *   **没有任何脚本查「页面该有的 schema 有没有」**。这是护栏盲区。
 *
 * 用法：
 *   node scripts/audit-schema.mjs          （或 pnpm audit:schema）
 *
 * 退出码：0 = 无缺失；1 = 有 P0 缺失（可用于 CI 门禁）。
 *
 * 设计取舍（重要）：
 *   这里做的是**静态源码校验**，不是线上抓取：
 *     - 离线/CI 可跑，不受本机 TLS 阻断影响（MEMORY 记录本机出网常被中断）
 *     - 比线上抓取快、稳
 *   代价：源码里写了 schema ≠ 线上真的输出了。
 *   所以本脚本对「schema 由数据驱动生成」的页面（替代页/落地页），
 *   额外做**数据层校验**（faq 字段是否真有内容），
 *   而真正「线上是否生效」仍需 read-back（铁律 1：HTTP200 ≠ 生效）。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const P0 = [];
const P1 = [];
const INFO = [];

const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf-8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

/** 去掉注释，避免「修复说明里引用的 @type 示例」造成误报。 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/**
 * 页面类型 → 期望的 schema @type 集合。
 *
 * 🔴 只列**该类型页面确实应该输出**的类型，不追求「全站统一」。
 *   例如 Review/ItemReviewed：craftisle 的替代页有真实评分（4.4/4.5…），
 *   但那是**替代工具的评分**，不是**这个页面的评分**，
 *   把它标成 Review 属于语义错误 ⇒ 本脚本不要求，也不建议加。
 */
// BreadcrumbList 由共享 helper 生成，字面量不在页面文件里。
const BREADCRUMB_HELPER = [{ call: "buildBreadcrumbJsonLd", file: "lib/breadcrumb-schema.ts" }];

const EXPECTED = [
  {
    label: "替代页 /directory/alternatives/[tool]",
    file: "app/(marketing)/directory/alternatives/[tool]/page.tsx",
    // 替代页 = 「一个付费工具的免费替代品列表」⇒ ItemList 是本体，FAQPage 是内容信号
    required: ["ItemList", "FAQPage"],
    // 层级明确（Directory > Category > Tool）⇒ 面包屑天然成立
    recommended: ["BreadcrumbList"],
    typeHelpers: BREADCRUMB_HELPER,
  },
  {
    label: "落地页 /l/[slug]",
    file: "app/l/[slug]/page.tsx",
    required: ["SoftwareApplication", "FAQPage"],
    recommended: ["BreadcrumbList"],
    typeHelpers: BREADCRUMB_HELPER,
  },
  {
    label: "对比页 /directory/compare/[...slug]",
    file: "app/(marketing)/directory/compare/[...slug]/page.tsx",
    required: ["ItemList"],
    recommended: ["BreadcrumbList", "FAQPage"],
    typeHelpers: BREADCRUMB_HELPER,
  },
  {
    label: "分类页 /directory/[category]",
    file: "app/(marketing)/directory/[category]/page.tsx",
    required: [],
    // ItemList 同样由 directoryCrumbs 之外的渲染给出；BreadcrumbList 来自 helper
    recommended: ["BreadcrumbList", "ItemList"],
    typeHelpers: BREADCRUMB_HELPER,
  },
  {
    label: "工具页 /tools/[tool]",
    file: "app/tools/[tool]/page.tsx",
    required: [],
    recommended: ["SoftwareApplication", "BreadcrumbList"],
    typeHelpers: [{
      call: "buildToolJsonLd",
      file: "lib/tool-seo.ts",
      extraFiles: ["lib/breadcrumb-schema.ts"],
    }],
  },
];

// ── 1. 源码层：每类页面实际写了哪些 @type ───────────────────────────────
console.log("─".repeat(64));
console.log("audit:schema — 页面级 JSON-LD 存在性与完整性");
console.log("─".repeat(64));

const results = [];

for (const spec of EXPECTED) {
  if (!exists(spec.file)) {
    INFO.push(`${spec.label}：源文件不存在（${spec.file}），跳过`);
    continue;
  }
  const src = stripComments(read(spec.file));
  const types = new Set();

  // 收集类型的统一入口：兼容字符串与数组两种 @type 写法
  // （lib/tool-seo.ts 用 `@type: ["SoftwareApplication", "WebApplication"]`）
  const collectTypes = (text) => {
    for (const m of text.matchAll(/"@type"\s*:\s*"([^"]+)"/g)) types.add(m[1]);
    for (const m of text.matchAll(/"@type"\s*:\s*\[([^\]]+)\]/g)) {
      for (const q of m[1].matchAll(/"([^"]+)"/g)) types.add(q[1]);
    }
  };
  collectTypes(src);

  // 🔴 2026-11-27：schema 类型可能来自共享 helper（如 buildBreadcrumbJsonLd），
  //   "@type" 字面量不在页面文件里。只有**页面真的调用了 helper**时才并入它的类型，
  //   避免「helper 存在就算绿」的假通过。
  for (const helper of spec.typeHelpers ?? []) {
    if (!src.includes(helper.call)) continue;
    // helper 文件 + 它内部进一步调用的类型源（extraFiles，如 tool-seo → breadcrumb-schema）
    for (const f of [helper.file, ...(helper.extraFiles ?? [])]) {
      if (!exists(f)) continue;
      collectTypes(stripComments(read(f)));
    }
  }

  const missingRequired = spec.required.filter((t) => !types.has(t));
  const missingRecommended = spec.recommended.filter((t) => !types.has(t));

  results.push({
    label: spec.label,
    file: spec.file,
    has: [...types].sort(),
    missingRequired,
    missingRecommended,
  });

  if (missingRequired.length) {
    P0.push(
      `${spec.label} 缺少必需 schema：${missingRequired.join(", ")}` +
        `（现有：${[...types].sort().join(", ") || "无"}）`,
    );
  }
  if (missingRecommended.length) {
    P1.push(
      `${spec.label} 缺少建议 schema：${missingRecommended.join(", ")}` +
        `（现有：${[...types].sort().join(", ") || "无"}）`,
    );
  }
}

// ── 2. 数据层：schema 由数据驱动时，数据得真的有内容 ───────────────────
//
// 🔴 这是「源码写了 schema ≠ 线上输出 schema」的关键一环：
//   替代页的 FAQPage 由 entry.faqs 生成。若 faqs 为空数组，
//   代码里 `entry.faqs?.length ? ... : null` 会**整块不输出** ——
//   于是源码里有 FAQPage，线上却没有。而这在静态检查里看不出来。
const dataChecks = [];

// 2a. 替代页：抽样若干条，核对 faqs 字段是否真有内容
//
// 🔴 批次数据在 public/data/（不是 data/）—— MEMORY 11-12 记录过
//   「alternatives-batch*.json 合并键 paidTool 非 slug、FAQ 字段 faqs[]」。
const altDir = path.join(ROOT, "public", "data");
if (exists("public/data")) {
  // 🔴 2026-11-27：必须合并 AdSense overlay 后再判断 faqs，否则误报。
  //   线上页面读的是 lib/alternatives.ts 的 getCombinedMap()（batch + overlay 合并），
  //   而本脚本原先只读原始 batch JSON。实测 11-27：脚本报 54/180 faqs 为空，
  //   但线上抽查 adobe-premiere-pro / shopify / semrush 全部输出 FAQPage
  //   ⇒ 那 54 条里的多数已被 overlay 补上，是审计盲区不是真实缺口。
  //   合并规则与 loadAdsenseOverlay() 一致：两份按顺序，faqs 非空数组才覆盖。
  const overlayFaqs = {};
  for (const ovFile of ["alternatives-adsense-overlay.json", "alternatives-adsense-overlay-2.json"]) {
    if (!exists(path.join("public", "data", ovFile))) continue;
    try {
      const ov = JSON.parse(read(path.join("public", "data", ovFile)));
      for (const [key, val] of Object.entries(ov?.entries ?? {})) {
        if (Array.isArray(val?.faqs) && val.faqs.length) overlayFaqs[key] = val.faqs;
      }
    } catch {
      /* overlay 解析失败不阻断 */
    }
  }
  const batchFiles = fs
    .readdirSync(altDir)
    .filter((f) => /^alternatives-batch.*\.json$/i.test(f));
  // 🔴 线上是「按 paidTool 去重 + 跨 batch 取最长数组 + 再叠加 overlay」的合并结果
  //   （lib/alternatives.ts getCombinedMap/mergeEntry）。同一 paidTool 在多个 batch
  //   重复出现（实测 Zoom 在 batch12/14/40），逐条统计会把同一页算多次且误判空 faqs。
  //   这里复刻同一语义：按 paidTool 聚合成 one-per-key 后才统计覆盖率。
  const byKey = new Map(); // key -> faqs[]（保留最长）
  for (const bf of batchFiles) {
    try {
      const raw = JSON.parse(read(path.join("public", "data", bf)));
      const entries = Array.isArray(raw) ? raw : Object.values(raw ?? {});
      for (const e of entries) {
        if (!e || typeof e !== "object") continue;
        const key = e.paidTool ?? e.slug ?? e.name;
        if (!key) continue;
        const k = String(key);
        const cur = byKey.get(k) ?? [];
        const faqs = Array.isArray(e.faqs) ? e.faqs : [];
        if (faqs.length > cur.length) byKey.set(k, faqs);
        else if (!byKey.has(k)) byKey.set(k, cur);
      }
    } catch {
      /* 单个批次文件解析失败不阻断整体检查 */
    }
  }
  // 叠加 overlay：只取更长的 faqs（mergeEntry 的内容数组语义）
  for (const [k, faqs] of Object.entries(overlayFaqs)) {
    const cur = byKey.get(k) ?? [];
    if (faqs.length > cur.length) byKey.set(k, faqs);
  }
  let checked = byKey.size;
  let noFaq = 0;
  const examples = [];
  for (const [k, faqs] of byKey) {
    if (!Array.isArray(faqs) || faqs.length === 0) {
      noFaq++;
      if (examples.length < 5) examples.push(k);
    }
  }
  if (checked > 0) {
    const pct = ((noFaq / checked) * 100).toFixed(1);
    dataChecks.push({ label: "替代页 faqs 覆盖", checked, noFaq, pct });
    if (noFaq > 0) {
      // 🔴 2026-11-27：措辞降级为「数据层未发现」而非断言「线上不输出」。
      //   本脚本离线，无法 import lib/alternatives.ts 的 in-code ALTERNATIVES_MAP
      //   （手写条目也会补 faqs）。实测 Evernote 在 batch+overlay 合并后 faqs 为空，
      //   但线上确有 FAQPage ⇒ 断言「线上不输出」是误报，会误导选词（11-25 就因此
      //   否决了整个方向）。真正线上状态必须 read-back。
      P1.push(
        `替代页数据层（batch+overlay 合并后）有 ${noFaq}/${checked}（${pct}%）条未发现 faqs` +
          `（线上可能被 in-code 手写条目补齐，须线上读回确认，勿直接判定无 FAQPage）` +
          (examples.length ? `，例：${examples.join(", ")}` : ""),
      );
    }
  }
}

// ── 3. 输出 ──────────────────────────────────────────────────────────────
console.log(`\n检查 ${results.length} 类页面 + ${dataChecks.length} 项数据校验\n`);

for (const r of results) {
  const status = r.missingRequired.length
    ? "🔴 缺必需"
    : r.missingRecommended.length
      ? "🟡 缺建议"
      : "✅ 完整";
  console.log(`${status}  ${r.label}`);
  console.log(`        现有：${r.has.join(", ") || "（无）"}`);
  if (r.missingRequired.length) console.log(`        缺必需：${r.missingRequired.join(", ")}`);
  if (r.missingRecommended.length) console.log(`        缺建议：${r.missingRecommended.join(", ")}`);
}

for (const d of dataChecks) {
  console.log(`ℹ️  ${d.label}：${d.checked - d.noFaq}/${d.checked} 有 faqs（${d.pct}% 无）`);
}

console.log("\n" + "─".repeat(64));
if (P0.length) {
  console.log(`\n🔴 P0（缺少必需 schema）：${P0.length} 项`);
  P0.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (P1.length) {
  console.log(`\n🟡 P1（建议补齐 / 数据缺口）：${P1.length} 项`);
  P1.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (INFO.length) {
  console.log(`\nℹ️ INFO：${INFO.length} 项`);
  INFO.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}

/**
 * 判定说明（重要，别误读）：
 *   本脚本只报 **P0 = 缺必需 schema**，P1 是建议项，**不阻断发布**。
 *   理由：schema 缺失影响 rich result 展示，但不是「页面不可索引」——
 *   它属于增长机会，不属于发布阻断项。真正阻断发布的是 sitemap 404（P0 级）。
 *
 *   ⇒ exit code 只看 P0。当前 craftisle 的 P0 应为 0（替代页/落地页的
 *   ItemList/FAQPage/SoftwareApplication 都在）；BreadcrumbList 缺失记 P1。
 */
if (!P0.length) {
  console.log("\n✅ 无「缺必需 schema」问题（建议项见上）。");
  console.log("─".repeat(64));
  process.exit(0);
}
console.log(`\n❌ 存在 ${P0.length} 个「缺必需 schema」问题。`);
console.log("─".repeat(64));
process.exit(1);
