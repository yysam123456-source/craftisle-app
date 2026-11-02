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
const AI_UAS = ["gptbot", "claudebot", "perplexitybot", "google-extended", "anthropic"];

type Result = {
  slug: string;
  host: string;
  tier: number;
  ok: boolean;
  robots: { status: number; aiUas: string[]; sitemap: boolean; blockAll: boolean };
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
};

async function get(url: string, asText = true): Promise<{ status: number; body: string }> {
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
  } catch {
    return { status: 0, body: "" };
  } finally {
    clearTimeout(timer);
  }
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
    robots: { status: 0, aiUas: [], sitemap: false, blockAll: false },
    llms: { status: 0, bytes: 0, links: 0 },
    sitemap: { status: 0, sampleUrl: null },
    page: { url: null, status: 0, words: 0, h1: null, jsonLd: [], hasNoindex: false, titleLen: 0 },
    p0: [],
    p1: [],
  };

  // 1) robots.txt
  const robots = await get(`${base}/robots.txt`);
  r.robots.status = robots.status;
  const lower = robots.body.toLowerCase();
  r.robots.aiUas = AI_UAS.filter((u) => lower.includes(`user-agent: ${u}`) || lower.includes(`user-agent:${u}`));
  r.robots.sitemap = /^\s*sitemap:/im.test(robots.body);
  r.robots.blockAll = /^\s*disallow:\s*\/\s*$/im.test(robots.body);

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
  if (r.robots.status !== 200) r.p0.push("robots.txt 不可读");
  if (r.robots.blockAll) r.p0.push("robots.txt 全站禁抓");
  if (r.sitemap.status !== 200) r.p0.push("sitemap 不可读");
  if (r.page.status !== 200) r.p0.push(`取样页 HTTP ${r.page.status}`);
  if (r.page.hasNoindex) r.p0.push("取样页 noindex");

  if (r.robots.aiUas.length === 0) r.p1.push("robots 未显式声明 AI 爬虫（依赖通配符）");
  if (r.llms.status !== 200 || r.llms.bytes < 500) r.p1.push("llms.txt 缺失或过薄");
  if (r.llms.links < 5) r.p1.push("llms.txt 缺结构化链接清单");
  if (r.page.jsonLd.length === 0) r.p1.push("取样页无 JSON-LD");
  if (r.page.words < 300) r.p1.push(`取样页 SSR 正文仅 ${r.page.words} 词（AI 无内容可引）`);
  if (!r.page.h1) r.p1.push("取样页无 h1");

  r.ok = r.p0.length === 0;
  return r;
}

function line(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length);
}

async function main() {
  const strict = process.argv.includes("--strict");
  const results: Result[] = [];
  for (const site of SITES) {
    const r = await audit(site);
    results.push(r);
    const flag = r.p0.length ? "P0" : r.p1.length ? "P1" : "OK";
    console.log(
      `${flag}  ${line(r.host, 26)} words=${line(String(r.page.words), 6)} ld=${line(r.page.jsonLd.join(",") || "-", 34)} aiUa=${r.robots.aiUas.length} llms=${r.llms.bytes}B`,
    );
    for (const p of r.p0) console.log(`      ⛔ ${p}`);
    for (const p of r.p1) console.log(`      ⚠️  ${p}`);
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
}

main();
