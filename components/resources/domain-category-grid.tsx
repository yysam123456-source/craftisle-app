"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { DomainGroup } from "@/lib/category-domains";
import type { Category } from "@/lib/fmhy-data";

const colorMap: Record<number, string> = {
  0: "from-blue-400 to-indigo-500",
  1: "from-green-400 to-teal-500",
  2: "from-purple-400 to-pink-500",
  3: "from-orange-400 to-amber-500",
};

interface DomainCategoryGridProps {
  domainGroups: DomainGroup[];
  allCategories: Category[];
}

function DomainCategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/directory/${category.id}`}
      className="group flex items-center gap-4 p-4 rounded-lg border bg-muted/20 hover:bg-muted/40 hover:border-primary/30 transition-all"
    >
      <div className="text-2xl w-10 text-center">{category.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-medium group-hover:text-primary transition-colors">
          {category.name}
        </div>
        {category.description ? (
          <div className="text-sm text-muted-foreground line-clamp-1">
            {category.description}
          </div>
        ) : null}
      </div>
      <Badge variant="secondary" className="shrink-0">
        {category.count?.toLocaleString() || 0} resources
      </Badge>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[colorIdx % 4]} flex items-center justify-center text-2xl shrink-0`}
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

      {isExpanded ? (
        <div className="px-5 pb-5 space-y-3 pt-1">
          {categories.map((cat) => (
            <DomainCategoryCard key={cat.id} category={cat} />
          ))}
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

  return (
    <div className="space-y-6">
      {domainGroups.map((domain, idx) => {
        const domainCategories = domain.categoryIds
          .map((id) => allCategories.find((c) => c.id === id))
          .filter(Boolean) as Category[];

        return (
          <DomainSection
            key={domain.id}
            domain={domain}
            categories={domainCategories}
            colorIdx={idx}
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
  );
}
