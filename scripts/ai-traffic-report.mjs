/**
 * AI 侧观测报告：AI 爬虫抓取 + AI 平台引荐来源（服务端只读，零客户端追踪）。
 *
 * 为什么必须做：GA4 依赖浏览器执行 JS，AI 爬虫不执行 JS ⇒ 完全不可见；
 * 只有服务端 access log / CDN 日志能验证 robots 与 llms 是否真被读、
 * 哪些页被抓、返回什么状态码。AI 引荐的人类会话同样可从 referer 头归类。
 *
 * 🔴 隐私立场：**不引入任何新的客户端埋点、不上报第三方**。
 *    本脚本只读取站点已有的服务端访问日志，做聚合统计后输出报告。
 *    不采集 IP、不采集用户标识、不做跨站关联。
 *
 * 输入（二选一）：
 *   1) --input <path>  标准 nginx combined access.log 或每行一个 JSON 对象
 *      JSON 字段：{ path, ua|userAgent|user_agent, status, referer|referrer }
 *   2) 无 --input 时，若设置 VERCEL_TOKEN + VERCEL_PROJECT_ID，
 *      尝试 Vercel Runtime Logs API（读不到会显式报错，不静默返回 0）。
 *
 * 输出：.workbuddy/growth/ai-traffic-<date>.json + 控制台摘要
 * 用法：node scripts/ai-traffic-report.mjs --input /path/to/access.log
 *
 * 判据边界：bot 命中是「被抓取」，不等于「被引用」——这是必要不充分条件，
 * 报告里必须分开标注，禁止把抓取量当 GEO 效果指标。
 */
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const AI_BOTS = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-SearchBot", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "CCBot", "YouBot", "Cohere-AYA",
  "Bytespider", "Applebot-Extended", "Meta-ExternalAgent",
];
const AI_REFERRERS = [
  "chatgpt.com", "perplexity.ai", "claude.ai",
  "copilot.microsoft.com", "gemini.google.com", "you.com", "phind.com",
];

const argv = process.argv.slice(2);
const inputIdx = argv.indexOf("--input");
const input = inputIdx >= 0 ? argv[inputIdx + 1] : null;
const days = Number(process.env.AI_LOG_DAYS ?? 30);

/**
 * nginx combined: IP - - [date] "METHOD path HTTP/x" status size "referer" "ua"
 * 捕获组（务必数清，2026-11-04 修过一次错位 bug）：
 *   1=date 2=method 3=path 4=status 5=referer 6=ua  —— 共 6 组，没有 m[7]
 */
