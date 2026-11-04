/**
 * CI 阻断门：data/content-lastmod.json 必须与 growth-ledger.json 同步。
 *
 * 存在的理由：台账登记了新动作但忘了跑 sync:lastmod ⇒ sitemap 的
 * lastModified 会停在旧日期，freshness 信号悄悄失效，且没人会发现。
 * 这类「字段存在但无人维护」的死锁在本项目已经发生过多次。
 *
 * 做法：以同样的解析规则重算期望映射，与磁盘文件逐项比对；
 * 不一致就 exit 1 并打印缺失/多余/过期的 URL。
 */
import { readFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = resolve(process.cwd(), "..");
const DATA = resolve(process.cwd(), "data", "content-lastmod.json");

if (!existsSync(DATA)) {
  console.error("[check:lastmod] 缺 data/content-lastmod.json —— 跑 npm run sync:lastmod");
  process.exit(1);
}

// 用同一份生成器写到临时位置，再比对（不信任任何复刻版解析逻辑）
const tmp = resolve(process.cwd(), "data", `.content-lastmod.expected-${process.pid}.json`);
try {
  execFileSync(process.execPath, ["scripts/sync-content-lastmod.mjs", "--out", tmp], {
    cwd: process.cwd(),
    stdio: "pipe",
  });
  const expected = JSON.parse(readFileSync(tmp, "utf-8")).urls;
  const actual = JSON.parse(readFileSync(DATA, "utf-8")).urls;
  const eKeys = Object.keys(expected).sort();
  const aKeys = Object.keys(actual ?? {}).sort();
  const missing = eKeys.filter((k) => !(k in actual));
  const extra = aKeys.filter((k) => !(k in expected));
  const stale = eKeys.filter((k) => k in actual && actual[k] !== expected[k]);
  if (missing.length || extra.length || stale.length) {
    console.error(
      `[check:lastmod] 不同步：缺失 ${missing.length}、多余 ${extra.length}、日期过期 ${stale.length}`
    );
    for (const k of [...missing, ...extra, ...stale].slice(0, 20)) console.error(`  ${k}`);
    console.error("→ 修复：npm run sync:lastmod && git add data/content-lastmod.json");
    process.exit(1);
  }
  console.log(`[check:lastmod] ✅ ${eKeys.length} 条 URL→日期与台账一致（真实时间源，无 now）`);
} finally {
  try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* no-op */ }
}
