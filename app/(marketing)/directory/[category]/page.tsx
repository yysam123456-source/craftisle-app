import { ResourcesClient } from "@/components/resources/resources-client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { CATEGORY_H2_CONTENT } from "@/lib/category-h2";
import { getAllCategories, getResourcesByCategory } from "@/lib/fmhy-data";
import { getDomainForCategory } from "@/lib/category-domains";
import { formatCategoryName } from "@/lib/unified-categories";
import { ChevronRight, Home } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
  source?: string;
}

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  categoryIcon?: string;
  name: string;
  url: string;
  description: string;
  source?: string;
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const DATE_MODIFIED = "2026-06-09";

export async function generateStaticParams() {
  const categories = getAllCategories();
  // 只预渲染前 20 个热门分类（减少 build 体积）
  return categories.slice(0, 20).map((cat) => ({ category: cat.id }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const categories = getAllCategories();
  const cat = categories.find((c) => c.id === category);

  if (!cat) {
    return constructMetadata({
      title: "Category Not Found | Resources | Craftisle",
      description: "This resource category does not exist.",
    });
  }

  const displayName = cat.name || formatCategoryName(cat.id);
  const count = cat.count || 0;

  const year = new Date().getFullYear();
  const longTailKeywords: Record<string, string[]> = {
    "Artificial-Intelligence": [
      `best free AI tools ${year}`,
      "free ChatGPT alternative no signup",
      "free AI image generator online",
      "best free machine learning tools",
      "Hugging Face alternative free",
    ],
    "Educational": [
      `best free learning platforms ${year}`,
      "free coding courses no signup",
      "Codecademy alternative free",
      "best free certification courses",
      "free programming tutorials",
    ],
    "Adblock": [
      `best free ad blockers ${year}`,
      "uBlock Origin alternative free",
      "free privacy extensions no tracking",
      "best free anti-tracking tools",
      "AdBlock alternative free",
    ],
    "Linux": [
      `best free Linux distros ${year}`,
      "Ubuntu alternative free",
      "best free Linux tools no signup",
      "free open source operating systems",
      "best free terminal tools",
    ],
  };

  return constructMetadata({
    title: `Best Free ${displayName} Resources ${year} (No Signup) | Craftisle`,
    description: `Discover ${count}+ free ${displayName.toLowerCase()} tools and resources. 100% free, no signup. Best alternative to paid ${displayName.toLowerCase()} software.`,
    keywords: longTailKeywords[category] || [
      `best free ${displayName.toLowerCase()} tools ${year}`,
      `free ${displayName.toLowerCase()} resources no signup`,
      `${displayName.toLowerCase()} tools free alternative`,
      `best free ${displayName.toLowerCase()} software`,
      "free resources",
      "free tools",
      "open source",
    ],
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const categories = getAllCategories();
  const cat = categories.find((c) => c.id === category);

  if (!cat) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">Category Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          This resource category does not exist.
        </p>
        <Link href="/directory">
          <span className="mt-8 inline-block px-6 py-2 rounded-md bg-primary text-primary-foreground">
            Back to Directory
          </span>
        </Link>
      </section>
    );
  }

  const resources = getResourcesByCategory(category) as Resource[];
  const h2Content = CATEGORY_H2_CONTENT[category] || null;
  const domainName = getDomainForCategory(category);
  const displayName = cat.name || formatCategoryName(cat.id);

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${displayName} — Free ${displayName} Resources`,
    description: cat.description || `${resources.length} free ${displayName.toLowerCase()} resources.`,
    url: `https://craftisle.app/directory/${category}`,
    dateModified: DATE_MODIFIED,
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.app",
    },
    numberOfItems: resources.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground flex items-center gap-1">
              <Home className="h-4 w-4" /> Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link href="/directory" className="hover:text-foreground">
              Directory
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{displayName}</span>
          </nav>

          {/* Category Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              {cat.source || "fmhy"}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {cat.icon || "📦"} {displayName}
            </h1>
            {cat.description ? (
              <p className="mt-2 text-muted-foreground">{cat.description}</p>
            ) : null}
            <p className="mt-1 text-sm text-muted-foreground">
              {resources.length} free resources in this category
            </p>
          </div>

          {/* SEO H2 */}
          {h2Content?.about ? (
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-4">
                About {displayName} Resources
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {h2Content.about}
              </p>
            </div>
          ) : null}

          {/* Resource List */}
          {resources.length > 0 ? (
            <ResourcesClient
              resources={resources}
              category={{
                id: cat.id,
                name: displayName,
                description: cat.description || "",
                icon: cat.icon || "📦",
                count: resources.length,
              }}
            />
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p>No resources found in this category.</p>
              <Link href="/directory" className="text-primary hover:underline mt-2 inline-block">
                Browse all categories
              </Link>
            </div>
          )}

          {/* FAQ */}
          {h2Content?.faq && h2Content.faq.length > 0 ? (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">
                FAQ: {displayName} Resources
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {h2Content.faq.map((item: { question: string; answer: string }, i: number) => (
                  <div key={i}>
                    <h3 className="font-semibold mb-2">{item.question}</h3>
                    <p className="text-sm text-muted-foreground">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Related Categories */}
          {h2Content?.related && h2Content.related.length > 0 ? (
            <div className="mt-16 pt-8 border-t">
              <h2 className="text-2xl font-bold mb-6">Related Categories</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {h2Content.related.map((relId: string) => {
                  const relCat = categories.find((c) => c.id === relId);
                  return relCat ? (
                    <Link
                      key={relId}
                      href={`/directory/${relId}`}
                      className="block rounded-lg border p-4 hover:border-primary hover:shadow-sm transition-colors"
                    >
                      <div className="font-semibold">
                        {relCat.icon || "📦"} {relCat.name || formatCategoryName(relCat.id)}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {relCat.count || 0} resources
                      </div>
                    </Link>
                  ) : null;
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
