export const revalidate = 86400;
export const dynamicParams = true;

/**
 * /directory/best/[slug]
 * "Best X Tools 2026" - 程序化 SEO 页面
 *
 * 支持三类 slug：
 * 1. fmhy-index.json 中的分类（AI Tools, Education 等）
 * 2. alternatives 数据中的分类（Design, Productivity 等）
 * 3. home-blocks.json 中的 block ID（weekly-hottest, rising-stars 等）
 */
import { notFound } from "next/navigation";
import { getAllResources, getAllCategories, type Resource, type Category } from "@/lib/fmhy-data";
import { getEnhancedDescription } from "@/lib/tool-descriptions";
import { getCombinedMap, type AlternativeEntry } from "@/lib/alternatives";
import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

interface BestPageProps {
  params: Promise<{ slug: string }>;
}

// ── 分类展示名映射（更友好的名称）────────────────────────────
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  "AI": "AI & ML",
  "Video": "Video & Multimedia",
  "Design": "Design & Creativity",
  "Productivity": "Productivity & Office",
  "Communication": "Communication & Chat",
  "Development": "Development & DevOps",
  "Marketing": "Marketing & SEO",
  "Music": "Music & Audio",
  "Security": "Security & Privacy",
  "Business": "Business & CRM",
  "Cloud Storage": "Cloud Storage",
  "Data Analysis": "Data Analysis",
  "DevOps": "DevOps & Cloud",
  "E-Commerce": "E-Commerce",
  "Customer Support": "Customer Support",
  "CRM": "CRM & Sales",
};

// ── 展示名 → 原始分类名 映射表 ──────────────────────────
const DISPLAY_TO_ORIGINAL: Record<string, string> = {};

// ── slug 工具函数 ─────────────────────────
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── 获取 alternatives 数据中的"虚拟分类" ──────────────────────────
function getAlternativesCategories(): Category[] {
  const map = getCombinedMap();
  const seen = new Set<string>();
  const cats: Category[] = [];
  for (const entry of Object.values(map) as AlternativeEntry[]) {
    const catName = entry.category || "Other";
    if (!seen.has(catName)) {
      seen.add(catName);
      const displayName = CATEGORY_DISPLAY_NAMES[catName] || catName;
      DISPLAY_TO_ORIGINAL[displayName] = catName;
      cats.push({
        id: toSlug(displayName),
        name: displayName,
      } as Category);
    }
  }
  return cats;
}

// ── 构建 slug → Category 映射 ─────────────────────────
function buildSlugMaps() {
  const categories = getAllCategories();
  const slugToCat: Record<string, Category> = {};
  const slugToCat2026: Record<string, Category> = {};

  for (const cat of categories) {
    const s1 = toSlug(cat.name);
    slugToCat[s1] = cat;
    slugToCat2026[`${s1}-2026`] = cat;

    const s2 = toSlug(cat.id);
    slugToCat[s2] = cat;
    slugToCat2026[`${s2}-2026`] = cat;
  }

  // 也加入 alternatives 分类（含 "{Name} Tools" 风格 slug）
  const altCats = getAlternativesCategories();
  for (const cat of altCats) {
    const s = toSlug(cat.name);
    if (!slugToCat[s]) slugToCat[s] = cat;
    if (!slugToCat2026[`${s}-2026`]) slugToCat2026[`${s}-2026`] = cat;

    // 同时映射 "{Name} Tools" 风格（用户自然访问方式）
    const sTools = toSlug(cat.name + " Tools");
    if (!slugToCat[sTools]) slugToCat[sTools] = cat;
    if (!slugToCat2026[`${sTools}-2026`]) slugToCat2026[`${sTools}-2026`] = cat;

    // 同时映射原始分类名短 slug（如 "Productivity" → "productivity"）
    const originalName = DISPLAY_TO_ORIGINAL[cat.name];
    if (originalName && originalName !== cat.name) {
      const sRaw = toSlug(originalName);
      if (!slugToCat[sRaw]) slugToCat[sRaw] = cat;
      if (!slugToCat2026[`${sRaw}-2026`]) slugToCat2026[`${sRaw}-2026`] = cat;
    }
  }

  return { slugToCat, slugToCat2026 };
}

