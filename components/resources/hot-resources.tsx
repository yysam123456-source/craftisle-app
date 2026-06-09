"use client";

import { useState, useMemo } from "react";
import { ResourceCard } from "./resource-card";

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  name: string;
  url: string;
  description: string;
}

interface HotResourcesProps {
  resources: Resource[];
}

export function HotResources({ resources }: HotResourcesProps) {
  const [showAll, setShowAll] = useState(false);
  const displayResources = showAll ? resources : resources.slice(0, 10);

  if (!resources || resources.length === 0) return null;

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Hot Resources
            </h2>
            <p className="mt-2 text-muted-foreground text-base max-w-2xl">
              Curated high-quality tools and resources worth discovering — useful utilities you may not have heard of yet
            </p>
          </div>
          {resources.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors flex-shrink-0"
            >
              {showAll ? "Show Less" : `View All ${resources.length}`}
            </button>
          )}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayResources.map((resource) => (
            <ResourceCard
              key={resource.id || resource.url}
              resource={resource}
              showCategory={true}
              variant="large"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
