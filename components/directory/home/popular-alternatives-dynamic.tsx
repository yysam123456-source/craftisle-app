import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

/**
 * Dynamic Popular Alternatives — auto-generated from FMHY data
 * Shows real free alternatives to popular paid tools
 * No hardcoded data — fully automated!
 */

export function PopularAlternativesDynamic() {
  // 从 FMHY 数据中提取最受欢迎的免费工具
  const resources = getAllResources();
  const richSet = getRichInfoResourceIds();
  
  // 筛选：免费/开源 + 高人气（有 description 且不是 "**"）
  const freeResources = resources
    .filter(r => (r.isFree || r.isOpenSource || r.isSelfHosted))
    .filter(r => r.description && r.description !== '**' && r.description.length > 30)
    .sort((a, b) => {
      // 排序：有详情页的优先 > GitHub Stars > 名称
      const aRich = richSet.has(a.id) ? 1 : 0;
      const bRich = richSet.has(b.id) ? 1 : 0;
      if (aRich !== bRich) return bRich - aRich;
      return (b.githubStars || 0) - (a.githubStars || 0);
    })
    .slice(0, 6); // 取前6个

  if (freeResources.length === 0) return null;

  // 生成图标和颜色（基于分类）
  const ICON_MAP = {
    'Artificial-Intelligence': '🤖',
    'Adblock': '🛡️',
    'Mobile': '📱',
    'Misc': '🔧',
    'Downloading': '⬇️',
    'Reading': '📚',
    'Gaming': '🎮',
    'Linux': '🐧',
    'Storage': '💾',
  };
  
  const COLOR_MAP = {
    'Artificial-Intelligence': 'purple',
    'Adblock': 'blue',
    'Mobile': 'green',
    'Misc': 'gray',
    'Downloading': 'orange',
    'Reading': 'yellow',
    'Gaming': 'pink',
    'Linux': 'orange',
    'Storage': 'indigo',
  };

  const BADGE_COLORS = {
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
      {freeResources.map((resource, index) => {
        const color = COLOR_MAP[resource.category] || 'gray';
        const icon = ICON_MAP[resource.category] || '🔧';
        const badgeClass = BADGE_COLORS[color] || '';
        const hasRich = richSet.has(resource.id);
        const href = hasRich 
          ? `/directory/resource/${resource.id}` 
          : resource.url || '#';

        return (
          <Link
            key={resource.id}
            href={href}
            className="group block"
            target={hasRich ? undefined : "_blank"}
            rel={hasRich ? undefined : "noopener noreferrer"}
          >
            <div className="rounded-xl border bg-card p-3 md:p-5 transition-all hover:border-primary/40 hover:shadow-md h-full">
              {/* Header: Icon + Category Badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <Badge className={badgeClass}>
                  {resource.categoryName || resource.category}
                </Badge>
                {resource.isOpenSource && (
                  <Badge variant="outline" className="text-xs">Open Source</Badge>
                )}
              </div>

              {/* Tool Name */}
              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                {resource.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {resource.description?.slice(0, 120) || "Popular free alternative"}
              </p>

              {/* Footer: Stars + Visit */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {resource.githubStars && (
                    <span className="inline-flex items-center gap-1">
                      ⭐ {(resource.githubStars || 0).toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-primary group-hover:underline">
                  {hasRich ? "View Details" : "Visit Site"} →
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
