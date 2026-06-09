"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResourceCard } from "@/components/resources/resource-card";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import type { Resource } from "@/lib/fmhy-data";

export function FavoritesClient() {
  const { favorites, isLoaded } = useFavorites();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (favorites.size === 0) {
      setLoading(false);
      return;
    }

    // Load resource data from fmhy-resources.json via a lightweight fetch
    // (only load the resources the user has favorited)
    fetch("/data/fmhy-resources.json")
      .then((r) => r.json())
      .then((data) => {
        const all: Resource[] = [];
        for (const catData of Object.values(data.categories as Record<string, { resources: Resource[] }>)) {
          all.push(...catData.resources);
        }
        const favorited = all.filter((r) => favorites.has(r.id));
        setResources(favorited);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [favorites, isLoaded]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading favorites...
      </div>
    );
  }

  if (favorites.size === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-2xl mb-4">⭐</p>
        <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
        <p className="text-muted-foreground mb-8">
          Star any resource in the directory to save it here.
        </p>
        <Link href="/directory">
          <Button>Browse Resources</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-6">
        {resources.length} saved resource{resources.length !== 1 ? "s" : ""}
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {resources.map((r) => (
          <ResourceCard key={r.id} resource={r} showCategory variant="default" />
        ))}
      </div>
    </>
  );
}