// ── 读取 home-blocks.json（Server-side）─────────────────────────
function getHomeBlocks(): any[] {
  try {
    // ESM __dirname：app/(marketing)/directory/best/[slug]/page.tsx → 向上 5 层到项目根
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..", "..");
    const filePath = join(PROJECT_ROOT, "public", "data", "home-blocks.json");
    if (!existsSync(filePath)) return [];
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data.blocks || [];
  } catch {
    return [];
  }
}

// ── 根据 slug 查找分类（大小写不敏感） ─────────────────────────
function findCategory(slug: string): Category | null {
  const { slugToCat, slugToCat2026 } = buildSlugMaps();
  const lowerSlug = slug.toLowerCase();
  return slugToCat[lowerSlug] || slugToCat2026[lowerSlug] || slugToCat[slug] || slugToCat2026[slug] || null;
}

// ── 根据 slug 查找 home-blocks.json 中的 block ─────────────────────────
function findBlock(slug: string): any | null {
  const blocks = getHomeBlocks();
  return blocks.find((b: any) => b.id === slug) || null;
}

// ── 获取 block 对应的资源详情 ─────────────────────────
function getBlockResources(blockId: string): Resource[] {
  const blocks = getHomeBlocks();
  const block = blocks.find((b: any) => b.id === blockId);
  if (!block || !block.resources) return [];

  // 从 block 中的资源摘要，去 fmhy 数据里找完整信息
  const all = getAllResources();
  const result: Resource[] = [];
  for (const summary of block.resources) {
    const full = all.find((r: Resource) => r.id === summary.id);
    if (full) {
      // 合并摘要信息（保留 githubStars 等）
      result.push({
        ...full,
        githubStars: summary.githubStars || full.githubStars || 0,
      });
    } else {
      // 找不到完整信息，用摘要凑合
      result.push({
        id: summary.id,
        name: summary.name,
        description: summary.description || "",
        url: summary.url || "",
        category: summary.category || "",
        categoryName: summary.categoryName || "",
        githubStars: summary.githubStars || 0,
        isFree: summary.isFree !== false,
        isOpenSource: summary.isOpenSource || false,
      } as Resource);
    }
  }
  return result;
}

// ── 获取分类下的资源（fmhy 数据）──────────────────────────
function getResourcesByCategory(categoryId: string): Resource[] {
  const all = getAllResources();
  return all
    .filter((r) => r.category === categoryId || r.categoryName === categoryId)
    .slice(0, 12);
}

// ── 获取分类下的替代品条目（alternatives 数据）──────────────────────────
function getAlternativesByCategory(categoryName: string): AlternativeEntry[] {
  const originalName = DISPLAY_TO_ORIGINAL[categoryName] || categoryName;
  const map = getCombinedMap();
  return Object.values(map).filter(
    (e) => (e.category || "Other") === originalName
  ) as AlternativeEntry[];
}

// ── 判断是否是 alternatives 虚拟分类 ─────────────────────────
function isAlternativesCategory(categoryName: string): boolean {
  const fmhyCats = getAllCategories();
  return !fmhyCats.some(
    (c) => c.name === categoryName || c.id === toSlug(categoryName)
  );
}

