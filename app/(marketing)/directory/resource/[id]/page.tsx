import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, ArrowRight, Globe, Tag, BookOpen, ThumbsUp, ThumbsDown, Lightbulb, Sparkles, Star } from "lucide-react";
import { ResourceCard } from "@/components/resources/resource-card";
import { GiscusComments } from "@/components/giscus-comments";
import { StarButtonWrapper } from "@/components/resources/star-button-wrapper";
import StarRating from "@/components/resources/star-rating";
import AdSlot from "@/components/ads/ad-slot";
import {
  getAllResources,
  getResourceById,
  getRelatedResources,
  getRichInfoResourceIds,
  type Resource,
  generateAdvantages,
  findSimilarResources,
  generateUsageTips,
} from "@/lib/fmhy-data";
import { Share2, Twitter, MessageSquare } from "lucide-react";

const baseUrl = "https://craftisle.com";
const LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'de', 'fr', 'es', 'pt', 'ru', 'ko', 'vi', 'th', 'id', 'tr'];

// ── 静态生成：仅预构建前10个「有丰富信息」的资源页（ISR：其余按需生成） ────
export const revalidate = 21600; // 6小时 ISR
export const dynamicParams = true;
export async function generateStaticParams() {
  const richIds = getRichInfoResourceIds();
  const resources = getAllResources();
  // 只预生成前10个资源页面，其余按需生成
  return resources.filter((r) => richIds.has(r.id)).slice(0, 10).map((r) => ({ id: r.id }));
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

  // Selective noindex: low-quality pages (no review + short/empty description)
  const isLowQuality =
    !review &&
    (!resource.description || resource.description.trim().length < 80);

  return {
    title,
    description,
    keywords,
    ...(isLowQuality ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical: canonicalUrl,
      languages: LANGUAGES.reduce((acc, lang) => ({
        ...acc,
        [lang]: `/directory/resource/${resource.id}${lang === 'en' ? '' : `/${lang}`}`,
      }), {}),
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
    return `https://favicone.com/${hostname}`;
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

  // 开发环境允许所有资源有详情页；生产环境仅富信息资源
  // const richInfoIds = getRichInfoResourceIds();
  // if (!richInfoIds.has(id)) notFound();

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
                      {/* User Rating */}
                      <StarRating resourceId={resource.id} size="sm" />
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
                {resource.description && resource.description.trim().length > 5 ? (
                  <p className="text-muted-foreground leading-relaxed">{resource.description}</p>
                ) : (
                  <p className="text-muted-foreground leading-relaxed text-sm italic">
                    No description available. Visit the website to learn more.
                  </p>
                )}

                {/* free-for-dev: Free Tier Details */}
                {resource.source === "free-for-dev" && resource.freeTier && resource.freeTier.trim().length > 10 && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-l border">
                    <h3 className="text-sm font-semibold text-foreground mb-2">🎁 Free Tier Details</h3>
                    <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                      {resource.freeTier.trim()}
                    </div>
                  </div>
                )}

                {/* public-apis: API Specs */}
                {resource.source === "public-apis" && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-l border">
                    <h3 className="text-sm font-semibold text-foreground mb-2">🔌 API Specifications</h3>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {resource.auth !== undefined && (
                        <span className={`px-2 py-0.5 rounded ${resource.auth === "No" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                          {resource.auth === "No" ? "No Auth" : `Auth: ${resource.auth}`}
                        </span>
                      )}
                      {resource.https !== undefined && (
                        <span className={`px-2 py-0.5 rounded ${resource.https ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {resource.https ? "HTTPS" : "HTTP only"}
                        </span>
                      )}
                      {resource.cors !== undefined && (
                        <span className={`px-2 py-0.5 rounded ${resource.cors ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                          {resource.cors ? "CORS enabled" : "No CORS"}
                        </span>
                      )}
                      {resource.category && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          {resource.category}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* awesome-selfhosted: Self-Hosting Details */}
                {resource.source === "awesome-selfhosted" && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-l border">
                    <h3 className="text-sm font-semibold text-foreground mb-2">🏠 Self-Hosting Details</h3>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {resource.isOpenSource && (
                        <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">Open Source</span>
                      )}
                      {resource.license && (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700">License: {resource.license}</span>
                      )}
                      {resource.language && (
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700">Built with: {resource.language}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

                {/* "Why Choose This?" section */}
              {(() => {
                const advantages = generateAdvantages(resource);
                return advantages.length > 0 ? (
                  <div className="mt-8 p-5 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      Why Choose {resource.name}?
                    </h3>
                    <ul className="space-y-3">
                      {advantages.map((adv, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span className="text-muted-foreground">{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* "Usage Tips" section */}
              {(() => {
                const tips = generateUsageTips(resource);
                return tips.length > 0 ? (
                  <div className="mt-6 p-5 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-600" />
                      Usage Tips
                    </h3>
                    <ul className="space-y-3">
                      {tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <span className="text-amber-600 mt-0.5 flex-shrink-0">💡</span>
                          <span className="text-muted-foreground">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}

              {/* "Related Resources" section */}
              {(() => {
                interface RelatedLink {
                  title: string;
                  url: string;
                  icon: string;
                  description: string;
                }
                
                const relatedLinks: RelatedLink[] = [];

                // Official website
                relatedLinks.push({
                  title: "Official Website",
                  url: resource.url,
                  icon: "🌐",
                  description: `Visit the official ${resource.name} website`
                });

                // GitHub repo
                if (resource.githubUrl) {
                  relatedLinks.push({
                    title: "GitHub Repository",
                    url: resource.githubUrl,
                    icon: "⭐",
                    description: `Source code and community discussions`
                  });
                }

                // Documentation (if different from main website)
                if (resource.githubUrl && resource.isOpenSource) {
                  const docsUrl = resource.githubUrl.includes("github.com") 
                    ? `${resource.githubUrl}/wiki`
                    : resource.url;
                  relatedLinks.push({
                    title: "Documentation",
                    url: docsUrl,
                    icon: "📚",
                    description: "Installation guides and API reference"
                  });
                }

                // Self-hosted tools: Docker Hub
                if (resource.isSelfHosted && resource.name) {
                  relatedLinks.push({
                    title: "Docker Hub",
                    url: `https://hub.docker.com/search?q=${encodeURIComponent(resource.name)}`,
                    icon: "🐳",
                    description: "Official Docker images for easy deployment"
                  });
                }

                return relatedLinks.length > 0 ? (
                  <div className="mt-6 p-5 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Related Resources
                    </h3>
                    <div className="space-y-3">
                      {relatedLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
                        >
                          <span className="text-2xl">{link.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                              {link.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {link.description}
                            </p>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        </a>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      💡 We're working on adding curated tutorials and blog posts. Check back soon!
                    </p>
                  </div>
                ) : null;
              })()}

              {/* "Update History" section */}
              {(() => {
                interface UpdateItem {
                  date: string;
                  title: string;
                  description: string;
                  link?: string;
                  isRecent: boolean;
                }
                
                const updates: UpdateItem[] = [];

                // Last updated from GitHub
                if (resource.githubLastUpdated) {
                  const lastUpdated = new Date(resource.githubLastUpdated);
                  const daysSince = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
                  
                  updates.push({
                    date: lastUpdated.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
                    title: "Last Commit",
                    description: daysSince === 0 
                      ? "Updated today"
                      : daysSince === 1
                      ? "Updated yesterday"
                      : daysSince < 30
                      ? `Updated ${daysSince} days ago`
                      : daysSince < 365
                      ? `Updated ${Math.floor(daysSince / 30)} months ago`
                      : `Updated ${Math.floor(daysSince / 365)} years ago`,
                    isRecent: daysSince < 30
                  });
                }

                // GitHub releases link
                if (resource.githubUrl) {
                  updates.push({
                    date: "Ongoing",
                    title: "Releases",
                    description: "Check GitHub releases for version history",
                    link: `${resource.githubUrl}/releases`,
                    isRecent: false
                  });
                }

                // Resource added date
                if (resource.dateAdded) {
                  const addedDate = new Date(resource.dateAdded);
                  updates.push({
                    date: addedDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
                    title: "Added to Craftisle",
                    description: "This resource was added to our directory",
                    isRecent: false
                  });
                }

                return updates.length > 0 ? (
                  <div className="mt-6 p-5 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Update History
                    </h3>
                    <div className="space-y-3">
                      {updates.map((update, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex-shrink-0 w-20 text-xs text-muted-foreground font-mono">
                            {update.date}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              {update.title}
                              {update.isRecent && (
                                <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                                  Active
                                </Badge>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {update.description}
                            </p>
                          </div>
                          {update.link && (
                            <a
                              href={update.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0"
                            >
                              <Button variant="ghost" size="sm" className="gap-1">
                                View <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      💡 Stay updated by watching the GitHub repo or starring it for notifications.
                    </p>
                  </div>
                ) : null;
              })()}

              {/* "How Does It Compare?" section */}
              {(() => {
                // Find related compare pages
                const compareUrl = `/directory/compare/${resource.id.split("-")[0]}`;
                return (
                  <div className="mt-6 p-5 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      How Does It Compare?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      View detailed comparison of {resource.name} vs other popular tools
                    </p>
                    <Link href={`/directory/compare/${resource.category.toLowerCase()}/${resource.id.split("-")[0]}`}>
                      <Button variant="outline" size="sm" className="gap-2">
                        View Comparison <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                );
              })()}

              {/* "Similar Tools" section */}
              {(() => {
                const similar = findSimilarResources(resource, 5);
                return similar.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Similar Tools
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {similar.map((r) => (
                        <Link key={r.id} href={`/directory/resource/${r.id}`} className="group">
                          <div className="p-4 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                {r.name}
                              </h4>
                              {r.githubStars && r.githubStars > 0 && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                                  <span>{(r.githubStars / 1000).toFixed(1)}K</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {r.description?.slice(0, 80) || "No description"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Ad slot in content */}
              <div className="my-8 flex justify-center">
                <AdSlot slot="in-content-resource" format="rectangle" />
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

              {/* Share buttons */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Share:</span>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${baseUrl}/directory/resource/${resource.id}`)}&text=${encodeURIComponent(`Check out ${resource.name} — a free ${resource.categoryName} tool via @Craftisle`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors text-sm"
                  title="Share on Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href={`https://reddit.com/submit?url=${encodeURIComponent(`${baseUrl}/directory/resource/${resource.id}`)}&title=${encodeURIComponent(`${resource.name} — free ${resource.categoryName} tool`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-orange-500 transition-colors text-sm"
                  title="Share on Reddit"
                >
                  <MessageSquare className="h-4 w-4" />
                </a>
                <a
                  href={`https://news.ycombinator.com/submitlink?u=${encodeURIComponent(`${baseUrl}/directory/resource/${resource.id}`)}&t=${encodeURIComponent(resource.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-orange-600 transition-colors text-sm"
                  title="Share on Hacker News"
                >
                  <Share2 className="h-4 w-4" />
                </a>
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

              {/* GitHub / Tech Stack Info Cards (only shown when data exists) */}
              {(resource.githubStars !== undefined || resource.githubLicense || resource.isSelfHosted || resource.techStack?.length) && (
                <div className="grid gap-4 sm:grid-cols-3 mt-4">
                  {resource.githubStars !== undefined && resource.githubStars !== null && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          GitHub Stars
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="font-medium">
                          ⭐ {resource.githubStars >= 1000
                            ? (resource.githubStars / 1000).toFixed(1) + "k"
                            : resource.githubStars}
                        </span>
                      </CardContent>
                    </Card>
                  )}
                  {resource.githubLicense && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          License
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs font-mono">
                          {resource.githubLicense}
                        </Badge>
                      </CardContent>
                    </Card>
                  )}
                  {resource.isSelfHosted && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Self-Hosted
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="font-medium text-green-600">✓ Available</span>
                      </CardContent>
                    </Card>
                  )}
                  {resource.githubLastUpdated && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Last Updated
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <span className="font-medium">
                          {new Date(resource.githubLastUpdated).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric"
                          })}
                        </span>
                      </CardContent>
                    </Card>
                  )}
                  {resource.techStack && resource.techStack.length > 0 && (
                    <Card className="sm:col-span-3">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Tech Stack
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {resource.techStack.map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
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
