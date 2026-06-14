"use client";

import { useState, useMemo } from "react";
import { ResourceCard } from "./resource-card";
import { ResourceSearch } from "./resource-search";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  subcategory?: string;
  name: string;
  url: string;
  description: string;
  githubUrl?: string;
  githubStars?: number;
  dateAdded?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface ResourcesClientProps {
  resources: Resource[];
  category: Category;
}

const PAGE_SIZE = 16;

type SortKey = "name" | "dateAdded" | "githubStars";
type FilterKey = "all" | "hasGithub" | "hasDescription";

export function ResourcesClient({
  resources,
  category,
}: ResourcesClientProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [filterBy, setFilterBy] = useState<FilterKey>("all");
  const [activeSubcat, setActiveSubcat] = useState<string>("");

  // Extract unique subcategories
  const subcategories = useMemo(() => {
    const seen = new Set<string>();
    const result: { name: string; count: number }[] = [];
    for (const r of resources) {
      const sub = r.subcategory || "";
      if (!sub) continue;
      if (seen.has(sub)) {
        const entry = result.find((e) => e.name === sub);
        if (entry) entry.count++;
      } else {
        seen.add(sub);
        result.push({ name: sub, count: 1 });
      }
    }
    return result.sort((a, b) => b.count - a.count);
  }, [resources]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = resources;

    // Subcategory filter
    if (activeSubcat) {
      result = result.filter((r) => r.subcategory === activeSubcat);
    }

    // Predefined filter
    if (filterBy === "hasGithub") {
      result = result.filter((r) => r.githubUrl);
    } else if (filterBy === "hasDescription") {
      result = result.filter(
        (r) => r.description && r.description.length > 20
      );
    }

    // Text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q))
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "dateAdded") {
        return (b.dateAdded || "").localeCompare(a.dateAdded || "");
      }
      if (sortBy === "githubStars") {
        return (b.githubStars || 0) - (a.githubStars || 0);
      }
      return 0;
    });

    return result;
  }, [resources, activeSubcat, filterBy, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const handleSearch = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  return (
    <>
      {/* Subcategory Navigation */}
      {subcategories.length > 0 && (
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-3">
            Subcategories in {category.name}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant={activeSubcat === "" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => {
                setActiveSubcat("");
                setPage(1);
              }}
            >
              All ({resources.length})
            </Badge>
            {subcategories.map((sub) => (
              <Badge
                key={sub.name}
                variant={activeSubcat === sub.name ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setActiveSubcat(sub.name);
                  setPage(1);
                }}
              >
                {sub.name} ({sub.count})
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Search + Filters Bar */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-xl">
          <ResourceSearch
            onSearch={handleSearch}
            placeholder={`Search in ${category.name}...`}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as SortKey);
              setPage(1);
            }}
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="name">Sort: Name</option>
            <option value="dateAdded">Sort: Newest</option>
            <option value="githubStars">Sort: Most Stars</option>
          </select>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => {
              setFilterBy(e.target.value as FilterKey);
              setPage(1);
            }}
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="hasGithub">Has GitHub</option>
            <option value="hasDescription">Has Description</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {query || activeSubcat || filterBy !== "all"
            ? `${filtered.length} results found`
            : `${resources.length} resources in ${category.name}`}
        </p>
      </div>

      {/* Resources Grid */}
      {paged.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No resources found
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {paged.map((resource, idx) => (
          <ResourceCard
            key={resource.id || `${resource.url}-${idx}`}
            resource={resource}
            showCategory={false}
            variant="large"
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <span className="mx-4 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </>
  );
}
