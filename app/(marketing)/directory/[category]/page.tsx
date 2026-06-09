import { ResourcesClient } from "@/components/resources/resources-client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { CATEGORY_H2_CONTENT } from "@/lib/category-h2";
import { getAllCategories, getResourcesByCategory } from "@/lib/fmhy-data";
import { getDomainForCategory } from "@/lib/category-domains";
import { formatCategoryName } from "@/lib/unified-categories";

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
  return categories.map((cat) => ({ category: cat.id }));
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

  return constructMetadata({
    title: `Best Free ${displayName} Resources ${new Date().getFullYear()} | Craftisle`,
    description: `Discover ${count} free ${displayName.toLowerCase()} tools and resources. ${cat.description || "100% free, no signup required."}`,
    keywords: [
      `free ${displayName.toLowerCase()}`,
      `best ${displayName.toLowerCase()} resources`,
      `${displayName.toLowerCase()} tools free`,
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
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://craftisle.app",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Directory",
          item: "https://craftisle.app/directory",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: displayName,
          item: `https://craftisle.app/directory/${category}`,
        },
      ],
    },
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
          <nav className="mb-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/directory" className="hover:text-primary">Directory</Link>
            {domainName ? (
              <>
                <span className="mx-2">/</span>
                <Link
                  href={`/directory/domain/${cat.id.split("-")[0] === "ffd" ? "development" : cat.id.split("-")[0] === "sh" ? "productivity" : cat.id.split("-")[0] === "pa" ? "misc" : "misc"}`}
                  className="hover:text-primary"
                >
                  {domainName}
                </Link>
              </>
            ) : null}
            <span className="mx-2">/</span>
            <span className="text-foreground">{displayName}</span>
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
