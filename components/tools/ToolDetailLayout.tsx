"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ToolMeta } from "@/lib/tools";
import { toolMeta } from "@/lib/tools";
import { Breadcrumb, type BreadcrumbItem } from "@/components/Breadcrumb";

interface ToolDetailLayoutProps {
  toolId: string;
  categorySlug: string;
  meta: ToolMeta;
  children?: React.ReactNode;
  /** JsonLD structured data (inject as <script type="application/ld+json">) */
  jsonLd?: Record<string, unknown>;
  /** External URL — when set, show "Open Tool ↗" button below description */
  externalUrl?: string;
  /** Author name to display below description (optional, defaults to "Craftisle Team") */
  author?: string;
  /** Related tool IDs for cross-linking (optional) */
  relatedTools?: string[];
}

export function ToolDetailLayout({
  toolId,
  categorySlug,
  meta,
  children,
  jsonLd,
  externalUrl,
  author,
  relatedTools,
}: ToolDetailLayoutProps) {
  // Generate breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: "Home", url: "https://craftisle.com" },
    { name: "Tools", url: "https://craftisle.com/tools" },
    { name: meta.title, url: `https://craftisle.com/tools/${toolId}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* === JsonLD === */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* === FAQPage JSON-LD (SEO optimization) === */}
      {meta.faq && meta.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: meta.faq.map(item => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
            }),
          }}
        />
      )}

      {/* === Breadcrumb === */}
      <Breadcrumb items={breadcrumbItems} />

      {/* === Tool Header === */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl">{meta.icon}</span>
          <h1 className="text-2xl font-bold">{meta.title}</h1>
          {meta.badge && (
            <Badge variant="secondary" className="text-xs">
              {meta.badge}
            </Badge>
          )}
        </div>
        {/* Quick Answer Box (GEO optimization) */}
        <div className="quick-answer bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h2 className="text-base font-semibold text-blue-900 mb-1">
            What is {meta.title}? (Quick Answer)
          </h2>
          <p className="text-sm text-blue-800 leading-relaxed">
            {meta.desc} Free online tool, no registration required, 100% client-side processing.
          </p>
        </div>
        <p className="text-muted-foreground max-w-2xl">{meta.desc}</p>
        {author && (
          <p className="text-sm text-muted-foreground">
            By {author}
          </p>
        )}
        {externalUrl && (
          <div className="pt-2">
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="gap-2 text-base px-6">
                Open Tool <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </div>
        )}
      </div>

      {/* === Content (children) === */}
      <div>{children}</div>

      {/* === FAQ Section (SEO optimization) === */}
      {meta.faq && meta.faq.length > 0 && (
        <section className="pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {meta.faq.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-medium text-base mb-2">{item.q}</h3>
                <p className="text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === Related Tools === */}
      {relatedTools && relatedTools.length > 0 && (
        <section className="pt-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedTools.map((relatedId) => {
              const relatedMeta = toolMeta[relatedId];
              if (!relatedMeta) return null;
              return (
                <Link
                  key={relatedId}
                  href={`/tools/${relatedId}`}
                  className="block rounded-lg border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{relatedMeta.icon}</span>
                    <h3 className="font-medium text-sm">{relatedMeta.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {relatedMeta.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
