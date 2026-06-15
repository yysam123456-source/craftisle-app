import Link from "next/link";
import { getAllCategories, getAllResources } from "@/lib/fmhy-data";
import { ArrowRight, LayoutGrid } from "lucide-react";

/**
 * Top Categories — 简化版分类浏览
 * 只展示 Top 8-10 个分类（按资源数量排序）
 * 对标 Product Hunt / G2 的简洁分类入口
 */

// 分类图标映射
const CATEGORY_ICONS = {
  'Artificial-Intelligence': '🤖',
  'Adblock': '🛡️',
  'Mobile': '📱',
  'Misc': '🔧',
  'Downloading': '⬇️',
  'Reading': '📚',
  'Gaming': '🎮',
  'Linux': '🐧',
  'Storage': '💾',
  'Media': '🎬',
  'Privacy': '🔒',
  'Development': '💻',
};

// 分类颜色映射
const CATEGORY_COLORS = {
  'Artificial-Intelligence': 'blue',
  'Adblock': 'red',
  'Mobile': 'green',
  'Misc': 'gray',
  'Downloading': 'orange',
  'Reading': 'yellow',
  'Gaming': 'pink',
  'Linux': 'orange',
  'Storage': 'indigo',
  'Media': 'purple',
  'Privacy': 'green',
  'Development': 'blue',
};

export function TopCategories() {
  const categories = getAllCategories();
  const resources = getAllResources();
  
  // 按资源数量排序，取前 8 个
  const topCategories = categories
    .map(cat => ({
      ...cat,
      count: resources.filter(r => r.category === cat.id).length,
      icon: CATEGORY_ICONS[cat.id] || '🔧',
      color: CATEGORY_COLORS[cat.id] || 'gray',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  
  if (topCategories.length === 0) return null;
  
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Browse by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore 200+ categories of free and open-source tools
          </p>
        </div>

        {/* Category Grid — 2 rows x 4 cols */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {topCategories.map(cat => {
            const href = cat.slug 
              ? `/directory/best/${cat.slug}` 
              : `/directory/best/${cat.id.toLowerCase()}`;
            
            return (
              <Link
                key={cat.id}
                href={href}
                className="group block"
              >
                <div className="rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {cat.count} tools
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Link
            href="/directory/best"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <LayoutGrid className="h-4 w-4" />
            View All 200+ Categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
