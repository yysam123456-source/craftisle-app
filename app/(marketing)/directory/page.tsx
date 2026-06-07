import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/resources/category-grid";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { ArrowRight } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { constructMetadata } from "@/lib/utils";
import { readFileSync } from "fs";
import { join } from "path";

export const metadata: Metadata = constructMetadata({
  title: "Free Resource Directory | 6,000+ Curated Free Tools & Software | Craftisle",
  description:
    "Discover 6,000+ curated free resources for developers, creators, and learners. Free AI tools, online courses, privacy software, cloud storage, game dev tools, music production, and more. 100% compliant, open-source, no signup required.",
  keywords: [
    "free resource directory",
    "free tools directory",
    "free software list",
    "open source tools directory",
    "best free online tools",
    "free AI tools directory",
    "free developer tools",
    "free learning resources",
    "free privacy tools",
    "free cloud storage tools",
    "free game development tools",
    "free music production software",
    "free utilities collection",
    "curated free software",
    "no signup free tools",
  ],
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

const DATE_PUBLISHED = "2026-06-07";
const DATE_MODIFIED = "2026-06-07";

export default async function ResourcesPage() {
  const indexData = getIndexData();
  const hotData = getHotData();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

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
          <CategoryGrid categories={categories} />
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
