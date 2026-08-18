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
import { computeCompetitorCoverage, CompetitorCoverageRow } from "@/lib/seo/competitors";
import { SITES, resolveSiteSlug } from "@/lib/seo/sites";

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
  competitor?: string | null;
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

/** 重试自愈：对瞬时失败（网络/超时/JWT 刷新）最多重试 attempts 次，指数退避 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelay = 1000): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      console.warn(`[GSC Cron] attempt ${i + 1}/${attempts} failed:`, e);
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, baseDelay * (i + 1)));
    }
  }
  throw lastErr;
}

/** 管道告警：把 Cron 调度失败/失效转成 AlertEvent，使其在 /api/analytics/alerts 可见 */
async function createPipelineAlert(
  prisma: PrismaClient,
  type: string,
  message: string,
  severity: string
): Promise<number> {
  return createAlertsIfAbsent(prisma, new Date(), [
    { type, query: "__pipeline__", severity, message },
  ]);
}

/** 自愈合：同一 (type, query) 只保留最新一条（createdAt 最大），删除其余历史/重复。
 *  历史告警的 snapshotAt 因多次代码迭代而不一致（有原始时间戳、有错误周一），
 *  无法可靠按周归一化，故直接按 (type, query) 去重并保留最新，彻底杜绝堆积。 */
