import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  GlassCard,
  GlassCardContent
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  Flame, Star, TrendingUp, GitCompareArrows,
  MessageSquare, Sparkles, Zap, Palette, NotebookPen, Wrench, Clock,
  ArrowRight, ArrowRightLeft, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  viewAllLink?: string;
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

/** 每个板块最多显示的条目数 */
const MAX_ITEMS_PER_BLOCK = 4;

export function DynamicHomeBlocks({ blocks, lastUpdated }: DynamicHomeBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-20 top-1/4 h-[400px] w-[400px] rounded-full bg-orange-500/5 blur-[100px]" />
        <div className="absolute -left-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-red-500/10 px-5 py-2 text-sm font-semibold text-orange-600 dark:text-orange-400 backdrop-blur-sm">
            <Flame className="h-4 w-4" />
            Trending Now
            <Sparkles className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Trending{" "}
            <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
              Now
            </span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Updated weekly &middot; Real data
            {lastUpdated && (
              <span className="ml-1"> &middot; {new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            )}
          </p>
        </div>

        {/* 网格卡片布局：桌面 3列 / 平板 2列 / 手机 1列 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {blocks.map((block) => (
            <MiniBlockCard key={block.id} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 单个迷你板块卡片 —— 玻璃拟态 + hover 动效 */
function MiniBlockCard({ block }: { block: HomeBlock }) {
  const Icon = BLOCK_ICONS[block.id] || Sparkles;
  const gradient = BLOCK_GRADIENTS[block.id] || "from-primary to-primary/60";

  // comparison-list 类型
  if (block.type === "comparison-list" && block.comparisons) {
    const items = block.comparisons.filter((c) => c.freeAlternativeName).slice(0, MAX_ITEMS_PER_BLOCK);
    if (items.length === 0) return null;

    return (
      <GlassCard className="group relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:border-white/30 dark:hover:border-white/15">
        {/* Hover 光晕效果 */}
        <div
          className="pointer-events-none absolute inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `linear-gradient(135deg, ${gradient.split(' ')[0].replace('from-', '')}15, transparent 40%, transparent 60%, ${gradient.split(' ')[1].replace('to-', '')}15)`,
            filter: "blur(8px)",
          }}
        />

        <GlassCardContent className="relative z-10 p-4 flex flex-col h-full">
          {/* 卡片标题栏 */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{
                "--hover-from": gradient.split(' ')[0].replace('from-', ''),
                "--hover-to": gradient.split(' ')[1].replace('to-', ''),
              } as React.CSSProperties}>
                {block.title}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate">{block.subtitle}</p>
            </div>
          </div>

          {/* 对比条目 */}
          <div className="space-y-2 flex-1">
            {items.map((comp, i) => {
              const href = comp.freeAlternativeId
                ? `/directory/resource/${comp.freeAlternativeId}`
                : `/directory/search?q=${encodeURIComponent(comp.paidTool)}`;
              return (
                <Link key={i} href={href} className="group/no-underline">
                  <div className="flex items-center gap-2 rounded-md px-2.5 py-2 hover:bg-muted/60 transition-colors">
                    <span className="text-xs text-muted-foreground line-through truncate flex-shrink-0 max-w-[28%]">
                      {comp.paidTool}
                    </span>
                    <ArrowRightLeft className="h-3 w-3 text-primary/60 flex-shrink-0" />
                    <span className="text-xs font-medium truncate flex-1 group-hover:text-primary transition-colors">
                      {comp.freeAlternativeName}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View all */}
          <Link href={block.viewAllLink || "/directory/compare"} className="no-underline mt-3 pt-2 border-t">
            <span className="text-[11px] font-medium text-primary flex items-center gap-1 hover:underline">
              Compare all tools <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </GlassCardContent>
      </GlassCard>
    );
  }

  // resource-list 类型
  const resources = (block.resources || []).slice(0, MAX_ITEMS_PER_BLOCK);
  if (resources.length === 0) return null;

  // 根据 block.viewAllLink 或 block 类型决定 View all 链接
  const getViewAllHref = () => {
    // 优先使用数据中的 viewAllLink
    if (block.viewAllLink) return block.viewAllLink;
    // fallback：根据 block id 生成
    switch (block.id) {
      case "weekly-hottest":
      case "rising-stars":
        return `/directory/best/${block.id}`;
      case "most-compared":
        return "/directory/compare";
      case "best-free-alternatives":
        return "/directory/alternatives/notion";
      default:
        return `/directory/search?q=${encodeURIComponent(block.title.replace(/\s+/g, " "))}`;
    }
  };

  return (
    <GlassCard className="group relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:border-white/30 dark:hover:border-white/15">
      {/* Hover 光晕效果 */}
      <div
        className="pointer-events-none absolute inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(135deg, ${gradient.split(' ')[0].replace('from-', '')}15, transparent 40%, transparent 60%, ${gradient.split(' ')[1].replace('to-', '')}15)`,
          filter: "blur(8px)",
        }}
      />

      <GlassCardContent className="relative z-10 p-4 flex flex-col h-full">
        {/* 卡片标题栏 */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text" style={{
              "--hover-from": gradient.split(' ')[0].replace('from-', ''),
              "--hover-to": gradient.split(' ')[1].replace('to-', ''),
            } as React.CSSProperties}>
              {block.title}
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">{block.subtitle}</p>
          </div>
        </div>

        {/* 资源条目 —— 紧凑单行 */}
        <div className="space-y-0.5 flex-1">
          {resources.map((resource, index) => {
            const href = `/directory/resource/${resource.id}`;
            return (
              <Link key={resource.id} href={href} className="group/no-underline">
                <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-muted/60 transition-colors">
                  {/* 排名圆点 */}
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    index < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  {/* 名称 */}
                  <span className="text-xs font-medium truncate flex-1 group-hover:text-primary transition-colors leading-relaxed">
                    {resource.name}
                  </span>
                  {/* Stars */}
                  {resource.githubStars && resource.githubStars > 0 ? (
                    <span className="flex-shrink-0 text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      {resource.githubStars > 999 ? `${(resource.githubStars / 1000).toFixed(1)}k` : resource.githubStars}
                    </span>
                  ) : (
                    <ExternalLink className="flex-shrink-0 h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all */}
        <Link href={getViewAllHref()} className="no-underline mt-3 pt-2 border-t">
          <span className="text-[11px] font-medium text-primary flex items-center gap-1 hover:underline">
            View all {block.resources?.length || ""} &rarr; <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </GlassCardContent>
    </GlassCard>
  );
}
