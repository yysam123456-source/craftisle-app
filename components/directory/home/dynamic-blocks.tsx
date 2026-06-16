"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Flame, Star, TrendingUp, ArrowRight, GitCompareArrows,
  MessageSquare, Sparkles, Zap, Palette, NotebookPen, Wrench, Clock,
  ArrowRightLeft, ExternalLink,
} from "lucide-react";
import { getEnhancedDescription } from "@/lib/tool-descriptions";

/**
 * home-blocks.json 中的资源摘要类型
 */
interface ResourceSummary {
  id: string;
  name: string;
  description: string;
  url?: string;
  category?: string;
  categoryName?: string;
  githubStars?: number;
  icon?: string | null;
  isFree?: boolean;
  isOpenSource?: boolean;
  tags?: string[];
}

interface ComparisonItem {
  paidTool: string;
  freeAlternativeId: string | null;
  freeAlternativeName: string | null;
  count: number;
  freeResource?: ResourceSummary | null;
}

interface HomeBlock {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  resources?: ResourceSummary[];
  comparisons?: ComparisonItem[];
  sortOrder: number;
}

interface DynamicHomeBlocksProps {
  blocks: HomeBlock[];
  lastUpdated?: string;
}

const BLOCK_ICONS: Record<string, any> = {
  "weekly-hottest": Flame,
  "hn-discussed": MessageSquare,
  "most-compared": GitCompareArrows,
  "best-free-alternatives": Star,
  "rising-stars": TrendingUp,
  "ai-coding-tools": Zap,
  "design-tools": Palette,
  "productivity-tools": NotebookPen,
  "dev-tools": Wrench,
  "newly-added": Clock,
};

const BLOCK_GRADIENTS: Record<string, string> = {
  "weekly-hottest": "from-orange-500 to-red-500",
  "hn-discussed": "from-blue-500 to-cyan-500",
  "most-compared": "from-purple-500 to-pink-500",
  "best-free-alternatives": "from-green-500 to-emerald-500",
  "rising-stars": "from-yellow-500 to-orange-500",
  "ai-coding-tools": "from-violet-500 to-purple-500",
  "design-tools": "from-pink-500 to-rose-500",
  "productivity-tools": "from-teal-500 to-cyan-500",
  "dev-tools": "from-slate-500 to-gray-500",
  "newly-added": "from-indigo-500 to-blue-500",
};

export function DynamicHomeBlocks({ blocks, lastUpdated }: DynamicHomeBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-4 px-4 py-1">
            📊 Weekly Updated · Real Data
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Trending & Community Picks
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ranked by GitHub activity, HN discussions, and alternative searches
            {lastUpdated && (
              <span className="text-sm ml-2 text-muted-foreground/70">
                · Updated {new Date(lastUpdated).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>

        <div className="space-y-14">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlockRenderer({ block }: { block: HomeBlock }) {
  const Icon = BLOCK_ICONS[block.id] || Sparkles;
  const gradient = BLOCK_GRADIENTS[block.id] || "from-primary to-primary/60";

  // comparison-list 类型
  if (block.type === "comparison-list" && block.comparisons) {
    const items = block.comparisons.filter((c) => c.freeAlternativeName);
    if (items.length === 0) return null;

    return (
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{block.title}</h3>
            <p className="text-sm text-muted-foreground">{block.subtitle}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((comp, i) => {
            const href = comp.freeAlternativeId
              ? `/directory/resource/${comp.freeAlternativeId}`
              : `/directory/search?q=${encodeURIComponent(comp.paidTool)}`;

            return (
              <Link key={i} href={href} className="no-underline group">
                <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium line-through text-muted-foreground truncate">
                        {comp.paidTool}
                      </span>
                      <ArrowRightLeft className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span className="text-sm font-bold text-primary truncate">
                        {comp.freeAlternativeName}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {comp.count} alternative{comp.count > 1 ? "s" : ""} available
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // resource-list 类型
  const resources = block.resources || [];
  if (resources.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{block.title}</h3>
            <p className="text-sm text-muted-foreground">{block.subtitle}</p>
          </div>
        </div>
        <Link href={`/directory/search?q=${encodeURIComponent(block.title)}`}>
          <Button variant="ghost" size="sm" className="gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* 桌面端：紧凑列表；移动端：横向滚动卡片 */}
      <div className="hidden md:block rounded-xl border bg-card divide-y overflow-hidden">
        {resources.map((resource, index) => (
          <ResourceRow key={resource.id} resource={resource} index={index} />
        ))}
      </div>
      <div className="md:hidden flex gap-3 overflow-x-auto pb-2 snap-x">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}

function ResourceRow({ resource, index }: { resource: ResourceSummary; index: number }) {
  const href = `/directory/resource/${resource.id}`;
  const desc = getEnhancedDescription(
    resource.name,
    resource.description,
    resource.category || resource.categoryName || ""
  ) || resource.description || "";

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      {/* Rank */}
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
        {index + 1}
      </span>

      {/* Icon — 首字母头像 */}
      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
        {(resource.icon && resource.icon.length <= 2)
          ? resource.icon
          : (resource.name?.charAt(0) || "?").toUpperCase()}
      </span>

      {/* Name + Desc */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
            {resource.name}
          </span>
          {resource.isOpenSource && (
            <Badge variant="outline" className="flex-shrink-0 text-[10px] px-1 py-0">
              OSS
            </Badge>
          )}
          {resource.isFree && (
            <Badge className="flex-shrink-0 text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
              Free
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{desc}</p>
      </div>

      {/* Stars */}
      {resource.githubStars && resource.githubStars > 0 && (
        <span className="flex-shrink-0 text-xs text-muted-foreground hidden sm:flex items-center gap-1">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          {resource.githubStars > 999
            ? `${(resource.githubStars / 1000).toFixed(1)}k`
            : resource.githubStars}
        </span>
      )}

      <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

function ResourceCard({ resource }: { resource: ResourceSummary }) {
  const href = `/directory/resource/${resource.id}`;
  const desc = getEnhancedDescription(
    resource.name,
    resource.description,
    resource.category || resource.categoryName || ""
  ) || resource.description || "";

  return (
    <Link href={href} className="no-underline flex-shrink-0 w-64 snap-start">
      <Card className="h-full hover:border-primary/50 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {(resource.icon && resource.icon.length <= 2)
                ? resource.icon
                : (resource.name?.charAt(0) || "?").toUpperCase()}
            </span>
            <span className="font-semibold text-sm truncate">{resource.name}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
          {resource.githubStars && resource.githubStars > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {resource.githubStars > 999
                ? `${(resource.githubStars / 1000).toFixed(1)}k`
                : resource.githubStars}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
