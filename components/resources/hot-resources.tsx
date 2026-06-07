"use client";

import { useState, useMemo, useCallback } from "react";
import { ResourceCard } from "./resource-card";

interface Resource {
  id: string;
  category: string;
  categoryZh: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

interface HotResourcesProps {
  resources: Resource[];
}

export function HotResources({ resources }: HotResourcesProps) {
  const [showAll, setShowAll] = useState(false);
  const displayResources = showAll ? resources : resources.slice(0, 12);

  if (!resources || resources.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              🔥 热门资源
            </h2>
            <p className="mt-1 text-muted-foreground">
              精选高质量工具与资源
            </p>
          </div>
          {resources.length > 12 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-primary hover:underline"
            >
              {showAll ? "收起" : `查看全部 (${resources.length})`}
            </button>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayResources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              showCategory={true}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
