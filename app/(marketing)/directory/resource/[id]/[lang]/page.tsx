import { notFound } from "next/navigation";
import Link from "next/link";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { ArrowLeft, Globe, Star } from "lucide-react";
import { ResourceContentTemplate } from "@/lib/ai-content-template";

const baseUrl = "https://craftisle.com";
const LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'de', 'fr', 'es', 'pt', 'ru', 'ko', 'vi', 'th', 'id', 'tr'];

// ── Static generation：预构建前 10 个资源的 14 种语言版本（ISR） ────
export const revalidate = 86400; // 24小时 ISR
export const dynamicParams = true;

export async function generateStaticParams() {
  // Only pre-generate first 10 resources × 14 languages (140 pages)
  // Rest will be generated on-demand via ISR
  const contentDir = join(process.cwd(), "public", "data", "generated-content");
  const fs = require("fs");
  
  if (!existsSync(contentDir)) return [];
  
  const files = fs.readdirSync(contentDir).filter((f: string) => f.endsWith(".json")).slice(0, 10);
  
  return files.flatMap((file: string) => {
    const resourceId = file.replace(".json", "");
    return LANGUAGES.filter(l => l !== "en").map(lang => ({
      id: resourceId,
      lang: lang,
    }));
  });
}

// ── Metadata (with hreflang) ─────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}): Promise<Metadata> {
  const { id, lang } = await params;
  const content = getContent(id, lang);
  if (!content) {
    return { title: "Not Found" };
  }

  const langNames = {
    'en': 'English', 'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese',
    'ja': 'Japanese', 'de': 'German', 'fr': 'French', 'es': 'Spanish',
    'pt': 'Portuguese', 'ru': 'Russian', 'ko': 'Korean', 'vi': 'Vietnamese',
    'th': 'Thai', 'id': 'Indonesian', 'tr': 'Turkish',
  };

  const title = `${getResourceName(id)} - ${langNames[lang] || lang}`;
  const description = content.introduction?.slice(0, 160) || "";

  return {
    title,
    description,
    alternates: {
      languages: LANGUAGES.reduce((acc, l) => ({
        ...acc,
        [l]: `${baseUrl}/directory/resource/${id}${l === "en" ? "" : `/${l}`}`,
      }), {}),
    },
    openGraph: {
      type: "article",
      url: `${baseUrl}/directory/resource/${id}/${lang}`,
      title,
      description,
      siteName: "Craftisle",
    },
  };
}

// ── Helper functions ─────────────────────────────────
function getContent(resourceId: string, lang: string): ResourceContentTemplate | null {
  try {
    const dir = lang === "en" ? "generated-content" : `generated-content/${lang}`;
    const filePath = join(process.cwd(), "public", "data", dir, `${resourceId}.json`);
    if (!existsSync(filePath)) return null;
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function getResourceName(resourceId: string): string {
  // Extract name from ID (e.g., "artificial-intelligence-00001" -> "00001" is not helpful)
  // In real implementation, read from fmhy-resources.json
  return resourceId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

// ── Page ─────────────────────────────────────────────
export default async function ResourceDetailLangPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const { id, lang } = await params;
  const content = getContent(id, lang);

  if (!content) notFound();

  const resourceName = getResourceName(id);

  // Language switcher
  const langNames: Record<string, string> = {
    'en': 'EN', 'zh-CN': '中文', 'zh-TW': '繁體', 'ja': '日本語',
    'de': 'DE', 'fr': 'FR', 'es': 'ES', 'pt': 'PT', 'ru': 'RU',
    'ko': 'KO', 'vi': 'VI', 'th': 'TH', 'id': 'ID', 'tr': 'TR',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Language Switcher */}
      <div className="border-b bg-muted/30 py-2">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 flex-wrap">
            <Globe className="h-4 w-4 text-muted-foreground" />
            {LANGUAGES.map(l => (
              <Link
                key={l}
                href={`/directory/resource/${id}${l === "en" ? "" : `/${l}`}`}
                className={`text-xs px-2 py-1 rounded ${l === lang ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {langNames[l] || l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="border-b py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{resourceName}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="border-b py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/directory/resource/${id}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to English version
            </Link>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              {resourceName}
            </h1>

            {/* Introduction */}
            <div className="mt-8 p-5 bg-muted/30 rounded-xl border">
              <h2 className="text-lg font-semibold mb-3">About {resourceName}</h2>
              <p className="text-muted-foreground leading-relaxed">{content.introduction}</p>
            </div>

            {/* Features */}
            {content.features && content.features.length > 0 && (
              <div className="mt-6 p-5 bg-green-50/50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-green-600" />
                  Key Features
                </h3>
                <ul className="space-y-3">
                  {content.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span className="text-muted-foreground">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use Cases */}
            {content.useCases && content.useCases.length > 0 && (
              <div className="mt-6 p-5 bg-blue-50/50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold mb-4">Best Use Cases</h3>
                <ul className="space-y-3">
                  {content.useCases.map((useCase, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span className="text-muted-foreground">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pricing */}
            <div className="mt-6 p-5 bg-purple-50/50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <h3 className="text-lg font-semibold mb-3">Pricing</h3>
              <Badge variant={content.pricing?.type === "free" ? "default" : "secondary"}>
                {content.pricing?.type === "free" ? "100% Free" : content.pricing?.type || "Unknown"}
              </Badge>
              {content.pricing?.description && (
                <p className="mt-2 text-sm text-muted-foreground">{content.pricing.description}</p>
              )}
            </div>

            {/* Pros & Cons */}
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {content.pros && content.pros.length > 0 && (
                <GlassCard className="border-green-200 dark:border-green-900 bg-green-50/40 dark:bg-green-950/20">
                  <GlassCardHeader className="pb-2">
                    <GlassCardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      ✓ Pros
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <ul className="space-y-2">
                      {content.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCardContent>
                </GlassCard>
              )}
              {content.cons && content.cons.length > 0 && (
                <GlassCard className="border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20">
                  <GlassCardHeader className="pb-2">
                    <GlassCardTitle className="text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                      ✗ Cons
                    </GlassCardTitle>
                  </GlassCardHeader>
                  <GlassCardContent>
                    <ul className="space-y-2">
                      {content.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-red-500 mt-1">✗</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCardContent>
                </GlassCard>
              )}
            </div>

            {/* Alternatives */}
            {content.alternatives && content.alternatives.length > 0 && (
              <div className="mt-6 p-5 bg-amber-50/50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <h3 className="text-lg font-semibold mb-4">Similar Alternatives</h3>
                <div className="flex flex-wrap gap-2">
                  {content.alternatives.map((alt, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {alt.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Start */}
            {content.quickStart && content.quickStart.length > 0 && (
              <div className="mt-6 p-5 bg-muted/30 rounded-xl border">
                <h3 className="text-lg font-semibold mb-4">Quick Start Guide</h3>
                <ol className="space-y-3">
                  {content.quickStart.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/directory/resource/${id}`}>
                <Button size="lg" className="gap-2">
                  Visit English Page
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
