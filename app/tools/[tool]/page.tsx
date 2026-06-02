import { getToolDefinition } from "@/lib/image-tools/registry";
import type { ToolDefinition } from "@/lib/image-tools/types";
import { getToolMeta, CATEGORY_LIST, type ToolMeta } from "@/lib/tools";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) return {};

  const url = `https://craftisle.com/tools/${tool}`;
  const title = String(meta.seoTitle || `${meta.title} | Craftisle Free Tools`);
  const description = String(meta.seoDesc || meta.desc || "Free online tool");

  const metadata: Metadata = {
    title,
    description,
    keywords: meta.seoKeywords,
    openGraph: { title, description, url, type: "website" as const, locale: "en-US" },
    twitter: { card: "summary_large_image" as const, title, description },
    alternates: { canonical: url },
  };

  return metadata;
}

function getCategorySlug(categoryLabel: string): string {
  const entry = CATEGORY_LIST.find((c) => c.label === categoryLabel);
  return entry?.key ?? "utility";
}

function buildRelatedTools(related: string[]): { id: string; title: string; desc: string; icon: string }[] {
  if (!related) return [];
  return related
    .map((id) => {
      const m = getToolMeta(id);
      if (!m) return null;
      return { id, title: m.title, desc: m.desc, icon: m.icon };
    })
    .filter((m): m is { id: string; title: string; desc: string; icon: string } => m != null);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);
  const meta = getToolMeta(tool);

  if (!meta) {
    notFound();
  }

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: meta.title,
    description: meta.desc,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  if (meta.faq && meta.faq.length > 0) {
    jsonLd.mainEntity = {
      "@type": "FAQPage",
      mainEntity: meta.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
  }

  const related = meta.relatedTools ? buildRelatedTools(meta.relatedTools) : [];
  const categorySlug = getCategorySlug(meta.category);

  if (definition) {
    const clientDef = {
      id: definition.id,
      acceptTypes: definition.acceptTypes,
      maxFileSize: definition.maxFileSize,
    };
    return (
      <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} relatedTools={related}>
        <ImageToolPage toolId={tool} definition={clientDef} />
      </ToolDetailLayout>
    );
  }

  return (
    <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} relatedTools={related}>
      <ToolDetailSections toolId={tool} />
    </ToolDetailLayout>
  );
}
