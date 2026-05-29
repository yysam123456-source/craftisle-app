"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { toolMeta, CATEGORY_LIST } from "@/lib/tools";
import type { ToolMeta } from "@/lib/tools";

export function ToolsClient({ toolDirs }: { toolDirs: string[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return toolDirs.filter((dirName) => {
      const meta = toolMeta[dirName];
      if (!meta) return false;

      const matchesSearch =
        !search ||
        meta.title.toLowerCase().includes(search.toLowerCase()) ||
        meta.desc.toLowerCase().includes(search.toLowerCase()) ||
        dirName.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        !activeCategory || meta.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [toolDirs, search, activeCategory]);

  const categoryCounts: Record<string, number> = {};
  for (const dirName of toolDirs) {
    const meta = toolMeta[dirName];
    if (meta) {
      categoryCounts[meta.category] =
        (categoryCounts[meta.category] || 0) + 1;
    }
  }

  return (
    <div>
      {/* Page Header */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              🛠️ Tools
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Free Online Tools
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {toolDirs.length}+ free online tools, no download required.
            </p>
          </div>
        </div>
      </section>

      {/* Search + Filter */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-base"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
                className="rounded-full"
              >
                All ({toolDirs.length})
              </Button>
              {CATEGORY_LIST.map(({ key, label }) => {
                const count = categoryCounts[label] || 0;
                if (count === 0) return null;
                return (
                  <Button
                    key={key}
                    variant={activeCategory === label ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setActiveCategory(
                        activeCategory === label ? null : label
                      )
                    }
                    className="rounded-full"
                  >
                    {label} ({count})
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              {activeCategory || "All Tools"} ({filtered.length})
            </h2>
            {search && (
              <p className="mt-1 text-sm text-muted-foreground">
                Search results for: &quot;{search}&quot;
              </p>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No tools found.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearch("");
                  setActiveCategory(null);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((dirName) => {
                const meta = toolMeta[dirName];
                if (!meta) return null;
                return (
                  <Card
                    key={dirName}
                    className="transition-shadow hover:shadow-lg flex flex-col"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-3 text-2xl">
                          {meta.icon}
                        </div>
                        {meta.badge && (
                          <Badge variant="default">{meta.badge}</Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4 text-base">
                        {meta.title}
                      </CardTitle>
                      <CardDescription>{meta.desc}</CardDescription>
                      <div className="mt-1">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          {meta.category}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto">
                      {meta.external && meta.url ? (
                        <a href={meta.url} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full" variant="outline">
                            Open Tool ↗
                          </Button>
                        </a>
                      ) : (
                        <Link href={`/tools/${dirName}`}>
                          <Button className="w-full" variant="outline">
                            Open Tool
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
