"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  ChevronRight,
  Heart,
  Share2,
  Maximize2,
} from "lucide-react";
import type { ToolMeta } from "@/lib/tools";

interface RelatedToolCard {
  id: string;
  title: string;
  desc: string;
  icon: string;
}

interface ToolDetailLayoutProps {
  toolId: string;
  categorySlug: string;
  meta: ToolMeta;
  children?: React.ReactNode;
  /** JsonLd structured data (inject as <script type="application/ld+json">) */
  jsonLd?: Record<string, unknown>;
  /** Pre-built related tool cards (built server-side) */
  relatedTools?: RelatedToolCard[];
}

export function ToolDetailLayout({
  toolId,
  categorySlug,
  meta,
  children,
  jsonLd,
  relatedTools,
}: ToolDetailLayoutProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      {/* === JsonLd === */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {/* === Breadcrumb === */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/tools" className="hover:text-foreground">
          Tools
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/tools?category=${categorySlug}`}
          className="hover:text-foreground"
        >
          {meta.category}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{meta.title}</span>
      </nav>

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
          <Button variant="ghost" size="icon" className="ml-auto" title="Favorite">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Share">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground max-w-2xl">{meta.desc}</p>
      </div>

      {/* === Tool Operation Area (children) === */}
      <div>{children}</div>

      {/* === AdSlot 1: below tool === */}
      <div className="flex justify-center py-4">
        <AdSlot slotId={`tool-${toolId}-below`} size="leaderboard" />
      </div>

      {/* === Description Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">About This Tool</h2>
        {meta.description ? (
          <div
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: meta.description }}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">Description coming soon.</p>
        )}
      </section>

      {/* === How To Use === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How to Use</h2>
        {meta.howToUse && meta.howToUse.length > 0 ? (
          <ol className="space-y-4">
            {meta.howToUse.map((step, i) => (
              <li key={i} className="ml-5 list-decimal">
                <strong>{step.heading}</strong>
                <p className="text-muted-foreground mt-1">{step.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground italic">Usage guide coming soon.</p>
        )}
      </section>

      {/* === Use Cases === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Use Cases</h2>
        {meta.useCases && meta.useCases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {meta.useCases.map((uc, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold">{uc.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {uc.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Use cases coming soon.</p>
        )}
      </section>

      {/* === AdSlot 2: below use cases === */}
      <div className="flex justify-center py-4">
        <AdSlot slotId={`tool-${toolId}-mid`} size="rectangle" />
      </div>

      {/* === FAQ Section === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">FAQ</h2>
        {meta.faq && meta.faq.length > 0 ? (
          <div className="space-y-4">
            {meta.faq.map((item, i) => (
              <details
                key={i}
                className="rounded-xl border bg-card p-4"
              >
                <summary className="cursor-pointer font-semibold">
                  {item.q}
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">FAQ coming soon.</p>
        )}
      </section>

      {/* === Related Tools === */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Related Tools</h2>
        {relatedTools && relatedTools.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {relatedTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.id}`}
                className="block rounded-xl border bg-card p-4 hover:shadow-md transition"
              >
                <div className="text-lg">{tool.icon}</div>
                <div className="font-semibold mt-1">{tool.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {tool.desc}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Related tools coming soon.</p>
        )}
      </section>
    </div>
  );
}
