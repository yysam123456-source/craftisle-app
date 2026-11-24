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
const EXPECTED = [
  {
    label: "替代页 /directory/alternatives/[tool]",
    file: "app/(marketing)/directory/alternatives/[tool]/page.tsx",
    // 替代页 = 「一个付费工具的免费替代品列表」⇒ ItemList 是本体，FAQPage 是内容信号
    required: ["ItemList", "FAQPage"],
    // 层级明确（Directory > Category > Tool）⇒ 面包屑天然成立
    recommended: ["BreadcrumbList"],
  },
  {
    label: "落地页 /l/[slug]",
    file: "app/l/[slug]/page.tsx",
    required: ["SoftwareApplication", "FAQPage"],
    recommended: ["BreadcrumbList"],
  },
  {
    label: "对比页 /directory/compare/[...slug]",
    file: "app/(marketing)/directory/compare/[...slug]/page.tsx",
    required: ["ItemList"],
    recommended: ["BreadcrumbList", "FAQPage"],
  },
  {
    label: "分类页 /directory/[category]",
    file: "app/(marketing)/directory/[category]/page.tsx",
    required: [],
    recommended: ["BreadcrumbList", "ItemList"],
  },
  {
    label: "工具页 /tools/[tool]",
    file: "app/tools/[tool]/page.tsx",
    required: [],
    recommended: ["SoftwareApplication", "BreadcrumbList"],
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
  const types = new Set([...src.matchAll(/"@type"\s*:\s*"([^"]+)"/g)].map((m) => m[1]));

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
  const batchFiles = fs
    .readdirSync(altDir)
    .filter((f) => /^alternatives-batch.*\.json$/i.test(f));
  let checked = 0;
  let noFaq = 0;
  const examples = [];
  for (const bf of batchFiles) {
    try {
      const raw = JSON.parse(read(path.join("public", "data", bf)));
      const entries = Array.isArray(raw) ? raw : Object.values(raw ?? {});
      for (const e of entries) {
        if (!e || typeof e !== "object") continue;
        // 🔴 合并键是 paidTool 而非 slug（MEMORY 11-12 记录的坑）
        const key = e.paidTool ?? e.slug ?? e.name;
        if (!key) continue;
        checked++;
        const faqs = e.faqs ?? [];
        if (!Array.isArray(faqs) || faqs.length === 0) {
          noFaq++;
          if (examples.length < 5) examples.push(String(key));
        }
      }
    } catch {
      /* 单个批次文件解析失败不阻断整体检查 */
    }
  }
  if (checked > 0) {
    const pct = ((noFaq / checked) * 100).toFixed(1);
    dataChecks.push({ label: "替代页 faqs 覆盖", checked, noFaq, pct });
    if (noFaq > 0) {
      P1.push(
        `替代页中有 ${noFaq}/${checked}（${pct}%）条 faqs 为空` +
          `⇒ 线上不会输出 FAQPage（代码是 faqs?.length ? ... : null）` +
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
