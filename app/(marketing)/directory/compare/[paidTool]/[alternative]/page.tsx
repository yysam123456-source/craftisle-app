import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Check, X, Star, ExternalLink } from "lucide-react";
import { getCombinedMap, toSlug, type AlternativeEntry, type AlternativeTool } from "@/lib/alternatives";

interface PageParams {
  params: Promise<{ paidTool: string; alternative: string }>;
}

export const dynamicParams = true;
export const revalidate = 21600;

export async function generateStaticParams() {
  const map = getCombinedMap();
  const params: { paidTool: string; alternative: string }[] = [];
  for (const entry of Object.values(map)) {
    if (!entry?.paidTool || !Array.isArray(entry.alternatives)) continue;
    const slugA = toSlug(entry.paidTool);
    for (const alt of entry.alternatives) {
      if (!alt?.name) continue;
      params.push({ paidTool: slugA, alternative: toSlug(alt.name) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { paidTool: paidSlug, alternative: altSlug } = await params;
  const map = getCombinedMap();
  let entry: AlternativeEntry | null = null;
  let alt: AlternativeTool | null = null;

  for (const e of Object.values(map)) {
    if (!e?.paidTool) continue;
    if (toSlug(e.paidTool) === paidSlug) {
      entry = e;
      if (!e.alternatives) break;
      for (const a of e.alternatives) {
        if (a?.name && toSlug(a.name) === altSlug) {
          alt = a;
          break;
        }
      }
      break;
    }
  }

  if (!entry || !alt) {
    return { title: "Comparison Not Found | Craftisle" };
  }

  return {
    title: `${entry.paidTool} vs ${alt.name}: Which is Better in 2026?`,
    description: `Detailed comparison of ${entry.paidTool} and ${alt.name}. Compare features, pricing, pros & cons.`,
    alternates: {
      canonical: `https://craftisle.com/directory/compare/${paidSlug}/${altSlug}`,
    },
  };
}

export default async function CompareDetailPage({ params }: PageParams) {
  const { paidTool: paidSlug, alternative: altSlug } = await params;
  const map = getCombinedMap();

  let entry: AlternativeEntry | null = null;
  let alt: AlternativeTool | null = null;

  for (const e of Object.values(map)) {
    if (!e?.paidTool) continue;
    if (toSlug(e.paidTool) === paidSlug) {
      entry = e;
      if (!e.alternatives) break;
      for (const a of e.alternatives) {
        if (a?.name && toSlug(a.name) === altSlug) {
          alt = a;
          break;
        }
      }
      break;
    }
  }

  if (!entry || !alt) notFound();

  const otherAlts = (entry.alternatives || []).filter((a) => a?.name && toSlug(a.name) !== altSlug).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-muted/30 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/directory" className="hover:text-foreground">Directory</Link>
            <span>/</span>
            <Link href="/directory/compare" className="hover:text-foreground">Compare</Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">{entry.paidTool} vs {alt.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/directory/compare" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" />
            All Comparisons
          </Link>

          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            {entry.paidTool} <span className="text-muted-foreground">vs</span> {alt.name}
          </h1>
          <p className="text-muted-foreground mb-8">Detailed comparison coming soon. Quick overview below.</p>

          {/* Quick Comparison Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Feature</th>
                      <th className="text-center py-2 px-3">{entry.paidTool}</th>
                      <th className="text-center py-2 px-3 text-green-600">{alt.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Pricing</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">{entry.pricing || "Paid"}</td>
                      <td className="py-2 px-3 text-center">
                        {alt.isFree ? <span className="text-green-600 font-medium">100% Free</span> : <span>Freemium</span>}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-3 font-medium">Open Source</td>
                      <td className="py-2 px-3 text-center">{entry.paidToolUrl?.includes("github") ? "✓" : "✗"}</td>
                      <td className="py-2 px-3 text-center">{alt.isOpenSource ? <span className="text-green-600">✓</span> : <span className="text-red-500">✗</span>}</td>
                    </tr>
                    {alt.isSelfHosted && (
                      <tr className="border-b">
                        <td className="py-2 px-3 font-medium">Self-Hosted</td>
                        <td className="py-2 px-3 text-center text-muted-foreground">Rarely</td>
                        <td className="py-2 px-3 text-center text-green-600">✓ Full control</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Why Switch */}
          {(entry.painPoints || []).length > 0 && (
            <Card className="mb-8 border-red-200 bg-red-50/40 dark:bg-red-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  Why Consider Switching from {entry.paidTool}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(entry.painPoints || []).map((p: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-red-500 mt-0.5">✗</span>
                      <span>{p?.problem || "High cost and vendor lock-in"}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Why Choose Alternative */}
          {(alt.pros || []).length > 0 && (
            <Card className="mb-8 border-green-200 bg-green-50/40 dark:bg-green-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Why Choose {alt.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(alt.pros || []).map((pro: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Other Alternatives */}
          {otherAlts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Other {entry.paidTool} Alternatives</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {otherAlts.map((a) => (
                  <Link key={a.name} href={`/directory/compare/${paidSlug}/${toSlug(a.name)}`} className="no-underline">
                    <Card className="p-4 hover:shadow-md transition-shadow h-full">
                      <h3 className="font-medium text-sm">{a.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.reason?.slice(0, 80) || ""}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-6 border-t">
            {alt.url && (
              <a href={alt.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button size="lg" className="gap-2">
                  Visit {alt.name}
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            )}
            <Link href="/directory/compare">
              <Button variant="outline" size="lg">View More Comparisons</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
