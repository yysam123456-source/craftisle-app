/**
 * auto-tune —— 每日长尾词自动调优（写入版）
 *
 * ============================ 为什么要这个脚本 ============================
 * 现状：每日巡检能「跑 seo:longtail」拿到 GSC + Suggest 的长尾候选，
 * 但写不进去 —— `/api/analytics/tune` 的鉴权依赖 Vercel 的 sensitive 变量
 * CRON_SECRET，而 **sensitive 变量的明文API 不回传**（decrypt=true 返回 value 为空）。
 * 于是巡检只能看 dryRun 预览，每天产出一份「建议清单」等人手动改。
 *
 * 本脚本把最后一段接通：从 gap-<date>.json 的 gscMatched 出发，
 * 对每个目标页算出候选新 title/description，**先本地校验质量，
 * 全部通过才调端点写入**，任一条不合格就整批跳过。
 *
 * 🔴 为什么必须本地先校验：端点是「接受即写库」，而标题改写会直接出现在
 * 用户面前。10-15 实测旧实现 8/8 标题有问题、5/5 描述超 160 字符。
 * 把校验放在写入之前，才敢开apply。
 *
 * ============================ 安全边界（都不松）============================
 * - 默认 dryRun。要真写必须显式 `--apply`
 * - 每日路由上限 40（端点侧也有 DAILY_ROUTE_CAP 兜底）
 * - PROTECTED_ROUTES（`/`）永不改写
 * - 每条改动都要过长度/幂等/同义反复三道检查
 * - 写入走覆盖层，删记录即回滚，不动源码
 *
 * 用法：
 *   npx tsx scripts/auto-tune.ts                    # dryRun，看会改什么
 *   npx tsx scripts/auto-tune.ts --apply            # 真写
 *   npx tsx scripts/auto-tune.ts --max 5           # 只改5 个页
 *   npx tsx scripts/auto-tune.ts --date 2026-10-15 # 指定 gap 文件
 */

import { readFileSync, existsSync } from "fs";
import { join, resolve } from "path";

const ARGV = process.argv.slice(2);
const APPLY = ARGV.includes("--apply");
const argOf = (n: string, d: number) => {
  const i = ARGV.indexOf(n);
  return i >= 0 ? Number(ARGV[i + 1]) || d : d;
};
const MAX_ROUTES = argOf("--max", 5);
const DATE_ARG = (() => {
  const i = ARGV.indexOf("--date");
  return i >= 0 ? ARGV[i + 1] : new Date().toISOString().slice(0, 10);
})();

const API_BASE = process.env.GROWTH_API_BASE || "https://craftisle.com";
const SECRET_FILE = resolve(process.cwd(), "..", ".workbuddy", "secrets", "autotune.txt");
const GAP_DIR = resolve(process.cwd(), "..", ".workbuddy", "trends");

const TITLE_MAX = 60;
const DESC_MAX = 160;

