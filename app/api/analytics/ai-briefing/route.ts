/**
 * GET /api/analytics/ai-briefing
 * AI 自助简报 —— 一次拉全 SEO 自动化体系的完整状态,供 AI(会话/定时自动化)直接消费,
 * 避免拼 9 个分散接口。定位:数据全景 + 最关键可行动信号;深度差距分析另调
 * /api/analytics/topical-gaps。
 *
 * 内容:管道健康 / 本周总量+环比 / 8 子站 SiteMetric / 近失词(P4-10) / 低CTR词
 *       (相对基准曲线的错失点击) / 活跃告警 / 上升词 / 优化器与覆盖层状态。
 *
 * ?format=markdown → 返回 text/markdown 可直接阅读的简报(适合自动化 prompt 直接 fetch)。
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PAGE_META_BASE } from "@/lib/seo/page-meta";
import { benchmarkCtr } from "@/lib/seo/topical-gaps";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

function getWeekStarts(): { weekStart: Date; lastWeekStart: Date } {
  const now = new Date();
  const weekday = now.getUTCDay();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
  weekStart.setUTCHours(0, 0, 0, 0);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { weekStart, lastWeekStart };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wantMarkdown = searchParams.get("format") === "markdown";
    const { weekStart, lastWeekStart } = getWeekStarts();
    const now = new Date();

    const [
      thisWeekAgg,
      lastWeekAgg,
      top3Count,
      pipeline,
      siteRecords,
      siteList,
      nearMissRows,
      top10Rows,
      activeAlerts,
      risingTrends,
    ] = await Promise.all([
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
      prisma.pipelineStatus.findUnique({ where: { key: "gsc_pull" } }),
      prisma.siteMetric.findMany({ where: { weekStart }, orderBy: { impressions: "desc" } }),
      prisma.site.findMany({ orderBy: { slug: "asc" } }),
      prisma.searchQuery.findMany({
        where: { snapshotAt: weekStart, country: "global", position: { gte: 4, lte: 10 } },
        orderBy: { impressions: "desc" },
        take: 15,
        select: { query: true, impressions: true, clicks: true, ctr: true, position: true },
      }),
      prisma.searchQuery.findMany({
        where: { snapshotAt: weekStart, country: "global", position: { lte: 10 }, impressions: { gte: 20 } },
        orderBy: { impressions: "desc" },
        take: 100,
        select: { query: true, impressions: true, clicks: true, ctr: true, position: true },
      }),
      prisma.alertEvent.findMany({
        where: { resolved: false },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { type: true, severity: true, query: true, message: true, createdAt: true },
      }),
      prisma.searchTrend.findMany({
        where: { weekStart, source: "gsc", growth: { gt: 0 } },
        orderBy: { growth: "desc" },
        take: 10,
        select: { query: true, count: true, previousCount: true, growth: true },
      }),
    ]);

    // ── 管道健康 ──
    const lastSuccessAt = pipeline?.lastSuccessAt ?? null;
    const lastError = pipeline?.lastError ?? null;
    const freshnessDays = lastSuccessAt
      ? Math.floor((now.getTime() - new Date(lastSuccessAt).getTime()) / 86400000)
      : null;
    let pipelineHealth: "healthy" | "stale" | "error" = "healthy";
    if (lastError && (freshnessDays === null || freshnessDays > 8)) pipelineHealth = "error";
    else if (freshnessDays === null || freshnessDays > 8) pipelineHealth = "stale";

    // ── 总览 + 环比 ──
    const tw = {
      impressions: thisWeekAgg._sum.impressions ?? 0,
      clicks: thisWeekAgg._sum.clicks ?? 0,
      avgPosition: thisWeekAgg._avg.position ?? 0,
      avgCtr: thisWeekAgg._avg.ctr ?? 0,
      queryCount: thisWeekAgg._count,
    };
    const lw = {
      impressions: lastWeekAgg._sum.impressions ?? 0,
      clicks: lastWeekAgg._sum.clicks ?? 0,
      avgPosition: lastWeekAgg._avg.position ?? 0,
      avgCtr: lastWeekAgg._avg.ctr ?? 0,
    };
    const pct = (c: number, p: number) => (p > 0 ? Math.round(((c - p) / p) * 100) : 0);

    // ── 每子站(零曝光也全列出) ──
    const totalImpr = siteRecords.reduce((s, m) => s + m.impressions, 0);
    const sites = siteList.map((s) => {
      const m = siteRecords.find((r) => r.siteId === s.id);
      let topQueries: Array<{ query: string; impressions: number; clicks: number; position: number }> = [];
      if (m?.topQueries) {
        try {
          topQueries = (JSON.parse(m.topQueries as string) || []).slice(0, 5);
        } catch {}
      }
      return {
        slug: s.slug,
        name: s.name,
        host: s.host,
        impressions: m?.impressions ?? 0,
        clicks: m?.clicks ?? 0,
        avgPosition: m ? Math.round(m.avgPosition * 10) / 10 : 0,
        avgCtr: m ? Math.round(m.avgCtr * 10000) / 100 : 0,
        queryCount: m?.queryCount ?? 0,
        uniquePages: m?.uniquePages ?? 0,
        share: totalImpr > 0 && m ? Math.round((m.impressions / totalImpr) * 1000) / 10 : 0,
        topQueries,
      };
    });

    // ── 低 CTR 词(P≤10 且曝光≥20,按「错失点击」= 曝光×(基准CTR−实际CTR) 降序) ──
    const lowCtrQueries = top10Rows
      .map((r) => {
        const bench = benchmarkCtr(r.position);
        const missed = Math.round(r.impressions * Math.max(0, bench - r.ctr));
        return {
          query: r.query,
          position: Math.round(r.position * 10) / 10,
          ctr: Math.round(r.ctr * 10000) / 100,
          benchmarkCtr: Math.round(bench * 10000) / 100,
          impressions: r.impressions,
          missedClicks: missed,
        };
      })
      .filter((r) => r.missedClicks > 0)
      .sort((a, b) => b.missedClicks - a.missedClicks)
      .slice(0, 10);

    // ── 优化器 / 覆盖层状态 ──
    let overrides: Array<{ route: string; title: string | null; description: string | null; provenance: string; lastOptimized: string | null }> = [];
    try {
      const rows = await prisma.$queryRawUnsafe<Array<{
        route: string; title: string | null; description: string | null; provenance: string; last_optimized: Date | null;
      }>>(`SELECT route, title, description, provenance, last_optimized FROM page_meta_override`);
      overrides = rows.map((r) => ({
        route: r.route,
        title: r.title,
        description: r.description,
        provenance: r.provenance,
        lastOptimized: r.last_optimized ? new Date(r.last_optimized).toISOString() : null,
      }));
    } catch {
      // 表尚未创建(惰性建表) = 覆盖层为空
    }

    const zeroImpressionSites = sites.filter((s) => s.impressions === 0).map((s) => s.slug);
    const briefing = {
      generatedAt: now.toISOString(),
      weekStart: weekStart.toISOString(),
      pipeline: {
        health: pipelineHealth,
        lastSuccessAt: lastSuccessAt ? new Date(lastSuccessAt).toISOString() : null,
        lastError,
        freshnessDays,
        lastQueryCount: pipeline?.lastQueryCount ?? null,
        gscConfigured: pipeline?.lastConfigured ?? null,
      },
      overall: {
        ...tw,
        top3Count,
        changes: {
          impressionsPct: pct(tw.impressions, lw.impressions),
          clicksPct: pct(tw.clicks, lw.clicks),
          positionChange: Math.round((tw.avgPosition - lw.avgPosition) * 10) / 10,
        },
        lastWeek: lw,
      },
      sites,
      nearMissQueries: nearMissRows.map((r) => ({
        query: r.query,
        position: Math.round(r.position * 10) / 10,
        impressions: r.impressions,
        clicks: r.clicks,
      })),
      lowCtrQueries,
      activeAlerts: activeAlerts.map((a) => ({
        type: a.type,
        severity: a.severity,
        query: a.query,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
      })),
      risingQueries: risingTrends.map((t) => ({
        query: t.query,
        count: t.count,
        previousCount: t.previousCount,
        growthPct: t.growth != null ? Math.round(t.growth * 100) : null,
      })),
      optimizer: {
        pageMetaBaseRoutes: Object.keys(PAGE_META_BASE),
        autoApplyCron: true, // vercel.json: /api/cron/auto-optimize?apply=1 每周一 07:00 UTC
        overrideCount: overrides.length,
        overrides,
      },
      focus: {
        zeroImpressionSites,
        biggestNearMiss: nearMissRows[0]
          ? { query: nearMissRows[0].query, position: Math.round(nearMissRows[0].position * 10) / 10, impressions: nearMissRows[0].impressions }
          : null,
        biggestCtrMiss: lowCtrQueries[0] ?? null,
      },
      endpoints: {
        deepGapAnalysis: "/api/analytics/topical-gaps",
        perSiteDetail: "/api/analytics/network?site=<slug>",
        manualApply: "/api/cron/auto-optimize?apply=1&secret=<CRON_SECRET>",
      },
    };

    if (wantMarkdown) {
      return new NextResponse(renderMarkdown(briefing), {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }
    return NextResponse.json(briefing);
  } catch (error: any) {
    console.error("[AI Briefing] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

type Briefing = {
  generatedAt: string;
  weekStart: string;
  pipeline: { health: string; lastSuccessAt: string | null; lastError: string | null; freshnessDays: number | null; lastQueryCount: number | null; gscConfigured: boolean | null };
  overall: { impressions: number; clicks: number; avgPosition: number; avgCtr: number; queryCount: number; top3Count: number; changes: { impressionsPct: number; clicksPct: number; positionChange: number }; lastWeek: { impressions: number; clicks: number } };
  sites: Array<{ slug: string; name: string; host: string; impressions: number; clicks: number; avgPosition: number; avgCtr: number; queryCount: number; uniquePages: number; share: number; topQueries: Array<{ query: string; impressions: number; clicks: number; position: number }> }>;
  nearMissQueries: Array<{ query: string; position: number; impressions: number; clicks: number }>;
  lowCtrQueries: Array<{ query: string; position: number; ctr: number; benchmarkCtr: number; impressions: number; missedClicks: number }>;
  activeAlerts: Array<{ type: string; severity: string; query: string; message: string; createdAt: string }>;
  risingQueries: Array<{ query: string; count: number; previousCount: number | null; growthPct: number | null }>;
  optimizer: { pageMetaBaseRoutes: string[]; autoApplyCron: boolean; overrideCount: number; overrides: Array<{ route: string; title: string | null; description: string | null; provenance: string; lastOptimized: string | null }> };
  focus: { zeroImpressionSites: string[]; biggestNearMiss: { query: string; position: number; impressions: number } | null; biggestCtrMiss: { query: string; position: number; ctr: number; benchmarkCtr: number; impressions: number; missedClicks: number } | null };
  endpoints: Record<string, string>;
};

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function renderMarkdown(b: Briefing): string {
  const L: string[] = [];
  L.push(`# Craftisle SEO AI 简报`);
  L.push(``);
  L.push(`生成: ${b.generatedAt} | 数据周: ${b.weekStart.slice(0, 10)} | 管道: ${b.pipeline.health}${b.pipeline.freshnessDays != null ? `(${b.pipeline.freshnessDays}天前成功)` : "(从未成功)"}${b.pipeline.lastError ? ` | 上次错误: ${b.pipeline.lastError}` : ""}`);
  L.push(``);
  L.push(`## 总览(本周 GSC)`);
  const o = b.overall;
  L.push(`- 曝光 ${fmt(o.impressions)}(${o.changes.impressionsPct >= 0 ? "+" : ""}${o.changes.impressionsPct}%) | 点击 ${fmt(o.clicks)}(${o.changes.clicksPct >= 0 ? "+" : ""}${o.changes.clicksPct}%) | 均排名 ${o.avgPosition.toFixed(1)}(Δ${o.changes.positionChange}) | CTR ${(o.avgCtr * 100).toFixed(2)}% | 查询 ${o.queryCount} 个 | Top3 ${o.top3Count} 个`);
  L.push(``);
  L.push(`## 子站表现(8 站全量,含零曝光)`);
  L.push(`| 站点 | 曝光 | 点击 | 均排名 | CTR% | 查询 | 页面 | 份额% |`);
  L.push(`|---|---|---|---|---|---|---|---|`);
  for (const s of b.sites) {
    L.push(`| ${s.name} (${s.host}) | ${fmt(s.impressions)} | ${fmt(s.clicks)} | ${s.avgPosition || "—"} | ${s.avgCtr} | ${s.queryCount} | ${s.uniquePages} | ${s.share} |`);
  }
  L.push(``);
  if (b.nearMissQueries.length > 0) {
    L.push(`## 近失词(P4-10,推一把上首页)`);
    L.push(`| 查询 | 排名 | 曝光 | 点击 |`);
    L.push(`|---|---|---|---|`);
    for (const q of b.nearMissQueries) {
      L.push(`| ${q.query} | P${q.position} | ${fmt(q.impressions)} | ${fmt(q.clicks)} |`);
    }
    L.push(``);
  }
  if (b.lowCtrQueries.length > 0) {
    L.push(`## 低 CTR 词(P≤10,重写标题即涨点击)`);
    L.push(`| 查询 | 排名 | CTR% | 基准% | 曝光 | 错失点击 |`);
    L.push(`|---|---|---|---|---|---|`);
    for (const q of b.lowCtrQueries) {
      L.push(`| ${q.query} | P${q.position} | ${q.ctr} | ${q.benchmarkCtr} | ${fmt(q.impressions)} | ~${q.missedClicks} |`);
    }
    L.push(``);
  }
  if (b.risingQueries.length > 0) {
    L.push(`## 上升词(周环比)`);
    L.push(b.risingQueries.map((q) => `- ${q.query}: ${q.previousCount ?? 0} → ${q.count}(+${q.growthPct}%)`).join("\n"));
    L.push(``);
  }
  L.push(`## 活跃告警(${b.activeAlerts.length} 条)`);
  if (b.activeAlerts.length === 0) L.push(`- 无 ✅`);
  else for (const a of b.activeAlerts) L.push(`- [${a.severity}] ${a.message}`);
  L.push(``);
  L.push(`## 优化器状态`);
  L.push(`- 可自动改写路由(${b.optimizer.pageMetaBaseRoutes.length}): ${b.optimizer.pageMetaBaseRoutes.join(", ")}`);
  L.push(`- 周一自动落库: ${b.optimizer.autoApplyCron ? "已启用(vercel.json ?apply=1)" : "未启用"}`);
  L.push(`- 已生效覆盖: ${b.optimizer.overrideCount} 条`);
  for (const ov of b.optimizer.overrides) {
    L.push(`  - ${ov.route} → ${ov.title ?? "(仅描述)"} [${ov.provenance}] ${ov.lastOptimized?.slice(0, 10) ?? ""}`);
  }
  L.push(``);
  L.push(`## AI 行动焦点`);
  if (b.focus.zeroImpressionSites.length > 0) L.push(`- 零曝光子站(${b.focus.zeroImpressionSites.length}): ${b.focus.zeroImpressionSites.join(", ")} → 索引急救(sitemap/内链/robots)`);
  if (b.focus.biggestNearMiss) L.push(`- 最大近失机会: "${b.focus.biggestNearMiss.query}" P${b.focus.biggestNearMiss.position}(${fmt(b.focus.biggestNearMiss.impressions)}曝光)`);
  if (b.focus.biggestCtrMiss) L.push(`- 最大 CTR 损失: "${b.focus.biggestCtrMiss.query}" P${b.focus.biggestCtrMiss.position},CTR ${b.focus.biggestCtrMiss.ctr}% vs 基准 ${b.focus.biggestCtrMiss.benchmarkCtr}% → 重写标题`);
  L.push(``);
  L.push(`> 深度差距分析: ${b.endpoints.deepGapAnalysis} | 单站详情: ${b.endpoints.perSiteDetail} | 手动落库: auto-optimize?apply=1`);
  return L.join("\n");
}
