"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { DomainGroup } from "@/lib/category-domains";
import type { Category } from "@/lib/fmhy-data";
import { DOMAINS } from "@/lib/unified-categories";

const colorMap: Record<number, string> = {
  0: "from-blue-400 to-indigo-500",
  1: "from-purple-400 to-violet-500",
  2: "from-orange-400 to-red-500",
  3: "from-red-400 to-rose-500",
  4: "from-pink-400 to-rose-400",
  5: "from-emerald-400 to-teal-500",
  6: "from-amber-400 to-yellow-500",
  7: "from-cyan-400 to-blue-500",
  8: "from-green-400 to-emerald-500",
  9: "from-sky-400 to-cyan-500",
  10: "from-lime-400 to-green-500",
  11: "from-gray-400 to-slate-500",
};

interface DomainCategoryGridProps {
  domainGroups: DomainGroup[];
  allCategories: Category[];
}

function DomainCategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/directory/${category.id}`}
      className="group flex items-center gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all"
    >
      <div className="text-xl w-8 text-center shrink-0">
        {category.icon || "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm group-hover:text-primary transition-colors truncate">
          {category.name}
        </div>
        {category.description ? (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {category.description}
          </div>
        ) : null}
      </div>
      <Badge variant="secondary" className="shrink-0 text-xs">
        {category.count?.toLocaleString() || 0}
      </Badge>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

function DomainSection({
  domain,
  categories,
  colorIdx,
  isExpanded,
  onToggle,
}: {
  domain: DomainGroup;
  categories: Category[];
  colorIdx: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[colorIdx % 12]} flex items-center justify-center text-2xl shrink-0`}
        >
          {domain.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg">{domain.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {domain.description}
          </p>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-muted-foreground">
              {categories.length} categories
            </span>
            <span className="text-xs text-muted-foreground">
              {domain.totalResources.toLocaleString()} resources
            </span>
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </div>
      </button>

      {isExpanded && categories.length > 0 ? (
        <div className="px-5 pb-5 pt-1">
          <div className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => (
              <DomainCategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DomainCategoryGrid({
  domainGroups,
  allCategories,
}: DomainCategoryGridProps) {
  const [expandedDomain, setExpandedDomain] = useState<string | null>(
    domainGroups[0]?.id || null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return domainGroups;
    const q = searchQuery.toLowerCase();
    return domainGroups.filter((domain) => {
      const domainMatch =
        domain.name.toLowerCase().includes(q) ||
        domain.description.toLowerCase().includes(q);
      if (domainMatch) return true;

      const domainCats = domain.categoryIds
        .map((id) => allCategories.find((c) => c.id === id))
        .filter(Boolean) as Category[];
      return domainCats.some(
        (cat) =>
          cat.name.toLowerCase().includes(q) ||
          (cat.description && cat.description.toLowerCase().includes(q)),
      );
    });
  }, [domainGroups, allCategories, searchQuery]);

  return (
    <div>
      {/* Search filter */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-6">
        {filtered.map((domain, idx) => {
          const domainCats = domain.categoryIds
            .map((id) => allCategories.find((c) => c.id === id))
            .filter(Boolean) as Category[];

          // Skip empty domains
          if (domainCats.length === 0) return null;

          return (
            <DomainSection
              key={domain.id}
              domain={domain}
              categories={domainCats}
              colorIdx={idx % 12}
              isExpanded={expandedDomain === domain.id}
              onToggle={() =>
                setExpandedDomain(
                  expandedDomain === domain.id ? null : domain.id,
                )
              }
            />
          );
        })}
      </div>
    </div>
  );
}
