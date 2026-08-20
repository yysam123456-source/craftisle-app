import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { Separator } from "@/components/ui/separator";
import { GiscusComments } from "@/components/giscus-comments";
import { ExternalLink, ArrowLeft, CalendarDays, Clock, ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { getResourceById } from "@/lib/fmhy-data";

const baseUrl = "https://craftisle.com";

// ── Types ──────────────────────────────────────────
interface ReviewData {
  resourceId: string;
  resourceName: string;
  resourceUrl: string;
  source: string;
  generatedAt: string;
  content: {
    overview: string;
    pros: string[];
    cons: string[];
    bestUseCases: string[];
    similarAlternatives: string[];
    category?: string;
  };
}

interface SlugEntry {
  slug: string;
  resourceId: string;
  resourceName: string;
}

// ── Helpers ────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadAllReviewSlugs(): SlugEntry[] {
  const reviewsDir = join(process.cwd(), "public", "data", "reviews");
  try {
    const files = readdirSync(reviewsDir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
    return files.map((file) => {
      const review: ReviewData = JSON.parse(readFileSync(join(reviewsDir, file), "utf-8"));
      return {
        slug: slugify(review.resourceName),
        resourceId: review.resourceId,
        resourceName: review.resourceName,
      };
    });
  } catch {
    return [];
  }
}

function loadReviewBySlug(slug: string): ReviewData | null {
  const entries = loadAllReviewSlugs();
  const match = entries.find((e) => e.slug === slug);
  if (!match) return null;
  try {
    const filePath = join(process.cwd(), "public", "data", "reviews", `${match.resourceId}.json`);
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── generateStaticParams ───────────────────────────
export async function generateStaticParams() {
  const entries = loadAllReviewSlugs();
  return entries.map((e) => ({ slug: e.slug }));
}

// ── generateMetadata ───────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const review = loadReviewBySlug(slug);
  if (!review) return { title: "Review Not Found" };

  const title = `${review.resourceName} Review 2026 — Pros, Cons & Best Alternatives`;
  const description = review.content.overview.slice(0, 155) + "...";

  return {
    title,
    description,
    alternates: { canonical: `${baseUrl}/blog/review/${slug}` },
    openGraph: {
      type: "article",
      url: `${baseUrl}/blog/review/${slug}`,
      title,
      description,
      siteName: "Craftisle",
    },
    keywords: [
      review.resourceName,
      `${review.resourceName} review`,
      `${review.resourceName} alternatives`,
      `${review.resourceName} free`,
      ...review.content.similarAlternatives,
    ],
  };
}

// ── Page ───────────────────────────────────────────
export default async function ReviewArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const review = loadReviewBySlug(slug);
  if (!review) notFound();

  const resource = getResourceById(review.resourceId);
  const { content } = review;

  // JSON-LD: Article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${review.resourceName} Review 2026 — Full Analysis`,
    description: content.overview.slice(0, 160),
    datePublished: review.generatedAt,
    dateModified: review.generatedAt,
    author: {
      "@type": "Organization",
      name: "Craftisle",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: baseUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/review/${slug}`,
    },
    about: {
      "@type": "SoftwareApplication",
      name: review.resourceName,
      url: review.resourceUrl,
      applicationCategory: content.category,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-foreground">Blog</Link>
              <span>/</span>
              <Link href="/blog/review" className="hover:text-foreground">Reviews</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{review.resourceName}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <header className="border-b py-12 md:py-16 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <Link href="/blog/review" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
                <ArrowLeft className="h-4 w-4" />
                All Tool Reviews
              </Link>

              <Badge variant="secondary" className="mb-4">Tool Review</Badge>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {review.resourceName} Review
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                Complete analysis — features, pros & cons, best use cases, and top alternatives
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(review.generatedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  5 min read
                </span>
                {content.category && (
                  <Badge variant="outline">{content.category}</Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Article Body */}
        <div className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              {/* Overview */}
              <section className="mb-10">
                <h2 className="text-xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed text-[15px]">
                  {content.overview}
                </p>
              </section>

              {/* Pros & Cons */}
              <div className="grid gap-6 md:grid-cols-2 mb-10">
                <GlassCard className="border-green-200 bg-green-50/40">
                  <GlassCardHeader className="pb-2">
                    <GlassCardTitle className="flex items-center gap-2 text-green-700">
                      <ThumbsUp className="h-5 w-5" />
                      Pros
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <ul className="space-y-2.5">
                      {content.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCardContent>
                </GlassCard>

                <GlassCard className="border-red-200 bg-red-50/40">
                  <GlassCardHeader className="pb-2">
                    <GlassCardTitle className="flex items-center gap-2 text-red-700">
                      <ThumbsDown className="h-5 w-5" />
                      Cons
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <ul className="space-y-2.5">
                      {content.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-red-500 mt-0.5">✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCardContent>
                </GlassCard>
              </div>

              {/* Best Use Cases */}
              <section className="mb-10">
                <GlassCard className="border-blue-200 bg-blue-50/40">
                  <GlassCardHeader className="pb-2">
                    <GlassCardTitle className="flex items-center gap-2 text-blue-700">
                      <Lightbulb className="h-5 w-5" />
                      Best Use Cases
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <ul className="space-y-2">
                      {content.bestUseCases.map((useCase, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCardContent>
                </GlassCard>
              </section>

              {/* Alternatives */}
              {content.similarAlternatives.length > 0 && (
                <section className="mb-10">
                  <h2 className="text-xl font-bold mb-4">Similar Alternatives</h2>
                  <div className="flex flex-wrap gap-2">
                    {content.similarAlternatives.map((alt) => (
                      <Badge key={alt} variant="secondary" className="px-3 py-1 text-sm">
                        {alt}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <section className="mt-12 border-t pt-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Try {review.resourceName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Visit the official site to get started with {review.resourceName}
                    </p>
                  </div>
                  <a href={review.resourceUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="lg" className="gap-2">
                      Visit {review.resourceName}
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>

                {/* Cross-link to resource detail page */}
                {resource && (
                  <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
                    <p className="text-sm text-muted-foreground">
                      💡 Also available in our{" "}
                      <Link
                        href={`/directory/resource/${review.resourceId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        Resource Directory
                      </Link>{" "}
                      with quick stats and related tools.
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Comments */}
        <div className="py-12 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <GiscusComments term={review.resourceName} />
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
