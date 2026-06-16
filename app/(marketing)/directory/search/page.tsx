"use client";

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { searchResources, formatStars, highlightTextSimple, type ScoredResource } from "@/lib/search-utils";

// 热门搜索建议
const POPULAR_SEARCHES = [
  "image generator", "video editor", "code assistant", "free api",
  "self-hosted", "github stars", "open source", "productivity",
  "ai tools", "free tier", "docker", "react",
];

// 最近搜索 localStorage key
const RECENT_SEARCHES_KEY = "craftisle-recent-searches";
const MAX_RECENT_SEARCHES = 5;

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  name: string;
  url: string;
  description: string;
  source?: string;
  githubStars?: number;
  githubLastUpdated?: string;
  isOpenSource?: boolean;
  isSelfHosted?: boolean;
  tags?: string[];
}

interface CategoryMeta {
  id: string;
  name: string;
  icon?: string;
}

// Source display config
const sourceLabels: Record<string, string> = { fmhy: "FMHY", "free-for-dev": "Free for Dev", "public-apis": "Public APIs", "awesome-selfhosted": "Self-Hosted" };
const sourceIcons: Record<string, string> = { fmhy: "📚", "free-for-dev": "🔧", "public-apis": "🔌", "awesome-selfhosted": "🏠" };

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
  },
};

const filtersVariants = {
  hidden: { opacity: 0, height: 0 },
  show: {
    opacity: 1,
    height: "auto",
  },
};


