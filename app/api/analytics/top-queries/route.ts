/**
 * GET /api/analytics/top-queries?limit=50&sort=impressions&type=tools&days=28
 * 返回 Top N 搜索词，支持排序和类型过滤。
 *
 * 🔴 `days` 语义（2026-10-10 加，此前是幻觉参数）
 * ------------------------------------------------------------------
 * 本端点此前**完全忽略 `days`**：`since` 被硬设为「本周周一 00:00」，
 * 于是 `?days=28` 拿回来的其实只有**本周**快照，而调用方（growth-review）
 * 把它当 28 天口径用 ⇒ 台账里所有「N 天」结论长期失真。
 *
 * GSC 拉取是**周级**的（`pull-gsc-data` 把 `snapshotAt` 对齐到本周周一），
 * 所以 N 天窗口 = 最近 ceil(N/7) 个周快照的聚合。
 *
 * 现在：
 *   · 不传 `days` ⇒ **行为与从前完全一致**（单快照、含国家分群行），
 *     `/admin/seo-monitor` 依赖这个行为，不破坏。
 *   · 传 `days>=7` ⇒ 走多快照聚合并**只取 country="global" 行**。
 *     原因：同一周的 `global` 行与各国分群行是同一份流量的两种切分，
 *     求和会翻倍。单快照模式不做这个过滤，是为了保持既有返回结构不变。
 *
 * 响应里新增 `days` / `aggregated` / `snapshots` / `windowDays` 四个自描述字段，
 * 让调用方能判断自己拿到的是什么口径，而不是靠猜。
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();

const MAX_DAYS = 90;

/** 返回本周一 00:00 UTC（与 pull-gsc-data 的 snapshotAt 对齐口径必须一致）。 */
function thisMondayUtc(now = new Date()): Date {
  const d = new Date(now);
  const wd = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (wd === 0 ? 6 : wd - 1));
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // 上限从 200 提到 1000：单周快照实测可达 600+ 行，旧的 `limit<=200`
    // 会让回读脚本的段位表变成「下界」而不自知（2026-10-10 修复）。
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 1000);
    const sort = searchParams.get("sort") || "impressions"; // impressions | clicks | ctr | position
    const type = searchParams.get("type") || "all"; // all | tools | directory | blog
    const daysRaw = searchParams.get("days");
    const days = daysRaw === null ? null : Math.min(Math.max(parseInt(daysRaw), 0) || 0, MAX_DAYS);

    const thisMonday = thisMondayUtc();

    // ── 单快照模式（向后兼容，admin 页依赖）────────────────────────
    if (days === null) {
      const queries = await prisma.searchQuery.findMany({
        where: { snapshotAt: thisMonday },
        orderBy:
          sort === "position"
            ? { position: "asc" }
            : sort === "ctr"
              ? { ctr: "desc" }
              : sort === "clicks"
                ? { clicks: "desc" }
                : { impressions: "desc" },
        take: limit * 3,
      });

      const filtered = type === "all" ? queries : queries.filter((q) => classifyQueryType(q.query) === type);

      const result = filtered.slice(0, limit).map((q) => ({
        query: q.query,
        impressions: q.impressions,
        clicks: q.clicks,
        ctr: Math.round(q.ctr * 10000) / 100,
        position: Math.round(q.position * 10) / 10,
        type: classifyQueryType(q.query),
      }));

      return NextResponse.json({
        queries: result,
        total: filtered.length,
        sort,
        type,
        snapshotAt: thisMonday.toISOString(),
        // 自描述：让调用方知道这是单周口径
        days: null,
        aggregated: false,
        snapshots: [thisMonday.toISOString()],
        windowDays: 7,
      });
    }

    // ── 多快照聚合模式 ────────────────────────────────────────────
    if (days < 7) {
      return NextResponse.json(
        { error: `days 至少为 7（GSC 为周级快照），收到 ${days}` },
        { status: 400 }
      );
    }

    const windowStart = new Date(thisMonday);
    windowStart.setUTCDate(windowStart.getUTCDate() - (days - 7)); // 含本周，往回 days-7 天

    const rows = await prisma.searchQuery.findMany({
      where: {
        snapshotAt: { gte: windowStart, lte: thisMonday },
        country: "global", // 只取全局行，避免与国家分群行重复计数
      },
      select: { query: true, impressions: true, clicks: true, ctr: true, position: true, snapshotAt: true },
      take: 20000,
    });

    const snapshots = [...new Set(rows.map((r) => r.snapshotAt.getTime()))].sort((a, b) => a - b);
    const snapshotCount = snapshots.length;

    if (snapshotCount === 0) {
      return NextResponse.json({
        queries: [],
        total: 0,
        sort,
        type,
        snapshotAt: thisMonday.toISOString(),
        days,
        aggregated: true,
        snapshots: [],
        windowDays: days,
        note: `最近 ${days} 天内没有 GSC 快照（拉取管道可能未运行）——这是「无数据」，不是「无需求」`,
      });
    }

    // 按 query 聚合：曝光/点击求和，排名与 CTR 按曝光加权平均
    const agg = new Map<string, { impressions: number; clicks: number; posNum: number; ctrNum: number; weeks: number }>();
    for (const r of rows) {
      const cur = agg.get(r.query) ?? { impressions: 0, clicks: 0, posNum: 0, ctrNum: 0, weeks: 0 };
      cur.impressions += r.impressions;
      cur.clicks += r.clicks;
      cur.posNum += r.position * r.impressions;
      cur.ctrNum += r.ctr * r.impressions;
      cur.weeks += 1;
      agg.set(r.query, cur);
    }

    let merged = [...agg.entries()].map(([query, a]) => ({
      query,
      impressions: a.impressions,
      clicks: a.clicks,
      ctr: a.impressions > 0 ? Math.round((a.ctrNum / a.impressions) * 10000) / 100 : 0,
      position: a.impressions > 0 ? Math.round((a.posNum / a.impressions) * 10) / 10 : 999,
      weeks: a.weeks,
      type: classifyQueryType(query),
    }));

    if (type !== "all") merged = merged.filter((m) => m.type === type);

    merged.sort((a, b) =>
      sort === "position"
        ? a.position - b.position
        : sort === "ctr"
          ? b.ctr - a.ctr
          : sort === "clicks"
            ? b.clicks - a.clicks
            : b.impressions - a.impressions
    );

    const total = merged.length;
    const result = merged.slice(0, limit);

    return NextResponse.json({
      queries: result,
      total,
      sort,
      type,
      snapshotAt: thisMonday.toISOString(),
      days,
      aggregated: true,
      snapshots: snapshots.map((t) => new Date(t).toISOString()),
      windowDays: days,
      note: snapshotCount < Math.ceil(days / 7)
        ? `窗口 ${days} 天，但只存在 ${snapshotCount} 个周快照（应有 ${Math.ceil(days / 7)} 个）——拉取管道可能断过`
        : undefined,
    });
  } catch (error: any) {
    console.error("[Analytics TopQueries] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
