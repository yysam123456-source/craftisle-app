import { ResourcesClient } from "@/components/resources/resources-client";
import { Badge } from "@/components/ui/badge";
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

const DATE_MODIFIED = "2026-06-07";

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
    title: `${cat.name} | Free Resources | Craftisle`,
    description: `${cat.description}. Browse ${cat.count} free, compliant resources.`,
    keywords: [
      cat.name,
      "free resources",
      "free tools",
      cat.id.toLowerCase().replace("-", " "),
    ],
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
          <button className="mt-8">Back to Directory</button>
        </a>
      </section>
    );
  }

  const resources = getCategoryResources(category);

  // JSON-LD: CollectionPage + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${cat.name} — Free ${cat.name} Resources`,
    "description": cat.description,
    "url": `https://craftisle.app/directory/${category}`,
    "dateModified": DATE_MODIFIED,
    "publisher": {
      "@type": "Organization",
      "name": "Craftisle",
      "url": "https://craftisle.app",
    },
    "numberOfItems": resources.length,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://craftisle.app",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Directory",
          "item": "https://craftisle.app/directory",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cat.name,
          "item": `https://craftisle.app/directory/${category}`,
        },
      ],
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Header */}
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
              {resources.length} free resources in this category
            </p>
          </div>

          {/* Resource List */}
          {resources.length > 0 ? (
            <ResourcesClient resources={resources} category={cat} />
          ) : (
            <p className="text-muted-foreground">No resources found in this category.</p>
          )}
        </div>
      </section>
    </>
  );
}
