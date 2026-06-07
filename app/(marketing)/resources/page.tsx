import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/resources/category-grid";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { readFileSync } from "fs";
import { join } from "path";

export const metadata: Metadata = constructMetadata({
  title: "Resources | Craftisle",
  description:
    "15,000+ curated free resources — AI tools, learning resources, dev tools, privacy & security. 100% compliant, no signup required.",
});

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface Resource {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

function getIndexData(): { categories: Category[] } | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-index.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load index data:", err);
    return null;
  }
}

function getHotData(): { resources: Resource[] } | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-hot.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load hot data:", err);
    return null;
  }
}

export default async function ResourcesPage() {
  const indexData = getIndexData();
  const hotData = getHotData();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <>
      {/* Hero Section */}
      <section className="border-b bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Resources
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Free Resource Directory
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              {totalCount.toLocaleString()}+ curated compliant resources covering AI tools, learning, dev tools, and more
            </p>
            <div className="mt-8 max-w-2xl mx-auto">
              <ResourceSearchClient />
            </div>
          </div>
        </div>
      </section>

      {/* Hot Resources */}
      {hotResources.length > 0 && (
        <HotResources resources={hotResources} />
      )}

      {/* All Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              All Categories
            </h2>
            <p className="mt-1 text-muted-foreground">
              {totalCount.toLocaleString()} resources across {categories.length} categories
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold">
              Know a great free resource?
            </h2>
            <p className="mt-4 text-muted-foreground">
              If you discover a high-quality free resource, feel free to recommend it via Issues.
            </p>
            <a
              href="https://github.com/yysam123456/yysam123456-source/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="mt-8">
                Recommend <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
