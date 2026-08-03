/**
 * Vercel Cron: 每月 1 日和 15 日 08:00 UTC 拉取 Google Trends 趋势
 * GET /api/cron/pull-trends
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchMultiKeywordTrends, TREND_SEED_QUERIES } from "@/lib/seo/trends-client";

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  return !!(CRON_SECRET && secret === CRON_SECRET);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log(`[Trends Cron] Pulling trends for ${TREND_SEED_QUERIES.length} seed queries`);

    const trendsData = await fetchMultiKeywordTrends(TREND_SEED_QUERIES);
    
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // 本周一

    let inserted = 0;

    for (const [query, trendList] of trendsData.entries()) {
      if (trendList.length === 0) continue;

      // 取最近一个完整周的平均值
      const values = trendList.map(t => t.value);
      const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
      const count = Math.round(avgValue);

      // 获取上周数据对比
      const lastWeek = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const prev = await prisma.searchTrend.findUnique({
        where: {
          query_source_weekStart: {
            query,
            source: "google_trends",
            weekStart: lastWeek,
          },
        },
      });

      const previousCount = prev?.count ?? null;
      const growth = previousCount != null
        ? (count - previousCount) / (previousCount || 1)
        : null;

      await prisma.searchTrend.upsert({
        where: {
          query_source_weekStart: { query, source: "google_trends", weekStart },
        },
        create: { query, source: "google_trends", count, previousCount, growth, weekStart },
        update: { count, previousCount, growth },
      });

      inserted++;
    }

    console.log(`[Trends Cron] Inserted ${inserted} trend records`);

    return NextResponse.json({
      success: true,
      queriesPulled: TREND_SEED_QUERIES.length,
      trendsInserted: inserted,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Trends Cron] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