// ─────────────────────────────────────────────────────────────
// 从 optimizer.ts 抽实现（该文件依赖 server-only 链，import 不了）
// 与 .workbuddy/tmp/test-optimizer.ts 同一手法：不维护复刻版，避免漂移。
// ─────────────────────────────────────────────────────────────
function loadOptimizer(): {
  optimizeTitle: (c: string, q: string, s: string) => string;
  optimizeDescription: (c: string, q: string) => string;
} {
  const src = readFileSync(resolve(process.cwd(), "lib", "seo", "optimizer.ts"), "utf-8");

  const extract = (name: string): string => {
    const withExport = src.indexOf(`export function ${name}`);
    const plain = src.indexOf(`\nfunction ${name}`);
    const start = withExport >= 0 ? withExport : plain;
    if (start < 0) throw new Error(`${name} not found in optimizer.ts`);
    const rest = src.slice(start + 1);
    const idx = rest.indexOf("\n}\n");
    if (idx < 0) throw new Error(`end of ${name} not found`);
    return src.slice(start, start + 1 + idx + 3);
  };

  let clean =
    extract("optimizeTitle") +
    "\n" +
    extract("optimizeDescription") +
    "\n" +
    extract("titleCase") +
    "\n" +
    // 🔴 DEBT-43：optimizeTitle 的身份词保护用到 stemWord，必须一起抽出来，
    // 否则切片出来的函数体引用未定义标识符（运行时 ReferenceError）。
    extract("stemWord");
  clean = clean.replace(/^export function /gm, "function ");
  clean = clean.replace(/current: string/g, "current");
  clean = clean.replace(/query: string/g, "query");
  clean = clean.replace(/siteName: string/g, "siteName");
  clean = clean.replace(/\(s: string\)/g, "(s)");
  clean = clean.replace(/\): string \{/g, ") {");
  // 🔴 DEBT-43：optimizer.ts 里新增的箭头函数参数标注（如 `(w: string) =>`）
  // 也要剥 —— 上面的规则只覆盖既有形态，漏一种 new Function 就拿到 TS 语法
  // 直接 SyntaxError（实测：加身份词保护后 auto-tune 起手就崩）。
  // 单参数 string 标注一次性剥掉；多参数/其他类型目前 optimizer.ts 里没有。
  clean = clean.replace(/\(([a-zA-Z_$][\w$]*)\s*:\s*string\)/g, "($1)");

  const ACRONYMS_SRC =
    "const ACRONYMS = new Set(['css','html','pdf','jpg','jpeg','png','svg','webp','avif','heic','bmp'," +
    "'gif','url','seo','utf','json','xml','api','ai','ui','ux','ocr','wav','mp3','sql']);\n" +
    "const TITLE_MAX = 60; const DESC_MAX = 160;\n";

  return new Function(
    ACRONYMS_SRC + clean + "\nreturn { optimizeTitle, optimizeDescription };",
  )() as { optimizeTitle: (c: string, q: string, s: string) => string; optimizeDescription: (c: string, q: string) => string };
}

// ─────────────────────────────────────────────────────────────
// 读入 gap 分析结果
// ─────────────────────────────────────────────────────────────
interface GapFile {
  gsc?: { reachable?: boolean };
  gscMatched?: Array<{
    query: string;
    impressions: number;
    position: number;
    hits: Array<{ key: string; kind: string; score: number; total: number }>;
  }>;
  suggestSourceTally?: Record<string, number>;
}

interface Proposal {
  route: string;
  query: string;
  impressions: number;
  position: number;
  titleBefore: string;
  titleAfter: string;
  descBefore: string;
  descAfter: string;
  /** 该页全部可索引文本，用于意图闸门 */
  pageText: string;
  rejectReason?: string;
}

function loadGap(): GapFile | null {
  const file = join(GAP_DIR, `gap-${DATE_ARG}.json`);
  if (!existsSync(file)) {
    console.error(`[auto-tune] 找不到 ${file} —— 先跑 npm run seo:longtail`);
    return null;
  }
  return JSON.parse(readFileSync(file, "utf-8")) as GapFile;
}

