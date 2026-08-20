import { getToolMeta, CATEGORY_LIST } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HandwritingAnimationTool from "@/components/tools/handwriting-animation";

// Static page — /tools/handwriting-animation (exact match)
// NOT /tools/[tool] (dynamic catch-all)

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("handwriting-animation");
  if (!meta) return {};

  const url = `https://craftisle.com/tools/handwriting-animation`;
  const title = String(meta.seoTitle || `${meta.title}`);
  const description = String(meta.seoDesc || meta.desc || "Free online tool");

  return {
    title,
    description,
    keywords: meta.seoKeywords,
    openGraph: { title, description, url, type: "website" as const, locale: "en-US" },
    twitter: { card: "summary_large_image" as const, title, description },
    alternates: { canonical: url },
  };
}

function getCategorySlug(categoryLabel: string): string {
  const entry = CATEGORY_LIST.find((c) => c.label === categoryLabel);
  return entry?.key ?? "other";
}

export default function ToolPage() {
  const meta = getToolMeta("handwriting-animation");
  if (!meta) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (meta.faq || []).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Create Handwriting Animation Free Online",
    description:
      "Step-by-step guide to create beautiful handwriting animations from any text using Craftisle free online tool.",
    step: [
      {
        "@type": "HowToStep",
        name: "Enter your text",
        text: "Type or paste any text into the text area. Supports all languages and Unicode characters including Chinese, Japanese, Korean.",
      },
      {
        "@type": "HowToStep",
        name: "Choose a handwriting font",
        text: "Select from 8 beautiful handwriting fonts: Caveat, Italianno, Tangerine, Parisienne, Suez One, Klee One, Amiri, Tilana. Each animates with authentic stroke order.",
      },
      {
        "@type": "HowToStep",
        name: "Adjust animation settings",
        text: "Set animation speed (slow/normal/fast), font size, and loop mode. Click Replay to preview the animation.",
      },
      {
        "@type": "HowToStep",
        name: "Export as GIF (optional)",
        text: "Click the GIF Export button to render the animation as a downloadable GIF file. Supports custom frame rate and loop settings.",
      },
    ],
  };

  const categorySlug = getCategorySlug(meta.category);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <ToolDetailLayout
        toolId="handwriting-animation"
        categorySlug={categorySlug}
        meta={meta}
      >
        <HandwritingAnimationTool />
        <ToolDetailSections toolId="handwriting-animation" />
      </ToolDetailLayout>
    </>
  );
}
