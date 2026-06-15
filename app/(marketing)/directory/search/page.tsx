"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { Badge } from "@/components/ui/badge";

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


// Loading skeleton for search results
function SearchSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="p-4 rounded-lg border bg-card animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2 mb-1"></div>
          <div className="h-3 bg-muted rounded w-5/6"></div>
        </div>
      ))}
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
  
    // 从 API 搜索
    if (q.trim()) {
      setLoading(true);
      fetch(`/api/directory/search?q=${encodeURIComponent(q)}&limit=100`)
        .then(res => res.json())
        .then(data => {
          setAllResources(data.results || []);
          setLoading(false);
        })
        .catch(() => {
          setAllResources([]);
          setLoading(false);
        });
    } else {
      setAllResources([]);
    }
  
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
            const res = await fetch(`/data/${src}-resources.json`);
            if (!res.ok) continue;
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

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    
    let filtered = allResources.filter((r) => {
      const text = `${r.name} ${r.url} ${r.description || ""} ${r.categoryName || ""} ${r.category || ""}`.toLowerCase();
      return text.includes(q);
    });

    // 数据源过滤
    if (sourceFilter) {
      filtered = filtered.filter((r) => r.source === sourceFilter);
    }

    // 分类过滤
    if (categoryFilter) {
      filtered = filtered.filter((r) => r.category === categoryFilter || r.categoryName === categoryFilter);
    }

    // GitHub 数据过滤
    if (githubFilter === "hasgithub") {
      filtered = filtered.filter((r) => r.githubStars && r.githubStars > 0);
    } else if (githubFilter === "nogithub") {
      filtered = filtered.filter((r) => !r.githubStars || r.githubStars === 0);
    }

    // 开源过滤
    if (openSourceFilter === "opensource") {
      filtered = filtered.filter((r) => r.isOpenSource === true);
    } else if (openSourceFilter === "commercial") {
      filtered = filtered.filter((r) => r.isOpenSource !== true);
    }

    // 更新频率过滤
    if (updateFrequencyFilter !== "all") {
      filtered = filtered.filter((r) => {
        if (!r.githubLastUpdated) return false;
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
      filtered = filtered.filter((r) => 
        r.tags && selectedTags.some(tag => r.tags?.includes(tag))
      );
    }

    // 排序
    if (sortBy === "stars") {
      filtered.sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    // relevance 排序保持默认（按搜索匹配度）

    return filtered;
  }, [allResources, query, sourceFilter, categoryFilter, githubFilter, openSourceFilter, updateFrequencyFilter, selectedTags, sortBy]);

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
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> results
                  {query && <span> for &quot;{query}&quot;</span>}
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
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No resources found for "{query}"</p>
              <p className="text-sm text-muted-foreground mb-6">
                Try different keywords or browse categories
              </p>
              {/* Show popular searches as suggestions */}
              <div className="max-w-md mx-auto">
                <p className="text-sm font-medium mb-3">Popular searches:</p>
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
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  showCategory={true}
                />
              ))}
            </div>
          )}
          {!loading && !query && (
            <div className="text-center py-12 text-muted-foreground">
              Enter keywords to search across all 10,000+ resources
            </div>
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
