import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllResources,
  getEditorsPicks,
  getRichInfoResourceIds,
} from "@/lib/fmhy-data";
import { getEnhancedDescription } from "@/lib/tool-descriptions";
import { Sparkles, Flame, ArrowRightLeft, ArrowRight, Star, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Featured With Tabs — 紧凑列表式布局
 * 合并 Editor's Picks + Quick Rankings + Popular Alternatives
 * 升级：玻璃拟态 + 渐变 + hover 动效
 */

/** 中文/应过滤的资源名黑名单 */
const BLOCKED_NAMES = [
  "deepseek", "qwen", "通义", "kimi", "月之暗面",
  "文心", "讯飞", "sensechat", "智谱", "chatglm",
  "doubao", "ernie",
];

function shouldBlock(name: string): boolean {
  const lower = name.toLowerCase();
  return BLOCKED_NAMES.some((b) => lower.includes(b));
}

// 获取 Trending 资源（优先按 GitHub Stars，无 stars 数据时按综合评分）
function getTrendingResources(limit = 8) {
  const resources = getAllResources();
  const richSet = getRichInfoResourceIds();

  // 先尝试按 stars 排序
  const withStars = resources.filter(
    (r) =>
      r.githubStars &&
      r.githubStars > 100 &&
      !shouldBlock(r.name)
  );

  if (withStars.length >= limit) {
    return withStars
      .sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0))
      .slice(0, limit)
      .map((r) => ({ ...r, _hasRichInfo: richSet.has(r.id) }));
  }

  // 兜底：无 stars 数据时，按综合评分 + 有描述过滤 
  return resources
    .filter((r) => !shouldBlock(r.name) && r.description && r.description.length > 10)
    .sort((a, b) => {
      // 描述越长越好（说明信息越丰富） 
      const aDesc = (a.description || "").length;
      const bDesc = (b.description || "").length;
      if (bDesc !== aDesc) return bDesc - aDesc;
      // 同等长度时看是否有 URL 
      if (!!a.url !== !!b.url) return !!b.url ? 1 : -1;
      return 0;
    })
    .slice(0, limit)
    .map((r) => ({ ...r, _hasRichInfo: richSet.has(r.id) }));
}

// 获取热门替代品 
function getPopularAlternatives(limit = 8) {
  try {
    const fs = require("fs");
    const path = require("path");
    const altPath = path.join(process.cwd(), "public/data/alternatives.json");

    if (!fs.existsSync(altPath)) return [];

    const alternatives = JSON.parse(fs.readFileSync(altPath, "utf-8"));
    const resources = getAllResources();
    const richSet = getRichInfoResourceIds();

    const topAlternatives = Object.entries(alternatives)
      .slice(0, limit)
      .map(([paidTool, freeTools]: [string, any]) => ({
        paidTool,
        freeTool: freeTools[0] || "N/A",
        freeToolResource: resources.find((r) => r.name === freeTools[0]),
      }));

    return topAlternatives;
  } catch {
    return [];
  }
}

