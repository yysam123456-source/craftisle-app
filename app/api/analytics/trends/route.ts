/**
 * GET /api/analytics/trends?dimension=tools&period=90d
 * 返回搜索词的趋势数据（按时间序列）
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dimension = searchParams.get("dimension") || "all"; // all | tools | directory | blog
    const period = parseInt(searchParams.get("period") || "90") || 90;

    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    // 拉取趋势数据
    const trends = await prisma.searchTrend.findMany({
      where: {
        weekStart: { gte: since },
        source: "gsc",
      },
      orderBy: [{ weekStart: "asc" }, { count: "desc" }],
      take: 500,
    });

    // 按周分组求总和
    const weeklyTotals: Record<string, { impressions: number; clicks: number }> = {};
    
    for (const t of trends) {
      const key = t.weekStart.toISOString().split("T")[0];
      if (!weeklyTotals[key]) weeklyTotals[key] = { impressions: 0, clicks: 0 };
      weeklyTotals[key].impressions += t.count;
      weeklyTotals[key].clicks += 0; // SearchTrend stores impressions in count
    }

    const timeline = Object.entries(weeklyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        impressions: values.impressions,
        clicks: values.clicks,
      }));

    // Top 20 上升关键词
    const risingQueries = trends
      .filter(t => t.growth != null && t.growth > 0)
      .sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))
      .slice(0, 20)
      .map(t => ({
        query: t.query,
        growth: t.growth,
        currentCount: t.count,
        previousCount: t.previousCount,
      }));

    // Top 10 下降关键词
    const decliningQueries = trends
      .filter(t => t.growth != null && t.growth < 0)
      .sort((a, b) => (a.growth ?? 0) - (b.growth ?? 0))
      .slice(0, 10)
      .map(t => ({
        query: t.query,
        growth: t.growth,
        currentCount: t.count,
        previousCount: t.previousCount,
      }));

    return NextResponse.json({
      timeline,
      rising: risingQueries,
      declining: decliningQueries,
      dimension,
      period,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics Trends] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
