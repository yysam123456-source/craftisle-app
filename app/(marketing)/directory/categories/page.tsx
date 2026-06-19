import Link from "next/link";
import { getAllCategories, getAllResources } from "@/lib/fmhy-data";
import { ArrowRight, LayoutGrid, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Categories Page — 全部分类浏览
 * 升级：玻璃拟态 + 渐变图标 + hover 动效
 */

// 分类图标映射（使用 lucide-react）
import type { LucideProps } from "lucide-react";
import {
  BotMessageSquare,
  ShieldQuestion,
  Smartphone,
  Download,
  BookOpen,
  Gamepad2,
  Terminal,
  HardDrive,
  Tv,
  Lock,
  Code2,
  Globe,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.FC<LucideProps>> = {
  'Artificial-Intelligence': BotMessageSquare,
  'Adblock': ShieldQuestion,
  'Mobile': Smartphone,
  'Misc': Globe,
  'Downloading': Download,
  'Reading': BookOpen,
  'Gaming': Gamepad2,
  'Linux': Terminal,
  'Storage': HardDrive,
  'Media': Tv,
  'Privacy': Lock,
  'Development': Code2,
};

// 渐变色映射
const CATEGORY_GRADIENT_MAP: Record<string, { from: string; to: string }> = {
  'Artificial-Intelligence': { from: "#3b82f6", to: "#8b5cf6" },
  'Adblock': { from: "#ef4444", to: "#f97316" },
  'Mobile': { from: "#22c55e", to: "#10b981" },
  'Misc': { from: "#6b7280", to: "#9ca3af" },
  'Downloading': { from: "#f97316", to: "#eab308" },
  'Reading': { from: "#eab308", to: "#f59e0b" },
  'Gaming': { from: "#ec4899", to: "#a855f7" },
  'Linux': { from: "#f97316", to: "#ef4444" },
  'Storage': { from: "#6366f1", to: "#3b82f6" },
  'Media': { from: "#a855f7", to: "#ec4899" },
  'Privacy': { from: "#22c55e", to: "#10b981" },
  'Development': { from: "#3b82f6", to: "#06b6d4" },
};

export default function CategoriesPage() {
  const categories = getAllCategories();
  const resources = getAllResources();

  // 按资源数量排序
  const sortedCategories = categories
    .map(cat => ({
      ...cat,
      count: resources.filter(r => r.category === cat.id).length,
      icon: CATEGORY_ICON_MAP[cat.id] || Globe,
      gradient: CATEGORY_GRADIENT_MAP[cat.id] || { from: "#6b7280", to: "#9ca3af" },
    }))
    .sort((a, b) => b.count - a.count);

  if (sortedCategories.length === 0) return null;

  return (
    <section className="relative overflow-hidden py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/4 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 px-5 py-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 backdrop-blur-sm">
            <LayoutGrid className="h-4 w-4" />
            All Categories
            <FolderOpen className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Browse All{" "}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              Categories
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {sortedCategories.length} categories of free and open-source tools
          </p>
        </div>

        {/* Category Grid — 3 cols */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12">
          {sortedCategories.map((cat) => {
            const href = cat.slug
              ? `/directory/best/${cat.slug}`
              : `/directory/best/${cat.id.toLowerCase()}`;
            const Icon = cat.icon;
            const gradient = cat.gradient;

            return (
              <Link
                key={cat.id}
                href={href}
                className="group block"
              >
                {/* 玻璃拟态卡片容器 */}
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30 dark:group-hover:border-white/15">
                  {/* Hover 光晕效果 */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${gradient.from}15, transparent 40%, transparent 60%, ${gradient.to}15)`,
                      filter: "blur(8px)",
                    }}
                  />

                  <div className="relative p-5 sm:p-6">
                    {/* 图标 + 标题行 */}
                    <div className="mb-4 flex items-start gap-3.5">
                      {/* 图标容器 — 渐变圆形背景 */}
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted/50 shadow-lg ring-1 ring-black/[0.06] transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-xl group-hover:ring-black/[0.08]"
                      >
                        <Icon
                          className="h-5 w-5 transition-transform duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text sm:text-lg"
                          style={{
                            "--hover-from": gradient.from,
                            "--hover-to": gradient.to,
                          } as React.CSSProperties}
                        >
                          {cat.name}
                        </h3>
                      </div>
                    </div>

                    {/* 描述/计数 */}
                    <p className="mb-4 leading-relaxed text-sm text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80">
                      {cat.count} free tools available
                    </p>

                    {/* 底部：工具数量 + CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 transition-colors group-hover:border-primary/10 group-hover:bg-primary/5 group-hover:text-foreground/70">
                        <LayoutGrid className="h-3 w-3" />
                        {cat.count} tools
                      </span>

                      {/* CTA — 渐变色滑入 */}
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-1.5"
                        style={{
                          background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Explore
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: gradient.from }} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back to Directory */}
        <div className="text-center">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowRight className="h-4 w-4" />
            Back to Directory
          </Link>
        </div>
      </div>
    </section>
  );
}