export function FeaturedWithTabs() {
  const editorsPicks = getEditorsPicks()
    .filter((r) => !shouldBlock(r.name))
    .slice(0, 8);
  const trending = getTrendingResources(8);
  const alternatives = getPopularAlternatives(8);

  return (
    <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
      {/* 背景装饰 */} 
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-orange-500/5 blur-[80px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-5xl">
        {/* Section Header */} 
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-2 text-sm font-semibold text-violet-600 dark:text-violet-400 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Featured Tools
            <Flame className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Featured{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Tools
            </span>
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Trending &middot; Editor&rsquo;s Picks &middot; Free Alternatives
          </p>
        </div>

        {/* Tabs */} 
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full max-w-sm mx-auto grid-cols-3 mb-6 h-9">
            <TabsTrigger value="trending" className="gap-1.5 text-xs">
              <Flame className="h-3.5 w-3.5" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="editors" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Top Picks
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="gap-1.5 text-xs">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Alternatives
            </TabsTrigger>
          </TabsList>

          {/* ===== Trending Tab — 紧凑列表 ===== */} 
          <TabsContent value="trending">
            <div className="rounded-2xl border border-white/15 bg-white/[0.65] shadow-lg shadow-black/[0.05] backdrop-blur-xl overflow-hidden dark:border-white/8 dark:bg-white/[0.04] dark:shadow-black/20">
              {trending.map((resource, index) => {
                const href = resource._hasRichInfo
                  ? `/directory/resource/${resource.id}`
                  : resource.url || "#";

                return (
                  <Link
                    key={resource.id}
                    href={href}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                    target={resource._hasRichInfo ? undefined : "_blank"}
                    rel={
                      resource._hasRichInfo
                        ? undefined
                        : "noopener noreferrer"
                    }
                  >
                    {/* Rank */} 
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      index < 3 ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </span>

                    {/* Icon — 首字母头像（无 icon 时用首字母）*/} 
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      {(resource.icon && resource.icon.length <= 2) ? resource.icon : (resource.name?.charAt(0) || "?").toUpperCase()}
                    </span>

                    {/* Name + Desc */} 
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {resource.name}
                        </span>
                        {resource.isOpenSource && (
                          <Badge
                            variant="outline"
                            className="flex-shrink-0 text-[10px] px-1 py-0"
                          >
                            OSS
                          </Badge>
                        )}
                        {resource.isFree && (
                          <Badge className="flex-shrink-0 text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                            Free
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {getEnhancedDescription(resource.name, resource.description, resource.category) ||
                          `${resource.categoryName || resource.category || "Free"} tool`.replace(/\s+/g, " ").trim() ||
                          "Curated tool"}
                      </p>
                    </div>

                    {/* Stars */} 
                    {resource.githubStars && (
                      <span className="flex-shrink-0 text-xs text-muted-foreground hidden sm:flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {(resource.githubStars / 1000).toFixed(1)}k
                      </span>
                    )}

                    {/* Arrow */} 
                    <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
              {trending.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No trending tools available yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== Editor's Picks Tab — 紧凑列表 ===== */} 
          <TabsContent value="editors">
            <div className="rounded-2xl border border-white/15 bg-white/[0.65] shadow-lg shadow-black/[0.05] backdrop-blur-xl overflow-hidden dark:border-white/8 dark:bg-white/[0.04] dark:shadow-black/20">
              {editorsPicks.map((resource, index) => {
                  const href = resource._hasRichInfo
                    ? `/directory/resource/${resource.id}`
                    : resource.url || "#";

                  return (
                    <Link
                      key={resource.id}
                      href={href}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                      target={
                        resource._hasRichInfo ? undefined : "_blank"
                      }
                      rel={
                        resource._hasRichInfo
                          ? undefined
                          : "noopener noreferrer"
                      }
                    >
                      {/* Rank */} 
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        index < 3 ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground"
                      }`}>
                        {index + 1}
                      </span>

                      {/* Icon */} 
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-xs font-bold text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                        {(resource.icon && resource.icon.length <= 2) ? resource.icon : (resource.name?.charAt(0) || "?").toUpperCase()}
                      </span>

                      {/* Name + Desc */} 
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                            {resource.name}
                          </span>
                          {resource.isFree && (
                            <Badge className="flex-shrink-0 text-[10px] px-1 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-0">
                              Free
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {getEnhancedDescription(resource.name, resource.description, resource.category) ||
                          `${resource.categoryName || resource.category || "Free"} tool`.trim() ||
                          "Curated tool"}
                        </p>
                      </div>

                      {/* Category badge */} 
                      {resource.categoryName && (
                        <Badge
                          variant="secondary"
                          className="flex-shrink-0 text-[10px] px-1.5 py-0"
                        >
                          {resource.categoryName}
                        </Badge>
                      )}

                      {/* Arrow */} 
                      <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  );
                }
              )}
              {editorsPicks.length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No editor picks available yet.
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== Alternatives Tab — 紧凑列表 ===== */} 
          <TabsContent value="alternatives">
            <div className="rounded-2xl border border-white/15 bg-white/[0.65] shadow-lg shadow-black/[0.05] backdrop-blur-xl overflow-hidden dark:border-white/8 dark:bg-white/[0.04] dark:shadow-black/20">
              {alternatives.map((alt, index) => {
                // Show even if no exact FMHY resource match — still useful info 
                const resource = alt.freeToolResource;
                if (!alt.freeTool || alt.freeTool === "N/A") return null;
                const blocked = resource && shouldBlock(resource.name);
                if (blocked) return null;

                return (
                  <Link
                    key={index}
                    href={resource ? `/directory/resource/${resource.id}` : "#"}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/20 last:border-0"
                    target={resource ? undefined : "_blank"}
                    rel={resource ? undefined : "noopener noreferrer"}
                  >
                    {/* Rank */} 
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      index < 3 ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1}
                    </span>

                    {/* Paid → Free indicator */} 
                    <div className="flex-shrink-0 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground line-through truncate max-w-[80px]">
                          {alt.paidTool}
                        </span>
                        <ArrowRightLeft className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-medium text-primary truncate max-w-[100px]">
                          {alt.freeTool}
                        </span>
                      </div>
                    </div>

                    {/* Desc */} 
                    <p className="flex-1 text-xs text-muted-foreground truncate hidden md:block">
                      {resource
                        ? (getEnhancedDescription(resource.name, resource.description, resource.category) || `${resource.categoryName || resource.category || "Free"} tool`.trim() || `Free alternative`)
                        : `Free alternative to ${alt.paidTool}`}
                    </p>

                    {/* Arrow */} 
                    <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
              {alternatives.filter((a) => a.freeTool && a.freeTool !== "N/A" && !(a.freeToolResource && shouldBlock(a.freeToolResource.name))).length === 0 && (
                <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                  No alternatives available yet.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
