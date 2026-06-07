"use client";

import { useState, useMemo, useCallback } from "react";
import { ResourceCard } from "./resource-card";
import { ResourceSearch } from "./resource-search";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Resource {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
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

const PAGE_SIZE = 20;

export function ResourcesClient({
  resources,
  category,
}: ResourcesClientProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!query.trim()) return resources;
    const q = query.toLowerCase();
    return resources.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.categoryName.toLowerCase().includes(q)
    );
  }, [resources, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setPage(1);
  }, []);

  return (
    <>
      <section className="border-b bg-muted/30 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <ResourceSearch
              onSearch={handleSearch}
              placeholder={`Search in ${category.name}...`}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {query
                ? `${filtered.length} results found`
                : `${resources.length} resources`}
            </p>
          </div>

          {paged.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              No resources found
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paged.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                showCategory={false}
              />
            ))}
          </div>

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
        </div>
      </section>
    </>
  );
}