// Loading skeleton for search results
function SearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 rounded-lg border bg-card overflow-hidden relative">
          {/* Shimmer effect overlay */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex items-start gap-3 mb-3">
            {/* Favicon placeholder */}
            <div className="w-10 h-10 rounded-lg bg-muted animate-pulse flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              {/* Title placeholder */}
              <div className="h-4 bg-muted rounded w-3/4 mb-2 animate-pulse" />
              {/* Category badge placeholder */}
              <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
            </div>
          </div>
          
          {/* Description lines placeholder */}
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-full animate-pulse" />
            <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
          </div>
          
          {/* Tags placeholder */}
          <div className="flex gap-1.5 mt-3">
            <div className="h-2 w-12 bg-muted rounded-full animate-pulse" />
            <div className="h-2 w-16 bg-muted rounded-full animate-pulse" />
            <div className="h-2 w-10 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      ))}
      
      {/* Add shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Inner component that uses useSearchParams().
 * Wrapped in <Suspense> by the parent to satisfy Next.js 15 requirements.
 */
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [githubFilter, setGithubFilter] = useState<"all" | "hasgithub" | "nogithub">("all");
  const [openSourceFilter, setOpenSourceFilter] = useState<"all" | "opensource" | "commercial">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "stars" | "name">("relevance");
  const [updateFrequencyFilter, setUpdateFrequencyFilter] = useState<"all" | "recent" | "active" | "maintained">("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setSourceFilter(null);

    // 注意：不再调用 API 覆盖 allResources！
    // 搜索过滤由 useMemo(results) 基于 allResources 客户端完成
    // 这里只设置查询词，不触发额外请求

    // 保存到最近搜索
    if (q.trim()) {
      setRecentSearches(prev => {
        const updated = [q, ...prev.filter(s => s !== q)].slice(0, MAX_RECENT_SEARCHES);
        if (typeof window !== 'undefined') {
          localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    }
  }, [searchParams]);

  // 加载最近搜索
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    async function loadAllData() {
      try {
        const sources = ["fmhy", "free-for-dev", "public-apis", "awesome-selfhosted"];
        const allRes: Resource[] = [];
        const allCats: CategoryMeta[] = [];

        for (const src of sources) {
          try {
            // 使用简化版数据文件（只含搜索必需字段）
            const res = await fetch(`/data/${src}-resources-simple.json`);
            if (!res.ok) {
              // 如果简化版不存在，回退到完整版
              const resFull = await fetch(`/data/${src}-resources.json`);
              if (!resFull.ok) continue;
              const data = await resFull.json();
              // 解析完整版数据...
              // (保持原有逻辑)
              if (src === "fmhy" && data.categories) {
                for (const [catId, catData] of Object.entries(data.categories) as [string, any][]) {
                  for (const r of (catData.resources || [])) {
                    allRes.push({ ...r, source: src });
                  }
                  if (catData.name) {
                    allCats.push({ id: catId, name: catData.name, icon: catData.icon });
                  }
                }
              } else if (data.resources) {
                for (const r of data.resources) {
                  if (r.id && r.name && r.url) {
                    allRes.push({ ...r, source: src });
                  }
                }
              }
              continue;
            }
            const data = await res.json();

            // FMHY uses nested {categories: {id: {resources: [...]}}} structure
            if (src === "fmhy" && data.categories) {
              for (const [catId, catData] of Object.entries(data.categories) as [string, any][]) {
                for (const r of (catData.resources || [])) {
                  allRes.push({ ...r, source: src });
                }
                if (catData.name) {
                  allCats.push({ id: catId, name: catData.name, icon: catData.icon });
                }
              }
            }
            // Other sources use flat {resources: [...], categories: [...]}
            else if (data.resources) {
              for (const r of data.resources) {
                if (r.id && r.name && r.url) {
                  allRes.push({ ...r, source: src });
                }
              }
            }

            // Collect categories
            if (data.categories) {
              for (const c of (Array.isArray(data.categories) ? data.categories : Object.values(data.categories))) {
                if ((c as any).id && (c as any).name) {
                  allCats.push({ id: (c as any).id, name: (c as any).name, icon: (c as any).icon });
                }
              }
            }
          } catch { /* skip failed sources */ }
        }

        // Dedup by ID
        const seen = new Set<string>();
        const deduped: Resource[] = [];
        for (const r of allRes) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            deduped.push(r);
          }
        }
        setAllResources(deduped);
        setCategories(allCats);
        // 调试日志
        if (typeof window !== 'undefined') {
          console.log('[Search Debug] allResources loaded:', deduped.length);
          console.log('[Search Debug] Categories loaded:', allCats.length);
          (window as any).__DEBUG_ALL_RESOURCES__ = deduped;
        }
      } catch {
        // keep resources empty
      } finally {
        setLoading(false);
      }
    }
    loadAllData();
  }, []);

  // Extract top tags from all resources
  const topTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    for (const r of allResources) {
      for (const tag of (r.tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag]) => tag);
  }, [allResources]);

  // 搜索结果（调用服务端 API）
  const [apiResults, setApiResults] = useState<ScoredResource[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setApiResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({ q: query });
    if (sourceFilter) params.set("source", sourceFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    params.set("limit", "500");

    fetch(`/api/search?${params}`)
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          let scored: ScoredResource[] = data.results;

          // GitHub 数据过滤
          if (githubFilter === "hasgithub") {
            scored = scored.filter(r => r.githubStars && r.githubStars > 0);
          } else if (githubFilter === "nogithub") {
            scored = scored.filter(r => !r.githubStars || r.githubStars === 0);
          }

          // 开源过滤
          if (openSourceFilter === "opensource") {
            scored = scored.filter(r => r.isOpenSource === true);
          } else if (openSourceFilter === "commercial") {
            scored = scored.filter(r => r.isOpenSource !== true);
          }

          // 更新频率过滤
          if (updateFrequencyFilter !== "all") {
            scored = scored.filter(r => {
              if (!r.githubLastUpdated || typeof r.githubLastUpdated !== "string") return false;
              const lastUpdated = new Date(r.githubLastUpdated);
              const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
              if (updateFrequencyFilter === "recent") return daysSince <= 30;
              if (updateFrequencyFilter === "active") return daysSince <= 90;
              if (updateFrequencyFilter === "maintained") return daysSince <= 365;
              return true;
            });
          }

          // 标签过滤
          if (selectedTags.length > 0) {
            scored = scored.filter(r => {
              const tags = r.tags;
              return tags && Array.isArray(tags) && selectedTags.some(tag => tags.includes(tag));
            });
          }

          // 最终排序
          if (sortBy === "stars") {
            scored.sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0));
          } else if (sortBy === "name") {
            scored.sort((a, b) => a.name.localeCompare(b.name));
          }
          // relevance: API 已按 score 排好序

          setApiResults(scored);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Search API error:", err);
        setApiResults([]);
        setLoading(false);
      });
  }, [query, sourceFilter, categoryFilter, githubFilter, openSourceFilter, updateFrequencyFilter, selectedTags, sortBy]);

  const results = apiResults;

  // Count by source
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      counts[r.source || "unknown"] = (counts[r.source || "unknown"] || 0) + 1;
    }
    return counts;
  }, [results]);

  const handleSearch = useCallback(
    (q: string) => {
      router.push(`/directory/search?q=${encodeURIComponent(q)}`);
    },
    [router],
  );

  // Ctrl+K / Cmd+K 快捷键聚焦搜索框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("main-search-input")?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Search Resources
            </h1>
            <p className="text-muted-foreground mb-4">
              Search across {allResources.length.toLocaleString()} resources from FMHY, Free for Dev, Public APIs, and Self-Hosted
            </p>
            <ResourceSearchClient
              placeholder="Search resources by name, description, URL..."
              className="max-w-2xl"
              value={query}
              onSearch={handleSearch}
              inputId="main-search-input"
              resources={allResources}
            />
            {/* 最近搜索 */}
            {!loading && !query && recentSearches.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Recent searches:</p>
                <div className="flex gap-2 flex-wrap">
                  {recentSearches.map((term) => (
                    <Badge
                      key={term}
                      variant="secondary"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        router.push(`/directory/search?q=${encodeURIComponent(term)}`);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {/* 热门搜索建议 */}
            {!loading && !query && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Popular searches:</p>
                <div className="flex gap-2 flex-wrap">
                  {POPULAR_SEARCHES.map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        router.push(`/directory/search?q=${encodeURIComponent(term)}`);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </section>

        <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && <SearchSkeleton />}
          {!loading && query && (
            <motion.div
              className="mb-6 space-y-3"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> results
                  {query && <span> for &quot;{query}&quot;</span>}
                  {/* 显示匹配原因统计 */}
                  {results.length > 0 && (
                    <span className="text-xs ml-2 text-muted-foreground">
                      ({results.filter(r => r._matchReason?.includes("Exact name match")).length} exact,{" "}
                      {results.filter(r => r._matchReason?.includes("Name contains query")).length} name,{" "}
                      {results.filter(r => r._matchReason?.includes("Description match")).length} description)
                    </span>
                  )}
                </p>
                {/* 排序下拉 */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "relevance" | "stars" | "name")}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background"
                >
                  <option value="relevance">Relevance</option>
                  <option value="stars">GitHub Stars</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
              {/* 过滤控件 */}
              <div className="flex gap-2 flex-wrap">
                {/* 数据源过滤 */}
                {Object.keys(sourceCounts).length > 1 ? (
                  <div className="flex gap-2 flex-wrap">
                    <Badge
                      variant={sourceFilter === null ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setSourceFilter(null)}
                    >
                      All ({results.length})
                    </Badge>
                    {Object.entries(sourceCounts).map(([src, count]) => (
                      <Badge
                        key={src}
                        variant={sourceFilter === src ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSourceFilter(src)}
                      >
                        {sourceIcons[src] || "📦"} {sourceLabels[src] || src} ({count})
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {/* 分类过滤 */}
                {categories.length > 0 && (
                  <select
                    value={categoryFilter || ""}
                    onChange={(e) => setCategoryFilter(e.target.value || null)}
                    className="px-3 py-1.5 text-sm border rounded-lg bg-background"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.icon || "📁"} {cat.name}</option>
                    ))}
                  </select>
                )}
                {/* GitHub 数据过滤 */}
                <select
                  value={githubFilter}
                  onChange={(e) => setGithubFilter(e.target.value as "all" | "hasgithub" | "nogithub")}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background"
                >
                  <option value="all">All Resources</option>
                  <option value="hasgithub">Has GitHub Data</option>
                  <option value="nogithub">No GitHub Data</option>
                </select>
                {/* 开源过滤 */}
                <select
                  value={openSourceFilter}
                  onChange={(e) => setOpenSourceFilter(e.target.value as "all" | "opensource" | "commercial")}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background"
                >
                  <option value="all">All Types</option>
                  <option value="opensource">Open Source Only</option>
                  <option value="commercial">Commercial Only</option>
                </select>
                {/* 更新频率过滤 */}
                <select
                  value={updateFrequencyFilter}
                  onChange={(e) => setUpdateFrequencyFilter(e.target.value as "all" | "recent" | "active" | "maintained")}
                  className="px-3 py-1.5 text-sm border rounded-lg bg-background"
                >
                  <option value="all">Any Update Date</option>
                  <option value="recent">Recently Updated (30 days)</option>
                  <option value="active">Actively Maintained (90 days)</option>
                  <option value="maintained">Maintained (1 year)</option>
                </select>
              </div>
              {/* 标签过滤 */}
              {topTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">Filter by tags:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {topTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag) 
                              ? prev.filter(t => t !== tag) 
                              : [...prev, tag]
                          );
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {selectedTags.length > 0 && (
                      <Badge
                        variant="outline"
                        className="cursor-pointer text-xs text-red-600 border-red-300"
                        onClick={() => setSelectedTags([])}
                      >
                        Clear Tags
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
          {!loading && query && results.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* 空状态图标 */}
              <div className="mb-6 text-6xl">🔍</div>
              
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-2">
                No resources found for "<span className="font-medium text-foreground">{query}</span>"
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Try adjusting your search or filters to find what you're looking for
              </p>

              {/* 搜索提示 */}
              <div className="max-w-md mx-auto mb-8 text-left">
                <p className="text-sm font-medium mb-3">💡 Search tips:</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                  <li>• Try different or more general keywords</li>
                  <li>• Check for typos in your search</li>
                  <li>• Remove filters to broaden results</li>
                  <li>• Search by category name or tool type</li>
                </ul>
              </div>
              
              {/* 热门搜索建议 */}
              <div className="max-w-md mx-auto mb-6">
                <p className="text-sm font-medium mb-3">🔥 Popular searches:</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {POPULAR_SEARCHES.slice(0, 6).map((term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        router.push(`/directory/search?q=${encodeURIComponent(term)}`);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 浏览建议 */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/directory/categories")}
                >
                  Browse Categories
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/directory")}
                >
                  View All Resources
                </Button>
              </div>
            </motion.div>
          )}
          {!loading && results.length > 0 && (
            <>
              {/* 结果计数 */}
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {results.length} results
              </div>
              
              {/* 常规网格渲染（虚拟滚动暂时禁用） */}
              <motion.div
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {results.map((resource, index) => (
                  <motion.div
                    key={resource.id}
                    variants={itemVariants}
                    custom={index}
                    className="relative"
                  >
                    <ResourceCard
                      resource={{ ...resource, category: resource.category || "" } as Resource}
                      showCategory={true}
                      highlightQuery={query}
                    />
                    {/* 显示匹配原因 */}
                    {resource._matchReason && (
                      <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {resource._matchReason}
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
          {!loading && !query && (
            <motion.div
              className="text-center py-12 text-muted-foreground"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-lg mb-2">🔍 Start searching</p>
              <p className="text-sm">Enter keywords to search across all 10,000+ resources</p>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

/**
 * Search page — wraps SearchResultsContent in <Suspense>
 * to satisfy Next.js 15 useSearchParams() requirement.
 */
export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading search...</div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
