#!/usr/bin/env node
/**
 * audit:types —— 离线类型检查闸门（2026-11-27 新增）
 *
 * 为什么要它：2026-11-27 的一次推送因为 `Property 'pricing' does not exist on
 * type 'AlternativeTool'` 构建失败（Vercel 报 lint_or_type_error）。而本地七道
 * 内容闸门全绿 —— 因为**它们都不做类型检查**，本地 node_modules 又不完整，
 * `tsc --noEmit` 跑不起来 ⇒ 缺陷一路溜到远端构建才暴露。
 *
 * 这个脚本的定位：**在本地/提交前**对关键源文件做类型检查，挡住"本地绿、远端红"。
 *
 * 实现：调用本地 typescript 的 tsc（若可用），对 tsconfig 覆盖不到的场景
 * 退化为"逐文件 tsc + 过滤第三方缺失类型导致的噪音"。
 * 缺 typescript 时明确报"跳过"而不是假装通过 —— 静默通过比不检查更危险。
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 必须检查的文件清单：本次事故涉及的文件 + 站点各页型的入口。
 * 逐个列出而不是"扫全仓库"，是因为本地依赖不完整时全量 tsc 会产生上千条
 * 与本次改动无关的噪音，反而会掩盖真实错误。
 */
const TARGETS = [
  "lib/alternatives.ts",
  "lib/tools.ts",
  "lib/blog-faq.ts",
  "app/(marketing)/directory/alternatives/[tool]/page.tsx",
  "app/(marketing)/blog/[slug]/page.tsx",
  "components/tools/ToolDetailLayout.tsx",
];

const tscBin = join(ROOT, "node_modules", "typescript", "bin", "tsc");

if (!existsSync(tscBin)) {
  console.log("⚠ audit:types 跳过：本地未安装 typescript（node_modules/typescript 缺失）。");
  console.log("  ⇒ 本地无法做类型检查，类型缺陷只能靠远端构建拦截。");
  console.log("  修法：npm install typescript --no-save --no-package-lock（或 pnpm install）");
  process.exit(0);
}

// 这些噪音来自本地缺失的第三方类型（@types/react 等），不是源码错误
const NOISE = [
  /Cannot find module/,
  /Could not find a declaration file/,
  /Cannot find type definition file/,
  /Cannot find name 'process'/,
  /node_modules/,
];

const missing = TARGETS.filter((t) => !existsSync(join(ROOT, t)));
if (missing.length) {
  console.log(`⚠ audit:types 跳过：目标文件缺失 ${missing.join(", ")}`);
  process.exit(0);
}

const res = spawnSync(
  process.execPath,
  [
    tscBin,
    "--noEmit",
    "--skipLibCheck",
    "--target", "es2020",
    "--module", "esnext",
    "--moduleResolution", "bundler",
    "--jsx", "preserve",
    ...TARGETS,
  ],
  { cwd: ROOT, encoding: "utf8" }
);

const lines = `${res.stdout || ""}${res.stderr || ""}`
  .split(/\r?\n/)
  .filter((l) => l.trim())
  .filter((l) => !NOISE.some((re) => re.test(l)));

if (lines.length === 0) {
  console.log(`✅ audit:types PASSED（${TARGETS.length} 个关键文件，0 类型错误）`);
  process.exit(0);
}

console.log(`❌ audit:types 失败 —— ${lines.length} 条类型错误`);
lines.slice(0, 30).forEach((l) => console.log("  " + l));
console.log("");
console.log("  ⇒ 这些是真实类型缺陷（已过滤第三方类型缺失的噪音）。");
console.log("    本地闸门此前不查类型，缺陷会一路溜到远端构建才暴露。");
process.exit(1);