// ── 静态生成参数 ─────────────────────────
export async function generateStaticParams() {
  const categories = getAllCategories();
  const altCats = getAlternativesCategories();
  const params: { slug: string }[] = [];

  for (const cat of categories) {
    params.push({ slug: toSlug(cat.name) });
    params.push({ slug: `${toSlug(cat.name)}-2026` });
    params.push({ slug: toSlug(cat.id) });
    params.push({ slug: `${toSlug(cat.id)}-2026` });
  }

  for (const cat of altCats) {
    params.push({ slug: toSlug(cat.name) });
    params.push({ slug: `${toSlug(cat.name)}-2026` });
    // 同时生成 "{Name} Tools" 风格 slug（用户自然访问方式）
    const toolsSlug = toSlug(cat.name + " Tools");
    params.push({ slug: toolsSlug });
    params.push({ slug: `${toolsSlug}-2026` });
  }

  // ✅ 新增：也生成 home-blocks.json 中的 block ID
  const blocks = getHomeBlocks();
  for (const block of blocks) {
    params.push({ slug: block.id });
    params.push({ slug: `${block.id}-2026` });
  }

  // 去重：FMHY 和 alternatives 可能产生相同 slug
  const unique = params.filter(
    (p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i
  );
  return unique;
}

// ── Metadata ─────────────────────────
export async function generateMetadata(props: BestPageProps): Promise<Metadata> {
  const { slug } = await props.params;

  // 先检查是不是 block ID
  const block = findBlock(slug);
  if (block) {
    const is2026 = slug.endsWith("-2026");
    const title = `${block.title} ${is2026 ? "2026" : ""} | Craftisle`;
    const description = block.subtitle || `Discover the best ${block.title} tools.`;
    return {
      title,
      description,
      alternates: {
        canonical: `https://craftisle.com/directory/best/${slug}`,
      },
      openGraph: {
        title: `${block.title} ${is2026 ? "2026" : ""}`,
        description,
        url: `https://craftisle.com/directory/best/${slug}`,
      },
    };
  }

  const category = findCategory(slug);
  if (!category) return {};

  const is2026 = slug.endsWith("-2026");
  const title = `Best ${category.name} Tools ${is2026 ? "2026" : ""} — Free & Open Source | Craftisle`;
  const description = `Discover the best free and open-source ${category.name.toLowerCase()} tools. Curated list with alternatives and reviews.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://craftisle.com/directory/best/${slug}`,
    },
    openGraph: {
      title: `Best ${category.name} Tools ${is2026 ? "2026" : ""}`,
      description,
      url: `https://craftisle.com/directory/best/${slug}`,
    },
  };
}

