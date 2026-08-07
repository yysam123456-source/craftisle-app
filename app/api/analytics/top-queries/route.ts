/**
 * GET /api/analytics/top-queries?limit=50&sort=impressions&type=tools
 * 返回 Top N 搜索词，支持排序和类型过滤
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const sort = searchParams.get("sort") || "impressions"; // impressions | clicks | ctr | position
    const type = searchParams.get("type") || "all"; // all | tools | directory | blog

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekday2 = since.getUTCDay();
    since.setUTCDate(since.getUTCDate() - (weekday2 === 0 ? 6 : weekday2 - 1));
    since.setUTCHours(0, 0, 0, 0);

    const queries = await prisma.searchQuery.findMany({
      where: {
        snapshotAt: since,
      },
      orderBy: sort === "position"
        ? { position: "asc" }
        : sort === "ctr"
        ? { ctr: "desc" }
        : sort === "clicks"
        ? { clicks: "desc" }
        : { impressions: "desc" },
      take: limit * 3, // 多取一些用于类型过滤后的裁剪
    });

    // 按类型过滤
    const filtered = type === "all"
      ? queries
      : queries.filter(q => classifyQueryType(q.query) === type);

    const result = filtered.slice(0, limit).map(q => ({
      query: q.query,
      impressions: q.impressions,
      clicks: q.clicks,
      ctr: Math.round(q.ctr * 10000) / 100, // 百分比
      position: Math.round(q.position * 10) / 10,
      type: classifyQueryType(q.query),
    }));

    return NextResponse.json({
      queries: result,
      total: filtered.length,
      sort,
      type,
      snapshotAt: since.toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics TopQueries] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
