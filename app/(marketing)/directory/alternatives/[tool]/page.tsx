import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import {
  ALTERNATIVES_MAP,
  getAlternativeBySlug,
  getAllAlternativeSlugs,
} from "@/lib/alternatives";

const baseUrl = "https://craftisle.com";

export async function generateStaticParams() {
  return getAllAlternativeSlugs().map((slug) => ({ tool: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const entry = getAlternativeBySlug(tool);
  if (!entry) return { title: "Not Found | Craftisle" };

  const title = `Best Free ${entry.paidTool} Alternatives in 2026 | Craftisle`;
  const description = `Looking for free ${entry.paidTool} alternatives? We've curated ${entry.alternatives.length} free options that can replace ${entry.paidTool} — no subscription required.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/directory/alternatives/${tool}`,
    },
    openGraph: {
      type: "article",
      url: `${baseUrl}/directory/alternatives/${tool}`,
      title,
      description,
      siteName: "Craftisle",
    },
    keywords: entry.seoKeywords,
  };
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const entry = getAlternativeBySlug(tool);
  if (!entry) notFound();

  // Structured Data: ItemList of alternatives
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best Free ${entry.paidTool} Alternatives`,
    description: `Curated list of free alternatives to ${entry.paidTool}`,
    url: `${baseUrl}/directory/alternatives/${tool}`,
    numberOfItems: entry.alternatives.length,
    itemListElement: entry.alternatives.map((alt, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: alt.name,
      url: alt.resourceId
        ? `${baseUrl}/directory/resource/${alt.resourceId}`
        : alt.url,
      description: alt.reason,
    })),
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Directory", item: `${baseUrl}/directory` },
        { "@type": "ListItem", position: 3, name: "Alternatives", item: `${baseUrl}/directory/alternatives` },
        {
          "@type": "ListItem",
          position: 4,
          name: `${entry.paidTool} Alternatives`,
          item: `${baseUrl}/directory/alternatives/${tool}`,
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

      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link>
              <span>/</span>
              <span className="text-foreground font-medium">
                {entry.paidTool} Alternatives
              </span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="border-b py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/directory"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Link>

              <Badge variant="secondary" className="mb-4">{entry.category}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Best Free {entry.paidTool} Alternatives in 2026
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {entry.description} Here are <strong>{entry.alternatives.length} free alternatives</strong> that
                can replace {entry.paidTool} without any subscription.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {entry.seoKeywords.slice(0, 4).map((kw) => (
                  <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Alternatives List */}
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-8">
                {entry.alternatives.length} Free Alternatives to {entry.paidTool}
              </h2>

              <div className="space-y-6">
                {entry.alternatives.map((alt, index) => (
                  <Card key={alt.name} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl font-bold text-muted-foreground/40">
                              #{index + 1}
                            </span>
                            <CardTitle className="text-xl">{alt.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              variant={alt.isFree ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {alt.isFree ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Free
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Paid
                                </>
                              )}
                            </Badge>
                            {alt.isOpenSource && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                Open Source
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {alt.resourceId && (
                            <Link href={`/directory/resource/${alt.resourceId}`}>
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </Link>
                          )}
                          <a
                            href={alt.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" className="gap-1">
                              Visit
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{alt.reason}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* More Alternatives */}
        <section className="border-t bg-muted/20 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6">More Alternative Comparisons</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(ALTERNATIVES_MAP)
                  .filter(([key]) => key.toLowerCase().replace(/\s+/g, "-") !== tool)
                  .slice(0, 6)
                  .map(([key, val]) => (
                    <Link
                      key={key}
                      href={`/directory/alternatives/${key.toLowerCase().replace(/\s+/g, "-")}`}
                      className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow hover:border-primary/30"
                    >
                      <p className="font-medium text-sm">Free {key} Alternatives</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {val.alternatives.length} options
                      </p>
                    </Link>
                  ))}
              </div>
              <div className="mt-6 text-center">
                <Link href="/directory">
                  <Button variant="outline">Browse All Resources →</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
