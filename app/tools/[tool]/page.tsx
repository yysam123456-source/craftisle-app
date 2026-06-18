import { getToolMeta, CATEGORY_LIST, type ToolMeta } from "@/lib/tools";
import { getToolDefinition } from "@/lib/image-tools/registry";
import type { ToolDefinition } from "@/lib/image-tools/types";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolLoader } from "@/lib/tool-components";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getRelatedTools } from "@/lib/related-tools";

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

  return constructMetadata({
    title,
    description,
    keywords: meta.seoKeywords,
  });
}

function getCategorySlug(categoryLabel: string): string {
  const entry = CATEGORY_LIST.find((c) => c.label === categoryLabel);
  return entry?.key ?? "utility";
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);
  const meta = getToolMeta(tool);

  if (!meta) {
    notFound();
  }

  const toolUrl = `https://craftisle.com/tools/${tool}`;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: meta.title,
    description: meta.desc,
    url: toolUrl,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Craftisle Team",
      url: "https://craftisle.com/about",
    },
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.com",
      logo: {
        "@type": "ImageObject",
        url: "https://craftisle.com/logo.png",
      },
    },
    inLanguage: "en-US",
    isAccessibleForFree: true,
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

  if (meta.howToUse && meta.howToUse.length > 0) {
    jsonLd.tutorial = {
      "@type": "HowTo",
      name: `How to Use ${meta.title}`,
      description: meta.desc || `Step-by-step guide for using ${meta.title} free online.`,
      step: meta.howToUse.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.heading,
        text: s.text,
      })),
    };
  }

  const categorySlug = getCategorySlug(meta.category);
  const relatedTools = getRelatedTools(tool);

  // Image tools: use ImageToolPage
  if (definition) {
    const clientDef = {
      id: definition.id,
      acceptTypes: definition.acceptTypes,
      maxFileSize: definition.maxFileSize,
    };
    return (
      <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url} author="Craftisle Team" relatedTools={relatedTools}>
        <ImageToolPage toolId={tool} definition={clientDef} />
        <ToolDetailSections toolId={tool} />
      </ToolDetailLayout>
    );
  }

  // Non-image tools: try ToolLoader first, fallback to ToolDetailSections
  return (
    <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url} author="Craftisle Team" relatedTools={relatedTools}>
      <ToolLoader toolId={tool} />
      <ToolDetailSections toolId={tool} />
    </ToolDetailLayout>
  );
}