/** 读页面当前 title/description + 主张文本 —— 只改已知路由，避免写出垃圾 */
function loadCurrentMeta(): Map<string, { title: string; desc: string; text: string }> {
  const out = new Map<string, { title: string; desc: string; text: string }>();
  const src = readFileSync(resolve(process.cwd(), "lib", "tools.ts"), "utf-8");
  const blocks = src.split(/\n {2}"[a-z0-9-]+": \{/);
  const ids = [...src.matchAll(/\n {2}"([a-z0-9-]+)": \{/g)].map((m) => m[1]);
  for (let i = 1; i < blocks.length; i++) {
    const id = ids[i - 1];
    if (!id) continue;
    const body = blocks[i];
    const title = body.match(/seoTitle:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
    const desc = body.match(/seoDesc:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? "";
    // 🔴 意图闸门只用「页面主张」，**不能用全文**。
    // 实测事故：tts 页 FAQ 里有 "For commercial projects, consider a paid TTS API"，
    // 于是 "free alternative to ms project windows 7" 的 project 被判为命中 ⇒
    // 一个 TTS 工具差点被改成 MS Project 的替代品。
    // 主张 = title + description + howToUse的 heading/text + seoKeywords。
    // FAQ/useCases 里的一次性举例不足以让页面"成为"某个东西的替代品。
    const claims: string[] = [title, desc];
    claims.push(...(body.match(/"heading":\s*"((?:[^"\\]|\\.)*)"/g) || []).map((s) => s.slice(11, -1)));
    claims.push(...(body.match(/"text":\s*"((?:[^"\\]|\\.)*)"/g) || []).map((s) => s.slice(9, -1)));
    const kw = body.match(/seoKeywords:\s*\[([^\]]*)\]/)?.[1] ?? "";
    claims.push(kw);
    out.set(`/tools/${id}`, { title, desc, text: claims.join(" ") });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 质量闸门：任一条不过就整条丢弃
// ─────────────────────────────────────────────────────────────
function validate(p: Proposal): string | null {
  if (!p.route.startsWith("/tools/")) return "非工具页，本脚本只改工具页";
  if (p.route === "/") return "PROTECTED_ROUTE";
  if (!p.titleBefore) return "读不到当前 title";

  // 🔴 意图闸门最先跑 —— 错配是性质最严重的问题，
  // 一个标题写错比不写危害大得多（虚假宣称）。
  const intentWhy = intentGate(p.query, p.pageText);
  if (intentWhy) return intentWhy;

  // 🔴 title 级闸门：Google 把词关联到这页可能是词重叠造成的偶然，
  // 只有核心名词落在 title 里，才是这个页真的在满足这个词。
  const titleWhy = titleGate(p.query, p.titleBefore);
  if (titleWhy) return titleWhy;

  // 🔴🔴 DEBT-43（2026-10-21）：方向性闸门。
  const dirWhy = directionGate(p.query, p.pageText, p.titleBefore);
  if (dirWhy) return dirWhy;

  if (p.titleAfter === p.titleBefore && p.descAfter === p.descBefore) {
    return "算出来与原值相同，无需写入";
  }
  // 1) 标题长度
  if (p.titleAfter.length > TITLE_MAX) return `新标题 ${p.titleAfter.length} 字符，超 ${TITLE_MAX}`;
  // 2) 描述长度
  if (p.descAfter.length > DESC_MAX) return `新描述 ${p.descAfter.length} 字符，超 ${DESC_MAX}`;
  // 3) 产出不含 undefined / NaN
  if (/undefined|NaN/.test(p.titleAfter) || /undefined|NaN/.test(p.descAfter)) {
    return "产出含 undefined 或 NaN";
  }
  // 4) 同义反复：同一短语不出现 4 次以上
  for (const field of [p.titleAfter, p.descAfter]) {
    const words = field.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const counts: Record<string, number> = {};
    for (const w of words) counts[w] = (counts[w] ?? 0) + 1;
    const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (worst && worst[1] >= 4) return `同义反复：「${worst[0]}」出现 ${worst[1]} 次`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// 意图闸门：查询的主张必须和页面主张是同一件事
// ─────────────────────────────────────────────────────────────

/**
 * 🔴 2026-10-15 实测事故：gscMatched 把
 *   "free alternative to ms project windows 7" (imp=4) 匹配到了 /tools/tts
 * —— 一个 TTS 页声称自己是 MS Project 的替代品，是**文案事故**，
 * 不是"覆盖不足"。写进 title 就是虚假宣称，比不写更糟。
 *
 * 语义锚只能保证"词有重叠"，保证不了"意图相同"。这里加第二道：
 * **查询里的关键名词必须真的出现在该页**，否则视为错配。
 * "alternative" / "free" / "windows" 这类不是关键名词（页面里到处都是），
 * 但 "project"（MS Project 里的 project）对 TTS 页是关键名词且不存在 ⇒ 拦下。
 */
const GENERIC_IN_QUERY = new Set([
  "free", "online", "tool", "tools", "best", "alternative", "alternatives",
  "app", "software", "windows", "mac", "android", "ios", "pc", "laptop",
  "version", "download", "use", "using", "make", "create", "convert",
]);

function stemWord(w: string): string {
  return w.replace(/(ings|ing|ers|er|ors|or|ies|es|s)$/i, "").replace(/e$/, "");
}

function pageTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map(stemWord)
      .filter((w) => w.length > 2),
  );
}

/** 返回 null = 通过；返回字符串 = 错配原因 */
function intentGate(query: string, pageText: string): string | null {
  const pt = pageTokens(pageText);
  const qTokens = [...pageTokens(query)];
  // 查询里的关键名词：排除泛化词后剩下的
  const keyNouns = qTokens.filter((w) => !GENERIC_IN_QUERY.has(w));
  if (keyNouns.length === 0) return "查询无关键名词（全是泛词），不敢自动写入";

  const missing = keyNouns.filter((w) => !pt.has(w));
  // 🔴 关键名词全部缺失 = 意图完全不相干
  if (missing.length === keyNouns.length) {
    return `意图错配：查询关键名词 ${keyNouns.join("/")} 在该页一个都没有`;
  }
  // 过半缺失也要拦 —— 页面与查询最多只有一半共同语言
  if (missing.length / keyNouns.length > 0.5) {
    return `意图可疑：${missing.length}/${keyNouns.length} 个关键名词不在该页（${missing.join("/")}）`;
  }
  return null;
}

/**
 * 🔴 title 级闸门：查询的核心名词必须出现在页面 **title** 里。
 *
 * 为什么需要第二道：意图闸门看的是「页面主张」(title+desc+howToUse+keywords)，
 * 仍会放过部分错配。实测实例：
 *   "svg file editor" → /tools/mermaid
 *   mermaid 的 seoDesc 里写着 "export SVG/PNG" ⇒ 意图闸门放行，
 *   但它是个 Mermaid 图表工具，不是 SVG 编辑器。
 *   写成 "SVG File Editor — Mermaid Chart Free" 会让人以为它是 SVG 编辑器。
 *
 * title 是「这个页面是什么」的**唯一声明**。目标词的核心名词不在 title 里，
 * 就说明 Google 把它关联到这个页是偶然的（词重叠），不是这个页真的在满足它。
 */
function titleGate(query: string, title: string): string | null {
  const tt = pageTokens(title);
  const keyNouns = [...pageTokens(query)].filter((w) => !GENERIC_IN_QUERY.has(w));
  if (keyNouns.length === 0) return null; // 上面已拦

  const inTitle = keyNouns.filter((w) => tt.has(w));
  if (inTitle.length === 0) {
    return `title 级错配：关键名词 ${keyNouns.join("/")} 一个都不在页面标题「${title}」里`;
  }
  return null;
}

/**
 * 🔴🔴 DEBT-43（2026-10-21）：**方向性闸门**。
 *
 * 意图闸门与 title 闸门查的都是「词是否存在」，查不了「方向是否相反」——
 * 实测 "time to seconds"（imp=1 pos=48）两道闸门全过（time/second 都在页面上），
 * 但 /tools/seconds-to-time 是单向「秒 → 时分秒」工具，查询是反向。
 * 若放行，optimizeTitle 会把标题改成「Time To Seconds — Online Tool」：
 * 词还是那两个词，宣称反了 —— **写入即虚假宣称，比不写更糟**。
 *
 * 判据：查询含 "A to B" / "A into B" 方向结构时，页面主张
 * （title + desc + howToUse + seoKeywords）必须出现**同向**的 A→B；
 * 只出现反向 B→A ⇒ 拦下。两个方向都没明说 ⇒ 不拦（交给其他闸门与人工判断）。
 * 宁可漏报：拦下只是不自动写入，人工仍可review后手动调。
 */
function directionGate(query: string, pageText: string, title: string): string | null {
  const m = query.toLowerCase().match(/([a-z0-9]+)\s+(?:to|into)\s+([a-z0-9]+)/);
  if (!m) return null;
  const [, a, b] = m;
  // 太短的词（单个字母/数字）没有方向语义，避免 "3 to 5" 之类误判
  if (a === b || a.length < 2 || b.length < 2) return null;
  const claims = `${pageText} ${title}`.toLowerCase();
  const conn = "(?:to|into|->|→)";
  const same = new RegExp(`\\b${a}\\s+${conn}\\s+${b}\\b`).test(claims);
  if (same) return null;
  const reverse = new RegExp(`\\b${b}\\s+${conn}\\s+${a}\\b`).test(claims);
  if (reverse) {
    return `方向错配：查询是 ${a}→${b}，页面只声称 ${b}→${a}（词相同、方向相反，写入即虚假宣称）`;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`[auto-tune] ${APPLY ? "🔴 APPLY 模式（会真写入线上）" : "dryRun 模式（只看，不写）"}`);
  console.log(`[auto-tune] 日期 ${DATE_ARG}｜单次上限 ${MAX_ROUTES} 条`);

  const gap = loadGap();
  if (!gap) return;

  // 🔴 源可达性是可信度前提
  if (gap.gsc?.reachable === false) {
    console.error("[auto-tune] GSC 本轮不可达 —— 没有真实 Google 数据，拒绝生成调优方案");
    process.exit(1);
  }
  const tally = gap.suggestSourceTally;
  if (tally) {
    console.log(
      `[auto-tune] Suggest 源：google=${tally.google} bing=${tally.bing} none=${tally.none}` +
        (tally.google === 0 ? "（Google 被封，只用 GSC 段）" : ""),
    );
  }

  const matched = gap.gscMatched ?? [];
  console.log(`[auto-tune] gscMatched ${matched.length} 条`);

  const { optimizeTitle, optimizeDescription } = loadOptimizer();
  const current = loadCurrentMeta();

  // 每个目标页取**曝光最高**的那条查询作为目标词 ——
  // 同一页多条词时，选曝光最大的那条，否则会被低曝光噪声带偏
  const bestPerRoute = new Map<string, (typeof matched)[number]>();
  for (const m of matched) {
    const route = m.hits[0]?.key;
    if (!route) continue;
    const prev = bestPerRoute.get(route);
    if (!prev || m.impressions > prev.impressions) bestPerRoute.set(route, m);
  }

  const proposals: Proposal[] = [];
  for (const [route, m] of bestPerRoute) {
    const meta = current.get(route);
    if (!meta) continue; // 非 /tools/ 路由（落地页 / 对转页）本轮不动
    const titleAfter = optimizeTitle(meta.title, m.query, "Craftisle");
    const descAfter = optimizeDescription(meta.desc, m.query);
    proposals.push({
      route,
      query: m.query,
      impressions: m.impressions,
      position: m.position,
      titleBefore: meta.title,
      titleAfter,
      descBefore: meta.desc,
      descAfter,
      pageText: meta.text,
    });
  }

  // 质量闸门
  const accepted: Proposal[] = [];
  const rejected: Proposal[] = [];
  for (const p of proposals) {
    const why = validate(p);
    if (why) {
      p.rejectReason = why;
      rejected.push(p);
    } else {
      accepted.push(p);
    }
  }

  console.log("");
  console.log(`[auto-tune] 候选 ${proposals.length}｜通过 ${accepted.length}｜拦下 ${rejected.length}`);
  if (rejected.length) {
    console.log("");
    console.log("─── 被质量闸门拦下 ───");
    for (const r of rejected) console.log(`  ${r.route}  ${r.query}  →  ${r.rejectReason}`);
  }

  // 按曝光排序取前 N —— 曝光高的先调，因为它的改动最可能带来可观测变化
  accepted.sort((a, b) => b.impressions - a.impressions);
  const chosen = accepted.slice(0, MAX_ROUTES);

  console.log("");
  console.log("─── 将要写入 ───");
  for (const p of chosen) {
    console.log(`  ${p.route}   imp=${p.impressions} pos=${p.position.toFixed(1)}  「${p.query}」`);
    if (p.titleAfter !== p.titleBefore) {
      console.log(`    标题 ${p.titleBefore.length}→${p.titleAfter.length}: ${p.titleAfter}`);
    }
    if (p.descAfter !== p.descBefore) {
      console.log(`    描述 ${p.descBefore.length}→${p.descAfter.length}: ${p.descAfter.slice(0, 90)}…`);
    }
  }

  if (chosen.length === 0) {
    console.log("");
    console.log("[auto-tune] 没有可写入的改动 —— 今日不调优（这是正常结果，不凑数）");
    return;
  }

  if (!APPLY) {
    console.log("");
    console.log("[auto-tune] dryRun 结束。加 --apply 才会真写入。");
    return;
  }

  // 🔴 DEBT-43（2026-10-21）：曝光 ≤2 的候选默认**不自动写入**，转人工清单。
  //   GSC 低曝光段抽样噪声占比高（1-2 曝光可能是一次偶然展示），
  //   自动写它收益不定、风险（写错页/写错方向）却真实存在。
  //   dry-run 仍完整展示，只是 apply 模式替你拦下来。
  const writable = chosen.filter((p) => p.impressions > 2);
  const deferred = chosen.filter((p) => p.impressions <= 2);
  if (deferred.length) {
    console.log("");
    console.log("─── 曝光 ≤2，转人工清单（不自动写入）───");
    for (const p of deferred) {
      console.log(`  ${p.route}  imp=${p.impressions} pos=${p.position.toFixed(1)}  「${p.query}」`);
    }
  }
  if (writable.length === 0) {
    console.log("");
    console.log("[auto-tune] 没有达到自动写入门槛的候选 —— 今日不调优（这是正常结果，不凑数）");
    return;
  }

  // ── 真写入 ──
  if (!existsSync(SECRET_FILE)) {
    console.error(`[auto-tune] 找不到 ${SECRET_FILE} —— 无法鉴权，拒绝写入`);
    process.exit(1);
  }
  const token = readFileSync(SECRET_FILE, "utf-8").trim();
  if (!token) {
    console.error("[auto-tune] autotune token 为空，拒绝写入");
    process.exit(1);
  }

  console.log("");
  console.log(`[auto-tune] POST 写入 ${writable.length} 条…`);
  const url = `${API_BASE}/api/analytics/tune?apply=1&autotune=${encodeURIComponent(token)}`;

  const payload = {
    edits: writable.map((p) => ({
      route: p.route,
      // 只发改动的那一个字段，避免把未变的字段也写进覆盖层
      ...(p.titleAfter !== p.titleBefore ? { title: p.titleAfter } : {}),
      ...(p.descAfter !== p.descBefore ? { description: p.descAfter } : {}),
      query: p.query,
      impressions: p.impressions,
    })),
  };

  try {
    const c = AbortSignal.timeout(120000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: c,
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      /* 端点可能返回非 JSON */
    }
    console.log(`[auto-tune] HTTP ${res.status}`);
    console.log(
      JSON.stringify(
        {
          ok: data.ok,
          savedToDb: data.savedToDb,
          savedRoutes: data.savedRoutes,
          cleanedOverrides: data.cleanedOverrides,
          rejected: data.rejected,
          note: data.note,
          error: data.error,
        },
        null,
        1,
      ),
    );
    if (res.status >= 400) process.exit(1);
  } catch (e) {
    console.error(`[auto-tune] 调用失败：${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[auto-tune] 失败：", e);
  process.exit(1);
});