async function dedupeAlerts(prisma: PrismaClient): Promise<number> {
  try {
    const all = await prisma.alertEvent.findMany({
      select: { id: true, type: true, query: true, createdAt: true },
    });
    const groups = new Map<string, typeof all>();
    for (const a of all) {
      const k = `${a.type}::${a.query}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k)!.push(a);
    }
    const toDelete: string[] = [];
    for (const arr of groups.values()) {
      if (arr.length > 1) {
        // 保留最新一条（createdAt 最大），删除其余历史/重复
        arr.sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime());
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

/**
 * 去重创建告警（v2.2 修正）：
 *  1. 先清理「上一周遗留的未解决陈旧告警」(snapshotAt < 本周一 且 resolved:false)，
 *     避免旧周告警占用 (type,query) key、永久挡住本周应生成的新鲜告警。
 *  2. 仅当本周「未解决」同 (type,query) 告警不存在时才插入，避免重复。
 *  说明：用户已解决 (resolved:true) 的历史告警保留为记录，不删除、也不挡本周新告警
 *        —— 若同类问题本周复发会正常重新告警（符合周监控语义）。
 */
async function createAlertsIfAbsent(
  prisma: PrismaClient,
  snapshotAt: Date,
  alerts: Array<{ type: string; query: string; severity: string; message: string; data?: Prisma.InputJsonValue }>
): Promise<number> {
  if (alerts.length === 0) return 0;

  // ── 1. 清理上一周遗留的未解决陈旧告警 ──
  const stale = await prisma.alertEvent.findMany({
    where: { snapshotAt: { lt: snapshotAt }, resolved: false },
    select: { id: true },
  });
  if (stale.length > 0) {
    await prisma.alertEvent.deleteMany({ where: { id: { in: stale.map((s) => s.id) } } });
    console.log(`[GSC Cron] Cleared ${stale.length} stale unresolved alerts from previous weeks`);
  }

  // ── 2. 仅本周「未解决」同 (type,query) 不存在时才插入 ──
  const existing = await prisma.alertEvent.findMany({
    where: {
      snapshotAt,
      resolved: false,
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

  // 管道健康预检：若上一次成功拉取已超时或上次报错，立即生成告警（自愈 + 通知）
  try {
    const prev = await prisma.pipelineStatus.findUnique({ where: { key: PIPELINE_KEY } });
    if (prev) {
      const lastSuccess = prev.lastSuccessAt ? new Date(prev.lastSuccessAt).getTime() : 0;
      const freshness = lastSuccess ? Math.floor((Date.now() - lastSuccess) / 86400000) : 999;
      if (prev.lastError || freshness > 8) {
        await createPipelineAlert(
          prisma,
          "pipeline_stale",
          prev.lastError
            ? `GSC 管道上次运行报错：${prev.lastError}。请检查 Cron 调度（Cloudflare 是否放行 /api/cron/*）。`
            : `GSC 管道已 ${freshness} 天未成功拉取（lastSuccess=${prev.lastSuccessAt}）。请检查 Cron 调度是否正常执行。`,
          "critical"
        );
        console.log(`[GSC Cron] Pipeline stale alert created (freshness=${freshness}, error=${prev.lastError})`);
      }
    }
  } catch (e) {
    console.error("[GSC Cron] Pipeline precheck failed:", e);
  }

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

    // ── 1. 全局（query 维度）──（带重试自愈）
    const { queries, configured, error } = await withRetry(() => fetchGscData(startDate, endDate, 500));
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
      if (configured) {
        await createPipelineAlert(prisma, "pipeline_stale", `GSC 返回 0 行：${msg}`, "warning");
      }
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

    // ── 1.5 竞品覆盖度 + 流失检测（section 4「竞争」维度）──
    const coverage = computeCompetitorCoverage(queries);
    const coveredCount = coverage.filter((c) => c.covered).length;
    let lostTerms: string[] = [];
    try {
      const prevPs = await prisma.pipelineStatus.findUnique({ where: { key: PIPELINE_KEY } });
      const prevRows = prevPs?.competitor ? ((JSON.parse(prevPs.competitor) as any).rows as CompetitorCoverageRow[] | undefined) : undefined;
      const prevCovered = new Set((prevRows ?? []).filter((r) => r.covered).map((r) => r.term));
      lostTerms = coverage.filter((c) => !c.covered && prevCovered.has(c.term)).map((c) => c.term);
      if (lostTerms.length > 0) {
        await createAlertsIfAbsent(prisma, snapshotAt, [
          {
            type: "competitor_lost",
            query: lostTerms.join(", "),
            severity: "warning",
            message: `竞品覆盖流失：以下竞品词本周 GSC 无曝光 ${lostTerms.join("、")}`,
            data: { lost: lostTerms },
          },
        ]);
      }
    } catch (e) {
      console.error("[GSC Cron] Competitor coverage failed:", e);
    }
    await recordPipelineStatus(prisma, {
      competitor: JSON.stringify({ total: coverage.length, covered: coveredCount, lost: lostTerms, rows: coverage }),
    });
    console.log(`[GSC Cron] Competitor coverage: ${coveredCount}/${coverage.length} covered, lost=${lostTerms.length}`);

    // ── 2. 国家维度分群（出海）──（带重试自愈）
    const countryRes = await withRetry(() => fetchGscPerformance(startDate, endDate, ["query", "country"], 5000));
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

    // ── 2.5 每子站周快照（page 维度，section 4 多子站监测）──
    try {
      const pageRes = await withRetry(() =>
        fetchGscPerformance(startDate, endDate, ["query", "page"], 5000)
      );
      if (pageRes.error) {
        results.errors.push(`site-metrics: ${pageRes.error}`);
      } else if (pageRes.rows.length > 0) {
        // 1) 确保 8 个站点都已存在
        for (const s of SITES) {
          await prisma.site.upsert({
            where: { slug: s.slug },
            create: { slug: s.slug, name: s.name, host: s.host, color: s.color, enabled: true },
            update: { name: s.name, host: s.host, color: s.color, enabled: true },
          });
        }
        // 2) 按主机名归类聚合
        type Bucket = {
          impressions: number; clicks: number; posSumImpressionWeighted: number;
          ctrImpressionWeighted: number; queryCount: number;
          pages: Set<string>;
          queries: Map<string, { impressions: number; clicks: number; position: number }>;
        };
        const buckets = new Map<string, Bucket>();
        for (const r of pageRes.rows) {
          if (!r.page) continue;
          const slug = resolveSiteSlug(r.page);
          if (!slug) continue;
          let b = buckets.get(slug);
          if (!b) {
            b = { impressions: 0, clicks: 0, posSumImpressionWeighted: 0, ctrImpressionWeighted: 0, queryCount: 0, pages: new Set(), queries: new Map() };
            buckets.set(slug, b);
          }
          b.impressions += r.impressions;
          b.clicks += r.clicks;
          b.posSumImpressionWeighted += r.position * r.impressions;
          b.ctrImpressionWeighted += r.ctr * r.impressions;
          b.queryCount += 1;
          b.pages.add(r.page);
          const prevQ = b.queries.get(r.query);
          if (!prevQ || r.impressions > prevQ.impressions) {
            b.queries.set(r.query, { impressions: r.impressions, clicks: r.clicks, position: r.position });
          }
        }
        // 3) 写入 SiteMetric
        let sitesWritten = 0;
        for (const [slug, b] of buckets) {
          const site = await prisma.site.findUnique({ where: { slug } });
          if (!site) continue;
          const topQ = Array.from(b.queries.entries())
            .map(([query, v]) => ({ query, ...v }))
            .sort((a, c) => c.impressions - a.impressions)
            .slice(0, 10);
          await prisma.siteMetric.upsert({
            where: { siteId_weekStart: { siteId: site.id, weekStart: snapshotAt } },
            create: {
              siteId: site.id,
              weekStart: snapshotAt,
              impressions: b.impressions,
              clicks: b.clicks,
              avgPosition: b.impressions > 0 ? b.posSumImpressionWeighted / b.impressions : 0,
              avgCtr: b.impressions > 0 ? b.ctrImpressionWeighted / b.impressions : 0,
              queryCount: b.queryCount,
              uniquePages: b.pages.size,
              topQueries: JSON.stringify(topQ),
            },
            update: {
              impressions: b.impressions,
              clicks: b.clicks,
              avgPosition: b.impressions > 0 ? b.posSumImpressionWeighted / b.impressions : 0,
              avgCtr: b.impressions > 0 ? b.ctrImpressionWeighted / b.impressions : 0,
              queryCount: b.queryCount,
              uniquePages: b.pages.size,
              topQueries: JSON.stringify(topQ),
            },
          });
          sitesWritten += 1;
        }
        console.log(`[GSC Cron] SiteMetric written for ${sitesWritten} sub-sites`);
      }
    } catch (e: any) {
      console.error("[GSC Cron] Site-metrics failed:", e?.message ?? e);
      results.errors.push(`site-metrics: ${e?.message ?? String(e)}`);
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

    // 运行结束再自愈合一次：本次新创建的告警需与历史同 (type,query) 告警一并去重
    results.alertsDeduped += await dedupeAlerts(prisma);

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
    await createPipelineAlert(prisma, "pipeline_error", `GSC Cron 运行抛出异常：${error.message}。请检查调度与凭证。`, "critical");
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
