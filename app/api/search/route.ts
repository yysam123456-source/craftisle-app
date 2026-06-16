import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// 数据源列表
const SOURCES = ["fmhy", "free-for-dev", "public-apis", "awesome-selfhosted"];

/**
 * 分词匹配搜索 — 将查询拆分为单词，每个单词独立匹配
 * 解决 "freecodecamp coursera edx" 等多词查询返回 0 结果的问题
 */
function searchResources(resources: any[], query: string, limit = 200) {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // 将查询拆分为有意义的单词（过滤掉单字符和停用词）
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
    "into", "through", "during", "before", "after", "above", "below", "between",
    "and", "or", "but", "not", "no", "it", "its", "this", "that", "these", "those",
    "i", "you", "he", "she", "we", "they", "what", "which", "who", "how"]);
  const queryWords = q.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));

  if (queryWords.length === 0) return [];

  const scored: any[] = [];

  for (const r of resources) {
    const name = (r.name || "").toLowerCase();
    const desc = (r.description || "").toLowerCase();
    const url = (r.url || "").toLowerCase();
    const catName = (r.categoryName || r.category || "").toLowerCase();
    const text = `${name} ${desc} ${url} ${catName}`;

    // 整串精确匹配（最高优先级）
    const exactMatch = text.includes(q);

    // 分词匹配：计算有多少个查询单词命中
    let matchedWords = 0;
    let matchedWordNames: string[] = [];
    for (const w of queryWords) {
      if (name.includes(w)) { matchedWords += 3; matchedWordNames.push(`name:${w}`); }
      else if (desc.includes(w)) { matchedWords += 1.5; matchedWordNames.push(`desc:${w}`); }
      else if (url.includes(w)) { matchedWords += 1; matchedWordNames.push(`url:${w}`); }
      else if (catName.includes(w)) { matchedWords += 1; matchedWordNames.push(`cat:${w}`); }
    }

    // 必须至少命中一个单词（或整串匹配）
    if (!exactMatch && matchedWords === 0) continue;

    // 计算得分
    let score = 0;
    let matchReason = "";

    if (exactMatch) {
      score += 50;
      matchReason = "Exact match";
    }

    // 名称完全匹配某个查询词
    for (const w of queryWords) {
      if (name === w) { score += 40; matchReason += (matchReason ? " + " : "") + `Exact name "${w}"`; }
      else if (name.startsWith(w)) { score += 25; matchReason += (matchReason ? " + " : "") + `Name starts "${w}"`; }
      else if (name.includes(w)) { score += 15; matchReason += (matchReason ? " + " : "") + `Name contains "${w}"`; }
    }

    // 所有查询词都命中名称（高相关）
    const nameHitAll = queryWords.every(w => name.includes(w));
    if (nameHitAll && queryWords.length > 1) { score += 30; matchReason += (matchReason ? " + " : "") + "All words in name"; }

    // 描述匹配
    for (const w of queryWords) {
      if (desc.includes(w) && !name.includes(w)) { score += 5; }
    }

    score += Math.floor(matchedWords * 2);
    matchReason = matchReason || `${matchedWordNames.slice(0,3).join(", ")}${matchedWordNames.length > 3 ? "..." : ""}`;

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
