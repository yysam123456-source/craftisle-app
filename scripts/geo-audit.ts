/**
 * GEO 就绪度日审（确定性、零外部依赖、可 CI 化）
 *
 * 为什么需要它：T/CGCC 119 的四大指标（AI 提及率/前三/首位/信息准确率）需要真实查询
 * AI 引擎，成本高且不可离线。在建成那条通道之前，**每日可测**的是「被引用的前置条件」：
 * AI 爬虫可抓、内容 SSR 可读、结构可解析、事实可核验。这些全部可确定性测量，
 * 不依赖任何模型，也不会因为模型变化而漂移。
 *
 * 判据边界（必须诚实）：本脚本**不测**「AI 是否引用了我们」，只测「AI 引用所需的条件是否具备」。
 * 不要把它输出当成 GEO 效果指标。
 *
 * 用法：
 *   npm run seo:geo              # 审全部 9 个站点
 *   npm run seo:geo -- --strict  # 任一站点 P0 缺失则以退出码 1 结束
 *   GEO_OUT=path.json npm run seo:geo
 */

import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

type Site = { slug: string; host: string; tier: 1 | 2 | 3 };

/** 站点清单与优先级：tier1=有真实曝光，tier2=有页面规模，tier3=仅保活 */
const SITES: Site[] = [
  { slug: "craftisle", host: "craftisle.com", tier: 1 },
  { slug: "games", host: "game.craftisle.com", tier: 1 },
  { slug: "pdf", host: "pdf.craftisle.com", tier: 2 },
  { slug: "fxlab", host: "fxlab.craftisle.com", tier: 2 },
  { slug: "draw", host: "draw.craftisle.com", tier: 2 },
  { slug: "imgprompt", host: "imgprompt.craftisle.com", tier: 3 },
  { slug: "resume", host: "resume.craftisle.com", tier: 3 },
  { slug: "viewer", host: "viewer.craftisle.com", tier: 3 },
];

const UA = "Mozilla/5.0 (compatible; CraftisleGeoAudit/1.0; +https://craftisle.com/llms.txt)";

/**
 * 已决策豁免（不是「合格」，是「知道且不改」）。
 * fxlab：2026-11-04 用户明确决定不修改该站 ⇒ 缺 OAI-SearchBot 属已知状态，
 * 降为 info，避免巡检每天重复提同一条、也避免 CI 把它当成新发现。
 * 站点本身已在 11-02 正确实现「具名组重复 disallow」，故只豁免 bot 清单检查。
 */
const AI_BOT_EXEMPT: Record<string, string> = {
  fxlab: "用户 2026-11-04 决定不修改 fxlab；缺 OAI-SearchBot 为已知状态",
};
// 🔴 2026-11-04 八站审计后补全。此前只有 5 个旧名字，导致
//    `OAI-SearchBot`（OpenAI 官方：ChatGPT Search 收录/退出的唯一管理 bot）
//    缺席时审计照样全绿 —— 仪表盘看不见的缺口等于没有缺口。
//    清单与 app/robots.ts 的 AI_AGENTS 保持一致；新增 bot 时两处都要改。
const AI_UAS = [
  "gptbot",
  "oai-searchbot",
  "chatgpt-user",
  "claudebot",
  "claude-searchbot",
  "perplexitybot",
  "perplexity-user",
  "google-extended",
  "anthropic",
  "ccbot",
];
/** 必须显式声明的 bot：缺一个就报 P1（不再只是「有没有声明 AI 爬虫」的模糊判断）。 */
const REQUIRED_AI_UAS = ["oai-searchbot", "gptbot", "claudebot", "perplexitybot"];

