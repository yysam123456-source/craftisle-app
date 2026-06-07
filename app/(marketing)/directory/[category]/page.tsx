import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/resources/category-grid";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourcesClient } from "@/components/resources/resources-client";
import { ResourceSearchClientWrapper } from "@/components/resources/resource-search-client-wrapper";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { readFileSync } from "fs";
import { join } from "path";

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

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

// Build-time: read files directly (no fetch)
function loadJson<T>(filename: string): T | null {
  try {
    const filePath = join(process.cwd(), "public", "data", filename);
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getIndexData(): { categories: Category[] } | null {
  return loadJson("fmhy-index.json");
}

function getHotData(): { resources: Resource[] } | null {
  return loadJson("fmhy-hot.json");
}

function getCategoryResources(categoryId: string): Resource[] {
  const data = loadJson<{ categories: Record<string, { resources: Resource[] }> }>("fmhy-resources.json");
  return data?.categories?.[categoryId]?.resources || [];
}

export async function generateStaticParams() {
  const indexData = getIndexData();
  return (
    indexData?.categories?.map((cat) => ({ category: cat.id })) || []
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const indexData = getIndexData();
  const cat = indexData?.categories?.find((c) => c.id === category);

  if (!cat) {
    return constructMetadata({
      title: "Category Not Found | Resources | Craftisle",
      description: "This resource category does not exist.",
    });
  }

  return constructMetadata({
    title: `${cat.name} | Resources | Craftisle`,
    description: `${cat.description}. ${cat.count} free resources.`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const indexData = getIndexData();
  const hotData = getHotData();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];
  const categoryInfo = categories.find((c) => c.id === category);
  const resources = getCategoryResources(category);

  if (!categoryInfo) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">Category Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          This resource category does not exist.
        </p>
        <a href="/resources">
          <Button className="mt-8">Back to Resources</Button>
        </a>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Resources
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {categoryInfo.icon} {categoryInfo.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {categoryInfo.description}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {categoryInfo.count} resources
            </p>
            <div className="mt-6 max-w-xl">
              <ResourceSearchClientWrapper />
            </div>
          </div>
        </div>
      </section>

      {/* Hot Resources */}
      {hotResources.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              Hot Resources
            </h2>
            <HotResources resources={hotResources.slice(0, 12)} />
          </div>
        </section>
      )}

      {/* All Categories */}
      <section className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            All Categories
          </h2>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Category Resource List */}
      <section className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            {categoryInfo.icon} {categoryInfo.name} — All Resources
          </h2>
          <ResourcesClient resources={resources} category={categoryInfo} />
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
