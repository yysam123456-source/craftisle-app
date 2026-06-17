"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";

interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryName: string;
}

export function RandomRecommendations() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRandom() {
    setLoading(true);
    try {
      const res = await fetch("/api/random-resources?count=6");
      const data = await res.json();
      setResources(data.resources || []);
    } catch (err) {
      console.error("Failed to fetch random resources:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRandom();
  }, []);

  if (loading) {
    return (
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">You Might Also Like</h2>
              <p className="mt-2 text-muted-foreground">Loading recommendations...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (resources.length === 0) return null;

  return (
    <section className="border-t py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">You Might Also Like</h2>
            <p className="mt-2 text-muted-foreground">Random recommendations, refresh to see more</p>
          </div>
          <Button variant="ghost" onClick={fetchRandom} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((res) => (
            <Link key={res.id} href={`/directory/resource/${res.id}`}>
              <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">{res.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {res.description || "No description available"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{res.categoryName}</span>
                    <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                      View Details <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
