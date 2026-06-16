"use client";

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, X, ChevronDown, Sparkles, Star, Clock, Code2, Filter } from "lucide-react";
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

  // 搜索结果（调用服务端 API）
  const [apiResults, setApiResults] = useState<ScoredResource[]>([]);
  const results = apiResults;  // 别名

  // Extract top tags from **search results only** (not all resources)
  const topTags = useMemo(() => {
    // Only show tags derived from current search results
    if (results.length === 0) return [];
    const tagCounts: Record<string, number> = {};
    for (const r of results) {
      // Handle both array and object formats of tags
      const tags = r.tags;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          if (typeof tag === "string") {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      } else if (tags && typeof tags === "object") {
        for (const key of Object.keys(tags)) {
          tagCounts[key] = (tagCounts[key] || 0) + 1;
        }
      }
    }
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([tag]) => tag)
      // Filter out noisy/generic tags
      .filter(tag => !tag.startsWith("Auth:") && tag !== "No Auth" && tag.length < 30);
  }, [results]);

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
              className="mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* 结果统计 + 排序 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{results.length.toLocaleString()}</span>
                  <span className="text-muted-foreground">results for</span>
                  <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md text-sm">&quot;{query}&quot;</span>
                  {results.length > 0 && (
                    <span className="hidden sm:inline-flex ml-1 text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
                      {results.filter(r => r._matchReason?.includes("Exact name match")).length} exact · {results.filter(r => r._matchReason?.includes("Name contains query")).length} name · {results.filter(r => r._matchReason?.includes("Description match")).length} desc
                    </span>
                  )}
                </div>

                {/* 排序选择器 */}
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-[150px] h-9 text-sm border-dashed hover:border-solid transition-colors">
                    {sortBy === "relevance" && <Sparkles className="mr-1.5 h-3.5 w-3.5 text-amber-500" />}
                    {sortBy === "stars" && <Star className="mr-1.5 h-3.5 w-3.5 text-yellow-500" />}
                    {sortBy === "name" && <span className="mr-1.5 font-serif italic text-sm">A-Z</span>}
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectItem value="relevance">
                      <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-amber-500" />Relevance</span>
                    </SelectItem>
                    <SelectItem value="stars">
                      <span className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-yellow-500" />GitHub Stars</span>
                    </SelectItem>
                    <SelectItem value="name">
                      <span className="flex items-center gap-2"><span className="font-serif italic">A-Z</span>Name A-Z</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 筛选栏 */}
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border p-4 space-y-3.5 shadow-sm">

                {/* 第一行：数据源 + 基础筛选 */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* 数据源标签组 */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground mr-0.5 hidden sm:inline" />
                    <button
                      onClick={() => setSourceFilter(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        sourceFilter === null
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-background border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      All ({results.length})
                    </button>
                    {Object.entries(sourceCounts).map(([src, count]) => {
                      const isSelected = sourceFilter === src;
                      return (
                        <button
                          key={src}
                          onClick={() => setSourceFilter(isSelected ? null : src)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-background border hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          <span>{sourceIcons[src] || "📦"}</span>
                          <span>{sourceLabels[src] || src}</span>
                          <span className={`rounded-full px-1.5 py-0 ${isSelected ? "bg-white/20" : "bg-muted"}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 分隔线（桌面端） */}
                  <div className="hidden sm:block h-6 w-px bg-border mx-1" />

                  {/* GitHub 筛选 */}
                  <Select value={githubFilter} onValueChange={(v) => setGithubFilter(v as typeof githubFilter)}>
                    <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs border-dashed hover:border-solid">
                      <Code2 className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"><span className="text-muted-foreground">All Resources</span></SelectItem>
                      <SelectItem value="hasgithub">✓ Has GitHub Data</SelectItem>
                      <SelectItem value="nogithub">✗ No GitHub Data</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 开源筛选 */}
                  <Select value={openSourceFilter} onValueChange={(v) => setOpenSourceFilter(v as typeof openSourceFilter)}>
                    <SelectTrigger className="w-auto min-w-[130px] h-8 text-xs border-dashed hover:border-solid">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"><span className="text-muted-foreground">All Types</span></SelectItem>
                      <SelectItem value="opensource">🌓 Open Source Only</SelectItem>
                      <SelectItem value="commercial">💰 Commercial Only</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* 更新频率筛选 */}
                  <Select value={updateFrequencyFilter} onValueChange={(v) => setUpdateFrequencyFilter(v as typeof updateFrequencyFilter)}>
                    <SelectTrigger className="w-auto min-w-[160px] h-8 text-xs border-dashed hover:border-solid">
                      <Clock className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all"><span className="text-muted-foreground">Any Update Date</span></SelectItem>
                      <SelectItem value="recent">🟢 Recently Updated (30d)</SelectItem>
                      <SelectItem value="active">🔵 Active (90d)</SelectItem>
                      <SelectItem value="maintained">⚪ Maintained (1y)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 第二行：标签过滤 */}
                {topTags.length > 0 && (
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-start gap-2">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium pt-1 whitespace-nowrap shrink-0">Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {topTags.map((tag) => {
                          const isActive = selectedTags.includes(tag);
                          return (
                            <Badge
                              key={tag}
                              variant={isActive ? "default" : "secondary"}
                              className={`cursor-pointer text-[11px] px-2.5 py-0.5 rounded-full transition-all ${
                                isActive ? "shadow-sm" : "hover:bg-primary/10 hover:text-foreground"
                              }`}
                              onClick={() => setSelectedTags(prev =>
                                prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                              )}
                            >
                              {tag}
                            </Badge>
                          );
                        })}
                        {selectedTags.length > 0 && (
                          <button
                            onClick={() => setSelectedTags([])}
                            className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 活跃筛选提示条 */}
                {(sourceFilter !== null || githubFilter !== "all" || openSourceFilter !== "all" || updateFrequencyFilter !== "all" || selectedTags.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="pt-2 border-t border-border/50"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Active filters:</span>
                      {sourceFilter && (
                        <Badge variant="default" className="text-[11px] px-2 py-0 gap-1">
                          {sourceIcons[sourceFilter]} {sourceLabels[sourceFilter]}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSourceFilter(null)} />
                        </Badge>
                      )}
                      {githubFilter !== "all" && (
                        <Badge variant="secondary" className="text-[11px] px-2 py-0 gap-1">
                          {githubFilter === "hasgithub" ? "Has GitHub" : "No GitHub"}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setGithubFilter("all")} />
                        </Badge>
                      )}
                      {openSourceFilter !== "all" && (
                        <Badge variant="secondary" className="text-[11px] px-2 py-0 gap-1">
                          {openSourceFilter === "opensource" ? "Open Source" : "Commercial"}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setOpenSourceFilter("all")} />
                        </Badge>
                      )}
                      {updateFrequencyFilter !== "all" && (
                        <Badge variant="secondary" className="text-[11px] px-2 py-0 gap-1">
                          {updateFrequencyFilter}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setUpdateFrequencyFilter("all")} />
                        </Badge>
                      )}
                      {selectedTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-0 gap-1">
                          #{tag}
                          <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} />
                        </Badge>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-foreground ml-auto"
                        onClick={() => {
                          setSourceFilter(null);
                          setGithubFilter("all");
                          setOpenSourceFilter("all");
                          setUpdateFrequencyFilter("all");
                          setSelectedTags([]);
                        }}
                      >
                        Reset All
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
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
