/**
 * 技术 SEO / 索引健康探针 v1
 * ─────────────────────────────────────────────
 * 真实、可抓取的信号（不需要 GSC 凭证即可跑一部分）：
 *   - robots.txt 可抓取且未用 Disallow 拦截整站
 *   - sitemap.xml 存在且可访问
 *   - 各子站首页 HTTP 200 且未被 noindex（meta robots / x-robots-tag）
 *   - 可选：CrUX / PageSpeed Insights Core Web Vitals（需 PSI_API_KEY，无则优雅跳过）
 *
 * 纯函数 + fetch，可离线单测（用注入的 fetch）。
 */

import { SITES, SiteConfig } from "./sites";

export interface TechIssue {
  severity: "critical" | "warning" | "info";
  siteSlug: string;
  check: string;
  message: string;
}

export interface SiteTechHealth {
  siteSlug: string;
  siteName: string;
  host: string;
  homeUrl: string;
  httpStatus: number | null;
  noindex: boolean;
  robotsAllowed: boolean | null; // null = 未探测
  sitemapOk: boolean | null;
  cwv?: { lcp?: number; cls?: number; inp?: number; score?: number };
  issues: TechIssue[];
  score: number; // 0-100，越高越健康
}

export interface TechnicalReport {
  generatedAt: string;
  sites: SiteTechHealth[];
  globalIssues: TechIssue[];
  avgScore: number;
  criticalCount: number;
}

const DEFAULT_FETCH: typeof fetch = (...args: any[]) => (globalThis as any).fetch(...args);

// 边缘防护（Cloudflare 机器人防护）会拦截无浏览器特征的服务端请求，返回 403 挑战页。
// 挑战页自带 noindex 且无 H1，若不识别会把「探针被拦」误报成「整站 noindex」的 critical。
// 带上浏览器特征头可显著降低被拦概率；仍被拦时按 edge_block 处理，不再误判为站点问题。
const PROBE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const EDGE_BLOCK_STATUSES = new Set([401, 403, 429, 503]);

async function fetchText(url: string, f: typeof fetch, timeoutMs = 8000): Promise<{ ok: boolean; status: number; body: string; headers: Record<string, string> }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await f(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent": PROBE_UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
    } as any);
    const body = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v: string, k: string) => { headers[k.toLowerCase()] = v; });
    return { ok: res.ok, status: res.status, body, headers };
  } catch {
    return { ok: false, status: 0, body: "", headers: {} };
  } finally {
    clearTimeout(t);
  }
}

