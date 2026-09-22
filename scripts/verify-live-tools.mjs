#!/usr/bin/env node
/**
 * 线上工具页抽查 —— 本地 build 不可用（Contentlayer2 在 Git Bash 下报 NoConfigFoundError）时的替代验收手段。
 *
 * 用法:
 *   node scripts/verify-live-tools.mjs                       # 抽查全部 toolMeta 里最近新增的工具
 *   node scripts/verify-live-tools.mjs ascii-art barcode     # 指定 slug
 *   BASE=https://craftisle.com node scripts/verify-live-tools.mjs
 *
 * 检查项（每条都是"构建成功但线上静默错误"的已知缺陷模式）:
 *   1. HTTP 200（404 = 页面没进构建产物；308 = 尾斜杠与平台暴露方式不一致）
 *   2. <title> 里 "| Craftisle" 只出现一次（根 layout title.template 会追加，子页面不能再自带）
 *   3. rel=canonical 指向自身且为 slash-less（本站 Vercel 无 trailingSlash，带尾斜杠会 308）
 *   4. FAQPage JSON-LD 存在且 question 数与 toolMeta.faq 条数一致
 *   5. 面包屑指向真实类目页 /l/<key>-tools 而非死链
 */

import fs from "node:fs";

const BASE = process.env.BASE || "https://craftisle.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const DEFAULT_SLUGS = [
  // 2026-09-22 补挂的 7 个
  "ascii-art", "barcode", "color-picker", "json-validator",
  "csv-to-tsv", "change-csv-separator", "markdown",
  // 同日新增的 4 个
  "image-upscale", "ocr-text", "ai-image-editor", "video-compress",
];

const slugs = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_SLUGS;

/** 从 lib/tools.ts 粗略读出一个 slug 的 faq 条数与类目 key，用于对照线上渲染结果 */
function metaExpectation(slug) {
  const src = fs.readFileSync("lib/tools.ts", "utf8");
  const i = src.indexOf(`"${slug}": {`);
  if (i < 0) return null;
  let depth = 0, j = src.indexOf("{", i);
  const from = j;
  for (; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}") { depth--; if (depth === 0) break; }
  }
  const entry = src.slice(from, j + 1);
  const faqBlock = entry.match(/faq:\s*\[([\s\S]*?)\n\s*\],/);
  const faqCount = faqBlock ? (faqBlock[1].match(/\bq:\s*"/g) || []).length : 0;
  const catKey = (entry.match(/category:\s*CATEGORIES\.(\w+)/) || [])[1] || null;
  return { faqCount, catKey };
}

async function check(slug) {
  const url = `${BASE}/tools/${slug}`;
  const res = await fetch(url, { headers: { "user-agent": UA }, redirect: "manual" });
  const problems = [];

  if (res.status !== 200) {
    return { slug, status: res.status, problems: [`HTTP ${res.status}${res.status === 308 ? " (尾斜杠不一致)" : ""}`] };
  }

  const html = await res.text();

  // 1) title 双后缀
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const suffixCount = (title.match(/\|\s*Craftisle/g) || []).length;
  if (suffixCount !== 1) problems.push(`title 出现 ${suffixCount} 次 "| Craftisle" → ${title}`);

  // 2) canonical
  const canonical = (html.match(/rel="canonical" href="([^"]*)"/) || [])[1] || "";
  if (!canonical) problems.push("缺 canonical");
  else if (canonical !== url) problems.push(`canonical 指向 ${canonical}（应为 ${url}）`);

  // 3) FAQPage
  const expect = metaExpectation(slug);
  const faqMatch = html.match(/"@type":"FAQPage"[\s\S]{0,200}?"mainEntity":\[([\s\S]*?)\]\s*\}/);
  const liveFaq = faqMatch ? (faqMatch[1].match(/"@type":"Question"/g) || []).length : 0;
  if (liveFaq === 0) problems.push("线上无 FAQPage JSON-LD");
  else if (expect && liveFaq !== expect.faqCount) {
    problems.push(`FAQ 数不符：线上 ${liveFaq} vs toolMeta ${expect.faqCount}`);
  }

  // 4) 类目内链
  if (expect?.catKey) {
    if (!html.includes(`/l/${expect.catKey}-tools`)) {
      problems.push(`未见类目内链 /l/${expect.catKey}-tools`);
    }
  }

  return { slug, status: 200, title: title.slice(0, 70), faq: liveFaq, problems };
}

const results = [];
for (const s of slugs) {
  try {
    results.push(await check(s));
  } catch (e) {
    results.push({ slug: s, status: "ERR", problems: [String(e.message || e)] });
  }
}

console.log(`\n── 线上工具页抽查 (${BASE}) ──\n`);
let bad = 0;
for (const r of results) {
  if (r.problems.length) {
    bad++;
    console.log(`✗ /tools/${r.slug}  [${r.status}]`);
    for (const p of r.problems) console.log(`    · ${p}`);
  } else {
    console.log(`✓ /tools/${r.slug}  [200] FAQ=${r.faq}  ${r.title}`);
  }
}
console.log(`\n合计 ${results.length} 个，异常 ${bad} 个\n`);
process.exit(bad ? 1 : 0);
