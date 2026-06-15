import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllResources, getEditorsPicks, getQuickRankingsByCategory, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { Sparkles, Flame, ArrowRightLeft, ArrowRight } from "lucide-react";

/**
 * Featured With Tabs — 合并 Editor's Picks + Quick Rankings + Popular Alternatives
 * 用 Tab 切换，减少板块数量
 */

// 获取 Trending 资源（按 GitHub Stars 排序）
function getTrendingResources(limit = 8) {
  const resources = getAllResources();
  const richSet = getRichInfoResourceIds();
  
  return resources
    .filter(r => r.githubStars && r.githubStars > 100)
    .sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0))
    .slice(0, limit)
    .map(r => ({ ...r, _hasRichInfo: richSet.has(r.id) }));
}

// 获取热门替代品（从 alternatives.json 读取）
function getPopularAlternatives(limit = 8) {
  try {
    const fs = require("fs");
    const path = require("path");
    const altPath = path.join(process.cwd(), "public/data/alternatives.json");
    
    if (!fs.existsSync(altPath)) return [];
    
    const alternatives = JSON.parse(fs.readFileSync(altPath, "utf-8"));
    const resources = getAllResources();
    const richSet = getRichInfoResourceIds();
    
    // 取前 N 个替代关系
    const topAlternatives = Object.entries(alternatives)
      .slice(0, limit)
      .map(([paidTool, freeTools]: [string, any]) => ({
        paidTool,
        freeTool: freeTools[0] || "N/A",
        freeToolResource: resources.find(r => r.name === freeTools[0])
      }));
    
    return topAlternatives;
  } catch {
    return [];
  }
}

export function FeaturedWithTabs() {
  const editorsPicks = getEditorsPicks().slice(0, 8);
  const trending = getTrendingResources(8);
  const alternatives = getPopularAlternatives(8);
  
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Featured This Week
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Hand-picked tools, trending favorites, and the best free alternatives
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="trending" className="gap-2">
              <Flame className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="editors" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Editor's Picks
            </TabsTrigger>
            <TabsTrigger value="alternatives" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Alternatives
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {trending.map(resource => {
                const href = resource._hasRichInfo
                  ? `/directory/resource/${resource.id}`
                  : resource.url || '#';
                
                return (
                  <Link
                    key={resource.id}
                    href={href}
                    className="group block"
                    target={resource._hasRichInfo ? undefined : "_blank"}
                    rel={resource._hasRichInfo ? undefined : "noopener noreferrer"}
                  >
                    <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{resource.icon || '🔧'}</span>
                        {resource.isOpenSource && (
                          <Badge variant="outline" className="text-xs">Open Source</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description?.slice(0, 80) || "Popular tool"}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        {resource.githubStars && (
                          <span className="text-xs text-muted-foreground">
                            ⭐ {resource.githubStars.toLocaleString()}
                          </span>
                        )}
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Editor's Picks Tab */}
          <TabsContent value="editors">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {editorsPicks.map(resource => {
                const href = resource._hasRichInfo
                  ? `/directory/resource/${resource.id}`
                  : resource.url || '#';
                
                return (
                  <Link
                    key={resource.id}
                    href={href}
                    className="group block"
                    target={resource._hasRichInfo ? undefined : "_blank"}
                    rel={resource._hasRichInfo ? undefined : "noopener noreferrer"}
                  >
                    <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md h-full">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{resource.icon || '🔧'}</span>
                        {resource.isFree && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            Free
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description?.slice(0, 80) || "Editor's pick"}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </TabsContent>

          {/* Alternatives Tab */}
          <TabsContent value="alternatives">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {alternatives.map((alt, index) => {
                if (!alt.freeToolResource) return null;
                
                const resource = alt.freeToolResource;
                const href = `/directory/resource/${resource.id}`;
                
                return (
                  <Link
                    key={index}
                    href={href}
                    className="group block"
                  >
                    <div className="rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md h-full">
                      <div className="flex items-center gap-2 mb-2 text-sm">
                        <span className="font-medium text-muted-foreground line-through">
                          {alt.paidTool}
                        </span>
                        <span className="text-primary">→</span>
                        <span className="font-medium text-primary">
                          {alt.freeTool}
                        </span>
                      </div>
                      <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {resource.description?.slice(0, 80) || "Free alternative"}
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <span className="text-sm font-medium text-primary group-hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