// ── 页面组件 ─────────────────────────
export default async function BestToolsPage(props: BestPageProps) {
  const { slug } = await props.params;

  // ✅ 先检查是不是 home-blocks.json 中的 block ID
  const block = findBlock(slug);
  if (block) {
    return <BlockBestPage block={block} slug={slug} />;
  }

  // 否则按原来的分类逻辑
  const category = findCategory(slug);
  if (!category) notFound();

  const is2026 = slug.endsWith("-2026");
  const isAltCat = isAlternativesCategory(category.name);
  const resources = getResourcesByCategory(category.id);
  const altEntries = isAltCat ? getAlternativesByCategory(category.name) : [];

  // ── Case 1: alternatives 虚拟分类 ──
  if (isAltCat && altEntries.length > 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* 面包屑 */}
        <nav className="text-sm text-gray-500 mb-6">
          <a href="/directory" className="hover:underline">Directory</a>
          <span className="mx-2">/</span>
          <span className="text-gray-900">
            Best {category.name} Tools {is2026 ? "2026" : ""}
          </span>
        </nav>

        <h1 className="text-3xl font-bold mb-2">
          Best {category.name} Tools to Use in {is2026 ? "2026" : "2026"}
        </h1>
        <p className="text-gray-600 mb-8 max-w-2xl">
          Discover the best free and open-source {category.name.toLowerCase()} tools
          and their top alternatives.
        </p>

        {/* 每个付费工具 + 它的替代品 */}
        <div className="space-y-10">
          {altEntries.map((entry) => (
            <section key={entry.paidTool}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold">
                  {entry.paidTool} Alternatives
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {entry.alternatives.length} options
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {entry.tagline}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {entry.alternatives.slice(0, 6).map((alt) => (
                  <Link
                    key={alt.name}
                    href={`/directory/alternatives/${toSlug(entry.paidTool)}`}
                    className="no-underline"
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow h-full">
                      <h3 className="font-medium text-sm mb-1">{alt.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {alt.reason}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {alt.isFree && (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                            Free
                          </Badge>
                        )}
                        {alt.isOpenSource && (
                          <Badge variant="outline" className="text-xs">
                            Open Source
                          </Badge>
                        )}
                        {alt.isSelfHosted && (
                          <Badge variant="outline" className="text-xs">
                            Self-hosted
                          </Badge>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
              {entry.alternatives.length > 6 && (
                <div className="mt-3">
                  <Link
                    href={`/directory/alternatives/${toSlug(entry.paidTool)}`}
                  >
                    <span className="text-sm text-primary hover:underline font-medium">
                      View all {entry.alternatives.length} alternatives →
                    </span>
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* CTA */}
        <section className="mt-12 text-center border-t pt-8">
          <p className="text-gray-600 mb-4">
            Looking for more? Browse all tool alternatives.
          </p>
          <Link href="/directory/compare">
            <span className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
              Compare All Tools <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </section>
      </div>
    );
  }

  // ── Case 2: fmhy 原分类（原有逻辑）──
  const pageTitle = `Best ${category.name} Tools (2026) | Craftisle`;
  const description = `Discover the best free and open-source ${category.name.toLowerCase()} tools. Curated list with alternatives and reviews.`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/directory" className="hover:underline">Directory</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">
          Best {category.name} Tools {is2026 ? "2026" : ""}
        </span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">
        Best {category.name} Tools to Use in 2026
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        {description}
      </p>

      {/* Top Picks */}
      {resources.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Top Picks</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.slice(0, 6).map((r) => (
              <Link
                key={r.id}
                href={`/directory/resource/${r.id}`}
                className="no-underline"
              >
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {(r.icon || r.name?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{r.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getEnhancedDescription(r.name, r.description, r.category) || r.description || `${r.categoryName || r.category || "Free"} tool`}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap items-center">
                        {r.isFree !== false && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 py-0">
                            Free
                          </Badge>
                        )}
                        {r.isOpenSource && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            OSS
                          </Badge>
                        )}
                        {r.githubStars && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {"⭐"}{r.githubStars > 1000 ? `${(r.githubStars / 1000).toFixed(1)}k` : r.githubStars}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No resources found in this category yet.</p>
          <Link href="/directory" className="text-primary hover:underline">
            Browse all categories →
          </Link>
        </div>
      )}

      {/* Full List */}
      {resources.length > 6 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">More Great Options</h2>
          <div className="space-y-3">
            {resources.slice(6).map((r, i) => (
              <Link
                key={r.id}
                href={`/directory/resource/${r.id}`}
                className="no-underline"
              >
                <Card className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-300 w-6 text-right">
                      {i + 7}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{r.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {getEnhancedDescription(r.name, r.description, r.category) || r.description || `${r.categoryName || r.category || "Free"} tool`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">FAQ</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm">Are these tools really free?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Yes! All tools listed on Craftisle are 100% free or have a generous free tier.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">How do you choose the best tools?</h3>
            <p className="text-sm text-gray-600 mt-1">
              We evaluate based on features, ease of use, community support, and update frequency.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Block 专属页面组件 ─────────────────────────
function BlockBestPage({ block, slug }: { block: any; slug: string }) {
  const resources = getBlockResources(block.id);
  const is2026 = slug.endsWith("-2026");

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/directory" className="hover:underline">Directory</a>
        <span className="mx-2">/</span>
        <a href="/directory" className="hover:underline">Trending Now</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">
          {block.title} {is2026 ? "2026" : ""}
        </span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">
        {block.title} {is2026 ? "2026" : ""}
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        {block.subtitle || `Discover the best ${block.title} tools.`}
      </p>

      {/* 资源列表 */}
      {resources.length > 0 ? (
        <div className="mb-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r: Resource) => (
              <Link
                key={r.id}
                href={`/directory/resource/${r.id}`}
                className="no-underline"
              >
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {(r.icon || r.name?.charAt(0) || "?").toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{r.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getEnhancedDescription(r.name, r.description, r.category) || r.description || ""}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap items-center">
                        {r.isFree !== false && (
                          <Badge className="bg-green-50 text-green-700 border-green-200 text-xs px-1.5 py-0">
                            Free
                          </Badge>
                        )}
                        {r.isOpenSource && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            OSS
                          </Badge>
                        )}
                        {r.githubStars && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {"⭐"}{r.githubStars > 1000 ? `${(r.githubStars / 1000).toFixed(1)}k` : r.githubStars}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>No resources found in this block yet.</p>
          <Link href="/directory" className="text-primary hover:underline">
            Browse all categories →
          </Link>
        </div>
      )}

      {/* CTA */}
      <section className="mt-12 text-center border-t pt-8">
        <p className="text-gray-600 mb-4">
          Looking for more? Browse all directory.
        </p>
        <Link href="/directory">
          <span className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
            Browse Directory <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
