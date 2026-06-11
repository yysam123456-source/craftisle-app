"use client"

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink, ArrowLeft, Globe, Tag, BookOpen, Star, Zap,
  Shield, Code, Users, Sparkles, ThumbsUp, ThumbsDown, Lightbulb,
  CheckCircle, Clock, Monitor, Database, Lock, FileText, ChevronRight,
  Layers, Award, TrendingUp, AlertTriangle, Info
} from "lucide-react";
import { ResourceCard } from "@/components/resources/resource-card";
import type { Resource } from "@/lib/fmhy-data";
import { extractFreeTierHighlights, generateResourceSummary } from "@/components/resources/enriched-resource-card";

interface ResourceDetailProps {
  resource: Resource;
  related: Resource[];
  review: any | null;
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

/**
 * Free Tier 模块 —— 专门展示 free-for-dev 资源的免费额度详情
 */
function FreeTierSection({ resource }: { resource: Resource }) {
  if (resource.source !== "free-for-dev" || !resource.freeTier) return null;

  const highlights = extractFreeTierHighlights(resource.freeTier);
  if (highlights.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <Zap className="h-5 w-5" />
          Free Tier Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {resource.name} offers the following free tier for developers. These quotas reset monthly unless otherwise noted.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {highlights.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-background/80 border border-border/50">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * API 详情模块 —— 专门展示 public-apis 资源的技术规格
 */
function APISpecsSection({ resource }: { resource: Resource }) {
  if (resource.source !== "public-apis") return null;

  const specs = [
    { label: "Authentication", value: resource.auth || "Unknown", icon: <Lock className="h-4 w-4" /> },
    { label: "HTTPS", value: resource.https ? "Supported" : resource.https === false ? "Not supported" : "Unknown", icon: <Shield className="h-4 w-4" /> },
    { label: "CORS", value: resource.cors ? "Enabled" : resource.cors === false ? "Disabled" : "Unknown", icon: <Database className="h-4 w-4" /> },
  ];

  return (
    <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
          <Code className="h-5 w-5" />
          API Specifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border/50">
              <div className="text-muted-foreground">{spec.icon}</div>
              <div>
                <p className="text-xs text-muted-foreground">{spec.label}</p>
                <p className="text-sm font-medium">{spec.value}</p>
              </div>
            </div>
          ))}
        </div>
        {resource.auth === "No" && (
          <div className="mt-3 flex items-start gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>This API requires no authentication, making it ideal for quick prototyping and testing.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Self-Hosted 详情模块
 */
function SelfHostedSection({ resource }: { resource: Resource }) {
  if (resource.source !== "awesome-selfhosted") return null;

  const features = [
    resource.isOpenSource && { label: "Open Source", desc: "Source code freely available", icon: <Code className="h-4 w-4" /> },
    resource.isSelfHosted && { label: "Self-Hosted", desc: "Deploy on your own infrastructure", icon: <Users className="h-4 w-4" /> },
    resource.license && { label: resource.license, desc: "Software license", icon: <FileText className="h-4 w-4" /> },
    resource.language && { label: resource.language, desc: "Primary language", icon: <Code className="h-4 w-4" /> },
  ].filter(Boolean) as { label: string; desc: string; icon: React.ReactNode }[];

  if (features.length === 0) return null;

  return (
    <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
          <Monitor className="h-5 w-5" />
          Self-Hosting Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border/50">
              <div className="text-muted-foreground">{f.icon}</div>
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        {resource.githubUrl && (
          <a
            href={resource.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Code className="h-4 w-4" />
            View source code on GitHub <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 快速事实信息卡 —— 始终展示的基础信息
 */
function QuickFacts({ resource }: { resource: Resource }) {
  const facts = [
    {
      label: "Category",
      value: resource.categoryName || resource.category,
      icon: <Layers className="h-4 w-4" />,
      href: `/directory/${resource.category}`,
    },
    {
      label: "Cost",
      value: resource.source === "free-for-dev" ? "Free Tier Available" : "100% Free",
      icon: <Zap className="h-4 w-4" />,
      color: "text-green-600",
    },
    {
      label: "Website",
      value: getHostname(resource.url),
      icon: <Globe className="h-4 w-4" />,
      href: resource.url,
      external: true,
    },
    ...(resource.githubStars ? [{
      label: "GitHub Stars",
      value: resource.githubStars >= 1000 ? `${(resource.githubStars / 1000).toFixed(1)}k` : `${resource.githubStars}`,
      icon: <Star className="h-4 w-4" />,
      color: "text-amber-600",
    }] : []),
    ...(resource.githubLastUpdated ? [{
      label: "Last Updated",
      value: new Date(resource.githubLastUpdated).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      icon: <Clock className="h-4 w-4" />,
    }] : []),
    ...(resource.techStack?.length ? [{
      label: "Tech Stack",
      value: resource.techStack.join(", "),
      icon: <Code className="h-4 w-4" />,
    }] : []),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {facts.map((fact, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">{fact.icon}</div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{fact.label}</p>
                {fact.href ? (
                  fact.external ? (
                    <a
                      href={fact.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-sm font-medium hover:underline truncate flex items-center gap-1 ${fact.color || ""}`}
                    >
                      {fact.value} <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <Link href={fact.href} className={`text-sm font-medium hover:text-primary transition-colors truncate block ${fact.color || ""}`}>
                      {fact.value}
                    </Link>
                  )
                ) : (
                  <p className={`text-sm font-medium truncate ${fact.color || ""}`}>{fact.value}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 增强版 About 区域 —— 智能描述 + 自动生成摘要
 */
function AboutSection({ resource }: { resource: Resource }) {
  const summary = generateResourceSummary(resource);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Info className="h-5 w-5 text-primary" />
        About {resource.name}
      </h2>
      <div className="space-y-4">
        <p className="text-muted-foreground leading-relaxed text-[15px]">
          {summary}
        </p>
        {resource.description && resource.description !== summary && (
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {resource.description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Tags 展示
 */
function TagsSection({ resource }: { resource: Resource }) {
  if (!resource.tags || resource.tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {resource.tags.map((tag) => (
        <Badge key={tag} variant="outline" className="text-xs">
          <Tag className="h-2.5 w-2.5 mr-1" />
          {tag}
        </Badge>
      ))}
    </div>
  );
}

/**
 * 增强版 Review 展示（支持无 review 时的兜底展示）
 */
function EnhancedReviewSection({ review, resource }: { review: any; resource: Resource }) {
  if (review) {
    const { content } = review;
    return (
      <div className="border-t pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold">In-Depth Review</h2>
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            AI-Enhanced
          </Badge>
        </div>

        <div className="mb-8">
          <p className="text-muted-foreground leading-relaxed text-[15px]">
            {content.overview}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                <ThumbsUp className="h-4 w-4" />
                Pros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <ThumbsDown className="h-4 w-4" />
                Cons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {content.cons.map((con: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Lightbulb className="h-4 w-4" />
              Best Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {content.bestUseCases.map((useCase: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {content.similarAlternatives?.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">Similar Tools & Alternatives</h3>
            <div className="flex flex-wrap gap-2">
              {content.similarAlternatives.map((alt: string) => (
                <Badge key={alt} variant="secondary" className="text-xs">
                  {alt}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 无 review 时的兜底展示：自动生成的 Why Use It / What to Know
  return (
    <div className="border-t pt-8">
      <div className="flex items-center gap-2 mb-6">
        <Award className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Why Use {resource.name}?</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
              <ThumbsUp className="h-4 w-4" />
              Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Listed as a trusted {resource.categoryName || "free resource"} in the Craftisle directory</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Available at no cost — verified free-to-use</span>
              </li>
              {resource.source === "free-for-dev" && resource.freeTier && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Includes a free tier with developer-friendly quotas</span>
                </li>
              )}
              {resource.source === "public-apis" && resource.auth === "No" && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>No authentication required — easy to get started</span>
                </li>
              )}
              {resource.source === "awesome-selfhosted" && resource.isOpenSource && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Open-source — full control over your data and deployment</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Info className="h-4 w-4" />
              What to Know
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Always review the official terms of service before heavy use</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span>Free tiers may have usage limits that reset monthly</span>
              </li>
              {resource.source === "public-apis" && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Check the API documentation for rate limits and endpoints</span>
                </li>
              )}
              {resource.source === "awesome-selfhosted" && (
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ChevronRight className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>Self-hosting requires technical knowledge and server resources</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * 主组件：增强版资源详情页
 */
export function ResourceDetailEnhanced({ resource, related, review }: ResourceDetailProps) {
  const faviconUrl = getFaviconUrl(resource.url);
  const hostname = getHostname(resource.url);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b py-10 md:py-14">
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
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" loading="lazy" className="w-10 h-10 object-contain" />
                ) : (
                  <Globe className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      {resource.name}
                    </h1>
                    <p className="mt-1 text-muted-foreground text-sm">{hostname}</p>
                  </div>
                  <StarButtonWrapper resourceId={resource.id} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {resource.categoryIcon} {resource.categoryName}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    ✓ {resource.source === "free-for-dev" ? "Free Tier" : "Free"}
                  </Badge>
                  <TagsSection resource={resource} />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button size="lg" className="gap-2">
                  Visit {resource.name} <ExternalLink className="h-4 w-4" />
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

      {/* Main Content */}
      <section className="py-10 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Quick Facts */}
            <QuickFacts resource={resource} />

            {/* About Section */}
            <AboutSection resource={resource} />

            {/* Source-specific sections */}
            <FreeTierSection resource={resource} />
            <APISpecsSection resource={resource} />
            <SelfHostedSection resource={resource} />

            {/* Review or Fallback */}
            <EnhancedReviewSection review={review} resource={resource} />
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
                  <ResourceCard key={r.id} resource={r} showCategory={false} variant="default" />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link href={`/directory/${resource.category}`}>
                  <Button variant="outline">View All {resource.categoryName} Tools →</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
