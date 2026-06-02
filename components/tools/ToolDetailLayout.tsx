"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Heart,
  Share2,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import type { ToolMeta } from "@/lib/tools";

interface ToolDetailLayoutProps {
  toolId: string;
  categorySlug: string;
  meta: ToolMeta;
  children?: React.ReactNode;
  /** JsonLd structured data (inject as <script type="application/ld+json">) */
  jsonLd?: Record<string, unknown>;
  /** External URL — when set, show "Open Tool ↗" button below description */
  externalUrl?: string;
}

export function ToolDetailLayout({
  toolId,
  categorySlug,
  meta,
  children,
  jsonLd,
  externalUrl,
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
    </div>
  );
}
