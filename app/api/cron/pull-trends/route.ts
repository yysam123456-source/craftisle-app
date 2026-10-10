/**
 * Vercel Cron: 每月 1 日和 15 日 08:00 UTC 拉取搜索趋势
 * GET /api/cron/pull-trends
 *
 * 🔴 2026-10-10 修复：此前本路由**只**调用 `fetchMultiKeywordTrends`，
 * 而那是个刻意留空的桩（真正的周时间序列需要非官方端点）⇒
 * **本 cron 无论跑多少次都写入 0 条趋势记录**，却返回 `success: true`、零告警。
 * 连 Google Suggest 恢复也改变不了任何结果。
 *
 * 现在改用 `fetchSuggestBreadth`（真实 Suggest 数据）：
 *   · 记录的是**长尾变体条数**，不是搜索量 —— 语义写在 `source` 上做区分。
 *   · `source = "suggest"`，**不复用 `"google_trends"`**，避免把变体条数
 *     伪装成搜索次数污染趋势表。
 *   · 换数据源时（google → bing）**跳过周环比计算**：两个口径的条数不可比，
 *     相减得到的增长率是假的。
 *   · 双源都不可达时返回 `degraded: true` 并写告警，而不是静悄悄写 0 条。
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { fetchSuggestBreadth, TREND_SEED_QUERIES } from "@/lib/seo/trends-client";

const prisma = new PrismaClient();
const CRON_SECRET = process.env.CRON_SECRET || "";
const TREND_SOURCE = "suggest";

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
    console.log(`[Trends Cron] Pulling suggest breadth for ${TREND_SEED_QUERIES.length} seed queries`);

    // 上周同源的 provider，用于判断是否换源（换源则不算环比）
    const lastWeek = new Date();
    lastWeek.setHours(0, 0, 0, 0);
    lastWeek.setDate(lastWeek.getDate() - lastWeek.getDay()); // 本周一
    const prevWeek = new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

    const prevRows = await prisma.searchTrend.findMany({
      where: { weekStart: prevWeek, source: TREND_SOURCE },
      select: { query: true, count: true },
    });
    const prevMap = new Map(prevRows.map((r) => [r.query, r.count]));

    const rows = await fetchSuggestBreadth(TREND_SEED_QUERIES);
    const providers = [...new Set(rows.map((r) => r.provider))];
    const degraded = rows.every((r) => r.provider === "none");

    let inserted = 0;
    let skippedNoProvider = 0;
    const failures: string[] = [];

    for (const row of rows) {
      if (row.provider === "none") {
        skippedNoProvider++;
        failures.push(`${row.seed}: ${row.error ?? "no source"}`);
        continue;
      }
      // 只在同一 provider 下算环比；换源或上周无记录时不写 previousCount/growth
      const comparable = !row.providerChanged && prevMap.has(row.seed);
      const previousCount = comparable ? prevMap.get(row.seed)! : null;
      const growth = previousCount != null ? (row.breadth - previousCount) / (previousCount || 1) : null;

      await prisma.searchTrend.upsert({
        where: {
          query_source_weekStart: { query: row.seed, source: TREND_SOURCE, weekStart: lastWeek },
        },
        create: {
          query: row.seed,
          source: TREND_SOURCE,
          count: row.breadth,
          previousCount,
          growth,
          weekStart: lastWeek,
        },
        update: { count: row.breadth, previousCount, growth },
      });
      inserted++;
    }

    console.log(
      `[Trends Cron] Inserted ${inserted} records (source=${TREND_SOURCE}, providers=${providers.join("/") || "none"}, skipped=${skippedNoProvider})`
    );

    // 🔴 双源都挂必须落告警 + 写进 pipelineStatus，否则「恒写 0 条」又是静默故障
    if (degraded) {
      console.error("[Trends Cron] 所有 Suggest 源均不可达 —— 本次未写入任何趋势数据");
      try {
        const msg = `趋势管道降级：Google 与 Bing Suggest 均不可达（${failures.length}/${rows.length} 个种子失败），本次未写入任何趋势记录。这是数据源故障，不是「无需求」。`;
        const existing = await prisma.alertEvent.findFirst({
          where: { type: "trends_degraded", query: "__trends__", resolved: false },
        });
        if (existing) {
          await prisma.alertEvent.update({
            where: { id: existing.id },
            data: { message: msg, severity: "critical", snapshotAt: lastWeek },
          });
        } else {
          await prisma.alertEvent.create({
            data: {
              type: "trends_degraded",
              query: "__trends__",
              severity: "critical",
              message: msg,
              snapshotAt: lastWeek,
            },
          });
        }
      } catch (e) {
        console.error("[Trends Cron] 写入降级告警失败:", e);
      }
    }

    return NextResponse.json({
      success: !degraded,
      degraded,
      metric: "suggest_breadth",
      metricNote: "count = 长尾变体条数，不是搜索量",
      queriesPulled: TREND_SEED_QUERIES.length,
      trendsInserted: inserted,
      skippedNoProvider,
      providers,
      failures: failures.slice(0, 5),
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
