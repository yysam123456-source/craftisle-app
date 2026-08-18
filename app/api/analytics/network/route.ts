/**
 * GET /api/analytics/network
 * 跨 8 站周聚合：每站本周 impressions / clicks / avgPosition / avgCtr / queryCount / uniquePages / Top 查询
 * 默认本周（含 lastWeek 对比），可选 ?site=slug 单站详情
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { SITES } from "@/lib/seo/sites";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slugFilter = searchParams.get("site");

  try {
    const now = new Date();
    const weekday = now.getUTCDay();
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 单站详情
    if (slugFilter) {
      const site = await prisma.site.findUnique({ where: { slug: slugFilter } });
      if (!site) return NextResponse.json({ error: `Site ${slugFilter} not found` }, { status: 404 });
      const [thisW, lastW] = await Promise.all([
        prisma.siteMetric.findUnique({ where: { siteId_weekStart: { siteId: site.id, weekStart } } }),
        prisma.siteMetric.findUnique({ where: { siteId_weekStart: { siteId: site.id, weekStart: lastWeekStart } } }),
      ]);
      return NextResponse.json({
        site,
        thisWeek: thisW,
        lastWeek: lastW,
        changes: thisW && lastW ? {
          impressionsPct: lastW.impressions > 0 ? Math.round(((thisW.impressions - lastW.impressions) / lastW.impressions) * 100) : 0,
          clicksPct: lastW.clicks > 0 ? Math.round(((thisW.clicks - lastW.clicks) / lastW.clicks) * 100) : 0,
          positionChange: thisW.avgPosition - lastW.avgPosition,
          ctrChange: thisW.avgCtr - lastW.avgCtr,
        } : null,
        topQueries: thisW?.topQueries ? JSON.parse(thisW.topQueries as string) : [],
      });
    }

    // 全网汇总
    const [thisWeekAll, lastWeekAll, siteRecords, siteList] = await Promise.all([
      prisma.siteMetric.aggregate({ where: { weekStart }, _sum: { impressions: true, clicks: true, queryCount: true, uniquePages: true }, _avg: { avgPosition: true, avgCtr: true } }),
      prisma.siteMetric.aggregate({ where: { weekStart: lastWeekStart }, _sum: { impressions: true, clicks: true, queryCount: true, uniquePages: true }, _avg: { avgPosition: true, avgCtr: true } }),
      prisma.siteMetric.findMany({ where: { weekStart }, orderBy: { impressions: "desc" } }),
      prisma.site.findMany({ orderBy: { slug: "asc" } }),
    ]);

    const totalImpr = thisWeekAll._sum.impressions ?? 0;
    const sites = siteList.map((s) => {
      const m = siteRecords.find((r) => r.siteId === s.id);
      return {
        slug: s.slug,
        name: s.name,
        host: s.host,
        color: s.color,
        enabled: s.enabled,
        impressions: m?.impressions ?? 0,
        clicks: m?.clicks ?? 0,
        avgPosition: m ? Math.round(m.avgPosition * 10) / 10 : 0,
        avgCtr: m ? Math.round(m.avgCtr * 10000) / 100 : 0,
        queryCount: m?.queryCount ?? 0,
        uniquePages: m?.uniquePages ?? 0,
        share: totalImpr > 0 && m ? Math.round((m.impressions / totalImpr) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json({
      total: {
        impressions: totalImpr,
        clicks: thisWeekAll._sum.clicks ?? 0,
        avgPosition: Math.round((thisWeekAll._avg.avgPosition ?? 0) * 10) / 10,
        avgCtr: Math.round((thisWeekAll._avg.avgCtr ?? 0) * 10000) / 100,
        queryCount: thisWeekAll._sum.queryCount ?? 0,
        uniquePages: thisWeekAll._sum.uniquePages ?? 0,
      },
      lastWeek: {
        impressions: lastWeekAll._sum.impressions ?? 0,
        clicks: lastWeekAll._sum.clicks ?? 0,
        avgPosition: Math.round((lastWeekAll._avg.avgPosition ?? 0) * 10) / 10,
        avgCtr: Math.round((lastWeekAll._avg.avgCtr ?? 0) * 10000) / 100,
      },
      changes: lastWeekAll._sum.impressions && lastWeekAll._sum.impressions > 0 ? {
        impressionsPct: Math.round(((totalImpr - (lastWeekAll._sum.impressions ?? 0)) / (lastWeekAll._sum.impressions ?? 0)) * 100),
        clicksPct: Math.round((((thisWeekAll._sum.clicks ?? 0) - (lastWeekAll._sum.clicks ?? 0)) / (lastWeekAll._sum.clicks ?? 1)) * 100),
      } : null,
      sites,
      siteConfig: SITES,
      snapshotAt: weekStart.toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics Network] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}