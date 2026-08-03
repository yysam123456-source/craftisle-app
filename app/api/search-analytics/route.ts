/**
 * 站内搜索分析 API（增强版 v2.0）
 * 
 * GET  /api/search-analytics              — Top 20 搜索词（保留向后兼容）
 * GET  /api/search-analytics?mode=trends   — 近 30 天搜索趋势
 * GET  /api/search-analytics?mode=gaps     — 内容缺口分析
 * POST /api/search-analytics              — 记录搜索事件
 */

import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const ANALYTICS_FILE = join(process.cwd(), "data", "search-analytics.jsonl");

interface SearchRecord {
  query: string;
  resultCount: number;
  timestamp: string;
}

function loadRecords(): SearchRecord[] {
  if (!existsSync(ANALYTICS_FILE)) return [];
  const content = readFileSync(ANALYTICS_FILE, "utf8");
  return content.trim().split("\n").filter(Boolean).map(line => JSON.parse(line));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "top";
    const days = parseInt(searchParams.get("days") || "30");

    const records = loadRecords();

    // 模式 1：热门搜索词（默认）
    if (mode === "top") {
      const queryCounts: Record<string, number> = {};
      for (const s of records) {
        const q = s.query?.toLowerCase().trim();
        if (q) queryCounts[q] = (queryCounts[q] || 0) + 1;
      }

      const topQueries = Object.entries(queryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([query, count]) => ({ query, count }));

      return NextResponse.json({
        totalSearches: records.length,
        topQueries,
      });
    }

    // 模式 2：搜索趋势（按天聚合近 N 天）
    if (mode === "trends") {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // 过滤近 N 天的记录
      const recent = records.filter(r => new Date(r.timestamp) >= since);

      // 按天和关键词聚合
      const dailyTotals: Record<string, number> = {};
      const dailyQueries: Record<string, Record<string, number>> = {};

      for (const r of recent) {
        const day = r.timestamp.split("T")[0];
        dailyTotals[day] = (dailyTotals[day] || 0) + 1;

        if (!dailyQueries[day]) dailyQueries[day] = {};
        const q = r.query.toLowerCase().trim();
        dailyQueries[day][q] = (dailyQueries[day][q] || 0) + 1;
      }

      // 返回时间线数据
      const timeline = Object.entries(dailyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }));

      // 提取趋势上升的搜索词
      const midPoint = Math.floor(timeline.length / 2);
      const firstHalf = timeline.slice(0, midPoint);
      const secondHalf = timeline.slice(midPoint);

      const avgFirst = firstHalf.reduce((s, d) => s + d.count, 0) / (firstHalf.length || 1);
      const avgSecond = secondHalf.reduce((s, d) => s + d.count, 0) / (secondHalf.length || 1);

      return NextResponse.json({
        timeline,
        trend: {
          direction: avgSecond > avgFirst ? "rising" : avgSecond < avgFirst ? "declining" : "stable",
          firstHalfAvg: Math.round(avgFirst),
          secondHalfAvg: Math.round(avgSecond),
          changePct: avgFirst > 0 ? Math.round(((avgSecond - avgFirst) / avgFirst) * 100) : 0,
        },
        totalRecent: recent.length,
        period: `${days} days`,
      });
    }

    // 模式 3：内容缺口分析
    if (mode === "gaps") {
      const queryCounts: Record<string, number> = {};
      const zeroResultQueries: Record<string, number> = {};

      for (const s of records) {
        const q = s.query?.toLowerCase().trim();
        if (!q) continue;
        queryCounts[q] = (queryCounts[q] || 0) + 1;
        if (s.resultCount === 0) {
          zeroResultQueries[q] = (zeroResultQueries[q] || 0) + 1;
        }
      }

      // 排序：搜索结果少但搜索次数多的词 = 内容缺口
      const gaps = Object.entries(queryCounts)
        .filter(([q]) => zeroResultQueries[q] && zeroResultQueries[q] >= 2)
        .map(([query, totalCount]) => ({
          query,
          totalSearches: totalCount,
          zeroResultCount: zeroResultQueries[query] || 0,
          gapScore: Math.round((zeroResultQueries[query] || 0) / totalCount * 100) / 100,
        }))
        .sort((a, b) => b.gapScore - a.gapScore)
        .slice(0, 20);

      return NextResponse.json({
        gaps,
        totalSearches: records.length,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error) {
    console.error("[Search Analytics] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, resultCount, timestamp } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const record = {
      query: query.trim(),
      resultCount: resultCount || 0,
      timestamp: timestamp || new Date().toISOString(),
    };

    appendFileSync(ANALYTICS_FILE, JSON.stringify(record) + "\n", "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Search Analytics] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
