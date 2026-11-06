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
 *
 * 🔴 2026-11-05（DEBT-51）：台账在 **仓库外**（../growth-ledger.json），
 *    CI checkout 只有 craftisle-app 仓库 ⇒ 一旦 check:lastmod 真跑到，
 *    读台账必然 ENOENT。修法不是 try/catch 吞掉后假通过，而是：
 *      · 本地读 canonical 台账时，同时把「id/date/target 摘要」镜像进
 *        仓库内 git 跟踪文件 data/ledger-snapshot.json；
 *      · CI 缺外部台账时读该镜像，用**同一份生成逻辑**重算期望映射；
 *      · 两条来源都没有 ⇒ 直接抛错并说清缺哪个文件。
 *    来源会明确打印，绝不静默回退。
 *
 *    边界（必须诚实）：CI 只能校验「仓库内镜像 ↔ content-lastmod.json」一致；
 *    「外部台账 ↔ 镜像」的一致性由本地 npm run sync:lastmod 保证。
 *    因此本地每次登记台账后必须跑 sync:lastmod 并提交两个文件。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd(), "..");
const LEDGER = resolve(ROOT, "growth-ledger.json");
const SNAPSHOT = resolve(process.cwd(), "data", "ledger-snapshot.json");
const DEFAULT_OUT = resolve(process.cwd(), "data", "content-lastmod.json");
const BASE = "https://craftisle.com";
// --out <path> 供 CI 一致性校验写到临时位置比对，避免任何复刻版解析逻辑漂移
const outIdx = process.argv.indexOf("--out");
const OUT = outIdx >= 0 ? resolve(process.argv[outIdx + 1]) : DEFAULT_OUT;

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

/**
 * 台账来源：外部 canonical 优先；CI 里只有仓库内镜像。
 * 明确打印来源 —— 静默回退会让「数据其实来自旧镜像」这种事没人看见。
 */
function loadActions() {
  if (existsSync(LEDGER)) {
    console.log(`[lastmod] source=${LEDGER} (canonical)`);
    const ledger = JSON.parse(readFileSync(LEDGER, "utf-8"));
    return { actions: ledger.actions ?? [], canonical: true };
  }
  if (!existsSync(SNAPSHOT)) {
    throw new Error(
      `[lastmod] 台账不可用：${LEDGER} 不存在，仓库内镜像 ${SNAPSHOT} 也不存在。\n` +
      `  CI 必须提交 data/ledger-snapshot.json（本地 npm run sync:lastmod 自动生成）。\n` +
      `  此处不允许静默跳过或假通过。`
    );
  }
  console.log(`[lastmod] source=${SNAPSHOT} (仓库内镜像 / CI fallback)`);
  console.log("[lastmod] ⚠ 本环境无外部台账，只校验「镜像↔映射」一致；「台账↔镜像」由本地 sync:lastmod 保证");
  const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf-8"));
  return { actions: snapshot.actions ?? [], canonical: false };
}

const { actions, canonical } = loadActions();
const map = {};
const skipped = [];
for (const a of actions) {
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
  source: canonical
    ? "growth-ledger.json (actions[].date + actions[].target)"
    : "data/ledger-snapshot.json (CI mirror of actions[].date + actions[].target)",
  ledgerSource: canonical ? "canonical" : "ci-mirror",
  note: "真实内容改动日期，禁止用构建时刻 now 覆盖；复合 target 已保守跳过",
  skippedCompositeTargets: skipped.length,
  urls: map,
};

// 镜像只在「读的是 canonical 台账 + 写的是默认路径」时更新。
// CI 的 check 用 --out 临时文件，不会碰镜像 ⇒ 不会污染工作区，也不会自己比对自己。
if (canonical && OUT === DEFAULT_OUT) {
  const snapshot = {
    note: "growth-ledger.json 的仓库内镜像，只含 id/date/target，供 CI 的 check:lastmod 重算期望映射。由本地 npm run sync:lastmod 生成，勿手改。",
    source: "growth-ledger.json (mirrored)",
    generatedAt: payload.generatedAt,
    actionCount: actions.length,
    actions: actions.map((a) => ({ id: a.id, date: a.date, target: a.target })),
  };
  const stmp = `${SNAPSHOT}.tmp`;
  writeFileSync(stmp, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
  renameSync(stmp, SNAPSHOT);
  console.log(`[lastmod] mirrored ${snapshot.actionCount} actions -> ${SNAPSHOT}`);
}

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