const NGINX_RE = /^\S+ \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d{3}) \S+ "([^"]*)" "([^"]*)"/;

function parseLine(line) {
  if (!line.trim()) return null;
  if (line.trim().startsWith("{")) {
    try {
      const o = JSON.parse(line);
      return {
        path: o.path || o.url || o.requestPath || "",
        ua: o.ua || o.userAgent || o.user_agent || "",
        status: Number(o.status ?? o.statusCode ?? 0),
        referer: o.referer || o.referrer || o.referrerUrl || "",
      };
    } catch { return null; }
  }
  const m = line.match(NGINX_RE);
  if (!m) return null;
  return { path: m[3], ua: m[6], status: Number(m[4]), referer: m[5] === "-" ? "" : m[5] };
}

async function loadFromVercel() {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return null;
  const since = Date.now() - days * 86_400_000;
  const url = `https://api.vercel.com/v1/projects/${encodeURIComponent(projectId)}/runtime-logs?since=${since}&limit=1000`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Vercel runtime-logs HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  // Vercel 返回结构随版本不同，统一映射到 {path,ua,status,referer}
  return (data.logs ?? data.rows ?? []).map((r) => ({
    path: r.path ?? r.requestPath ?? r.url ?? "",
    ua: r.userAgent ?? r.ua ?? r.headers?.["user-agent"] ?? "",
    status: Number(r.status ?? r.statusCode ?? 0),
    referer: r.referer ?? r.referrer ?? r.headers?.referer ?? "",
  }));
}

let rows;
let source;
if (input) {
  if (!existsSync(input)) {
    console.error(`[ai-traffic] 找不到输入文件 ${input}`);
    process.exit(1);
  }
  rows = readFileSync(input, "utf-8").split(/\r?\n/).map(parseLine).filter(Boolean);
  source = `file:${input}`;
} else {
  try {
    rows = await loadFromVercel();
    source = "vercel-runtime-logs";
  } catch (e) {
    // 静默失败会把「没采到」伪装成「没有 AI 流量」：必须显式报错
    console.error(`[ai-traffic] 拉取失败：${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
  if (!rows) {
    console.error("[ai-traffic] 无 --input 且未设置 VERCEL_TOKEN/VERCEL_PROJECT_ID ⇒ 无法采集。");
    console.error("             这是「没数据源」，不是「AI 流量为 0」。");
    process.exit(1);
  }
}

const botHits = {};
const botUrls = {};
const botStatus = {};
const refHits = {};
let total = 0;
for (const r of rows) {
  total++;
  const ua = String(r.ua || "");
  for (const bot of AI_BOTS) {
    if (ua.toLowerCase().includes(bot.toLowerCase())) {
      botHits[bot] = (botHits[bot] ?? 0) + 1;
      (botUrls[bot] ??= []).push(String(r.path || ""));
      const s = String(r.status || "0");
      (botStatus[bot] ??= {})[s] = ((botStatus[bot] ?? {})[s] ?? 0) + 1;
      break; // 一个 UA 只归一个 bot，避免重复计数
    }
  }
  const ref = String(r.referer || "").toLowerCase();
  for (const host of AI_REFERRERS) {
    if (ref.includes(host)) {
      refHits[host] = (refHits[host] ?? 0) + 1;
      break;
    }
  }
}

const botSummary = Object.entries(botHits)
  .sort((a, b) => b[1] - a[1])
  .map(([bot, hits]) => ({
    bot,
    hits,
    status: botStatus[bot] ?? {},
    topPaths: [...new Set(botUrls[bot] ?? [])].slice(0, 10),
    llmsTxtFetches: (botUrls[bot] ?? []).filter((p) => /\/llms(?:-full)?\.txt/.test(p)).length,
  }));

const report = {
  generatedAt: new Date().toISOString(),
  source,
  windowDays: days,
  totalRequests: total,
  aiBotRequests: Object.values(botHits).reduce((s, n) => s + n, 0),
  aiReferralSessions: Object.values(refHits).reduce((s, n) => s + n, 0),
  bots: botSummary,
  missingBots: AI_BOTS.filter((b) => !botHits[b]),
  referrers: refHits,
  llmsTxtFetchesTotal: botSummary.reduce((s, b) => s + b.llmsTxtFetches, 0),
  caveat: "抓取 ≠ 引用；AI bot 命中是必要不充分条件，不得当作 GEO 效果指标。",
};

const out = resolve(process.cwd(), "..", ".workbuddy", "growth", `ai-traffic-${new Date().toISOString().slice(0, 10)}.json`);
mkdirSync(dirname(out), { recursive: true });
const tmp = `${out}.tmp`;
writeFileSync(tmp, JSON.stringify(report, null, 2) + "\n", "utf-8");
renameSync(tmp, out);

console.log(`[ai-traffic] source=${source} total=${total} aiBot=${report.aiBotRequests} aiReferral=${report.aiReferralSessions}`);
for (const b of botSummary) console.log(`  ${b.bot.padEnd(20)} ${b.hits}  status=${JSON.stringify(b.status)}`);
console.log(`[ai-traffic] missing bots (${report.missingBots.length}): ${report.missingBots.join(", ") || "none"}`);
console.log(`[ai-traffic] llms.txt fetches: ${report.llmsTxtFetchesTotal}（用于验证 llms 是否真被读）`);
console.log(`[ai-traffic] AI referrers: ${JSON.stringify(refHits)}`);
console.log(`[ai-traffic] wrote ${out}`);
