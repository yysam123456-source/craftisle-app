import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, ArrowRight, Globe, Tag, BookOpen, ThumbsUp, ThumbsDown, Lightbulb, Sparkles } from "lucide-react";
import { ResourceCard } from "@/components/resources/resource-card";
import { GiscusComments } from "@/components/giscus-comments";
import { StarButtonWrapper } from "@/components/resources/star-button-wrapper";
import {
  getAllResources,
  getResourceById,
  getRelatedResources,
  type Resource,
} from "@/lib/fmhy-data";

const baseUrl = "https://craftisle.com";

// ── ISR：每6小时重新生成 ─────────────────────────────────
export const revalidate = 21600;

// ── 静态生成：构建时仅生成前3000个资源页（避免构建时间过长） ────
export async function generateStaticParams() {
  const resources = getAllResources();
  return resources.slice(0, 3000).map((r) => ({ id: r.id }));
}

// ── Metadata ────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = getResourceById(id);
  if (!resource) return { title: "Resource Not Found | Craftisle" };

  const title = `${resource.name} Review — Free ${resource.categoryName || "Online"} Tool | Craftisle`;
  const review = loadReview(id) || loadReview(resource.name);
  const description = review?.content?.overview
    ? review.content.overview.slice(0, 155) + "..."
    : resource.description?.length > 155
      ? resource.description.slice(0, 152) + "..."
      : resource.description || `${resource.name} is a free ${resource.categoryName || "online"} resource listed in the Craftisle directory.`;

  const canonicalUrl = `${baseUrl}/directory/resource/${resource.id}`;

  const keywords = review?.content
    ? [
        resource.name,
        `${resource.name} review`,
        `${resource.name} free`,
        ...(review.content.bestUseCases || []),
        ...(review.content.similarAlternatives || []),
        resource.categoryName || "",
      ].filter(Boolean)
    : undefined;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: review ? `${resource.name} — In-Depth Review | Craftisle` : title,
      description,
      siteName: "Craftisle",
    },
    twitter: {
      card: "summary",
      title: review ? `${resource.name} Review` : title,
      description,
    },
  };
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return "";
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Review loading ─────────────────────────────────────
interface ReviewContent {
  overview: string;
  pros: string[];
  cons: string[];
  bestUseCases: string[];
  similarAlternatives: string[];
  category?: string;
}

interface ReviewData {
  resourceId: string;
  resourceName: string;
  resourceUrl: string;
  source: string;
  generatedAt: string;
  version: number;
  content: ReviewContent;
}

