/**
 * Vercel Cron: 每周一 06:00 UTC 自动从 GSC 拉取搜索表现数据
 * GET /api/cron/pull-gsc-data
 *
 * 鉴权：Accept Vercel Cron header 或 CRON_SECRET query param
 *
 * 改进（v2.1）：
 *  - 错误不再被 gsc-client 静默吞掉，统一记录到 PipelineStatus.lastError
 *  - 每次运行写入管道健康状态（lastRunAt / lastSuccessAt / lastQueryCount / lastError）
 *  - 新增「国家维度」分群拉取，补齐出海分析所需的 country 数据
 *  - 运行前自愈合重复告警，避免历史重复累积
 */

import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { fetchGscData, fetchGscPerformance, classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || "";
const PIPELINE_KEY = "gsc_pull";

function isAuthorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (CRON_SECRET && secret === CRON_SECRET) return true;
  return false;
}

/** 写入管道健康状态 */
async function recordPipelineStatus(prisma: PrismaClient, patch: {
  lastRunAt?: Date;
  lastSuccessAt?: Date | null;
  lastConfigured?: boolean;
  lastQueryCount?: number;
  lastError?: string | null;
}) {
  try {
    await prisma.pipelineStatus.upsert({
      where: { key: PIPELINE_KEY },
      create: { key: PIPELINE_KEY, ...patch },
      update: patch,
    });
  } catch (e) {
    console.error("[GSC Cron] Failed to record pipeline status:", e);
  }
}

/** 将快照时间归一化为「周一 00:00 UTC」，用于按周分组去重 */
function mondayOf(d: Date): string {
  const x = new Date(d);
  const wd = x.getUTCDay();
  x.setUTCDate(x.getUTCDate() - (wd === 0 ? 6 : wd - 1));
  x.setUTCHours(0, 0, 0, 0);
  return x.toISOString();
}

/** 自愈合：同一 (type, query, 所属周) 只保留最早一条，删除其余重复。
 *  历史重复告警的 snapshotAt 可能是「运行精确时间」而非周一，故按周归一化分组。 */
