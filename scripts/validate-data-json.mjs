#!/usr/bin/env node
/**
 * CI 门禁：校验 public/data 下所有 JSON 都是合法 JSON。
 *
 * 为什么需要它（2026-09-22 事故）：
 *   `fmhy-resources.json` 被写坏（完整文档 + 残尾垃圾）后**静默上线**：
 *     - 站点侧 `catch { return [] }` 把它降成 0 条资源，构建与线上都零报错；
 *     - 同步脚本读同一文件也抛错，导致 Daily Data Sync 长期失败、产出全不推送。
 *   两个多月无人察觉。本脚本让"坏数据"在**提交前**就 fail 出声。
 *
 * 用法:
 *   node scripts/validate-data-json.mjs          # 扫 public/data（递归）
 *   node scripts/validate-data-json.mjs path...  # 只校验指定文件
 * 退出码: 0 = 全部合法；1 = 有非法文件（CI 会因此失败）
 */
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, resolve } from "path";
import { readJsonSafe } from "./lib/data-io.mjs";

const ROOT = resolve(process.cwd());
const SCAN_DIR = join(ROOT, "public", "data");

/** 递归收集 .json 文件 */
function collect(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...collect(p));
    else if (name.toLowerCase().endsWith(".json")) out.push(p);
  }
  return out;
}

const args = process.argv.slice(2);
const files = args.length ? args.map((a) => resolve(ROOT, a)) : collect(SCAN_DIR);

if (files.length === 0) {
  console.log("⚠️ public/data 下没有 JSON 文件，跳过校验");
  process.exit(0);
}

const bad = [];
let totalBytes = 0;

for (const f of files) {
  const r = readJsonSafe(f);
  if (r.ok) {
    totalBytes += r.bytes || 0;
    continue;
  }
  if (r.reason === "文件不存在") continue; // 缺失不是"损坏"，另行处理
  bad.push({ file: relative(ROOT, f).replace(/\\/g, "/"), reason: r.reason, bytes: r.bytes });
}

console.log("── public/data JSON 合法性校验 ──");
console.log(`扫描 ${files.length} 个文件，共 ${(totalBytes / 1048576).toFixed(2)} MB`);

if (bad.length === 0) {
  console.log("✅ 全部合法");
  process.exit(0);
}

console.log(`\n❌ 发现 ${bad.length} 个非法 JSON：`);
for (const b of bad) {
  console.log(`  · ${b.file}`);
  console.log(`      ${b.reason}${b.bytes ? `（${b.bytes} 字节）` : ""}`);
}
console.log(
  "\n提示：损坏文件多为「原文档 + 尾随残片」，通常是写入被中断或并发写同一路径所致。\n" +
    "      修复：先确认数据源可重建，再用 npm run sync:fmhy 全量重建，切勿手改大文件。"
);
process.exit(1);
