#!/usr/bin/env node
/**
 * audit-related-tools.mjs — 内链死链 / 孤儿页护栏
 *
 * 背景（DEBT-17 / DEBT-18）：lib/related-tools.ts 的 RELATED_TOOLS 里有 25 条指向
 * toolMeta 中不存在的 slug。app/tools/[tool]/page.tsx 设了 dynamicParams=false 且
 * 查不到 toolMeta 就 notFound() ⇒ 这些 URL 全部 404。而这些配置从来没被渲染过，
 * 所以线上一个死链都没暴露 —— 这类缺陷不会让构建失败、不会让 lint 报错，
 * 只能靠「配置 ↔ 数据」双向对齐检查发现（与 audit-page-matrix 同源思路）。
 *
 * 断言：
 *   1. RELATED_TOOLS 的 value 里不存在 toolMeta 之外的 slug（死链）
 *   2. RELATED_TOOLS 的每个 key 自身存在于 toolMeta（幽灵宿主）
 *   3. 输出所有入度为 0 的工具（孤儿页，内链是有向的：宿主 relatedTools 里的
 *      才是入站）
 *
 * 用法：node scripts/audit-related-tools.mjs  （或 pnpm/npm run audit:related）
 * 退出码：0 = 无死链；1 = 存在死链/幽灵宿主（可用于 CI 门禁）
 */

import path from "node:path";
import esbuild from "esbuild";

const ROOT = process.cwd();
const REL = "lib/related-tools.ts";

const fail = (msg) => {
  console.error(msg);
  process.exitCode = 1;
};

/** 用 esbuild 打包 + 内存加载，拿到真实的 RELATED_TOOLS / toolMeta 对象。
 *  不用正则解析 TS —— 正则会在字符串/注释/嵌套上误判，这不是能上生产的做法。 */
async function loadModule() {
  const out = await esbuild.build({
    entryPoints: [path.join(ROOT, REL)],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    target: "node18",
    // 让 "@/lib/..." 解析到项目根
    alias: { "@": ROOT },
    logLevel: "silent",
  });
  const code = out.outputFiles[0].text;
  const mod = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  return mod;
}

const mod = await loadModule();
const { RELATED_TOOLS, mergeRelatedTools } = mod;

// toolMeta 与 RELATED_TOOLS 在同一个 bundle 里，但 related-tools 不 re-export 它，
// 所以直接从 tools.ts 单独取（tools.ts 无 import，可直接 esbuild）。
const toolsOut = await esbuild.build({
  entryPoints: [path.join(ROOT, "lib/tools.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "node18",
  logLevel: "silent",
});
const toolsCode = toolsOut.outputFiles[0].text;
const toolMeta = (
  await import(
    `data:text/javascript;base64,${Buffer.from(toolsCode).toString("base64")}`
  )
).toolMeta;
const imageToolIdsOut = await esbuild.build({
  entryPoints: [path.join(ROOT, "lib/image-tools/ids.ts")],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "node18",
  logLevel: "silent",
});
const imageToolIds = (
  await import(
    `data:text/javascript;base64,${Buffer.from(imageToolIdsOut.outputFiles[0].text).toString("base64")}`
  )
).imageToolIds;

const VALID = new Set([
  ...Object.keys(toolMeta),
  ...(imageToolIds || []),
]);

console.log(
  `audit:related — toolMeta ${Object.keys(toolMeta).length} 条 / imageToolIds ${
    (imageToolIds || []).length
  } 条 / 有效 slug 合计 ${VALID.size} 条`
);
console.log(`audit:related — RELATED_TOOLS 配置条目 ${Object.keys(RELATED_TOOLS).length} 条\n`);

// ── 断言 1&2：死链 + 幽灵宿主 ────────────────────────────────────────────
const deadLinks = [];   // value 里指向不存在 slug
const ghostHosts = [];  // key 本身不在 toolMeta 里（且不是 imageToolIds）
const selfRefs = [];     // 自己链自己

for (const [host, targets] of Object.entries(RELATED_TOOLS)) {
  if (!VALID.has(host)) ghostHosts.push(host);
  const seen = new Set();
  for (const t of targets) {
    if (seen.has(t)) continue;
    seen.add(t);
    if (!VALID.has(t)) {
      deadLinks.push({ host, target: t });
    } else if (t === host) {
      selfRefs.push({ host, target: t });
    }
  }
}

if (deadLinks.length) {
  fail(
    `✗ DEBT-18 死链 ${deadLinks.length} 条（指向 toolMeta 中不存在的 slug，线上 404）：`
  );
  for (const { host, target } of deadLinks) {
    console.error(`    ${host} -> ${target}`);
  }
  console.error("");
} else {
  console.log("✓ 断言 1：RELATED_TOOLS 无死链");
}

if (ghostHosts.length) {
  fail(`✗ 幽灵宿主 ${ghostHosts.length} 条（key 不在 toolMeta / imageToolIds 中）：`);
  for (const h of ghostHosts) console.error(`    ${h}`);
  console.error("");
} else {
  console.log("✓ 断言 2：RELATED_TOOLS 的 key 全部存在于 toolMeta");
}

if (selfRefs.length) {
  fail(`✗ 自指 ${selfRefs.length} 条（工具链接到自己）：`);
  for (const { host } of selfRefs) console.error(`    ${host} -> ${host}`);
  console.error("");
}

// ── 断言 3：孤儿页（入度 = 0）────────────────────────────────────────────
// 权威判据：**渲染出来的**互链。ToolDetailSections 走 mergeRelatedTools()，
// 它合并 meta.relatedTools（精选，优先）与 RELATED_TOOLS/同分类兜底（补位），
// 并去重、剔除自身、过滤非法 slug。所以这里直接调同一个函数 —— 断言的是
// 用户真实看到的链接图，而不是某份没人调用的配置。
// 注意方向：out.get(host) 是 host **指向**的那批工具（出边），
// 入度必须反过来累加到 target 上——写反了会把出度当入度，孤儿页永远算成 0。
const out = new Map(); // host -> [target]
for (const id of VALID) {
  out.set(id, mergeRelatedTools(id, toolMeta[id]?.relatedTools, 8));
}

const inDeg = new Map();
for (const id of VALID) inDeg.set(id, 0);
for (const targets of out.values()) {
  for (const t of targets) inDeg.set(t, (inDeg.get(t) || 0) + 1);
}

const orphans = [...inDeg.entries()]
  .filter(([, d]) => d === 0)
  .map(([id]) => id)
  .sort();

console.log(
  `\n入度统计：0 入度（孤儿页）${orphans.length} 个 / 共 ${VALID.size} 个工具`
);
if (orphans.length) {
  const lines = [];
  for (let i = 0; i < orphans.length; i += 6) {
    lines.push("    " + orphans.slice(i, i + 6).join(", "));
  }
  console.log(lines.join("\n"));
} else {
  console.log("    （无孤儿页）");
}

// 低入度（1-2）作为观察项输出，不计入失败
const low = [...inDeg.entries()]
  .filter(([, d]) => d > 0 && d <= 2)
  .map(([id, d]) => `${id}(${d})`)
  .sort();
console.log(`\n低入度（1-2 入站，观察项）${low.length} 个：`);
for (let i = 0; i < low.length; i += 6) {
  console.log("    " + low.slice(i, i + 6).join(", "));
}

console.log(
  `\n${process.exitCode ? "✗ audit:related FAILED" : "✓ audit:related PASSED"}`
);
