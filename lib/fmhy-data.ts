/**
 * unified-data.ts
 * 统一的多源资源数据访问层
 * 支持 FMHY + free-for.dev + public-apis + awesome-selfhosted
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── Types ──────────────────────────────────────────

export interface Resource {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  source: string;
  /** FMHY 特有 */
  categoryName?: string;
  categoryIcon?: string;
  dateAdded?: string;
  popularity?: number;
  githubUrl?: string;
  /** free-for-dev 特有 */
  freeTier?: string;
  /** public-apis 特有 */
  auth?: string;
  https?: boolean;
  cors?: boolean;
  /** awesome-selfhosted 特有 */
  isOpenSource?: boolean;
  license?: string;
  language?: string;
  /** GitHub enrichment（P0-2b 脚本补充） */
  githubStars?: number;
  githubLastUpdated?: string;
  githubLicense?: string;
  isSelfHosted?: boolean;
  techStack?: string[];
  /** 通用 */
  tags?: string[];
  isFree?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
  slug?: string;
  source?: string;
}

export interface SourceMeta {
  id: string;
  name: string;
  type: string;
  icon: string;
  resourceCount: number;
  categoryCount: number;
}

// ── Source definitions ─────────────────────────────

const SOURCE_FILES: Record<string, { file: string; name: string; icon: string }> = {
  fmhy: { file: "fmhy-resources.json", name: "FMHY", icon: "📚" },
  "free-for-dev": { file: "free-for-dev-resources.json", name: "Free for Dev", icon: "🛠️" },
  "public-apis": { file: "public-apis-resources.json", name: "Public APIs", icon: "🔌" },
  "awesome-selfhosted": { file: "awesome-selfhosted-resources.json", name: "Self-Hosted", icon: "🏠" },
};

// ── Cache ──────────────────────────────────────────

let _cachedAll: Resource[] | null = null;
let _cachedBySource: Record<string, Resource[]> = {};
let _cachedCategories: Category[] | null = null;

// ── Internal loaders ───────────────────────────────

function loadFmhyResources(): Resource[] {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-resources.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const all: Resource[] = [];
    for (const catData of Object.values(data.categories || {}) as any[]) {
      for (const r of (catData as any).resources || []) {
        if (r.id && r.name && r.url) {
          all.push({
            ...r,
            source: "fmhy",
            category: r.category || "uncategorized",
          });
        }
      }
    }
    return all;
  } catch {
    return [];
  }
}

function loadSourceResources(source: string): Resource[] {
  if (source === "fmhy") return loadFmhyResources();
  if (_cachedBySource[source]) return _cachedBySource[source];

  try {
    const filePath = join(process.cwd(), "public", "data", `${source}-resources.json`);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    // Dedup by id
    const seen = new Set<string>();
    const resources: Resource[] = [];
    for (const r of (data.resources || [])) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        resources.push({ ...r, source });
      }
    }
    _cachedBySource[source] = resources;
    return resources;
  } catch {
    return [];
  }
}

function loadFmhyCategories(): Category[] {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-index.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.categories || []).map((c: any) => ({
      ...c,
      source: "fmhy",
    }));
  } catch {
    return [];
  }
}

function loadSourceCategories(source: string): Category[] {
  if (source === "fmhy") return loadFmhyCategories();
  try {
    const filePath = join(process.cwd(), "public", "data", `${source}-resources.json`);
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const categories: Category[] = (data.categories || []).map((c: any) => ({
      ...c,
      source,
      slug: c.slug || c.id,
    }));

    // Compute count from actual resources (non-FMHY JSONs don't have count field)
    const resources = loadSourceResources(source);
    const countMap = new Map<string, number>();
    for (const r of resources) {
      countMap.set(r.category, (countMap.get(r.category) || 0) + 1);
    }
    for (const cat of categories) {
      cat.count = countMap.get(cat.id) || 0;
    }

    return categories;
  } catch {
    return [];
  }
}

// ── Public API ─────────────────────────────────────

