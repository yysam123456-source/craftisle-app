import { NextRequest, NextResponse } from "next/server";
import { appendFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";

const ANALYTICS_FILE = join(process.cwd(), "data", "search-analytics.jsonl");

export async function GET(request: NextRequest) {
  try {
    if (!existsSync(ANALYTICS_FILE)) {
      return NextResponse.json({ searches: [], topQueries: [] });
    }

    const content = readFileSync(ANALYTICS_FILE, "utf8");
    const lines = content.trim().split("\n").filter(Boolean);
    const searches = lines.map(line => JSON.parse(line));

    // 统计热门搜索词
    const queryCounts: Record<string, number> = {};
    for (const s of searches) {
      const q = s.query?.toLowerCase().trim();
      if (q) {
        queryCounts[q] = (queryCounts[q] || 0) + 1;
      }
    }

    const topQueries = Object.entries(queryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    return NextResponse.json({ searches, topQueries });
  } catch (error) {
    console.error("Analytics API error:", error);
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

    // 追加到 JSONL 文件
    appendFileSync(ANALYTICS_FILE, JSON.stringify(record) + "\n", "utf8");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
