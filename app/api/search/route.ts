import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// 数据源列表
const SOURCES = ["fmhy", "free-for-dev", "public-apis", "awesome-selfhosted"];

// 搜索函数（简化版，直接在 API 中执行）
function searchResources(resources: any[], query: string, limit = 200) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored: any[] = [];

  for (const r of resources) {
    const name = (r.name || "").toLowerCase();
    const desc = (r.description || "").toLowerCase();
    const url = (r.url || "").toLowerCase();
    const text = `${name} ${desc} ${url}`;

    if (!text.includes(q)) continue;

    let score = 0;
    let matchReason = "";

    // 名称精确匹配
    if (name === q) {
      score += 50;
      matchReason = "Exact name match";
    }
    // 名称包含查询词
    else if (name.includes(q)) {
      score += 30;
      matchReason = "Name contains query";
    }
    // 描述匹配
    if (desc.includes(q)) {
      score += 15;
      matchReason = matchReason ? `${matchReason} + Description match` : "Description match";
    }

    scored.push({ ...r, _score: score, _matchReason: matchReason });
  }

  // 按分数排序
  scored.sort((a, b) => b._score - a._score);

  // 去重（同名资源保留得分最高的）
  const seen = new Map<string, any>();
  for (const r of scored) {
    const key = r.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || r._score > existing._score) {
      seen.set(key, r);
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const sourceFilter = searchParams.get("source") || null;
  const limit = parseInt(searchParams.get("limit") || "200");

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const allResources: any[] = [];

    // 加载所有数据源
    for (const src of SOURCES) {
      try {
        const filePath = join(process.cwd(), "public", "data", `${src}-resources-simple.json`);
        if (!existsSync(filePath)) continue;

        const fileContent = readFileSync(filePath, "utf8");
        const data = JSON.parse(fileContent);

        let resources: any[] = [];
        if (src === "fmhy" && data.categories) {
          for (const [catId, catData] of Object.entries(data.categories) as [string, any][]) {
            for (const r of (catData.resources || [])) {
              allResources.push({ ...r, source: src });
            }
          }
        } else if (data.resources) {
          for (const r of data.resources) {
            allResources.push({ ...r, source: src });
          }
        }
      } catch (e) {
        console.error(`Failed to load ${src}:`, e);
      }
    }

    // 执行搜索
    let results = searchResources(allResources, q, limit);

    // 数据源过滤
    if (sourceFilter) {
      results = results.filter(r => r.source === sourceFilter);
    }

    return NextResponse.json({
      results,
      total: results.length,
      query: q,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