/** 获取所有来源的元信息 */
export function getSources(): SourceMeta[] {
  try {
    const filePath = join(process.cwd(), "public", "data", "all-sources-index.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data.sources || [];
  } catch {
    // Fallback
    return [
      { id: "fmhy", name: "FMHY", type: "directory", icon: "📚", resourceCount: 6187, categoryCount: 14 },
      { id: "free-for-dev", name: "Free for Dev", type: "dev-tools", icon: "🛠️", resourceCount: 0, categoryCount: 0 },
      { id: "public-apis", name: "Public APIs", type: "apis", icon: "🔌", resourceCount: 0, categoryCount: 0 },
      { id: "awesome-selfhosted", name: "Self-Hosted", type: "selfhosted", icon: "🏠", resourceCount: 0, categoryCount: 0 },
    ];
  }
}

/** 获取所有资源（可指定来源） */
export function getAllResources(source?: string): Resource[] {
  if (source) {
    return loadSourceResources(source);
  }
  if (_cachedAll) return _cachedAll;

  const all: Resource[] = [];
  for (const src of Object.keys(SOURCE_FILES)) {
    all.push(...loadSourceResources(src));
  }
  _cachedAll = all;
  return all;
}

/** 根据 id 获取单个资源（跨源搜索） */
export function getResourceById(id: string): Resource | null {
  // 先从所有缓存中查找
  const all = getAllResources();
  return all.find((r) => r.id === id) || null;
}

/** 获取某分类下的资源 */
export function getResourcesByCategory(categoryId: string): Resource[] {
  // 判断来源：ffd-/pa-/sh- 前缀，fmhy 没有前缀
  if (categoryId.startsWith("ffd-")) {
    return loadSourceResources("free-for-dev").filter((r) => r.category === categoryId);
  }
  if (categoryId.startsWith("pa-")) {
    return loadSourceResources("public-apis").filter((r) => r.category === categoryId);
  }
  if (categoryId.startsWith("sh-")) {
    return loadSourceResources("awesome-selfhosted").filter((r) => r.category === categoryId);
  }
  // FMHY: 从原始数据结构中获取
  return loadSourceResources("fmhy").filter((r) => r.category === categoryId);
}

/** 获取所有分类（可指定来源） */
export function getAllCategories(source?: string): Category[] {
  if (source) return loadSourceCategories(source);
  if (_cachedCategories) return _cachedCategories;

  const all: Category[] = [];
  for (const s of Object.keys(SOURCE_FILES)) {
    all.push(...loadSourceCategories(s));
  }
  _cachedCategories = all;
  return all;
}

/** 获取热门资源（目前仅 FMHY 有热度数据） */
export function getHotResources(limit = 8): Resource[] {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-hot.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const resources: Resource[] = (data?.resources || []).map((r: any) => ({
      ...r,
      id: r.id || r.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      source: "fmhy",
    }));
    return resources.slice(0, limit);
  } catch {
    return [];
  }
}

/** 获取相同分类的相关资源（排除自身，跨源搜索） */
export function getRelatedResources(resource: Resource, limit = 6): Resource[] {
  const all = getResourcesByCategory(resource.category);
  return all.filter((r) => r.id !== resource.id).slice(0, limit);
}

/** 获取最新资源（按 dateAdded 排序） */
export function getNewResources(limit = 8, source?: string): Resource[] {
  const all = source ? loadSourceResources(source) : getAllResources();
  return [...all]
    .sort((a, b) => {
      if (a.dateAdded && b.dateAdded) {
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
      return 0;
    })
    .slice(0, limit);
}

/** 获取最受欢迎资源（按 popularity 排序） */
export function getPopularResources(limit = 8, source?: string): Resource[] {
  const all = source ? loadSourceResources(source) : getAllResources();
  return [...all]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit);
}

/** 获取来源信息 */
export function getSourceInfo(sourceId: string) {
  return SOURCE_FILES[sourceId] || null;
}

/** 统计总数据 */
export function getStats() {
  let total = 0;
  const bySource: Record<string, number> = {};
  for (const src of Object.keys(SOURCE_FILES)) {
    const count = loadSourceResources(src).length;
    bySource[src] = count;
    total += count;
  }
  return { total, bySource };
}