function loadReview(resourceIdOrName: string): ReviewData | null {
  // First try: direct file by resourceId
  try {
    const filePath = join(process.cwd(), "public", "data", "reviews", `${resourceIdOrName}.json`);
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    // Fallback: look up by resource name via manifest
  }

  // Second try: search _manifest.json for matching resourceName
  try {
    const manifestPath = join(process.cwd(), "public", "data", "reviews", "_manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const reviews: any[] = manifest.reviews || [];
    for (const entry of reviews) {
      if (
        entry.resourceId === resourceIdOrName ||
        entry.resourceName?.toLowerCase() === resourceIdOrName.toLowerCase()
      ) {
        const filePath = join(process.cwd(), "public", "data", "reviews", `${entry.resourceId}.json`);
        return JSON.parse(readFileSync(filePath, "utf-8"));
      }
    }
  } catch {
    // no match
  }
  return null;
}

// ── Page ─────────────────────────────────────────────────
export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resource = getResourceById(id);
  if (!resource) notFound();

  const related = getRelatedResources(resource, 6);
  const faviconUrl = getFaviconUrl(resource.url);
  const hostname = getHostname(resource.url);

  // Structured Data: SoftwareApplication
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: resource.name,
    description: resource.description,
    url: resource.url,
    applicationCategory: resource.categoryName,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    isPartOf: {
      "@type": "CollectionPage",
      name: "Craftisle Free Resource Directory",
      url: `${baseUrl}/directory`,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Directory", item: `${baseUrl}/directory` },
        {
          "@type": "ListItem",
          position: 3,
          name: resource.categoryName,
          item: `${baseUrl}/directory/${resource.category}`,
        },
        {
          "@type": "ListItem",
          position: 4,
          name: resource.name,
          item: `${baseUrl}/directory/resource/${resource.id}`,
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

      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/directory" className="hover:text-foreground transition-colors">
                Directory
              </Link>
              <span>/</span>
              <Link
                href={`/directory/${resource.category}`}
                className="hover:text-foreground transition-colors"
              >
                {resource.categoryIcon} {resource.categoryName}
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {resource.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="border-b py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {/* Back link */}
              <Link
                href={`/directory/${resource.category}`}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to {resource.categoryName}
              </Link>

              {/* Resource header */}
              <div className="flex items-start gap-5">
                {/* Favicon */}
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                  {faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt=""
                      loading="lazy"
                      className="w-10 h-10 object-contain"
                    />
                  ) : (
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                {/* Title & Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        {resource.name}
                      </h1>
                      <p className="mt-1 text-muted-foreground text-sm">{hostname}</p>
                    </div>
                    {/* Star button (client component) */}
                    <StarButtonWrapper resourceId={resource.id} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {resource.categoryIcon} {resource.categoryName}
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      ✓ Free
                    </Badge>
                    {resource.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-2.5 w-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-8 max-w-2xl">
                <h2 className="text-lg font-semibold mb-3">About {resource.name}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {resource.description}
                </p>
              </div>

              {/* AI Review Section */}
              {(() => {
                const review = loadReview(resource.id) || loadReview(resource.name);
                return review ? <ReviewSection review={review} /> : null;
              })()}

              {/* CTA */}
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="lg" className="gap-2">
                    Visit {resource.name}
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Link href={`/directory/${resource.category}`}>
                  <Button variant="outline" size="lg" className="gap-2">
                    <BookOpen className="h-4 w-4" />
                    More {resource.categoryName} Tools
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section className="py-10 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/directory/${resource.category}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {resource.categoryIcon} {resource.categoryName}
                    </Link>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="font-medium text-green-600">100% Free</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Website
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline truncate flex items-center gap-1"
                    >
                      {hostname}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Related Resources */}
        {related.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold tracking-tight mb-6">
                  More {resource.categoryName} Tools
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((r) => (
                    <ResourceCard
                      key={r.id}
                      resource={r}
                      showCategory={false}
                      variant="default"
                    />
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link href={`/directory/${resource.category}`}>
                    <Button variant="outline">
                      View All {resource.categoryName} Tools →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Source Attribution (Google合规) */}
        <section className="border-t py-8 bg-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <p className="text-xs text-muted-foreground">
                Resource data sourced from{" "}
                <a
                  href="https://fmhy.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  FMHY
                </a>{" "}
                and curated by the Craftisle team. Listings are regularly reviewed for accuracy and compliance.
                If you find an outdated link,{" "}
                <Link href="/contact" className="underline hover:text-foreground">
                  let us know
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Comments (Giscus - GitHub Discussions) */}
        <section className="py-12 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <GiscusComments term={resource.name} />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// ── Review Section Component ────────────────────────────
function ReviewSection({ review }: { review: ReviewData }) {
  const { content } = review;

  return (
    <div className="mt-10 border-t pt-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold">In-Depth Review</h2>
        <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
          AI-Enhanced
        </Badge>
      </div>

      {/* Overview */}
      <div className="mb-8">
        <p className="text-muted-foreground leading-relaxed text-[15px]">
          {content.overview}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pros */}
        <Card className="border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <ThumbsUp className="h-4 w-4" />
              Pros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-green-500 mt-1 flex-shrink-0">✓</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Cons */}
        <Card className="border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
              <ThumbsDown className="h-4 w-4" />
              Cons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.cons.map((con, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-red-500 mt-1 flex-shrink-0">✗</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Best Use Cases */}
      <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <Lightbulb className="h-4 w-4" />
            Best Use Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {content.bestUseCases.map((useCase, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-blue-500 mt-1 flex-shrink-0">•</span>
                <span>{useCase}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Similar Alternatives */}
      {content.similarAlternatives && content.similarAlternatives.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">Similar Tools & Alternatives</h3>
          <div className="flex flex-wrap gap-2">
            {content.similarAlternatives.map((alt) => (
              <Badge key={alt} variant="secondary" className="text-xs">
                {alt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Link to full blog article */}
      <div className="mt-6 flex justify-end">
        <Link href={`/blog/review/${slugify(review.resourceName)}`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            Read Full Review <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
