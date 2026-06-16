/**
 * 搜索工具库 — 相关性评分 + 模糊匹配
 * 
 * 评分算法（满分 100）：
 *   - 名称精确匹配：+50
 *   - 名称包含查询词：+30
 *   - 描述包含查询词：+15
 *   - URL 包含查询词：+10
 *   - 有 GitHub Stars：+5 (对数缩放)
 *   - 有丰富描述：+5
 *   - 数据源奖励（FMHY 覆盖最广）：+3
 */

// LRU Cache for search results (max 100 entries)
const searchCache = new Map<string, ScoredResource[]>();
const MAX_CACHE_SIZE = 100;

function getCacheKey(
  query: string,
  sourceFilter?: string | null,
  categoryFilter?: string | null
): string {
  return `${query}|${sourceFilter || ""}|${categoryFilter || ""}`;
}

export function clearSearchCache() {
  searchCache.clear();
}

export interface SearchableResource {
  id: string;
  name: string;
  description?: string;
  url: string;
  category?: string;
  categoryName?: string;
  source?: string;
  githubStars?: number;
}

export interface ScoredResource {
  id: string;
  name: string;
  description?: string;
  url: string;
  category?: string;
  categoryName?: string;
  source?: string;
  githubStars?: number;
  _score: number;
  _matchReason: string;
  [key: string]: unknown;
}

/**
 * 计算单条资源的相关性得分
 */
export function scoreResource(
  resource: SearchableResource,
  query: string
): { score: number; matchReason: string } {
  const q = query.toLowerCase().trim();
  if (!q) return { score: 0, matchReason: "" };

  const name = (resource.name || "").toLowerCase();
  const desc = (resource.description || "").toLowerCase();
  const url = (resource.url || "").toLowerCase();
  const catName = (resource.categoryName || "").toLowerCase();

  let score = 0;
  const reasons: string[] = [];

  // 1. 名称精确匹配（最高优先级）
  if (name === q) {
    score += 50;
    reasons.push("Exact name match");
  }
  // 2. 名称开头匹配
  else if (name.startsWith(q)) {
    score += 40;
    reasons.push("Name starts with query");
  }
  // 3. 名称包含查询词
  else if (name.includes(q)) {
    score += 30;
    reasons.push("Name contains query");
  }

  // 4. 按空格分割的多关键词匹配（名称）
  const queryWords = q.split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length > 1) {
    const nameMatches = queryWords.filter(w => name.includes(w));
    if (nameMatches.length === queryWords.length) {
      score += 25;
      reasons.push("All query words in name");
    } else if (nameMatches.length > 0) {
      score += nameMatches.length * 8;
    }
  }

  // 5. 分类名匹配
  if (catName && catName.includes(q)) {
    score += 20;
    reasons.push("Category match");
  }

  // 6. 描述匹配
  if (desc) {
    if (desc.includes(q)) {
      score += 15;
      reasons.push("Description match");
    }
    // 多关键词在描述中
    if (queryWords.length > 1) {
      const descMatches = queryWords.filter(w => desc.includes(w));
      if (descMatches.length > 0) {
        score += descMatches.length * 5;
      }
    }
  }

  // 7. URL 匹配
  if (url.includes(q)) {
    score += 10;
    reasons.push("URL match");
  }

  // 8. GitHub Stars 奖励（对数缩放，避免极端值主导）
  if (resource.githubStars && resource.githubStars > 0) {
    const starBonus = Math.min(8, Math.floor(Math.log10(resource.githubStars) * 2));
    score += starBonus;
    if (starBonus > 0) reasons.push(`${formatStars(resource.githubStars)} stars`);
  }

  // 9. 有描述文本的奖励
  if (desc && desc.length > 50) {
    score += 5;
  }

  // 10. 数据源奖励
  if (resource.source === "fmhy") score += 3;
  if (resource.source === "free-for-dev") score += 2;

  return { score, matchReason: reasons.join(", ") };
}

/**
 * 对资源列表执行全文搜索并评分排序
 */
export function searchResources(
  resources: SearchableResource[],
  query: string,
  options: {
    limit?: number;
    sourceFilter?: string | null;
    categoryFilter?: string | null;
  } = {}
): ScoredResource[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const { limit = 200, sourceFilter, categoryFilter } = options;

  // 检查缓存
  const cacheKey = getCacheKey(q, sourceFilter, categoryFilter);
  const cached = searchCache.get(cacheKey);
  if (cached) {
    return cached.slice(0, limit);
  }

  // 第一步：过滤
  let filtered = resources.filter(r => {
    const text = `${r.name} ${r.url} ${r.description || ""} ${r.categoryName || ""}`.toLowerCase();
    return text.includes(q);
  });

  // 数据源过滤
  if (sourceFilter) {
    filtered = filtered.filter(r => r.source === sourceFilter);
  }
  // 分类过滤
  if (categoryFilter) {
    filtered = filtered.filter(r => r.category === categoryFilter || r.categoryName === categoryFilter);
  }

  // 第二步：评分排序
  const scored: ScoredResource[] = filtered.map(r => {
    const { score, matchReason } = scoreResource(r, query);
    return { ...r, _score: score, _matchReason: matchReason };
  });

  scored.sort((a, b) => b._score - a._score);

  // 第三步：去重（同名资源保留得分最高的）
  const seen = new Map<string, ScoredResource>();
  for (const r of scored) {
    const key = r.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || r._score > existing._score) {
      seen.set(key, r);
    }
  }

  const results = Array.from(seen.values())
    .sort((a, b) => b._score - a._score);

  // 存入缓存
  searchCache.set(cacheKey, results);
  if (searchCache.size > MAX_CACHE_SIZE) {
    // 删除最旧的条目（LRU）
    const firstKey = searchCache.keys().next().value;
    searchCache.delete(firstKey);
  }

  return results.slice(0, limit);
}

/**
 * 生成搜索建议（基于查询前缀匹配）
 */
export function getSearchSuggestions(
  query: string,
  allResources: SearchableResource[],
  limit = 6
): string[] {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase();
  const suggestions = new Set<string>();

  // 从资源名称中提取建议
  for (const r of allResources) {
    const name = r.name.toLowerCase();
    if (name.startsWith(q) && name !== q) {
      suggestions.add(r.name);
    }
    // 也匹配名称中的单词
    const words = name.split(/[\s\-_.,]+/);
    for (const w of words) {
      if (w.startsWith(q) && w.length > q.length) {
        suggestions.add(r.name);
        break;
      }
    }
    if (suggestions.size >= limit * 2) break;
  }

  return Array.from(suggestions).slice(0, limit);
}

/**
 * 格式化 GitHub Stars 数字
 */
export function formatStars(stars: number): string {
  if (stars >= 1_000_000) return `${(stars / 1_000_000).toFixed(1)}M`;
  if (stars >= 1_000) return `${(stars / 1_000).toFixed(1)}k`;
  return stars.toString();
}

/**
 * 高亮文本中的匹配部分（返回 React 安全的 HTML 字符串）
 * 用于服务器端或需要 HTML 的场景
 */
export function highlightTextSimple(text: string, query: string): string {
  if (!query || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}
