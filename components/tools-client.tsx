"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Search, X, Star, ArrowRight,
  FileText, Image, Palette, Cpu, Shield, Code, Type, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toolMeta, CATEGORY_LIST } from "@/lib/tools";
import { imageToolIds } from "@/lib/image-tools/ids";
import type { ToolMeta } from "@/lib/tools";
import { useFavorites } from "@/hooks/use-favorites";
import { StarButton } from "@/components/star-button";

export function ToolsClient({ toolDirs }: { toolDirs: string[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { favorites, toggle, isFavorited } = useFavorites();

  // 分类 → 渐变色映射
  const CATEGORY_GRADIENT: Record<string, { from: string; to: string; icon: React.FC<any> }> = {
    "PDF": { from: "#ef4444", to: "#f97316", icon: FileText },
    "Image": { from: "#3b82f6", to: "#8b5cf6", icon: Image },
    "Design": { from: "#ec4899", to: "#a855f7", icon: Palette },
    "Developer": { from: "#3b82f6", to: "#06b6d4", icon: Code },
    "Text": { from: "#f97316", to: "#eab308", icon: Type },
    "Converter": { from: "#22c55e", to: "#10b981", icon: Layers },
    "Security": { from: "#ef4444", to: "#dc2626", icon: Shield },
    "AI": { from: "#8b5cf6", to: "#ec4899", icon: Cpu },
  };

  function getToolGradient(category: string) {
    return CATEGORY_GRADIENT[category] || { from: "#6366f1", to: "#a855f7", icon: Cpu };
  }

  const filtered = useMemo(() => {
    const pinned = ["pdf-tools", "file-viewer", ...imageToolIds];
    return toolDirs
      .filter((dirName) => {
        const meta = toolMeta[dirName];
        if (!meta) return false;

        const matchesSearch =
          !search ||
          meta.title.toLowerCase().includes(search.toLowerCase()) ||
          meta.desc.toLowerCase().includes(search.toLowerCase()) ||
          dirName.toLowerCase().includes(search.toLowerCase());

        const matchesCategory =
          !activeCategory || meta.category === activeCategory;

        const matchesFavorite = !showFavoritesOnly || isFavorited(dirName);

        return matchesSearch && matchesCategory && matchesFavorite;
      })
      .sort((a, b) => {
        // Favorited items always on top
        const aFav = isFavorited(a);
        const bFav = isFavorited(b);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;

        const aIdx = pinned.indexOf(a);
        const bIdx = pinned.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });
  }, [toolDirs, search, activeCategory, showFavoritesOnly, isFavorited]);

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
                variant={
                  activeCategory === null && !showFavoritesOnly
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => {
                  setActiveCategory(null);
                  setShowFavoritesOnly(false);
                }}
                className="rounded-full"
              >
                All ({toolDirs.length})
              </Button>
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowFavoritesOnly(!showFavoritesOnly);
                  setActiveCategory(null);
                }}
                className="rounded-full"
              >
                <Star
                  className={cn(
                    "mr-1 h-3.5 w-3.5",
                    showFavoritesOnly
                      ? "fill-current"
                      : "fill-transparent"
                  )}
                />
                Favorites ({favorites.size})
              </Button>
              {CATEGORY_LIST.map(({ key, label }) => {
                const count = categoryCounts[label] || 0;
                if (count === 0) return null;
                return (
                  <Button
                    key={key}
                    variant={activeCategory === label ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveCategory(
                        activeCategory === label ? null : label
                      );
                      setShowFavoritesOnly(false);
                    }}
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((dirName) => {
                const meta = toolMeta[dirName];
                if (!meta) return null;
                const grad = getToolGradient(meta.category);
                const ToolIcon = grad.icon;

                return (
                  <GlassCard
                    key={dirName}
                    gradientFrom={grad.from}
                    gradientTo={grad.to}
                    className="flex flex-col transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl"
                  >
                    <GlassCardHeader>
                      {/* 图标行 */}
                      <div className="flex items-start justify-between">
                        {/* 渐变图标圆球 */}
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl shadow-md ring-1 ring-black/[0.04] transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                          }}
                        >
                          <ToolIcon
                            className="h-5 w-5 text-white"
                          />
                        </div>

                        {/* Badge + Star */}
                        <div className="flex items-center gap-1.5">
                          {meta.badge && (
                            <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                              {meta.badge}
                            </span>
                          )}
                          <StarButton
                            isActive={isFavorited(dirName)}
                            onClick={() => toggle(dirName)}
                          />
                        </div>
                      </div>

                      {/* 标题 */}
                      <GlassCardTitle className="mt-4 text-base leading-tight">
                        {meta.title}
                      </GlassCardTitle>

                      {/* 描述 */}
                      <GlassCardDescription className="mt-1.5 line-clamp-2">
                        {meta.desc}
                      </GlassCardDescription>

                      {/* 分类标签 */}
                      <div className="mt-2.5 inline-flex self-start">
                        <span
                          className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors"
                          style={{
                            borderColor: `${grad.from}30`,
                            color: `${grad.from}`,
                            background: `${grad.from}08`,
                          }}
                        >
                          {meta.category}
                        </span>
                      </div>
                    </GlassCardHeader>

                    <GlassCardContent className="mt-auto pt-4">
                      {meta.external && meta.url ? (
                        <a href={meta.url} target="_blank" rel="noopener noreferrer">
                          <Button
                            className="w-full rounded-lg font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                            size="sm"
                            style={{
                              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                            }}
                          >
                            Open Tool
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </a>
                      ) : (
                        <Link href={`/tools/${dirName}`}>
                          <Button
                            className="w-full rounded-lg font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
                            size="sm"
                            style={{
                              background: `linear-gradient(135deg, ${grad.from}, ${grad.to})`,
                            }}
                          >
                            Open Tool
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
                    </GlassCardContent>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
