#!/usr/bin/env node
/**
 * audit-page-matrix.mjs — 工具页矩阵一致性护栏
 *
 * 背景：2026-09-22 一次排查抓到两类静默缺陷（都不会报错、都不会让构建失败）：
 *   A. 「幽灵页」—— app/tools/image-upscale|ai-image-editor|ocr-text 三份 page.tsx
 *      逐字节相同，于是 /tools/image-upscale 这个 URL 上跑的是 OCR 工具，
 *      canonical 还互相指。
 *   B. 「幽灵组件」—— components/tools/ImageUpscaleTool.tsx 等真实组件一直躺在仓库里
 *      从未被 componentLoaders 注册；且它引用的两个 HF 模型 id 根本不存在（401），
 *      AI 分支每次抛错后被 catch 吞掉、静默降级。构建全程零报警。
 *
 * 这类问题只能靠"四方对齐"检查发现：toolMeta ↔ componentLoaders ↔ 静态 page.tsx ↔ 组件文件。
 * 用法：node scripts/audit-page-matrix.mjs   （或 pnpm audit:pages）
 * 退出码：0 = 无 P0 问题；1 = 存在 P0 问题（可用于 CI 门禁）。
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p) => fs.existsSync(path.join(ROOT, p));

const P0 = [];
const P1 = [];
const INFO = [];

// ── 1. toolMeta ids ────────────────────────────────────────────────────────
const toolsSrc = read("lib/tools.ts");
const metaStart = toolsSrc.indexOf("export const toolMeta");
if (metaStart < 0) {
  console.error("FATAL: 找不到 lib/tools.ts 的 toolMeta");
  process.exit(1);
}
const metaIds = [
  ...toolsSrc.slice(metaStart).matchAll(/^ {2}"([a-z0-9-]+)": \{/gm),
].map((m) => m[1]);
const metaSet = new Set(metaIds);

const dupMeta = metaIds.filter((v, i) => metaIds.indexOf(v) !== i);
if (dupMeta.length) P0.push(`lib/tools.ts 存在重复 id: ${dupMeta.join(", ")}`);

// ── 2. componentLoaders keys ───────────────────────────────────────────────
// 注意：loader 写法不统一，解析必须容忍三种形态，否则会产生大量假阳性
// （踩过：`() => import("@/components/tools/X")` 单行 /
//   跨行 `() =>\n  import(...)` /
//   `import(".../create-gif-page").then(m => ({ default: m.CreateGifPage }))` 具名导出 /
//   嵌套目录 `import(".../IDPhoto/IDPhotoTool")`）
const loaderSrc = read("lib/tool-components.tsx");
const loaderIds = [
  ...loaderSrc.matchAll(
    /^ {2}"([a-z0-9-]+)": \(\) =>\s*import\("@\/components\/tools\/([A-Za-z0-9_/-]+)"\)/gm
  ),
].map((m) => ({ id: m[1], comp: m[2] }));
const loaderSet = new Set(loaderIds.map((l) => l.id));

// ── 3. 静态工具页 ──────────────────────────────────────────────────────────
const toolsDir = path.join(ROOT, "app", "tools");
const staticPages = fs
  .readdirSync(toolsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && exists(path.join("app", "tools", d.name, "page.tsx")))
  .map((d) => d.name);

// ── A. 幽灵页：page.tsx 内容撞车 ───────────────────────────────────────────
const pageHashes = new Map();
for (const slug of staticPages) {
  const buf = fs.readFileSync(path.join(toolsDir, slug, "page.tsx"));
  const h = crypto.createHash("md5").update(buf).digest("hex");
  if (!pageHashes.has(h)) pageHashes.set(h, []);
  pageHashes.get(h).push(slug);
}
for (const [h, slugs] of pageHashes) {
  if (slugs.length > 1) {
    P0.push(`幽灵页：这些 page.tsx 逐字节相同（md5 ${h.slice(0, 8)}）→ ${slugs.join(", ")}（至少一个 URL 在展示别人的内容）`);
  }
}

// ── B. 静态页 canonical 是否指向自己 ───────────────────────────────────────
for (const slug of staticPages) {
  const src = read(path.join("app", "tools", slug, "page.tsx"));
  for (const m of src.matchAll(/canonical:\s*"https?:\/\/[^"]*?(\/tools\/[a-z0-9/-]+)"/g)) {
    const target = m[1].replace(/\/$/, "");
    if (target !== `/tools/${slug}`) {
      P0.push(`canonical 错指：/tools/${slug} 的 canonical 指向 ${target}（会被判为重复内容）`);
    }
  }
}

// ── C. 幽灵组件 / 未注册工具 ───────────────────────────────────────────────
const toolsMetaNoLoader = metaIds.filter((id) => !loaderSet.has(id));
const loaderNoMeta = loaderIds.filter((l) => !metaSet.has(l.id));
// toolMeta 有、loader 没有：若同时**没有**静态页，则该工具页交互区永远为空
for (const id of toolsMetaNoLoader) {
  if (!staticPages.includes(id)) {
    P0.push(`幽灵工具：toolMeta 有 "${id}" 但既没注册组件、也没有静态 page.tsx ⇒ 页面交互区恒为空`);
  } else {
    INFO.push(`toolMeta "${id}" 未注册组件，但存在静态页（自行 import 组件，属预期）`);
  }
}
for (const l of loaderNoMeta) {
  P1.push(`注册了组件 "${l.id}" 但 toolMeta 里没有该 id ⇒ 该组件永远不会被渲染`);
}

// loader 指向的组件文件是否存在（comp 可能是嵌套路径，如 IDPhoto/IDPhotoTool）
for (const l of loaderIds) {
  const direct = path.join("components", "tools", `${l.comp}.tsx`);
  const flat = path.join("components", "tools", `${l.comp.replace(/^.*\//, "").replace(/-page$/, "")}.tsx`);
  // create-gif-page / find-duplicates-page 本身就是 components/tools 下的文件，无需再推导
  const asIs = path.join("components", "tools", l.comp.endsWith("-page") ? `${l.comp}.tsx` : "__none__");
  if (!exists(direct) && !exists(flat) && !exists(asIs)) {
    P0.push(`组件文件缺失：Loader "${l.id}" 指向 components/tools/${l.comp}.tsx，文件不存在 ⇒ 该工具静默不渲染`);
  }
}

// ── D. 未挂在任何 loader 上、也不被静态页直接引用的工具组件 ────────────────
const compDir = path.join(ROOT, "components", "tools");
const allComps = fs.readdirSync(compDir).filter((f) => f.endsWith(".tsx"));
// loader 里的路径取末段（去掉目录前缀）后再比对文件名
const loadedComps = new Set(loaderIds.map((l) => l.comp.split("/").pop()));
const NON_TOOL = /^(Tool|TextToolLayout|image-tool-page|image-upload|create-gif-page|find-duplicates-page|MermaidClient|MonacoEditorDynamic|TitleSetter)/;
const orphans = allComps
  .map((f) => f.replace(/\.tsx$/, ""))
  .filter((n) => !loadedComps.has(n) && !NON_TOOL.test(n))
  .filter((n) => {
    // 被某个静态页直接 import 的不算孤儿
    for (const slug of staticPages) {
      if (read(path.join("app", "tools", slug, "page.tsx")).includes(`tools/${n}"`)) return false;
    }
    return true;
  });
if (orphans.length) {
  P1.push(`以下工具组件既未注册 loader、也未被任何静态页引用（"现成代码没接上"）：${orphans.join(", ")}`);
}

// ── E. relatedTools 指向不存在的 id（渲染层会过滤，不产生死链，故 P1） ──────
let deadRel = [];
for (const m of toolsSrc.slice(metaStart).matchAll(/relatedTools: \[([^\]]*)\]/g)) {
  for (const r of m[1].matchAll(/"([a-z0-9-]+)"/g)) {
    if (!metaSet.has(r[1])) deadRel.push(r[1]);
  }
}
deadRel = [...new Set(deadRel)];
if (deadRel.length) {
  P1.push(
    `relatedTools 指向不存在的 id（${deadRel.length} 个，渲染层已过滤 ⇒ 不死链，只是少渲染卡片）: ${deadRel.slice(0, 12).join(", ")}${deadRel.length > 12 ? " …" : ""}`
  );
}

// ── F. seoDesc 超 160 字符（会在 SERP 被截断） ──────────────────────────────
// 阈值取 160 而非 155：Google 桌面端摘要展示上限约 160 字符，
// 155 是移动端的更紧口径。用 155 会产出大量"156-159"的噪音告警，
// 真实需要处理的是显著超出的那几条（原 7 条 179-195 已手改）。
const DESC_MAX = 160;
const longDesc = [];
for (const blk of toolsSrc.slice(metaStart).split(/^ {2}"(?=[a-z0-9-]+": \{)/m).slice(1)) {
  const id = blk.match(/^([a-z0-9-]+)": \{/)?.[1];
  const sd = blk.match(/seoDesc: "((?:[^"\\]|\\.)*)"/)?.[1];
  if (id && sd && sd.length > DESC_MAX) longDesc.push(`${id}(${sd.length})`);
}
if (longDesc.length) P1.push(`seoDesc 超 ${DESC_MAX} 字符（${longDesc.length} 个）: ${longDesc.join(", ")}`);

// ── 输出 ───────────────────────────────────────────────────────────────────
console.log("── 工具页矩阵一致性审计 ──");
console.log(`toolMeta: ${metaIds.length}  |  loader: ${loaderIds.length}  |  静态页: ${staticPages.length}  |  组件文件: ${allComps.length}`);
console.log("");
for (const [label, list] of [["P0 必须修", P0], ["P1 建议修", P1]]) {
  console.log(`${label}：${list.length}`);
  for (const x of list) console.log(`  ✗ ${x}`);
}
if (INFO.length) {
  console.log(`INFO（预期行为）：${INFO.length}`);
  for (const x of INFO) console.log(`  · ${x}`);
}
console.log("");
if (P0.length) {
  console.log("结果：存在 P0 问题 —— 构建不会失败，线上会静默错");
  process.exit(1);
}
console.log("结果：无 P0 问题");
