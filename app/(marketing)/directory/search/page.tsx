"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResourceCard } from "@/components/resources/resource-card";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { Badge } from "@/components/ui/badge";

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  name: string;
  url: string;
  description: string;
  source?: string;
}

interface CategoryMeta {
  id: string;
  name: string;
  icon?: string;
}

// Source display config
const sourceLabels: Record<string, string> = { fmhy: "FMHY", "free-for-dev": "Free for Dev", "public-apis": "Public APIs", "awesome-selfhosted": "Self-Hosted" };
const sourceIcons: Record<string, string> = { fmhy: "📚", "free-for-dev": "🔧", "public-apis": "🔌", "awesome-selfhosted": "🏠" };

/**
 * Inner component that uses useSearchParams().
 * Wrapped in <Suspense> by the parent to satisfy Next.js 15 requirements.
 */
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setSourceFilter(null);
  }, [searchParams]);

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

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    let filtered = allResources.filter((r) => {
      const text = `${r.name} ${r.url} ${r.description || ""} ${r.categoryName || ""} ${r.category || ""}`.toLowerCase();
      return text.includes(q);
    });

    if (sourceFilter) {
      filtered = filtered.filter((r) => r.source === sourceFilter);
    }

    return filtered;
  }, [allResources, query, sourceFilter]);

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
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-12 text-muted-foreground">
              Loading 10,000+ resources...
            </div>
          )}
          {!loading && query && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{results.length}</span> results
                  {query && <span> for &quot;{query}&quot;</span>}
                </p>
              </div>
              {/* Source filter badges */}
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
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No resources found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try different keywords or browse categories
              </p>
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
