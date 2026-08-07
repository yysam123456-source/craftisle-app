/**
 * GET /api/analytics/opportunities
 * AI 辅助发现 SEO 机会词：高展示低竞争、非品牌新词、内容缺口
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { classifyQueryType } from "@/lib/seo/gsc-client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const weekStart = new Date();
    const weekday = weekStart.getUTCDay();
    weekStart.setUTCDate(weekStart.getUTCDate() - (weekday === 0 ? 6 : weekday - 1));
    weekStart.setUTCHours(0, 0, 0, 0);

    const queries = await prisma.searchQuery.findMany({
      where: { snapshotAt: weekStart },
      orderBy: { impressions: "desc" },
      take: 300,
    });

    if (queries.length === 0) {
      return NextResponse.json({ opportunities: [], message: "No GSC data available yet." });
    }

    const opportunities: Array<{
      query: string;
      reason: string;
      currentPosition: number;
      impressions: number;
      clicks: number;
      ctr: number;
      type: string;
      priority: "high" | "medium" | "low";
      suggestion: string;
    }> = [];

    // 机会 1：高展示量但排名在 5-20 位的词（有提升空间）
    for (const q of queries) {
      if (q.position >= 5 && q.position <= 20 && q.impressions > 100) {
        opportunities.push({
          query: q.query,
          reason: "排名 5-20，有提升到 Top 3 的潜力",
          currentPosition: Math.round(q.position * 10) / 10,
          impressions: q.impressions,
          clicks: q.clicks,
          ctr: Math.round(q.ctr * 1000) / 10,
          type: classifyQueryType(q.query),
          priority: q.position <= 10 ? "high" : "medium",
          suggestion: q.position <= 10
            ? "优化页面标题和 meta description，增加内链指向此页面"
            : "考虑为此词创建专门的落地页或博客内容",
        });
      }
    }

    // 机会 2：非品牌词中 CTR > 5% 但点击量低（好 CTR，潜在优质内容）
    for (const q of queries) {
      const nonBrand = !q.query.toLowerCase().includes("craftisle");
      if (nonBrand && q.ctr > 0.05 && q.position > 3 && q.clicks < 50) {
        const exists = opportunities.find(o => o.query === q.query);
        if (!exists) {
          opportunities.push({
            query: q.query,
            reason: "CTR > 5%（用户感兴趣），排名可进一步提升",
            currentPosition: Math.round(q.position * 10) / 10,
            impressions: q.impressions,
            clicks: q.clicks,
            ctr: Math.round(q.ctr * 1000) / 10,
            type: classifyQueryType(q.query),
            priority: "medium",
            suggestion: "为此词优化落地页内容，提高排名以放大流量",
          });
        }
      }
    }

    // 去重 + 按优先级排序
    const unique = opportunities
      .filter((o, i, arr) => arr.findIndex(x => x.query === o.query) === i)
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      })
      .slice(0, 30);

    return NextResponse.json({
      opportunities: unique,
      total: unique.length,
      snapshotAt: weekStart.toISOString(),
    });
  } catch (error: any) {
    console.error("[Analytics Opportunities] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
