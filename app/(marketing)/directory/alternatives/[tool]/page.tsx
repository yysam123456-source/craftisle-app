import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, CheckCircle2, XCircle, HelpCircle, Star, ArrowRight, Download, Users, DollarSign, Shield, Globe } from "lucide-react";
import {
  getAlternativeBySlug,
  getAllAlternativeSlugs,
  AlternativeEntry,
  AlternativeTool,
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

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-sm text-muted-foreground">N/A</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
    </span>
  );
}

function MigrationDifficultyBadge({ difficulty }: { difficulty?: string }) {
  if (!difficulty) return <span className="text-xs text-muted-foreground">N/A</span>;
  const color =
    difficulty === "Easy"
      ? "bg-green-100 text-green-700 border-green-200"
      : difficulty === "Medium"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-red-100 text-red-700 border-red-200";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
      {difficulty} to migrate
    </span>
  );
}

export default async function AlternativesPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const entry = getAlternativeBySlug(tool);
  if (!entry) notFound();

  const featured = entry.alternatives.filter((a) => a.featured);
  const others = entry.alternatives.filter((a) => !a.featured);

  // Structured Data
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
      url: alt.resourceId ? `${baseUrl}/directory/resource/${alt.resourceId}` : alt.url,
      description: alt.reason,
    })),
  };

  const faqJsonLd = entry.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: entry.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      }
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <div className="min-h-screen">
        {/* ===== Breadcrumb ===== */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{entry.paidTool} Alternatives</span>
            </nav>
          </div>
        </div>

        {/* ===== Hero Section ===== */}
        <section className="border-b py-12 md:py-16 bg-gradient-to-b from-background to-muted/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/directory"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Directory
              </Link>

              <div className="flex items-start gap-3 mb-4">
                <Badge variant="secondary" className="mt-1">{entry.category}</Badge>
                <a
                  href={entry.paidToolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
                Best Free {entry.paidTool} Alternatives in 2026
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {entry.tagline}
              </p>

              {/* Pricing callout */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      {entry.paidTool} Pricing
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {entry.pricing}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-sm max-w-none text-muted-foreground mb-8">
                {entry.description.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-3 leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{entry.alternatives.filter(a => a.isFree).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Free Alternatives</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{entry.alternatives.filter(a => a.isOpenSource).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Open Source</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{entry.alternatives.filter(a => a.isSelfHosted).length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Self-Hostable</p>
                </div>
                <div className="bg-card border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    ${entry.pricing?.match(/\$(\d+)/)?.[1] ? parseInt(entry.pricing.match(/\$(\d+)/)![1]) * 12 : "?"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Est. Yearly Cost</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Why Switch Section ===== */}
        {entry.whySwitch && entry.whySwitch.length > 0 && (
          <section className="py-12 border-b bg-muted/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">
                  Why Consider {entry.paidTool} Alternatives?
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {entry.whySwitch.map((reason, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                      <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <p className="text-sm leading-relaxed">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== Pain Points Section ===== */}
        {entry.painPoints && entry.painPoints.length > 0 && (
          <section className="py-12 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold mb-2">
                  Common {entry.paidTool} Pain Points
                </h2>
                <p className="text-muted-foreground mb-8">
                  These are the top reasons users look for alternatives
                </p>
                <div className="space-y-4">
                  {entry.painPoints.map((pain, i) => (
                    <div key={i} className="bg-card border rounded-lg p-5">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-sm font-bold text-red-600">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground">{pain.problem}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="text-red-600 font-medium">Impact: </span>
                            {pain.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== Featured Alternatives ===== */}
        {featured.length > 0 && (
          <section className="py-12 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <h2 className="text-2xl font-bold">Top-Rated Alternatives</h2>
                </div>
                <p className="text-muted-foreground mb-8">
                  Our highest-recommended free alternatives to {entry.paidTool}
                </p>
                <div className="space-y-8">
                  {featured.map((alt, index) => (
                    <AlternativeCard key={alt.name} alt={alt} index={index} paidTool={entry.paidTool} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== All Alternatives ===== */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">
                All {entry.paidTool} Alternatives ({entry.alternatives.length})
              </h2>
              <p className="text-muted-foreground mb-8">
                Compare features, pricing, and migration difficulty
              </p>
              <div className="space-y-6">
                {(featured.length > 0 ? others : entry.alternatives).map((alt, index) => (
                  <AlternativeCard
                    key={alt.name}
                    alt={alt}
                    index={featured.length > 0 ? index + featured.length : index}
                    paidTool={entry.paidTool}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===== Detailed Comparison Table ===== */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">
                {entry.paidTool} vs Free Alternatives — Detailed Comparison
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left py-3 px-4 font-semibold">Tool</th>
                      <th className="text-center py-3 px-4 font-semibold">Price</th>
                      <th className="text-center py-3 px-4 font-semibold">Open Source</th>
                      <th className="text-center py-3 px-4 font-semibold">Self-Hosted</th>
                      <th className="text-center py-3 px-4 font-semibold">Rating</th>
                      <th className="text-center py-3 px-4 font-semibold">Migrate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-muted/20">
                      <td className="py-3 px-4 font-medium">{entry.paidTool}</td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant="secondary" className="text-xs">Paid</Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                      </td>
                      <td className="py-3 px-4 text-center">—</td>
                      <td className="py-3 px-4 text-center">—</td>
                    </tr>
                    {entry.alternatives.map((alt) => (
                      <tr key={alt.name} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-medium">
                          <a
                            href={alt.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {alt.name}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={alt.isFree ? "default" : "secondary"} className={alt.isFree ? "bg-green-600 text-xs" : "text-xs"}>
                            {alt.isFree ? "Free" : "Paid"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {alt.isOpenSource ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {alt.isSelfHosted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <RatingStars rating={alt.rating} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <MigrationDifficultyBadge difficulty={alt.migrationDifficulty} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Migration Guide ===== */}
        {entry.migrationGuide && (
          <section className="py-12 border-b bg-muted/10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-6">
                  <ArrowRight className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">
                    How to Migrate from {entry.paidTool} — Step by Step
                  </h2>
                </div>
                <div className="bg-card border rounded-xl p-6 md:p-8">
                  <ol className="space-y-4">
                    {(entry.migrationGuide?.steps || []).map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                      </li>
                    ))}
                  </ol>
                  {(entry.migrationGuide?.tips || []).length > 0 && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Pro Tips</p>
                      <ul className="space-y-1.5">
                        {(entry.migrationGuide?.tips || []).map((tip, i) => (
                          <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">💡</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== FAQ Section ===== */}
        {entry.faqs && entry.faqs.length > 0 && (
          <section className="py-12 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-2 mb-8">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                </div>
                <div className="space-y-4">
                  {entry.faqs.map((faq, i) => (
                    <Card key={i} className="hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-semibold">
                          {faq.question}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== More Alternatives ===== */}
        <section className="border-t bg-muted/20 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold mb-6">More Alternative Comparisons</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(await getAlternativesMap())
                  .filter(([key]) => key.toLowerCase().replace(/\s+/g, "-") !== tool)
                  .slice(0, 6)
                  .map(([key, val]) => (
                    <Link
                      key={key}
                      href={`/directory/alternatives/${key.toLowerCase().replace(/\s+/g, "-")}`}
                      className="rounded-lg border bg-card p-4 hover:shadow-md transition-all hover:border-primary/30"
                    >
                      <p className="font-medium text-sm">Free {key} Alternatives</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {val.alternatives.length} options · {val.category}
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

/** Helper: render a full alternative card */
function AlternativeCard({
  alt,
  index,
  paidTool,
}: {
  alt: AlternativeTool;
  index: number;
  paidTool: string;
}) {
  return (
    <Card className="hover:shadow-lg transition-all border-2 hover:border-primary/20 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-2xl font-bold text-muted-foreground/40">#{index + 1}</span>
              <CardTitle className="text-xl">
                <a
                  href={alt.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {alt.name}
                </a>
              </CardTitle>
              {alt.featured && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                  <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                  Editor's Choice
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <RatingStars rating={alt.rating} />
              <MigrationDifficultyBadge difficulty={alt.migrationDifficulty} />
              <Badge variant={alt.isFree ? "default" : "secondary"} className={alt.isFree ? "bg-green-600 text-xs" : "text-xs"}>
                {alt.isFree ? "Free" : "Paid"}
              </Badge>
              {alt.isOpenSource && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                  Open Source
                </Badge>
              )}
              {alt.isSelfHosted && (
                <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                  Self-Hosted
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {alt.resourceId && (
              <Link href={`/directory/resource/${alt.resourceId}`}>
                <Button variant="outline" size="sm">Details</Button>
              </Link>
            )}
            <a
              href={alt.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-1">
                Visit <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-muted-foreground leading-relaxed text-sm">{alt.description}</p>

        {/* Reason */}
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-sm">
            <span className="font-semibold">Why it's a good alternative: </span>
            {alt.reason}
          </p>
        </div>

        {/* Best For */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">BEST FOR</p>
          <p className="text-sm">{alt.bestFor}</p>
        </div>

        {/* Features */}
        {alt.features && alt.features.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">KEY FEATURES</p>
            <div className="flex flex-wrap gap-1.5">
              {alt.features.map((f) => (
                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Pros & Cons */}
        <div className="grid sm:grid-cols-2 gap-4">
          {alt.pros && alt.pros.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">PROS</p>
              <ul className="space-y-1">
                {alt.pros.map((pro) => (
                  <li key={pro} className="flex items-start gap-1.5 text-xs">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {alt.cons && alt.cons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">CONS</p>
              <ul className="space-y-1">
                {alt.cons.map((con) => (
                  <li key={con} className="flex items-start gap-1.5 text-xs">
                    <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** Helper to get alternatives map for the "More" section */
async function getAlternativesMap() {
  // Import dynamically to avoid circular deps
  const { getCombinedMap } = await import("@/lib/alternatives");
  return getCombinedMap();
}
