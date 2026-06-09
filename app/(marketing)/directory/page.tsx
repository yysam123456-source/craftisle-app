import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DomainCategoryGrid } from "@/components/resources/domain-category-grid";
import { getDomainGroups } from "@/lib/category-domains";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { ArrowRight, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { constructMetadata } from "@/lib/utils";
import { getAllCategories, getHotResources, getSources, getStats } from "@/lib/fmhy-data";

export const metadata: Metadata = constructMetadata({
  title: "Free Resource Directory | 10,000+ Curated Free Tools, APIs & Software | Craftisle",
  description:
    "Discover 10,000+ curated free resources for developers, creators, and learners. Free AI tools, public APIs, self-hosted software, dev tools, online courses, privacy software, and more. 100% free, open-source, no signup required.",
  keywords: [
    "free resource directory",
    "free tools directory",
    "free software list",
    "open source tools directory",
    "best free online tools",
    "free AI tools directory",
    "free developer tools",
    "free learning resources",
    "free public APIs directory",
    "free self-hosted software",
    "free privacy tools",
    "free cloud storage tools",
    "curated free software",
    "no signup free tools",
  ],
});

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
}

function getIndexData(): { categories: Category[] } | null {
  try {
    const categories = getAllCategories();
    return { categories };
  } catch {
    return null;
  }
}

function getHotData(): { resources: Resource[] } | null {
  try {
    return { resources: getHotResources(8) };
  } catch {
    return null;
  }
}

const DATE_PUBLISHED = "2026-06-07";
const DATE_MODIFIED = "2026-06-07";

export default async function ResourcesPage() {
  const indexData = getIndexData();
  const hotData = getHotData();
  const sources = getSources();
  const stats = getStats();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];
  const totalCount = stats.total || categories.reduce((sum, c) => sum + (c.count || 0), 0);

  // Group categories by source
  const fmhyCategories = categories.filter(c => !c.source || c.source === "fmhy");
  const sourceCategories: Record<string, { source: ReturnType<typeof getSources>[0]; categories: Category[] }> = {};
  for (const src of sources) {
    const cats = src.id === "fmhy" ? fmhyCategories : getAllCategories(src.id);
    sourceCategories[src.id] = { source: src, categories: cats };
  }

  // Structured data: CollectionPage with Breadcrumb + FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["CollectionPage", "FAQPage"],
    "name": "Free Resource Directory",
    "description": `6,000+ curated free resources for developers and creators. Covers AI tools, learning platforms, dev tools, privacy & security, cloud storage, and more.`,
    "url": "https://craftisle.app/directory",
    "datePublished": DATE_PUBLISHED,
    "dateModified": DATE_MODIFIED,
    "publisher": {
      "@type": "Organization",
      "name": "Craftisle",
      "url": "https://craftisle.app",
      "logo": {
        "@type": "ImageObject",
        "url": "https://craftisle.app/logo.png",
      },
    },
    "numberOfItems": totalCount,
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
          "name": "Resource Directory",
          "item": "https://craftisle.app/directory",
        },
      ],
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalCount,
      "itemListElement": categories.slice(0, 14).map((cat, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "name": cat.name,
        "description": cat.description,
        "url": `https://craftisle.app/directory/${cat.id}`,
      })),
    },
    "mainEntityOfPage": {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Craftisle Resource Directory?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Craftisle Resource Directory is a curated collection of 6,000+ free, compliant tools and resources for developers, creators, and learners. All resources are manually reviewed to ensure they are free, open-source, or have a free tier with no mandatory signup.",
          },
        },
        {
          "@type": "Question",
          "name": "Are all resources in the directory free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. Every resource listed in the Craftisle directory is free to use, open-source, or offers a free tier. We do not include resources that require payment or mandatory account creation.",
          },
        },
        {
          "@type": "Question",
          "name": "How are resources categorized?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Resources are organized into 14 categories: AI Tools, Education, Ad Blocking, Linux, Miscellaneous, Reading, Mobile, Storage, Gaming, Music, Streaming, Non-English, Downloading, and Torrenting. Each category contains hundreds of carefully selected tools.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I suggest a resource to be added?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! If you know a high-quality free resource that is not yet listed, you can suggest it by opening an issue on our GitHub repository. We review all suggestions for compliance and quality before adding them to the directory.",
          },
        },
        {
          "@type": "Question",
          "name": "What does 'compliant' mean in the resource directory?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Compliant means the resource does not involve piracy, cracking, adult content, or other non-compliant materials. We only list resources that respect intellectual property rights and are safe to use.",
          },
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
              {totalCount.toLocaleString()}+ curated free resources across 4 sources — FMHY, Free for Dev, Public APIs, and Self-Hosted software
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

      {/* My Favorites shortcut */}
      <section className="py-6 border-b bg-yellow-50/40 dark:bg-yellow-900/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
              <div>
                <p className="font-semibold">My Favorites</p>
                <p className="text-sm text-muted-foreground">Quickly access your saved resources</p>
              </div>
            </div>
            <Link href="/directory/favorites">
              <Button variant="outline" size="sm" className="gap-1">
                View Favorites <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Source Tabs */}
      <section className="py-8 border-b bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Explore {totalCount.toLocaleString()}+ Resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {sources.map((src) => {
              const data = sourceCategories[src.id];
              const catCount = data?.categories.length || 0;
              if (catCount === 0 && src.id !== "fmhy") return null;
              return (
                <a
                  key={src.id}
                  href={`#source-${src.id}`}
                  className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{src.icon}</span>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {src.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {src.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{src.resourceCount.toLocaleString()} resources</span>
                    <span>{catCount} categories</span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Categories — Domain Grouped */}
      <section className="py-16" id="categories">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              All Categories
            </h2>
            <p className="mt-1 text-muted-foreground">
              {totalCount.toLocaleString()} resources across {categories.length} categories
            </p>
          </div>
          <DomainCategoryGrid
            domainGroups={getDomainGroups(categories)}
            allCategories={categories}
          />
        </div>
      </section>

      {/* FAQ Section (for users + AI citation) */}
      <section className="border-t bg-muted/20 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-base">What is Craftisle Resource Directory?</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Craftisle Resource Directory is a curated collection of 6,000+ free, compliant tools and resources for developers, creators, and learners. All resources are manually reviewed to ensure they are free, open-source, or have a free tier with no mandatory signup.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-base">Are all resources in the directory free?</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Yes. Every resource listed in the Craftisle directory is free to use, open-source, or offers a free tier. We do not include resources that require payment or mandatory account creation.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-base">How are resources categorized?</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Resources are organized into 14 categories: AI Tools, Education, Ad Blocking, Linux, Miscellaneous, Reading, Mobile, Storage, Gaming, Music, Streaming, Non-English, Downloading, and Torrenting. Each category contains hundreds of carefully selected tools.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-base">Can I suggest a resource to be added?</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Yes! If you know a high-quality free resource that is not yet listed, you can suggest it by opening an issue on our GitHub repository. We review all suggestions for compliance and quality before adding them to the directory.
              </p>
            </div>
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold text-base">What does &quot;compliant&quot; mean in the resource directory?</h3>
              <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                Compliant means the resource does not involve piracy, cracking, adult content, or other non-compliant materials. We only list resources that respect intellectual property rights and are safe to use.
              </p>
            </div>
          </div>
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
