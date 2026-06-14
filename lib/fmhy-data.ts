/**
 * unified-data.ts
 * 统一的多源资源数据访问层
 * 支持 FMHY + free-for.dev + public-apis + awesome-selfhosted
 */
import { readFileSync } from "fs";
import { join } from "path";

// ── Review lookup (lazy-loaded) ────────────────────

let _reviewLookup: Set<string> | null = null;

function getReviewLookup(): Set<string> {
  if (_reviewLookup) return _reviewLookup;
  _reviewLookup = new Set<string>();
  try {
    const manifestPath = join(process.cwd(), "public", "data", "reviews", "_manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    for (const entry of manifest.reviews || []) {
      if (entry.resourceId) _reviewLookup.add(entry.resourceId);
      if (entry.resourceName) _reviewLookup.add(entry.resourceName.toLowerCase());
    }
  } catch {
    // ignore — no reviews available
  }
  return _reviewLookup;
}

function hasReviewFor(resource: { id?: string; name?: string }): boolean {
  const lookup = getReviewLookup();
  // ✅ 只检查 resourceId（唯一标识），不检查 resourceName（可能不够唯一，比如很多资源都叫 "GitHub"）
  if (resource.id && lookup.has(resource.id)) return true;
  return false;
}

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
  /** 是否有 AI Review */
  hasReview?: boolean;
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
            hasReview: hasReviewFor(r),
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
        resources.push({ ...r, source, hasReview: hasReviewFor(r) });
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

