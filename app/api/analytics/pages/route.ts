/**
 * GET /api/analytics/pages?site=<slug>&limit=50
 *
 * 🔴 2026-11-03 新增：页面级曝光归因。
 *
 * 存在的理由：此前 page 维度的数据在 pull 侧被聚合成 SiteMetric.uniquePages
 * （**一个计数**），URL 列表直接丢弃 ⇒ 能回答「有多少页有曝光」，
 * 回答不了「**是哪几页**」「**哪一页在涨**」「**哪一页掉了**」。
 * 而「对有曝光的模板加量、没曝光的模板停用」这个决策环必须有页面级数据才能执行。
 *
 * 输出：
 *   - pages[]：该站本期每个有曝光的 URL + 曝光/点击/位次/命中查询数 + Top 查询
 *   - movers[]：与上一期相比的新增 / 掉零 / 涨幅最大 / 跌幅最大
 *
 * 口径：weekStart 与 SiteMetric 对齐（同一次滚动窗口拉取）。
 * 数据未入库时（首次部署后还没跑 cron）返回空数组而不是报错 ——
 * 「还没数据」和「查询失败」必须能区分开。
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const siteSlug = searchParams.get("site");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50") || 50, 500);

    const site = siteSlug
      ? await prisma.site.findUnique({ where: { slug: siteSlug } })
      : null;
    if (siteSlug && !site) {
      return NextResponse.json(
        { ok: false, error: `未知站点 "${siteSlug}"`, sites: null },
        { status: 404 }
      );
    }

    // 本期 = 最新 weekStart；上一期 = 紧邻的前一周
    const latest = await prisma.pageMetric.findFirst({
      where: site ? { siteId: site.id } : {},
      orderBy: { weekStart: "desc" },
      select: { weekStart: true },
    });
    if (!latest) {
      return NextResponse.json({
        ok: true,
        note: "PageMetric 尚无数据 —— 页面级归因需要 cron 跑过一次 pull-gsc-data 之后才有。这是「还没数据」，不是「查询失败」。",
        latestWeek: null,
        pages: [],
        movers: { appeared: [], dropped: [], gained: [], lost: [] },
        totalPages: 0,
      });
    }

    const prevWeek = new Date(latest.weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const current = await prisma.pageMetric.findMany({
      where: { weekStart: latest.weekStart, ...(site ? { siteId: site.id } : {}) },
      orderBy: { impressions: "desc" },
      take: limit,
    });
    const previous = await prisma.pageMetric.findMany({
      where: { weekStart: prevWeek, ...(site ? { siteId: site.id } : {}) },
      select: { page: true, impressions: true, clicks: true, position: true },
    });
    const prevMap = new Map(previous.map((p) => [p.page, p]));

    const pages = current.map((p) => {
      let topQueries: unknown = [];
      try {
        topQueries = p.topQueries ? JSON.parse(p.topQueries) : [];
      } catch {
        // 🔴 静默 catch 会把「JSON 写坏」伪装成「该页无查询」—— 必须显式标出来
        topQueries = { parseError: true };
      }
      const prev = prevMap.get(p.page);
      return {
        page: p.page,
        impressions: p.impressions,
        clicks: p.clicks,
        position: Number(p.position.toFixed(1)),
        queryCount: p.queryCount,
        prevImpressions: prev ? prev.impressions : null,
        deltaImpressions: prev ? p.impressions - prev.impressions : null,
        topQueries,
      };
    });

    // 本期有、上一期没有 ⇒ 新增曝光
    const currentPages = new Set(current.map((p) => p.page));
    const appeared = previous
      .filter((p) => !currentPages.has(p.page))
      .map((p) => ({ page: p.page, prevImpressions: p.impressions }));

    // 上一期有、本期掉到 0（且确实仍在 DB 里被查过）⇒ 掉零
    const prevOnly = previous.filter((p) => !currentPages.has(p.page));

    const gained = pages
      .filter((p) => p.deltaImpressions !== null && p.deltaImpressions > 0)
      .sort((a, b) => (b.deltaImpressions ?? 0) - (a.deltaImpressions ?? 0))
      .slice(0, 20);
    const lost = pages
      .filter((p) => p.deltaImpressions !== null && p.deltaImpressions < 0)
      .sort((a, b) => (a.deltaImpressions ?? 0) - (b.deltaImpressions ?? 0))
      .slice(0, 20);

    const totalPages = await prisma.pageMetric.count({
      where: { weekStart: latest.weekStart, ...(site ? { siteId: site.id } : {}) },
    });

    return NextResponse.json({
      ok: true,
      site: site ? { slug: site.slug, name: site.name, host: site.host } : null,
      latestWeek: latest.weekStart.toISOString().slice(0, 10),
      prevWeek: prevWeek.toISOString().slice(0, 10),
      totalPages,
      pages,
      movers: {
        appeared: appeared.slice(0, 20),
        dropped: prevOnly.slice(0, 20),
        gained,
        lost,
      },
    });
  } catch (error: any) {
    console.error("[Analytics Pages] Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || String(error), pages: null },
      { status: 500 }
    );
  }
}