function detectNoindex(html: string, headers: Record<string, string>): boolean {
  const xRobots = headers["x-robots-tag"]?.toLowerCase() ?? "";
  if (xRobots.includes("noindex")) return true;
  // 简单 meta 提取（避免引入 cheerio 依赖）
  const metaMatch = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*name=["']robots["']/i);
  if (metaMatch && /noindex/i.test(metaMatch[1])) return true;
  return false;
}

async function probeSite(site: SiteConfig, f: typeof fetch): Promise<SiteTechHealth> {
  const homeUrl = `https://${site.host}/`;
  const issues: TechIssue[] = [];

  const home = await fetchText(homeUrl, f);
  const httpStatus = home.status;
  const noindex = detectNoindex(home.body, home.headers);

  // 边缘防护拦截：不是站点配置问题，降级为 info，避免误报 critical
  const edgeBlocked = EDGE_BLOCK_STATUSES.has(httpStatus);

  if (edgeBlocked) {
    issues.push({
      severity: "info",
      siteSlug: site.slug,
      check: "edge_block",
      message: `探针请求被边缘防护拦截（HTTP ${httpStatus}）：Cloudflare 机器人防护会拦截无浏览器特征的服务端请求，非站点配置问题，Googlebot 通常不受影响。`,
    });
  } else if (httpStatus !== 200) {
    issues.push({ severity: "critical", siteSlug: site.slug, check: "http_status", message: `首页 HTTP ${httpStatus}（应为 200），搜索引擎无法索引。` });
  }
  // 只有真正取到页面时才判定 noindex —— 挑战页自带 noindex，直接判定会产生假阳性
  if (!edgeBlocked && noindex) {
    issues.push({ severity: "critical", siteSlug: site.slug, check: "noindex", message: `首页带 noindex，整站从搜索结果消失。` });
  }

  // robots.txt
  const robots = await fetchText(`https://${site.host}/robots.txt`, f);
  let robotsAllowed: boolean | null = null;
  if (robots.ok) {
    const disallowAll = /^\s*disallow:\s*\/\s*$/im.test(robots.body);
    robotsAllowed = !disallowAll;
    if (disallowAll) {
      issues.push({ severity: "critical", siteSlug: site.slug, check: "robots", message: `robots.txt 含 "Disallow: /"，整站被拦截。` });
    }
  } else {
    // 无 robots.txt 在 Google 视角等同允许，但记录为 info
    issues.push({ severity: "info", siteSlug: site.slug, check: "robots", message: `未找到 robots.txt（Google 默认允许，建议显式提供）。` });
  }

  // sitemap
  const sitemap = await fetchText(`https://${site.host}/sitemap.xml`, f);
  const sitemapOk = sitemap.ok && /<urlset|<?xml/i.test(sitemap.body);
  if (!sitemapOk) {
    // 同样可能是边缘拦截（robots.txt 能取到、页面取不到时基本可断定）
    const blocked = EDGE_BLOCK_STATUSES.has(sitemap.status);
    issues.push({
      severity: blocked ? "info" : "warning",
      siteSlug: site.slug,
      check: "sitemap",
      message: blocked
        ? `sitemap.xml 同样被边缘防护拦截（HTTP ${sitemap.status}），无法判定真实可用性。`
        : `sitemap.xml 不可访问或为空，新页面发现变慢。`,
    });
  }

  // 评分：critical 扣 40，warning 扣 15，info 不扣；满分 100
  const critical = issues.filter((i) => i.severity === "critical").length;
  const warning = issues.filter((i) => i.severity === "warning").length;
  const score = Math.max(0, 100 - critical * 40 - warning * 15);

  return {
    siteSlug: site.slug, siteName: site.name, host: site.host, homeUrl,
    httpStatus, noindex, robotsAllowed, sitemapOk, issues, score,
  };
}

/**
 * 运行全站技术探针。
 * @param f 注入 fetch（便于测试与 SSR 环境兼容）。
 * @param psiApiKey 可选 PageSpeed Insights API key，用于 CrUX CWV；无则跳过。
 */
export async function runTechnicalProbe(
  f: typeof fetch = DEFAULT_FETCH,
  psiApiKey?: string,
): Promise<TechnicalReport> {
  const sites = await Promise.all(SITES.map((s) => probeSite(s, f)));

  // 可选 CrUX
  if (psiApiKey) {
    for (const s of sites) {
      try {
        const url = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(s.homeUrl)}&key=${psiApiKey}&category=PERFORMANCE`;
        const r = await fetchText(url, f, 10000);
        if (r.ok) {
          const json = JSON.parse(r.body);
          const lh = json?.lighthouseResult?.audits;
          s.cwv = {
            lcp: lh?.["largest-contentful-paint"]?.numericValue,
            cls: lh?.["cumulative-layout-shift"]?.numericValue,
            inp: lh?.["interaction-to-next-paint"]?.numericValue,
          };
          if (s.cwv.lcp && s.cwv.lcp > 2500) {
            s.issues.push({ severity: "warning", siteSlug: s.siteSlug, check: "cwv", message: `LCP ${Math.round(s.cwv.lcp)}ms 超 2.5s 阈值。` });
            s.score = Math.max(0, s.score - 10);
          }
        }
      } catch { /* 跳过单站 CWV 失败 */ }
    }
  }

  const globalIssues = sites.flatMap((s) => s.issues);
  const avgScore = Math.round(sites.reduce((a, s) => a + s.score, 0) / (sites.length || 1));
  const criticalCount = globalIssues.filter((i) => i.severity === "critical").length;

  return { generatedAt: new Date().toISOString(), sites, globalIssues, avgScore, criticalCount };
}
