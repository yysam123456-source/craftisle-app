/**
 * 内容深度 / E-E-A-T 审计 v1
 * ─────────────────────────────────────────────
 * 抓取本站关键落地页，测量真实可量化的内容信号：
 *   - 正文纯文本长度（字节/字符，近似字数）
 *   - 是否含结构化数据（JSON-LD / schema.org）
 *   - 是否含作者/组织实体（E-E-A-T 信号）
 *   - 是否含 H1 / 标题层级
 *
 * 纯函数 + fetch，可离线单测（注入 fetch）。不编造——只报告抓取到的真实值。
 */

import { SITES, SiteConfig } from "./sites";

export interface PageContentAudit {
  siteSlug: string;
  url: string;
  ok: boolean;
  status: number | null;
  textLength: number; // 近似正文字符数
  hasJsonLd: boolean;
  hasAuthorOrOrg: boolean;
  hasH1: boolean;
  issues: string[];
  /** 内容健康分 0-100 */
  score: number;
}

export interface ContentAuditReport {
  generatedAt: string;
  pages: PageContentAudit[];
  avgTextLength: number;
  thinPages: number; // 正文 < 300 字符视为薄弱
}

function stripToText(html: string): string {
  // 去 script/style，再去标签，折叠空白
  const noScript = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const noTags = noScript.replace(/<[^>]+>/g, " ");
  return noTags.replace(/\s+/g, " ").trim();
}

async function auditPage(site: SiteConfig, f: typeof fetch, timeoutMs = 8000): Promise<PageContentAudit> {
  const url = `https://${site.host}/`;
  const issues: string[] = [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await f(url, { redirect: "follow", signal: ctrl.signal } as any);
    clearTimeout(t);
    const html = await res.text();
    const text = stripToText(html);
    const textLength = text.length;

    const hasJsonLd = /application\/ld\+json/i.test(html);
    const hasAuthorOrOrg = /"@type"\s*:\s*"(Author|Person|Organization)/i.test(html) || /"author"/i.test(html);
    const hasH1 = /<h1[\s>]/i.test(html);

    if (textLength < 300) issues.push(`正文过薄（${textLength} 字符，建议 ≥ 300）。`);
    if (!hasJsonLd) issues.push("缺少 JSON-LD 结构化数据（影响富媒体展示与 E-E-A-T）。");
    if (!hasAuthorOrOrg) issues.push("未检测到作者/组织实体标注。");
    if (!hasH1) issues.push("页面缺少 H1 标题。");

    const score = Math.max(0, 100 - issues.length * 20);
    return { siteSlug: site.slug, url, ok: res.ok, status: res.status, textLength, hasJsonLd, hasAuthorOrOrg, hasH1, issues, score };
  } catch {
    return { siteSlug: site.slug, url, ok: false, status: 0, textLength: 0, hasJsonLd: false, hasAuthorOrOrg: false, hasH1: false, issues: ["抓取失败（超时/网络错误）。"], score: 0 };
  }
}

export async function runContentAudit(f: typeof fetch = (globalThis as any).fetch): Promise<ContentAuditReport> {
  const pages = await Promise.all(SITES.map((s) => auditPage(s, f)));
  const avgTextLength = Math.round(pages.reduce((a, p) => a + p.textLength, 0) / (pages.length || 1));
  const thinPages = pages.filter((p) => p.textLength < 300 && p.ok).length;
  return { generatedAt: new Date().toISOString(), pages, avgTextLength, thinPages };
}
