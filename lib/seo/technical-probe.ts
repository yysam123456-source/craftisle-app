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

async function fetchText(url: string, f: typeof fetch, timeoutMs = 8000): Promise<{ ok: boolean; status: number; body: string; headers: Record<string, string> }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await f(url, { redirect: "follow", signal: ctrl.signal } as any);
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

  if (httpStatus !== 200) {
    issues.push({ severity: "critical", siteSlug: site.slug, check: "http_status", message: `首页 HTTP ${httpStatus}（应为 200），搜索引擎无法索引。` });
  }
  if (noindex) {
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
    issues.push({ severity: "warning", siteSlug: site.slug, check: "sitemap", message: `sitemap.xml 不可访问或为空，新页面发现变慢。` });
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
