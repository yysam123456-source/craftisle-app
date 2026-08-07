/**
 * Vercel Cron: 每周一 06:00 UTC 自动从 GSC 拉取搜索表现数据
 * GET /api/cron/pull-gsc-data
 * 
 * 鉴权：Accept Vercel Cron header 或 CRON_SECRET query param
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchGscData, classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(request: Request): boolean {
  // Vercel Cron 自动带这个 header
  if (request.headers.get("x-vercel-cron")) return true;
  
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (CRON_SECRET && secret === CRON_SECRET) return true;
  
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshotAt = new Date();
  snapshotAt.setUTCHours(0, 0, 0, 0);
  
  const results = {
    queriesInserted: 0,
    rankingsUpdated: 0,
    alertsCreated: 0,
    configured: false,
    errors: [] as string[],
  };

  try {
    // 拉取近 90 天数据
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    console.log(`[GSC Cron] Pulling data: ${startDate} → ${endDate}`);

    const { queries, configured } = await fetchGscData(startDate, endDate, 500);
    results.configured = configured;

    if (queries.length === 0) {
      return NextResponse.json({
        success: true,
        message: configured ? "No queries returned from GSC" : "GSC not configured — skipping",
        ...results,
      });
    }

    // 批量写入 SearchQuery
    const searchQueries = queries.map(q => ({
      query: q.query,
      clicks: q.clicks,
      impressions: q.impressions,
      ctr: q.ctr,
      position: q.position,
      snapshotAt,
    }));

    // 批量 upsert（使用 transaction 提高性能）
    await prisma.$transaction(
      searchQueries.map(sq =>
        prisma.searchQuery.upsert({
          where: {
            query_country_device_snapshotAt: {
              query: sq.query,
              country: "global",
              device: "all",
              snapshotAt: sq.snapshotAt,
            },
          },
          create: sq,
          update: {
            clicks: sq.clicks,
            impressions: sq.impressions,
            ctr: sq.ctr,
            position: sq.position,
          },
        })
      )
    );

    results.queriesInserted = queries.length;
    console.log(`[GSC Cron] Inserted ${queries.length} queries`);

    // 更新排名快照 — 找出上周有数据的词，对比本周排名变化
    const lastWeek = new Date(snapshotAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // 获取上周排名数据
    const previousSnapshots = await prisma.rankingSnapshot.findMany({
      where: { snapshotAt: lastWeek },
    });

    const previousMap = new Map(
      previousSnapshots.map(s => [s.keyword, s])
    );

    // 只为 Top 100 且有排名的词创建快照
    const topQueries = queries
      .filter(q => q.position < 100)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 100);

    const rankingOps = topQueries.map(q => {
      const prev = previousMap.get(q.query);
      const prevPosition = prev?.position ?? null;
      const change = prevPosition != null && q.position != null
        ? prevPosition - Math.round(q.position)  // 正数=上升
        : null;

      // 检测告警
      let alertType: string | null = null;
      let alertSeverity: string | null = null;
      let alertMessage: string | null = null;

      if (change != null) {
        if (change < -10) {
          alertType = "position_drop";
          alertSeverity = "critical";
          alertMessage = `"${q.query}" 排名暴跌 ${Math.abs(change)} 位：${prevPosition} → ${Math.round(q.position)}`;
        } else if (change < -5) {
          alertType = "position_drop";
          alertSeverity = "warning";
          alertMessage = `"${q.query}" 排名下降 ${Math.abs(change)} 位：${prevPosition} → ${Math.round(q.position)}`;
        } else if (change > 10) {
          alertType = "position_rise";
          alertSeverity = "info";
          alertMessage = `"${q.query}" 排名大幅上升 ${change} 位：${prevPosition} → ${Math.round(q.position)}`;
        }
      }

      // 低 CTR 告警
      if (q.position < 10 && q.ctr < 0.03) {
        if (!alertType) {
          alertType = "low_ctr";
          alertSeverity = "warning";
          alertMessage = `"${q.query}" 排名 ${q.position} 但 CTR 仅 ${(q.ctr * 100).toFixed(1)}% — 建议优化标题/描述`;
        }
      }

      return {
        snapshot: {
          keyword: q.query,
          url: "", // GSC API 不返回 URL，需二次拉取（Phase 2 优化）
          position: Math.round(q.position),
          previousPosition: prevPosition,
          change,
          source: "GSC" as const,
          snapshotAt,
        },
        alert: alertType ? {
          type: alertType,
          query: q.query,
          severity: alertSeverity || "warning",
          message: alertMessage || "",
          data: {
            previousPosition: prevPosition,
            currentPosition: Math.round(q.position),
            change,
            ctr: q.ctr,
            impressions: q.impressions,
          },
        } : null,
        keyword: q.query,
        url: "",
      };
    });

    // 批量 upsert RankingSnapshot
    const rankingResults = await Promise.all(
      rankingOps.map(op =>
        prisma.rankingSnapshot.upsert({
          where: {
            keyword_url_snapshotAt: {
              keyword: op.keyword,
              url: op.url,
              snapshotAt,
            },
          },
          create: op.snapshot,
          update: {
            position: op.snapshot.position,
            previousPosition: op.snapshot.previousPosition,
            change: op.snapshot.change,
          },
        })
      )
    );
    results.rankingsUpdated = rankingResults.length;

    // 创建告警
    const alertOps = rankingOps.filter(op => op.alert).map(op => op.alert!);
    if (alertOps.length > 0) {
      await prisma.alertEvent.createMany({ data: alertOps });
      results.alertsCreated = alertOps.length;
    }

    // 更新搜索趋势聚合
    await aggregateSearchTrends(prisma, queries, snapshotAt);

    // 发现新词（上周不存在、本周出现的词）
    const previousWeekQueries = await prisma.searchQuery.findMany({
      where: { snapshotAt: lastWeek },
      select: { query: true, impressions: true },
    });
    const previousSet = new Set(previousWeekQueries.map(q => q.query));
    const newQueries = queries
      .filter(q => !previousSet.has(q.query) && q.position < 10)
      .slice(0, 10);

    if (newQueries.length > 0) {
      await prisma.alertEvent.createMany({
        data: newQueries.map(q => ({
          type: "new_query",
          query: q.query,
          severity: "info",
          message: `新词进入 Top 10："${q.query}"，排名 ${Math.round(q.position)}，展示 ${q.impressions} 次`,
          data: { position: q.position, impressions: q.impressions, clicks: q.clicks },
        })),
      });
      results.alertsCreated += newQueries.length;
    }

    // 检测流失词（上周有、本周消失的高展示词）
    const thisWeekSet = new Set(queries.map(q => q.query));
    const lostQueries = previousWeekQueries
      .filter(q => !thisWeekSet.has(q.query))
      .filter(q => q.impressions > 100)
      .slice(0, 5);

    if (lostQueries.length > 0) {
      await prisma.alertEvent.createMany({
        data: lostQueries.map(q => ({
          type: "lost_query",
          query: q.query,
          severity: "warning",
          message: `高展示词流失："${q.query}"（上周展示 ${q.impressions} 次）`,
          data: { previousImpressions: q.impressions },
        })),
      });
      results.alertsCreated += lostQueries.length;
    }

    console.log(`[GSC Cron] Complete — ${results.queriesInserted} queries, ${results.rankingsUpdated} rankings, ${results.alertsCreated} alerts`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results,
    });
  } catch (error: any) {
    console.error("[GSC Cron] Error:", error);
    results.errors.push(error.message);
    return NextResponse.json(
      { success: false, ...results, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * 聚合搜索趋势到 SearchTrend 表
 */
async function aggregateSearchTrends(
  prisma: PrismaClient,
  current: Array<{ query: string; clicks: number; impressions: number }>,
  weekStart: Date,
) {
  const lastWeek = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const previous = await prisma.searchQuery.findMany({
    where: { snapshotAt: lastWeek },
    select: { query: true, clicks: true, impressions: true },
  });

  const prevMap = new Map(previous.map(p => [p.query, p]));
  
  const trends = current.slice(0, 100).map(c => {
    const prev = prevMap.get(c.query);
    const growth = prev && prev.impressions > 0
      ? (c.impressions - prev.impressions) / prev.impressions
      : null;

    return {
      query: c.query,
      source: "gsc" as const,
      count: c.impressions,
      previousCount: prev?.impressions ?? null,
      growth,
      weekStart,
    };
  });

  await Promise.all(
    trends.map(t =>
      prisma.searchTrend.upsert({
        where: {
          query_source_weekStart: {
            query: t.query,
            source: t.source,
            weekStart,
          },
        },
        create: t,
        update: {
          count: t.count,
          previousCount: t.previousCount,
          growth: t.growth,
        },
      })
    )
  );
}
