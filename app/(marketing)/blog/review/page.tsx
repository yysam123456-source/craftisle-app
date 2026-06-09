import Link from "next/link";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ExternalLink, Sparkles, ArrowRight } from "lucide-react";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Free Tool Reviews | In-Depth Analysis & Comparisons | Craftisle",
  description:
    "In-depth reviews of the best free tools for developers, creators, and businesses. Pros, cons, use cases, and alternatives for every tool. Updated regularly.",
});

interface ReviewMeta {
  slug: string;
  resourceId: string;
  resourceName: string;
  resourceUrl: string;
  source: string;
  date: string;
  category: string;
  excerpt: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function loadAllReviews(): ReviewMeta[] {
  const reviewsDir = join(process.cwd(), "public", "data", "reviews");
  try {
    const files = readdirSync(reviewsDir).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
    return files
      .map((file) => {
        const review = JSON.parse(readFileSync(join(reviewsDir, file), "utf-8"));
        return {
          slug: slugify(review.resourceName),
          resourceId: review.resourceId,
          resourceName: review.resourceName,
          resourceUrl: review.resourceUrl,
          source: review.source,
          date: review.generatedAt,
          category: review.content?.category || "General",
          excerpt: review.content?.overview?.slice(0, 200) + "..." || "",
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch {
    return [];
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function ReviewsPage() {
  const reviews = loadAllReviews();

  return (
    <div>
      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-muted/30 to-background py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              In-Depth Reviews
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Free Tool Reviews
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive analysis of the best free tools. Pros, cons, use cases, and alternatives — all in one place.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/directory">
                <Button variant="outline">Browse Directory</Button>
              </Link>
              <Link href="/blog">
                <Button variant="outline">All Blog Posts</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {reviews.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No reviews yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {reviews.length} comprehensive reviews
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                  <Card key={review.slug} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {review.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatDate(review.date)}
                        </span>
                      </div>
                      <CardTitle className="text-lg">
                        <Link href={`/blog/review/${review.slug}`} className="hover:text-primary">
                          {review.resourceName} Review
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-sm">
                        {review.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <Link href={`/blog/review/${review.slug}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          Read Review <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <a href={review.resourceUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold">Want more tools?</h2>
          <p className="mt-2 text-muted-foreground">
            Explore 10,000+ free tools in our curated directory
          </p>
          <Link href="/directory">
            <Button size="lg" className="mt-6 gap-2">
              Browse Resource Directory <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
