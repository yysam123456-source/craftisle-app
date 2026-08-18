/**
 * GET /api/analytics/summary
 * 返回 SEO 概览数据：总量、周环比、趋势方向，以及数据管道健康状态。
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const now = new Date();
    const weekStart = new Date(now);
    const weekday = now.getUTCDay();
    weekStart.setUTCDate(now.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 本周 GSC 汇总（含国家分群）
    const [thisWeek, lastWeek, top3, alerts, pipeline, topCountries] = await Promise.all([
      prisma.searchQuery.aggregate({
        where: { snapshotAt: weekStart, country: "global" },
        _sum: { clicks: true, impressions: true },
        _avg: { position: true, ctr: true },
        _count: true,
      }),
      prisma.searchQuery.aggregate({
        where: { snapshotAt: lastWeekStart, country: "global" },
        _sum: { clicks: true, impressions: true },
        _avg: { position: true, ctr: true },
      }),
      prisma.rankingSnapshot.count({ where: { snapshotAt: weekStart, position: { lte: 3 } } }),
      prisma.alertEvent.count({ where: { resolved: false } }),
      prisma.pipelineStatus.findUnique({ where: { key: "gsc_pull" } }),
      prisma.searchQuery.groupBy({
        by: ["country"],
        where: { snapshotAt: weekStart, country: { not: "global" } },
        _sum: { impressions: true, clicks: true },
        _avg: { position: true },
        orderBy: { _sum: { impressions: "desc" } },
        take: 8,
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

    // 管道健康：以 lastSuccessAt 为准；失败兜底用最新快照
    const lastSuccessAt = pipeline?.lastSuccessAt ?? null;
    const lastError = pipeline?.lastError ?? null;
    const freshnessDays = lastSuccessAt
      ? Math.floor((now.getTime() - new Date(lastSuccessAt).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    let pipelineHealth: "healthy" | "stale" | "error" = "healthy";
    if (lastError && (freshnessDays === null || freshnessDays > 8)) pipelineHealth = "error";
    else if (freshnessDays === null || freshnessDays > 8) pipelineHealth = "stale";

    return NextResponse.json({
      thisWeek: tw,
      changes: {
        impressionsPct: Math.round(pctChange(tw.impressions, lw.impressions)),
        clicksPct: Math.round(pctChange(tw.clicks, lw.clicks)),
        positionChange: tw.avgPosition - lw.avgPosition,
        ctrChange: tw.avgCtr - lw.avgCtr,
      },
      top3Count: top3,
      alertCount: alerts,
      hasGscData: tw.totalQueries > 0,
      snapshotAt: weekStart.toISOString(),
      // ── 管道可观测性 ──
      pipelineHealth,
      lastSuccessfulPull: lastSuccessAt ? lastSuccessAt.toISOString() : null,
      lastError,
      dataFreshnessDays: freshnessDays,
      lastQueryCount: pipeline?.lastQueryCount ?? null,
      gscConfigured: pipeline?.lastConfigured ?? null,
      // ── 出海：国家分群 ──
      topCountries: topCountries.map((c) => ({
        country: c.country,
        impressions: c._sum.impressions ?? 0,
        clicks: c._sum.clicks ?? 0,
        avgPosition: Math.round((c._avg.position ?? 0) * 10) / 10,
      })),
    });
  } catch (error: any) {
    console.error("[Analytics Summary] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
