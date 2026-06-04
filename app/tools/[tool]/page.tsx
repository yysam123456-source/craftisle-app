import { getToolMeta, CATEGORY_LIST, type ToolMeta } from "@/lib/tools";
import { getToolDefinition } from "@/lib/image-tools/registry";
import type { ToolDefinition } from "@/lib/image-tools/types";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolLoader } from "@/lib/tool-components";
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

  const ogImage = `https://craftisle.com/og-image.png`;

  return {
    title,
    description,
    keywords: meta.seoKeywords,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${meta.title} — Free Online Tool`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
  };
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

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: meta.title,
    description: meta.desc,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.com",
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

  // Image tools: use ImageToolPage
  if (definition) {
    const clientDef = {
      id: definition.id,
      acceptTypes: definition.acceptTypes,
      maxFileSize: definition.maxFileSize,
    };
    return (
      <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url}>
        <ImageToolPage toolId={tool} definition={clientDef} />
        <ToolDetailSections toolId={tool} />
      </ToolDetailLayout>
    );
  }

  // Non-image tools: try ToolLoader first, fallback to ToolDetailSections
  return (
    <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url}>
      <ToolLoader toolId={tool} />
      <ToolDetailSections toolId={tool} />
    </ToolDetailLayout>
  );
}
