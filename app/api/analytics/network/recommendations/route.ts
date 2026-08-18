/**
 * GET /api/analytics/network/recommendations
 * 基于 8 站本周 vs 上周 SiteMetric，输出按子站的可执行优化建议
 * 规则（按优先级降序）：
 *  1. 子站 impressions = 0 → 「零曝光急救」
 *  2. 子站周环比 impressions 跌幅 > 50% → 「断崖预警」
 *  3. 子站 avgPosition > 60 → 「深度不足，需博客/对比页/外链支撑」
 *  4. 多子站覆盖同一查询 → 「关键词互打架，建议指定主承接站」
 *  5. 主站份额 > 70% → 「网络分布失衡，建议给子站导量」
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SITES } from "@/lib/seo/sites";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    const weekday = now.getUTCDay();
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [thisWeekAll, lastWeekAll, sites] = await Promise.all([
      prisma.siteMetric.findMany({ where: { weekStart } }),
      prisma.siteMetric.findMany({ where: { weekStart: lastWeekStart } }),
      prisma.site.findMany(),
    ]);

    const totalImp = thisWeekAll.reduce((s, m) => s + m.impressions, 0);
    const recs: Array<{
      site?: string;
      severity: "critical" | "warning" | "info";
      title: string;
      detail: string;
    }> = [];

    // 1) 零曝光
    for (const s of sites) {
      const m = thisWeekAll.find((x) => x.siteId === s.id);
      if (!m || m.impressions === 0) {
        recs.push({
          site: s.slug,
          severity: "critical",
          title: `${s.name}（${s.host}）本周 0 曝光`,
          detail:
            "诊断步骤：① 在 GSC 添加 URL-prefix property 并授权服务账号；② 提交 sitemap.xml；③ 检查 robots.txt 与 Cloudflare 是否拦截爬虫；④ 在主站 footer / 相关博客内容中增加内链。",
        });
      }
    }

    // 2) 周环比断崖
    for (const s of sites) {
      const t = thisWeekAll.find((x) => x.siteId === s.id);
      const l = lastWeekAll.find((x) => x.siteId === s.id);
      if (!t || !l || l.impressions === 0) continue;
      const dropPct = ((t.impressions - l.impressions) / l.impressions) * 100;
      if (dropPct < -50) {
        recs.push({
          site: s.slug,
          severity: "critical",
          title: `${s.name} 展示断崖式下跌 ${Math.abs(Math.round(dropPct))}%`,
          detail: `上周 ${l.impressions} → 本周 ${t.impressions}。立即核查：① Cloudflare 是否误拦爬虫；② sitemap 是否更新；③ 最近是否改过页面 template / meta；④ 是否有新外链丢失。`,
        });
      }
    }

    // 3) 排名太差
    for (const s of sites) {
      const m = thisWeekAll.find((x) => x.siteId === s.id);
      if (!m || m.impressions === 0 || m.queryCount === 0) continue;
      if (m.avgPosition > 60) {
        recs.push({
          site: s.slug,
          severity: "warning",
          title: `${s.name} 平均排名 ${Math.round(m.avgPosition)}（远低于首页 30）`,
          detail: `内容深度不足的典型信号。该站有 ${m.uniquePages} 个页面被收录、${m.queryCount} 个查询词。建议：① 至少 5 篇 1000 字+ 的 cornerstone 博客（围绕该站工具的核心查询词）；② 内部互链到工具页；③ 标题描述用真实 Top 词优化（参考 /tools 改法）。`,
        });
      }
    }

    // 4) 主站份额失衡
    if (totalImp > 0) {
      const mainM = thisWeekAll.find((x) => sites.find((s) => s.slug === "craftisle" && s.id === x.siteId));
      if (mainM) {
        const share = (mainM.impressions / totalImp) * 100;
        if (share > 70) {
          recs.push({
            severity: "warning",
            title: `主站占网络 ${Math.round(share)}%（${mainM.impressions}/${totalImp}）——网络失衡`,
            detail: `6 个子站加起来才 ${Math.round(100 - share)}%，主站过度承重。Google 期望"每个子站是独立可索引实体"，过度依赖主站会拉低整网权威。建议：① 在主站工具页加子站推荐卡（已经在做但可加深）；② 子站各自产出独立博客与外链；③ 弱子站短期内先用主站 301 跳转到对应子站工具页，待子站有基础权重后改回。`,
          });
        }
      }
    }

    // 5) 关键词交叉互打架检测（同一查询出现在多个子站）
    const queryToSites = new Map<string, string[]>();
    for (const m of thisWeekAll) {
      if (!m.topQueries) continue;
      try {
        const tqs = JSON.parse(m.topQueries as string) as Array<{ query: string; impressions: number }>;
        for (const tq of tqs) {
          const arr = queryToSites.get(tq.query) ?? [];
          const siteSlug = sites.find((s) => s.id === m.siteId)?.slug;
          if (siteSlug) arr.push(siteSlug);
          queryToSites.set(tq.query, arr);
        }
      } catch {}
    }
    const cannibalized: Array<{ query: string; sites: string[] }> = [];
    for (const [q, ss] of queryToSites) {
      if (ss.length > 1) cannibalized.push({ query: q, sites: Array.from(new Set(ss)) });
    }
    if (cannibalized.length > 0) {
      recs.push({
        severity: "warning",
        title: `检测到 ${cannibalized.length} 个查询在多子站出现 → 关键词互打架`,
        detail:
          "Top 示例：" +
          cannibalized.slice(0, 3).map((c) => `"${c.query}"（${c.sites.join(", ")}）`).join("；") +
          "。建议：选定一个承接站、其它站用 canonical 指向主承接站，或合并内容。",
      });
    }

    // 按严重度排序
    const order = { critical: 0, warning: 1, info: 2 };
    recs.sort((a, b) => order[a.severity] - order[b.severity]);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      weekStart: weekStart.toISOString(),
      recommendationCount: recs.length,
      recommendations: recs,
    });
  } catch (error: any) {
    console.error("[Network Recommendations] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}