async function dedupeAlerts(prisma: PrismaClient): Promise<number> {
  try {
    const all = await prisma.alertEvent.findMany({
      select: { id: true, type: true, query: true, snapshotAt: true, createdAt: true },
    });
    const groups = new Map<string, typeof all>();
    for (const a of all) {
      const k = `${a.type}::${a.query}::${mondayOf(a.snapshotAt)}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(a);
    }
    const toDelete: string[] = [];
    for (const arr of groups.values()) {
      if (arr.length > 1) {
        arr.sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime());
        toDelete.push(...arr.slice(1).map((a) => a.id));
      }
    }
    if (toDelete.length > 0) {
      await prisma.alertEvent.deleteMany({ where: { id: { in: toDelete } } });
      console.log(`[GSC Cron] Deduped ${toDelete.length} duplicate alerts`);
    }
    return toDelete.length;
  } catch (e) {
    console.error("[GSC Cron] Dedupe failed:", e);
    return 0;
  }
}

/** 去重创建告警：同一 (type, query, snapshotAt) 只插入一次，避免重复 */
async function createAlertsIfAbsent(
  prisma: PrismaClient,
  snapshotAt: Date,
  alerts: Array<{ type: string; query: string; severity: string; message: string; data?: Prisma.InputJsonValue }>
): Promise<number> {
  if (alerts.length === 0) return 0;

  const existing = await prisma.alertEvent.findMany({
    where: {
      snapshotAt,
      OR: alerts.map((a) => ({ type: a.type, query: a.query })),
    },
    select: { type: true, query: true },
  });
  const existingKeys = new Set(existing.map((e) => `${e.type}::${e.query}`));
  const fresh = alerts.filter((a) => !existingKeys.has(`${a.type}::${a.query}`));

  if (fresh.length === 0) return 0;

  await prisma.alertEvent.createMany({
    data: fresh.map((a) => ({
      type: a.type,
      query: a.query,
      severity: a.severity,
      message: a.message,
      data: a.data ?? undefined,
      snapshotAt,
    })),
    skipDuplicates: true,
  });
  return fresh.length;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 运行前先自愈合历史重复告警
  const deduped = await dedupeAlerts(prisma);

  const snapshotAt = new Date();
  const weekday = snapshotAt.getUTCDay();
  snapshotAt.setUTCDate(snapshotAt.getUTCDate() - (weekday === 0 ? 6 : weekday - 1)); // 本周一
  snapshotAt.setUTCHours(0, 0, 0, 0);

  const results = {
    queriesInserted: 0,
    countryRowsInserted: 0,
    rankingsUpdated: 0,
    alertsCreated: 0,
    alertsDeduped: deduped,
    configured: false,
    errors: [] as string[],
  };

  let runError: string | null = null;

  try {
    await recordPipelineStatus(prisma, { lastRunAt: new Date() });

    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    console.log(`[GSC Cron] Pulling data: ${startDate} → ${endDate}`);

    // ── 1. 全局（query 维度）──
    const { queries, configured, error } = await fetchGscData(startDate, endDate, 500);
    results.configured = configured;

    if (error) {
      results.errors.push(error);
      runError = error;
    }

    if (queries.length === 0) {
      const msg = configured
        ? "GSC 返回 0 行（凭证有效但无数据，或拉取出错）"
        : "GSC 未配置 — 跳过";
      await recordPipelineStatus(prisma, {
        lastConfigured: configured,
        lastSuccessAt: configured ? null : new Date(),
        lastError: configured ? msg : null,
        lastQueryCount: 0,
      });
      return NextResponse.json({
        success: !configured,
        message: msg,
        ...results,
      });
    }

    // 批量写入 SearchQuery（country=global）
    const searchQueries = queries.map((q) => ({
      query: q.query,
      clicks: q.clicks,
      impressions: q.impressions,
      ctr: q.ctr,
      position: q.position,
      snapshotAt,
    }));

    await prisma.$transaction(
      searchQueries.map((sq) =>
        prisma.searchQuery.upsert({
          where: { query_country_device_snapshotAt: { query: sq.query, country: "global", device: "all", snapshotAt: sq.snapshotAt } },
          create: sq,
          update: { clicks: sq.clicks, impressions: sq.impressions, ctr: sq.ctr, position: sq.position },
        })
      )
    );
    results.queriesInserted = queries.length;
    console.log(`[GSC Cron] Inserted ${queries.length} global queries`);

    // ── 2. 国家维度分群（出海）──
    const countryRes = await fetchGscPerformance(startDate, endDate, ["query", "country"], 5000);
    if (countryRes.error) {
      results.errors.push(countryRes.error);
      runError = runError || countryRes.error;
    } else if (countryRes.rows.length > 0) {
      const countryRows = countryRes.rows.filter((r) => r.country && r.country !== "global");
      await prisma.$transaction(
        countryRows.map((r) =>
          prisma.searchQuery.upsert({
            where: { query_country_device_snapshotAt: { query: r.query, country: r.country, device: "all", snapshotAt } },
            create: { query: r.query, country: r.country, device: "all", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position, snapshotAt },
            update: { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position },
          })
        )
      );
      results.countryRowsInserted = countryRows.length;
      console.log(`[GSC Cron] Inserted ${countryRows.length} country-segmented rows`);
    }

    // ── 3. 排名快照 + 告警 ──
    const lastWeek = new Date(snapshotAt.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousSnapshots = await prisma.rankingSnapshot.findMany({ where: { snapshotAt: lastWeek } });
    const previousMap = new Map(previousSnapshots.map((s) => [s.keyword, s]));

    const topQueries = queries
      .filter((q) => q.position < 100)
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 100);

    const rankingOps = topQueries.map((q) => {
      const prev = previousMap.get(q.query);
      const prevPosition = prev?.position ?? null;
      const change = prevPosition != null ? prevPosition - Math.round(q.position) : null;

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

      if (q.position < 10 && q.ctr < 0.03 && !alertType) {
        alertType = "low_ctr";
        alertSeverity = "warning";
        alertMessage = `"${q.query}" 排名 ${Math.round(q.position)} 但 CTR 仅 ${(q.ctr * 100).toFixed(1)}% — 建议优化标题/描述`;
      }

      return {
        snapshot: {
          keyword: q.query,
          url: "",
          position: Math.round(q.position),
          previousPosition: prevPosition,
          change,
          source: "GSC" as const,
          snapshotAt,
        },
        alert: alertType
          ? {
              type: alertType,
              query: q.query,
              severity: alertSeverity || "warning",
              message: alertMessage || "",
              data: { previousPosition: prevPosition, currentPosition: Math.round(q.position), change, ctr: q.ctr, impressions: q.impressions },
            }
          : null,
        keyword: q.query,
        url: "",
      };
    });

    const rankingResults = await Promise.all(
      rankingOps.map((op) =>
        prisma.rankingSnapshot.upsert({
          where: { keyword_url_snapshotAt: { keyword: op.keyword, url: op.url, snapshotAt } },
          create: op.snapshot,
          update: { position: op.snapshot.position, previousPosition: op.snapshot.previousPosition, change: op.snapshot.change },
        })
      )
    );
    results.rankingsUpdated = rankingResults.length;

    const alertOps = rankingOps.filter((op) => op.alert).map((op) => op.alert!);
    results.alertsCreated = await createAlertsIfAbsent(prisma, snapshotAt, alertOps);

    await aggregateSearchTrends(prisma, queries, snapshotAt);

    // 新词 / 流失词
    const previousWeekQueries = await prisma.searchQuery.findMany({ where: { snapshotAt: lastWeek }, select: { query: true, impressions: true } });
    const previousSet = new Set(previousWeekQueries.map((q) => q.query));
    const newQueries = queries.filter((q) => !previousSet.has(q.query) && q.position < 10).slice(0, 10);
    if (newQueries.length > 0) {
      results.alertsCreated += await createAlertsIfAbsent(
        prisma,
        snapshotAt,
        newQueries.map((q) => ({
          type: "new_query",
          query: q.query,
          severity: "info",
          message: `新词进入 Top 10："${q.query}"，排名 ${Math.round(q.position)}，展示 ${q.impressions} 次`,
          data: { position: q.position, impressions: q.impressions, clicks: q.clicks },
        }))
      );
    }

    const thisWeekSet = new Set(queries.map((q) => q.query));
    const lostQueries = previousWeekQueries.filter((q) => !thisWeekSet.has(q.query) && q.impressions > 100).slice(0, 5);
    if (lostQueries.length > 0) {
      results.alertsCreated += await createAlertsIfAbsent(
        prisma,
        snapshotAt,
        lostQueries.map((q) => ({
          type: "lost_query",
          query: q.query,
          severity: "warning",
          message: `高展示词流失："${q.query}"（上周展示 ${q.impressions} 次）`,
          data: { previousImpressions: q.impressions },
        }))
      );
    }

    console.log(`[GSC Cron] Complete — ${results.queriesInserted} queries, ${results.countryRowsInserted} country rows, ${results.rankingsUpdated} rankings, ${results.alertsCreated} alerts`);

    await recordPipelineStatus(prisma, {
      lastSuccessAt: new Date(),
      lastConfigured: configured,
      lastQueryCount: queries.length,
      lastError: null,
    });

    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...results });
  } catch (error: any) {
    console.error("[GSC Cron] Error:", error);
    results.errors.push(error.message);
    runError = error.message;
    await recordPipelineStatus(prisma, { lastError: error.message });
    return NextResponse.json({ success: false, ...results, error: error.message }, { status: 500 });
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
  const previous = await prisma.searchQuery.findMany({ where: { snapshotAt: lastWeek }, select: { query: true, clicks: true, impressions: true } });
  const prevMap = new Map(previous.map((p) => [p.query, p]));

  const trends = current.slice(0, 100).map((c) => {
    const prev = prevMap.get(c.query);
    const growth = prev && prev.impressions > 0 ? (c.impressions - prev.impressions) / prev.impressions : null;
    return { query: c.query, source: "gsc" as const, count: c.impressions, previousCount: prev?.impressions ?? null, growth, weekStart };
  });

  await Promise.all(
    trends.map((t) =>
      prisma.searchTrend.upsert({
        where: { query_source_weekStart: { query: t.query, source: t.source, weekStart } },
        create: t,
        update: { count: t.count, previousCount: t.previousCount, growth: t.growth },
      })
    )
  );
}
