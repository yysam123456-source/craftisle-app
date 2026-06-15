import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllResources,
  getEditorsPicks,
  getRichInfoResourceIds,
} from "@/lib/fmhy-data";
import { Sparkles, Flame, ArrowRightLeft, ArrowRight, Star, ExternalLink } from "lucide-react";

/**
 * Featured With Tabs — 紧凑列表式布局
 * 合并 Editor's Picks + Quick Rankings + Popular Alternatives
 * 设计原则：紧凑、信息密度高、一行一个工具
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

/** 清洗 FMHY 原始描述文字
 *
 * FMHY 原始格式：'**, [link1](url), [link2](url) or [link3](url) - 实际描述'
 * 核心策略：取最后一个 "- " 之后的内容，那是真正有意义的分类/主题描述
 */
function cleanDescription(desc: string | undefined): string {
  if (!desc) return "";

  // 取最后一个 "- " 之后的内容（FMHY 的真正描述总在末尾）
  const lastDash = desc.lastIndexOf("- ");
  if (lastDash > desc.length * 0.4) {
    let result = desc.slice(lastDash + 2).trim();
    result = result.replace(/\[.*?\]\(.*?\)/g, " ").trim();
    result = result.replace(/\s{2,}/g, " ").trim();
    if (result.length >= 3)
      return result.length > 80 ? result.slice(0, 77) + "..." : result;
  }

  // 兜底：去掉所有链接和噪音符号
  let cleaned = desc
    .replace(/\[.*?\]\(.*?\)/g, "")
    .replace(/^\*+\s*/, "")
    .replace(/^[\/,\s]+/g, "")
    .replace(/\\/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.length > 80 ? cleaned.slice(0, 77) + "..." : cleaned;
}

// 获取 Trending 资源（按 GitHub Stars 排序）
function getTrendingResources(limit = 8) {
  const resources = getAllResources();
  const richSet = getRichInfoResourceIds();

  return resources
    .filter(
      (r) =>
        r.githubStars &&
        r.githubStars > 100 &&
        !shouldBlock(r.name)
    )
    .sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0))
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
    <section className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">
            Featured Tools
          </h2>
          <p className="text-muted-foreground text-sm">
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
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {trending.map((resource, index) => {
                const href = resource._hasRichInfo
                  ? `/directory/resource/${resource.id}`
                  : resource.url || "#";

                return (
                  <Link
                    key={resource.id}
                    href={href}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                    target={resource._hasRichInfo ? undefined : "_blank"}
                    rel={
                      resource._hasRichInfo
                        ? undefined
                        : "noopener noreferrer"
                    }
                  >
                    {/* Rank */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Icon */}
                    <span className="flex-shrink-0 text-base">
                      {resource.icon || "🔧"}
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
                        {cleanDescription(resource.description) ||
                          "Popular open-source tool"}
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
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {editorsPicks.map((resource, index) => {
                  const href = resource._hasRichInfo
                    ? `/directory/resource/${resource.id}`
                    : resource.url || "#";

                  return (
                    <Link
                      key={resource.id}
                      href={href}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
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
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>

                      {/* Icon */}
                      <span className="flex-shrink-0 text-base">
                        {resource.icon || "🔧"}
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
                          {cleanDescription(resource.description) ||
                            "Editor recommended tool"}
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
            <div className="rounded-xl border bg-card divide-y overflow-hidden">
              {alternatives.map((alt, index) => {
                if (!alt.freeToolResource) return null;

                const resource = alt.freeToolResource;
                if (shouldBlock(resource.name)) return null;

                const href = `/directory/resource/${resource.id}`;

                return (
                  <Link
                    key={index}
                    href={href}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>

                    {/* Paid → Free indicator */}
                    <div className="flex-shrink-0 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground line-through truncate max-w-[80px]">
                          {alt.paidTool}
                        </span>
                        <ArrowRight className="h-3 w-3 text-primary flex-shrink-0" />
                        <span className="font-medium text-primary truncate max-w-[100px]">
                          {alt.freeTool}
                        </span>
                      </div>
                    </div>

                    {/* Desc */}
                    <p className="flex-1 text-xs text-muted-foreground truncate hidden md:block">
                      {cleanDescription(resource.description) || "Free alternative"}
                    </p>

                    {/* Arrow */}
                    <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
              {alternatives.filter((a) => a.freeToolResource && !shouldBlock(a.freeToolResource.name)).length === 0 && (
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