type Result = {
  slug: string;
  host: string;
  tier: number;
  ok: boolean;
  robots: {
    status: number;
    aiUas: string[];
    sitemap: boolean;
    blockAll: boolean;
    /** 缺失的必需 AI bot（与 REQUIRED_AI_UAS 比对）。 */
    missingRequiredAiUas: string[];
    /** `*` 组有 disallow 但具名组没重复的 UA 列表 —— 分组语义泄漏。 */
    groupsMissingDisallow: string[];
    wildcardDisallowCount: number;
  };
  llms: { status: number; bytes: number; links: number };
  sitemap: { status: number; sampleUrl: string | null };
  page: {
    url: string | null;
    status: number;
    words: number;
    h1: string | null;
    jsonLd: string[];
    hasNoindex: boolean;
    titleLen: number;
  };
  p0: string[];
  p1: string[];
  /** 只记录、不判定，也不影响退出码（用于已被证伪或仅作参考的观测项）。 */
  info: string[];
  /** 三个网络探针全部失败 = 本次无法判定，不是站点缺陷。 */
  degraded: boolean;
};

async function get(url: string, asText = true): Promise<{ status: number; body: string }> {
  // 🔴 单次尝试会把一次连接抖动放大成「整站 P0」——实测（11-02）同一轮里
  //    draw/viewer 的 robots.txt 被 AbortError 打断，报告直接判「不可读 + 未声明 AI 爬虫」，
  //    而 curl 同时刻 200。故改为最多 3 次尝试，只有全部失败才返回 status 0。
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: asText ? "text/html,text/plain,*/*" : "*/*" },
        signal: ctrl.signal,
        redirect: "follow",
      });
      const body = asText ? await res.text() : "";
      return { status: res.status, body };
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    } finally {
      clearTimeout(timer);
    }
  }
  // 静默 catch 会把「抓取失败」伪装成「站点什么都没声明」。
  // GEO_DEBUG=1 时输出真实原因，否则一次网络抖动就足以让整份报告全 0。
  if (process.env.GEO_DEBUG) {
    const err = lastErr as { name?: string; message?: string; cause?: { code?: string } };
    console.error(`[geo] fetch failed ${url} :: ${err?.name} ${err?.cause?.code || err?.message}`);
  }
  return { status: 0, body: "" };
}

function strip(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jsonLdTypes(html: string): string[] {
  const out: string[] = [];
  const blocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of blocks) {
    try {
      const parsed = JSON.parse(b[1]);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const n of nodes) {
        if (n && typeof n === "object") {
          const t = (n as Record<string, unknown>)["@type"];
          if (typeof t === "string") out.push(t);
          const graph = (n as Record<string, unknown>)["@graph"];
          if (Array.isArray(graph)) {
            for (const g of graph) {
              const gt = g && typeof g === "object" ? (g as Record<string, unknown>)["@type"] : null;
              if (typeof gt === "string") out.push(gt);
            }
          }
        }
      }
    } catch {
      out.push("PARSE_ERR");
    }
  }
  return [...new Set(out)];
}

function firstLoc(xml: string): string | null {
  const m = xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i);
  return m ? m[1] : null;
}