/** 获取热门资源（按综合评分排序，自动更新） */
export function getHotResources(limit = 8): Resource[] {
  return getHotResourcesByScore(limit);
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

// ── Rich-info filter（供 generateStaticParams / sitemap / 页面组件复用）
// 注意：不缓存，每次调用重新计算（ISR 按需生成页面时需要读取最新数据）
// 【判断标准】预构建两类详情页：
//   1. 有 AI review 的资源（高质量内容）
//   2. 综合评分 TOP 100 的资源（热门资源，自动更新）
export function getRichInfoResourceIds(): Set<string> {
  const all = getAllResources();
  const set = new Set<string>();

  // 1. 有 AI Review 的资源（高质量内容）
  for (const r of all) {
    if (hasReviewFor(r)) { set.add(r.id); }
  }

  // 2. 综合评分 TOP 500 的资源（热门资源，自动更新）—— 从 TOP 100 扩展到 TOP 500
  const topByScore = [...all]
    .sort((a, b) => calculateResourceScore(b) - calculateResourceScore(a))
    .slice(0, 500)
    .map(r => r.id);
  for (const id of topByScore) {
    set.add(id);
  }

  // 3. GitHub Stars > 500 的资源（有一定知名度的开源工具）
  for (const r of all) {
    if (r.githubStars && r.githubStars > 500) {
      set.add(r.id);
    }
  }

  // 4. 有描述且描述长度 > 50 字符的资源（有一定信息量）
  for (const r of all) {
    if (r.description && r.description.length > 50) {
      set.add(r.id);
    }
  }

  // 5. 有标签的资源（有一定元数据）
  for (const r of all) {
    if (r.tags && r.tags.length > 0) {
      set.add(r.id);
    }
  }

  return set;
}

export function isRichInfoResource(id: string): boolean {
  return getRichInfoResourceIds().has(id);
}

// ── Resource scoring system（供 hot resources / rich info 判断复用）
/**
 * 综合评分系统（满分 ~100 分）
 * 维度：GitHub Stars(30) + AI Review(25) + 描述质量(15) + 数据丰富度(15) + 时效性(5) + 数据源特性(15)
 */
export function calculateResourceScore(resource: Resource): number {
  let score = 0;

  // 1. GitHub Stars（0-30 分）
  if (resource.githubStars && resource.githubStars > 0) {
    score += Math.min(Math.log10(resource.githubStars) * 10, 30);
  }

  // 2. 有 AI Review（0-25 分）
  if (hasReviewFor(resource)) {
    score += 25;
  }

  // 3. 描述质量（0-15 分）
  const descLen = (resource.description || "").length;
  if (descLen > 500) score += 15;
  else if (descLen > 200) score += 10;
  else if (descLen > 100) score += 5;

  // 4. 数据丰富度（0-15 分）
  let dataRichness = 0;
  if (resource.tags && resource.tags.length > 0) dataRichness += 5;
  if (resource.license) dataRichness += 5;
  if (resource.language) dataRichness += 3;
  if (resource.isOpenSource) dataRichness += 2;
  score += Math.min(dataRichness, 15);

  // 5. 时效性（0-5 分）
  if (resource.dateAdded) {
    try {
      const daysSinceAdded = (Date.now() - new Date(resource.dateAdded).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAdded < 30) score += 5;
      else if (daysSinceAdded < 90) score += 3;
      else if (daysSinceAdded < 180) score += 1;
    } catch {}
  }

  // 6. 数据源特性（0-15 分）
  let sourceRichness = 0;
  // public-apis: auth / https / cors
  if (resource.auth) sourceRichness += 5;
  if (resource.https !== undefined) sourceRichness += 3;
  if (resource.cors !== undefined) sourceRichness += 2;
  // free-for-dev: freeTier
  if (resource.freeTier && resource.freeTier.length > 20) sourceRichness += 5;
  score += Math.min(sourceRichness, 15);

  return Math.round(score);
}

/** 获取按综合评分排序的热门资源（默认取前 20 个，预构建详情页用） */
export function getHotResourcesByScore(limit = 20): Resource[] {
  const all = getAllResources();
  return [...all]
    .sort((a, b) => calculateResourceScore(b) - calculateResourceScore(a))
    .slice(0, limit);
}

/**
 * 根据资源数据自动生成"优势"列表（用于详情页"为什么选这个"板块）
 * 返回最多 3 个优势点
 */
export function generateAdvantages(resource: Resource): string[] {
  const advantages: string[] = [];

  // 1. GitHub Stars 高
  if (resource.githubStars && resource.githubStars > 10000) {
    advantages.push(`⭐ 高人气：GitHub ${resource.githubStars.toLocaleString()} stars`);
  } else if (resource.githubStars && resource.githubStars > 1000) {
    advantages.push(`⭐ 受欢迎：GitHub ${resource.githubStars.toLocaleString()} stars`);
  }

  // 2. 开源协议友好
  if (resource.githubLicense === "MIT" || resource.githubLicense === "Apache-2.0") {
    advantages.push(`📖 开源协议：${resource.githubLicense}，可自由使用`);
  } else if (resource.githubLicense) {
    advantages.push(`📖 License：${resource.githubLicense}`);
  }

  // 3. 开源 + 可自部署
  if (resource.isOpenSource) {
    advantages.push("🔓 开源：代码透明，可自部署");
  }

  // 4. 文档完善
  if (resource.description && resource.description.length > 200) {
    advantages.push("📚 文档完善：有详细的使用说明");
  }

  // 5. 有 AI Review
  if (hasReviewFor(resource)) {
    advantages.push("✅ 已评测：有详细的 AI 评测报告");
  }

  return advantages.slice(0, 3); // 最多 3 个
}

/**
 * 根据 tags 或 category，推荐相似资源（用于详情页"类似工具"板块）
 * 返回最多 5 个相似资源
 */
export function findSimilarResources(resource: Resource, limit = 5): Resource[] {
  const all = getAllResources();
  return all
    .filter(r => r.id !== resource.id)
    .filter(r => 
      r.category === resource.category || 
      (r.tags && resource.tags && r.tags.some(t => resource.tags?.includes(t)))
    )
    .sort((a, b) => calculateResourceScore(b) - calculateResourceScore(a))
    .slice(0, limit);
}

/**
 * 根据资源数据自动生成"使用技巧"列表（用于详情页"使用技巧"板块）
 * 返回最多 4 个实用技巧
 */
export function generateUsageTips(resource: Resource): string[] {
  const tips: string[] = [];

  // 1. 开源项目的小贴士
  if (resource.isOpenSource && resource.githubUrl) {
    tips.push(`💡 Star the GitHub repo (${resource.githubUrl}) to get updates and support the developer`);
    tips.push("🔧 Check the GitHub Issues tab for common problems and solutions");
  }

  // 2. 可自部署的小贴士
  if (resource.isSelfHosted) {
    tips.push("🏠 Self-host for full control: deploy with Docker using the official image");
    tips.push("📖 Read the self-hosting docs carefully — configuration can be tricky");
  }

  // 3. GitHub Stars 高的项目
  if (resource.githubStars && resource.githubStars > 1000) {
    tips.push(`🌟 This tool has ${resource.githubStars.toLocaleString()} GitHub stars — join the community for tutorials and support`);
  }

  // 4. 有 AI Review 的资源
  if (hasReviewFor(resource)) {
    tips.push("📝 Read our in-depth review below for pros, cons, and best use cases");
  }

  // 5. 根据数据源类型提供小贴士
  if (resource.source === "free-for-dev" && resource.freeTier) {
    tips.push("🎁 Free tier available — check the limits before heavy use");
    tips.push("⚠️ Monitor your usage to avoid unexpected charges");
  }

  if (resource.source === "public-apis") {
    tips.push("🔌 Test the API with Postman or curl before integrating");
    if (resource.auth === "No") {
      tips.push("✅ No auth required — great for quick prototyping");
    }
  }

  if (resource.source === "awesome-selfhosted") {
    tips.push("🐳 Check Docker Hub for official images — easiest way to deploy");
    tips.push("🔒 Keep self-hosted apps updated for security patches");
  }

  // 6. 通用小贴士
  if (resource.tags && resource.tags.includes("privacy")) {
    tips.push("🔒 Privacy-first tool — no data leaves your device / your server");
  }

  if (resource.tags && resource.tags.includes("ai")) {
    tips.push("🤖 AI-powered — results may vary, always verify important outputs");
  }

  // 7. 最后添加一个通用小贴士
  if (tips.length < 4) {
    tips.push("💬 Join the discussion below to share your experience and ask questions");
  }

  return tips.slice(0, 4); // 最多 4 个
}
