/**
 * 从 growth-ledger.json 生成「URL → 真实最后改动日期」映射。
 *
 * 为什么需要它：sitemap 的 lastmod 必须是**真实内容变更时间**，不能用构建时刻的
 * `now`（全站同时更新会让信号完全失效，见 app/sitemap.ts 顶部注释）。
 * 台账里每条已落地动作都有 date + target，是站内唯一可信的时间源。
 *
 * 输出：data/content-lastmod.json（git 跟踪路径，CI/构建都拿得到）
 * 用法：node scripts/sync-content-lastmod.mjs
 *
 * 🔴 纪律：**宁可漏报不可错报**。只认「单个、规范、以 / 开头的站内路径」；
 *    target 里带花括号/逗号/中文说明/多 URL 的复合描述一律跳过，
 *    否则会把不相干页面标成「今天改过」，制造虚假 freshness 信号。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "..");
const LEDGER = resolve(ROOT, "growth-ledger.json");
const BASE = "https://craftisle.com";
// --out <path> 供 CI 一致性校验写到临时位置比对，避免任何复刻版解析逻辑漂移
const outIdx = process.argv.indexOf("--out");
const OUT = outIdx >= 0 ? resolve(process.argv[outIdx + 1]) : resolve(process.cwd(), "data", "content-lastmod.json");

/** 只接受站内单一路径。保守白名单：主战场 + 允许的静态段。 */
const PATH_RE = /^\/(tools|l|directory\/alternatives|c|blog|guides|about|compare)(\/[a-z0-9._~%-]+)*\/?$/i;

/**
 * 把 target 解析成 0..N 个站内 URL。
 *
 * 严格规则（宁可漏报不可错报）：
 *   · 中文 / 不可打印字符 / 问号 ⇒ 整条丢弃（避免把说明文字当路径）；
 *   · 花括号 `/tools/{a, b}` ⇒ 展开成 /tools/a、/tools/b；
 *   · 逗号或 `+` 分隔的多个 token ⇒ **每个**都必须是合法的站内路径，
 *     只要有一个不合法（如 `scripts/xxx.ts`、`8 个静态工具页`）就整条丢弃；
 *   · 结果为空 ⇒ 跳过。
 */
function toUrls(target) {
  if (typeof target !== "string") return [];
  const t = target.trim();
  if (!t.startsWith("/")) return [];
  if (/[^\x20-\x7E]|\?/.test(t)) return [];

  // 花括号展开：/tools/{a, b, c} → /tools/a, /tools/b, /tools/c
  const brace = t.match(/^(\/[a-z0-9._~%/-]+)\{([^}]+)\}\s*$/i);
  if (brace) {
    const prefix = brace[1].replace(/\/$/, "");
    const parts = brace[2].split(",").map((s) => s.trim());
    if (parts.some((p) => !/^[a-z0-9._~%-]+$/.test(p))) return [];
    return parts.map((p) => `${prefix}/${p}`).filter((p) => PATH_RE.test(p)).map((p) => BASE + p);
  }

  // 多 URL：按逗号或 '+' 切分，每个 token 都必须独立合法
  const tokens = t.split(/[,+]/).map((s) => s.trim()).filter(Boolean);
  if (tokens.length === 0) return [];
  const paths = [];
  for (const tok of tokens) {
    if (!tok.startsWith("/") || !PATH_RE.test(tok)) return [];
    paths.push(BASE + tok);
  }
  return paths;
}

const ledger = JSON.parse(readFileSync(LEDGER, "utf-8"));
const map = {};
const skipped = [];
for (const a of ledger.actions ?? []) {
  if (!a.date || !/^\d{4}-\d{2}-\d{2}$/.test(String(a.date))) continue;
  const urls = toUrls(a.target);
  if (urls.length === 0) {
    if (a.target) skipped.push({ id: a.id, target: String(a.target).slice(0, 80) });
    continue;
  }
  // 同一 URL 有多次动作 ⇒ 取最新（字典序对 ISO 日期等价于时间序）
  for (const url of urls) {
    if (!map[url] || a.date > map[url]) map[url] = a.date;
  }
}

const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  source: "growth-ledger.json (actions[].date + actions[].target)",
  note: "真实内容改动日期，禁止用构建时刻 now 覆盖；复合 target 已保守跳过",
  skippedCompositeTargets: skipped.length,
  urls: map,
};

mkdirSync(dirname(OUT), { recursive: true });
const tmp = `${OUT}.tmp`;
writeFileSync(tmp, JSON.stringify(payload, null, 2) + "\n", "utf-8");
renameSync(tmp, OUT);

console.log(`[lastmod] wrote ${Object.keys(map).length} URL→date entries → ${OUT}`);
console.log(`[lastmod] skipped ${skipped.length} composite/ambiguous targets (conservative)`);
if (existsSync(OUT)) {
  const sample = Object.entries(map).slice(0, 3).map(([u, d]) => `${d} ${u}`);
  for (const s of sample) console.log(`  ${s}`);
}
