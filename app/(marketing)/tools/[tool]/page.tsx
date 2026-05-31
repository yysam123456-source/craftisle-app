import { getToolDefinition } from "@/lib/image-tools/registry";
import type { ToolDefinition } from "@/lib/image-tools/types";
import { getToolMeta, toolMeta, CATEGORIES, type ToolMeta } from "@/lib/tools";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";

interface Props {
  params: Promise<{ tool: string }>;
}

function getCategorySlug(categoryLabel: string): string {
  return Object.entries(CATEGORIES).find(([, v]) => v === categoryLabel)?.[0] || "other";
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) return {};

  const url = `https://craftisle.com/tools/${tool}`;
  return {
    title: `${meta.title} | Craftisle Free Tools`,
    description: meta.desc,
    keywords: ["free online tools", "web tools", meta.title, "Craftisle"],
    openGraph: {
      title: `${meta.title} | Craftisle`,
      description: meta.desc,
      url,
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${meta.title} | Craftisle`,
      description: meta.desc,
    },
    alternates: { canonical: url },
  };
}

/** Build related tool cards from an array of tool IDs (server-side) */
function buildRelatedTools(ids: string[] | undefined) {
  if (!ids || ids.length === 0) return [];
  return ids
    .map((id) => {
      const m = toolMeta[id];
      return m ? { id, title: m.title, desc: m.desc, icon: m.icon } : null;
    })
    .filter(Boolean) as { id: string; title: string; desc: string; icon: string }[];
}

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);
  const meta = getToolMeta(tool);

  if (!definition || !meta) {
    notFound();
  }

  // JsonLD structured data
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

  const clientDef = {
    id: definition.id,
    acceptTypes: definition.acceptTypes,
    maxFileSize: definition.maxFileSize,
  };

  const related = buildRelatedTools(meta.relatedTools);
  const categorySlug = getCategorySlug(meta.category);

  return (
    <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} relatedTools={related}>
      <ImageToolPage toolId={tool} definition={clientDef} />
    </ToolDetailLayout>
  );
}