async function audit(site: Site): Promise<Result> {
  const base = `https://${site.host}`;
  const r: Result = {
    slug: site.slug,
    host: site.host,
    tier: site.tier,
    ok: true,
    robots: {
      status: 0,
      aiUas: [],
      sitemap: false,
      blockAll: false,
      missingRequiredAiUas: [],
      groupsMissingDisallow: [],
      wildcardDisallowCount: 0,
    },
    llms: { status: 0, bytes: 0, links: 0 },
    sitemap: { status: 0, sampleUrl: null },
    page: { url: null, status: 0, words: 0, h1: null, jsonLd: [], hasNoindex: false, titleLen: 0 },
    p0: [],
    p1: [],
    info: [],
    degraded: false,
  };

  // 1) robots.txt
  const robots = await get(`${base}/robots.txt`);
  r.robots.status = robots.status;
  const lower = robots.body.toLowerCase();
  r.robots.aiUas = AI_UAS.filter((u) => lower.includes(`user-agent: ${u}`) || lower.includes(`user-agent:${u}`));
  r.robots.sitemap = /^\s*sitemap:/im.test(robots.body);
  r.robots.blockAll = /^\s*disallow:\s*\/\s*$/im.test(robots.body);
  r.robots.missingRequiredAiUas = REQUIRED_AI_UAS.filter((u) => !r.robots.aiUas.includes(u));

  // 🔴 分组语义闸门（Google 官方：具名组命中后 `*` 组被完全忽略，两组规则不合并）。
  //    2026-11-04 八站审计发现主站 / pdf / viewer 的 AI 组只有 `Allow: /`，
  //    等于放行 /api/ /admin/ /dashboard/ 等受保护路径。这里按组解析，
  //    逐个具名组检查是否重复了 `*` 组的全部 disallow —— 防止今后再次回归。
  if (robots.status === 200) {
    type Group = { ua: string; disallow: string[] };
    const groups: Group[] = [];
    let cur: Group | null = null;
    for (const raw of robots.body.split(/\r?\n/)) {
      const ua = raw.match(/^\s*user-agent:\s*(.+?)\s*$/i);
      if (ua) {
        cur = { ua: ua[1].toLowerCase().trim(), disallow: [] };
        groups.push(cur);
        continue;
      }
      const dis = raw.match(/^\s*disallow:\s*(\S+)/i);
      if (dis && cur) cur.disallow.push(dis[1].toLowerCase());
    }
    const wildcard = groups.find((g) => g.ua === "*");
    const wildDis = wildcard?.disallow ?? [];
    r.robots.wildcardDisallowCount = wildDis.length;
    if (wildDis.length > 0) {
      for (const g of groups) {
        if (g.ua === "*") continue;
        if (wildDis.some((d) => !g.disallow.includes(d))) {
          r.robots.groupsMissingDisallow.push(g.ua);
        }
      }
    }
  }

  // 2) llms.txt
  const llms = await get(`${base}/llms.txt`);
  r.llms.status = llms.status;
  // 🔴 只有 200 才算有内容。404 页面本身也是 10–20KB 的 HTML，
  //    先前用 body.length 判大小 ⇒ 把「缺失」误报成「内容充足」。
  r.llms.bytes = llms.status === 200 ? llms.body.length : 0;
  r.llms.links = (llms.body.match(/\]\(https?:\/\//g) || []).length;

  // 3) sitemap → 取样页
  const smUrl = robots.body.match(/^\s*sitemap:\s*(\S+)/im)?.[1] ?? `${base}/sitemap.xml`;
  const sm = await get(smUrl);
  r.sitemap.status = sm.status;
  let loc = firstLoc(sm.body);
  // 🔴 有些站的 robots 指向的是「sitemap 索引」，首个 <loc> 本身就是 .xml。
  //    直接把它当页面抓会得到 20 词、无 h1、无 JSON-LD 的假缺陷（fxlab 今日实测误报）。
  //    这里最多下钻两层，直到拿到真正的页面 URL。
  for (let depth = 0; depth < 2 && loc && /\.xml(\?|$)/i.test(loc); depth++) {
    const nested = await get(loc);
    loc = firstLoc(nested.body);
  }
  r.sitemap.sampleUrl = loc;

  // 4) 取样页 SSR 可读性
  const pageUrl = loc ?? `${base}/`;
  const page = await get(pageUrl);
  r.page.url = pageUrl;
  r.page.status = page.status;
  r.page.words = strip(page.body).split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const h1 = page.body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  r.page.h1 = h1 ? strip(h1[1]).slice(0, 80) || null : null;
  r.page.jsonLd = jsonLdTypes(page.body);
  r.page.hasNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(page.body);
  r.page.titleLen = (page.body.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "").length;

  // ── 判定 ──
  // 三个网络探针全 0 = 本机什么都没抓到，属于「本次无法判定」。
  // 必须先算这个，否则一次网络抖动就会写成「主站从 OK 掉到 P0」，
  // 而真实情况是主站一直没事（11-02 实测：同一分钟 curl 主站 robots 200）。
  r.degraded = r.robots.status === 0 && r.sitemap.status === 0 && r.page.status === 0;

  if (!r.degraded) {
    // status 0 = 三次重试后仍抓不到，是「本次无法判定」而不是「站点有缺陷」。
    if (r.robots.status === 0) r.p0.push("robots.txt 抓取失败（重试 3 次未果，本次未判定）");
    else if (r.robots.status !== 200) r.p0.push(`robots.txt 返回 ${r.robots.status}`);
    if (r.robots.blockAll) r.p0.push("robots.txt 全站禁抓");
    if (r.sitemap.status !== 200) r.p0.push("sitemap 不可读");
    if (r.page.status !== 200) r.p0.push(`取样页 HTTP ${r.page.status}`);
    if (r.page.hasNoindex) r.p0.push("取样页 noindex");

    // 只在真正读到 robots 时才评价 AI 爬虫声明与分组一致性。
    if (r.robots.status === 200) {
      const exempt = AI_BOT_EXEMPT[site.slug];
      if (r.robots.aiUas.length === 0) r.p1.push("robots 未显式声明 AI 爬虫（依赖通配符）");
      if (r.robots.missingRequiredAiUas.length > 0) {
        const msg = `robots 缺必需 AI bot：${r.robots.missingRequiredAiUas.join(", ")}`;
        if (exempt) r.info.push(`${msg}（已豁免：${exempt}）`);
        else r.p1.push(msg);
      }
      if (r.robots.groupsMissingDisallow.length > 0)
        r.p1.push(
          `robots 具名组未重复 * 组 disallow（分组语义泄漏，可抓受保护路径）：` +
            `${r.robots.groupsMissingDisallow.join(", ")}`
        );
    }

    // 🔴 llms.txt 降级为 info（2026-11-04）：Google 官方明确不用，
    //    Ahrefs 137,210 域研究中 97% 有效文件当月零请求、AI retrieval bots 仅占 1.1%，
    //    wislr 48 天 12,099 次 AI 请求 0 次抓该文件。保留文件无害，
    //    但把它当 P1 质量门槛会让巡检每天为一个无因果杠杆的文件报警。
    if (r.llms.status !== 200 || r.llms.bytes < 500)
      r.info.push("llms.txt 缺失或过薄（仅记录：已被证伪为 GEO 杠杆，不作质量判定）");
    else if (r.llms.links < 5)
      r.info.push("llms.txt 链接清单偏少（仅记录，不作质量判定）");

    if (r.page.jsonLd.length === 0) r.p1.push("取样页无 JSON-LD");
    if (r.page.words < 300) r.p1.push(`取样页 SSR 正文仅 ${r.page.words} 词（AI 无内容可引）`);
    if (!r.page.h1) r.p1.push("取样页无 h1");
  }

  r.ok = r.p0.length === 0;
  return r;
}

function line(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length);
}

/**
 * `--robots-only`：只跨站核对 robots 分组一致性（CI 用）。
 * 与完整审计分开，避免把 sitemap/正文/llms 抓取结果混进这条阻断判据。
 * 读的是**线上** robots，所以部署前跑必然看到旧配置 ⇒ 该步骤在 CI 里不阻断，
 * 只输出可核对的清单；真正的回归由部署后的每日巡检发现。
 */
async function robotsOnly(): Promise<void> {
  const problems: string[] = [];
  const undetermined: string[] = [];
  for (const site of SITES) {
    const body = await get(`https://${site.host}/robots.txt`);
    if (body.status === 0) {
      // 🔴 抓不到 ≠ 有缺陷。三次重试全失败是「本次无法判定」，
      //    不能报成「8 站待修」——那会把一次网络抖动伪装成全站配置灾难。
      undetermined.push(`${site.host}: 三次重试未取到 robots.txt`);
      console.log(`❔ ${site.host.padEnd(26)} 未判定（抓取失败，不代表站点状态）`);
      continue;
    }
    if (body.status !== 200) {
      problems.push(`${site.host}: robots HTTP ${body.status}`);
      continue;
    }
    const lower = body.body.toLowerCase();
    const present = AI_UAS.filter((u) => lower.includes(`user-agent: ${u}`) || lower.includes(`user-agent:${u}`));
    const missing = REQUIRED_AI_UAS.filter((u) => !present.includes(u));

    type Group = { ua: string; disallow: string[] };
    const groups: Group[] = [];
    let cur: Group | null = null;
    for (const raw of body.body.split(/\r?\n/)) {
      const ua = raw.match(/^\s*user-agent:\s*(.+?)\s*$/i);
      if (ua) { cur = { ua: ua[1].toLowerCase().trim(), disallow: [] }; groups.push(cur); continue; }
      const dis = raw.match(/^\s*disallow:\s*(\S+)/i);
      if (dis && cur) cur.disallow.push(dis[1].toLowerCase());
    }
    const wild = groups.find((g) => g.ua === "*")?.disallow ?? [];
    const leak = wild.length
      ? groups.filter((g) => g.ua !== "*" && wild.some((d) => !g.disallow.includes(d))).map((g) => g.ua)
      : [];
    const exempt = AI_BOT_EXEMPT[site.slug];

    const flags: string[] = [];
    if (missing.length && !exempt) flags.push(`缺 ${missing.join(",")}`);
    if (leak.length) flags.push(`组泄漏 ${leak.length} 个`);
    if (exempt && missing.length) flags.push(`(已豁免 ${site.slug})`);
    console.log(`${flags.length ? "⚠️ " : "✅"} ${site.host.padEnd(26)} aiUa=${present.length} leak=${leak.length} wildDis=${wild.length}`);
    if (missing.length && !exempt) problems.push(`${site.host}: 缺必需 AI bot ${missing.join(", ")}`);
    if (leak.length) problems.push(`${site.host}: 具名组未重复 disallow → ${leak.join(", ")}`);
  }
  console.log(`\n[robots-only] ${problems.length} 项待修 / ${undetermined.length} 项未判定（fxlab 豁免已单列）`);
  for (const p of problems) console.log(`  - ${p}`);
  if (undetermined.length) {
    console.log(`[robots-only] ⚠️ 本次有 ${undetermined.length} 站未判定 —— 结论不完整，不代表站点无缺陷`);
    for (const u of undetermined) console.log(`  ❔ ${u}`);
  }
}

async function main() {
  if (process.argv.includes("--robots-only")) {
    await robotsOnly();
    return;
  }
  const strict = process.argv.includes("--strict");
  const results: Result[] = [];
  for (const site of SITES) {
    const r = await audit(site);
    results.push(r);
    // degraded 用 "--" 而不是 P0：抓不到 ≠ 有缺陷。读数的人必须能一眼分开这两件事。
    const flag = r.degraded ? "--" : r.p0.length ? "P0" : r.p1.length ? "P1" : "OK";
    console.log(
      `${flag}  ${line(r.host, 26)} words=${line(String(r.page.words), 6)} ld=${line(r.page.jsonLd.join(",") || "-", 34)}` +
        ` aiUa=${r.robots.aiUas.length} groupLeak=${r.robots.groupsMissingDisallow.length} llms=${r.llms.bytes}B`,
    );
    if (r.degraded) console.log("      ❔ 本轮抓取失败（3 次重试未果），本次未判定——不是 P0");
    for (const p of r.p0) console.log(`      ⛔ ${p}`);
    for (const p of r.p1) console.log(`      ⚠️  ${p}`);
    for (const p of r.info) console.log(`      ℹ️  ${p}`);
  }

  const out = process.env.GEO_OUT ?? resolve(process.cwd(), `.workbuddy/geo/geo-audit-${new Date().toISOString().slice(0, 10)}.json`);
  try {
    mkdirSync(dirname(out), { recursive: true });
    const tmp = `${out}.tmp`;
    writeFileSync(tmp, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2), "utf-8");
    // 原子写：先临时文件再 rename，避免半截 JSON（本站曾因此类写入静默坏过一次）
    renameSync(tmp, out);
    console.log(`\n→ ${out}`);
  } catch (e) {
    console.error(`写入失败（不影响判定）：${(e as Error).message}`);
  }

  const p0 = results.filter((r) => r.p0.length);
  if (strict && p0.length) {
    console.error(`\n[strict] ${p0.length} 个站点存在 P0 缺陷`);
    process.exitCode = 1;
  }
  // 抓不到不算通过，也不算失败——单独提示，别让它悄悄混进 CI 绿灯。
  const degraded = results.filter((r) => r.degraded);
  if (degraded.length) {
    console.error(`\n[未判定] ${degraded.map((r) => r.host).join(", ")} —— 本机抓取失败，结果不代表站点状态`);
  }
}

main();
