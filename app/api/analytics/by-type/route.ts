/**
 * GET /api/analytics/by-type
 * 按页面类型（tools vs directory vs blog）分组统计搜索表现
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();

interface TypeStats {
  impressions: number;
  clicks: number;
  ctr: number;
  avgPosition: number;
  queryCount: number;
}

export async function GET() {
  try {
    const weekStart = new Date();
    const weekday = weekStart.getUTCDay();
    weekStart.setUTCDate(weekStart.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);

    const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [thisWeek, lastWeek] = await Promise.all([
      prisma.searchQuery.findMany({ where: { snapshotAt: weekStart } }),
      prisma.searchQuery.findMany({ where: { snapshotAt: lastWeekStart } }),
    ]);

    const buildStats = (queries: typeof thisWeek): Record<string, TypeStats> => {
      const stats: Record<string, TypeStats> = {
        tools: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0, queryCount: 0 },
        directory: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0, queryCount: 0 },
        blog: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0, queryCount: 0 },
        other: { impressions: 0, clicks: 0, ctr: 0, avgPosition: 0, queryCount: 0 },
      };

      for (const q of queries) {
        const type = classifyQueryType(q.query);
        stats[type].impressions += q.impressions;
        stats[type].clicks += q.clicks;
        stats[type].avgPosition += q.position;
        stats[type].queryCount++;
      }

      // 计算平均
      for (const key of Object.keys(stats)) {
        const s = stats[key];
        if (s.queryCount > 0) {
          s.avgPosition = Math.round((s.avgPosition / s.queryCount) * 10) / 10;
          s.ctr = s.impressions > 0
            ? Math.round((s.clicks / s.impressions) * 1000) / 10
            : 0;
        }
      }

      return stats;
    };

    const tw = buildStats(thisWeek);
    const lw = buildStats(lastWeek);

    // 计算周环比
    const result: Record<string, any> = {};
    for (const type of Object.keys(tw)) {
      const current = tw[type];
      const previous = lw[type];
      const changePct = (cur: number, prev: number) =>
        prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

      result[type] = {
        ...current,
        changes: {
          impressionsPct: changePct(current.impressions, previous.impressions),
          clicksPct: changePct(current.clicks, previous.clicks),
          positionChange: previous.avgPosition > 0
            ? Math.round((current.avgPosition - previous.avgPosition) * 10) / 10
            : 0,
        },
      };
    }

    return NextResponse.json({
      byType: result,
      weekStart: weekStart.toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics ByType] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
