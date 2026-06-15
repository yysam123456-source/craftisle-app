import Link from "next/link";
import { getAllCategories } from "@/lib/fmhy-data";
import { ArrowRight, LayoutGrid } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Categories — Craftisle Directory",
  description:
    "Browse 200+ categories of free and open-source tools. Find exactly what you need.",
};

/** 分类图标映射 */
const CATEGORY_ICONS: Record<string, string> = {
  AI: "\u{1F916}",
  Video: "\u{1F3AC}",
  Design: "\u{1F3A8}",
  Productivity: "\u{1F4DD}",
  Communication: "\u{1F4AC}",
  Development: "\u{1F4BB}",
  Marketing: "\u{1F4E2}",
  Music: "\u{1F3B5}",
  Security: "\u{1F512}",
  Business: "\u{1F3E2}",
  Education: "\u{1F393}",
  Reading: "\u{1F4D6}",
  Gaming: "\u{1F3AE}",
  Mobile: "\u{1F4F1}",
  Linux: "\u{1F427}",
  Adblock: "\u{1F6AB}\uFE0F",
  Downloading: "\u{2B07}\uFE0F",
  Miscellaneous: "\u{1F527}",
};

function getIcon(name: string): string {
  // 精确匹配
  if (CATEGORY_ICONS[name]) return CATEGORY_ICONS[name];
  // 模糊匹配
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return icon;
  }
  return "\u{1F517}"; // 默认链接图标
}

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Header */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/directory" className="hover:text-primary transition-colors">
          Directory
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground font-medium">Categories</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">All Categories</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Browse {categories.length}+ categories of free and open-source tools.
          Each category is updated daily from multiple data sources.
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/directory/best/${cat.id}`}
            className="group flex items-center gap-2.5 rounded-lg border bg-card p-3.5 transition-all hover:border-primary/40 hover:shadow-sm"
          >
            <span className="text-xl flex-shrink-0">{getIcon(cat.name)}</span>
            <div className="min-w-0">
              <span className="block text-sm font-medium group-hover:text-primary transition-colors truncate">
                {cat.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {cat.count || ""}{typeof cat.count === "number" ? " tools" : ""}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="mt-12 pt-8 border-t text-center">
        <p className="text-muted-foreground mb-3">
          Can&apos;t find what you&apos;re looking for?
        </p>
        <Link
          href="/directory"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Back to Directory <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
