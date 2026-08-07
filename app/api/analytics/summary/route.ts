/**
 * GET /api/analytics/summary
 * 返回 SEO 概览数据：总量、周环比、趋势方向
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay());
    weekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 本周 GSC 汇总
    const [thisWeek, lastWeek, rankings, top3, alerts] = await Promise.all([
      prisma.searchQuery.aggregate({
        where: { snapshotAt: weekStart },
        _sum: { clicks: true, impressions: true },
        _avg: { position: true, ctr: true },
        _count: true,
      }),
      prisma.searchQuery.aggregate({
        where: { snapshotAt: lastWeekStart },
        _sum: { clicks: true, impressions: true },
        _avg: { position: true, ctr: true },
      }),
      prisma.rankingSnapshot.findMany({
        where: { snapshotAt: weekStart, position: { lte: 3 } },
        select: { keyword: true },
      }),
      prisma.rankingSnapshot.count({
        where: { snapshotAt: weekStart, position: { lte: 3 } },
      }),
      prisma.alertEvent.count({
        where: { resolved: false },
      }),
    ]);

    const tw = {
      impressions: thisWeek._sum.impressions ?? 0,
      clicks: thisWeek._sum.clicks ?? 0,
      avgPosition: thisWeek._avg.position ?? 0,
      avgCtr: thisWeek._avg.ctr ?? 0,
      totalQueries: thisWeek._count,
    };

    const lw = {
      impressions: lastWeek._sum.impressions ?? 0,
      clicks: lastWeek._sum.clicks ?? 0,
      avgPosition: lastWeek._avg.position ?? 0,
      avgCtr: lastWeek._avg.ctr ?? 0,
    };

    const pctChange = (current: number, previous: number) =>
      previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return NextResponse.json({
      thisWeek: tw,
      changes: {
        impressionsPct: Math.round(pctChange(tw.impressions, lw.impressions)),
        clicksPct: Math.round(pctChange(tw.clicks, lw.clicks)),
        positionChange: tw.avgPosition - lw.avgPosition, // 负数=排名上升（好）
        ctrChange: tw.avgCtr - lw.avgCtr,
      },
      top3Count: top3,
      alertCount: alerts,
      hasGscData: tw.totalQueries > 0,
      snapshotAt: weekStart.toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics Summary] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
