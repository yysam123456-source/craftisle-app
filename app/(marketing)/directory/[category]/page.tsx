import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const cat = indexData?.categories?.find((c) => c.id === category);

  if (!cat) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">Category Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          This resource category does not exist.
        </p>
        <a href="/directory">
          <Button className="mt-8">Back to Directory</Button>
        </a>
      </section>
    );
  }

  const resources = getCategoryResources(category);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4">
            Resources
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {cat.icon} {cat.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {cat.description}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {resources.length} resources
          </p>
        </div>

        {/* Search within category */}
        <div className="mb-8 max-w-xl">
          <ResourceSearchClientWrapper />
        </div>

        {/* Resource List */}
        {resources.length > 0 ? (
          <ResourcesClient resources={resources} category={cat} />
        ) : (
          <p className="text-muted-foreground">No resources found in this category.</p>
        )}
      </div>
    </section>
  );
}
