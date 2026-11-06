/**
 * CI 阻断门：data/content-lastmod.json 必须与 growth-ledger.json 同步。
 *
 * 存在的理由：台账登记了新动作但忘了跑 sync:lastmod ⇒ sitemap 的
 * lastModified 会停在旧日期，freshness 信号悄悄失效，且没人会发现。
 * 这类「字段存在但无人维护」的死锁在本项目已经发生过多次。
 *
 * 做法：以同样的解析规则重算期望映射，与磁盘文件逐项比对；
 * 不一致就 exit 1 并打印缺失/多余/过期的 URL。
 *
 * 🔴 2026-11-04 修：失败分支不能在 try 里直接 process.exit —— 那样 finally
 *    不会执行，临时文件会留在 data/ 里被 git 当成未跟踪文件（实测踩过一次）。
 *    改为统一在末尾退出，并在启动时清理历史残留。
 */
import { readFileSync, existsSync, unlinkSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const DATA_DIR = resolve(process.cwd(), "data");
const DATA = resolve(DATA_DIR, "content-lastmod.json");

// 清理历次异常退出留下的临时文件
for (const f of readdirSync(DATA_DIR)) {
  if (/^\.content-lastmod\.expected-\d+\.json$/.test(f)) {
    try { unlinkSync(resolve(DATA_DIR, f)); } catch { /* no-op */ }
  }
}

if (!existsSync(DATA)) {
  console.error("[check:lastmod] 缺 data/content-lastmod.json —— 跑 npm run sync:lastmod");
  process.exit(1);
}

// 用同一份生成器写到临时位置，再比对（不信任任何复刻版解析逻辑）
const tmp = resolve(DATA_DIR, `.content-lastmod.expected-${process.pid}.json`);
let failed = false;
try {
  execFileSync(process.execPath, ["scripts/sync-content-lastmod.mjs", "--out", tmp], {
    cwd: process.cwd(),
    // 🔴 2026-11-05（DEBT-51）：生成器会打印**台账来源**（外部 canonical /
    //    仓库内镜像）。原先 stdio:"pipe" 把这段 stdout 全吞掉 ⇒ CI 日志里
    //    「其实在用镜像、只校验镜像↔映射」这个关键事实不可见，等于静默回退。
    //    必须透传，失败时原始 stderr 也能直接看到真因。
    stdio: ["ignore", "inherit", "inherit"],
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
    failed = true;
  } else {
    console.log(`[check:lastmod] ✅ ${eKeys.length} 条 URL→日期与台账一致（真实时间源，无 now）`);
  }
} catch (e) {
  console.error(`[check:lastmod] 生成/比对失败：${e instanceof Error ? e.message : String(e)}`);
  failed = true;
} finally {
  try { if (existsSync(tmp)) unlinkSync(tmp); } catch { /* no-op */ }
}

if (failed) process.exit(1);
