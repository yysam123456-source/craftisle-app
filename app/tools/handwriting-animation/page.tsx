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
  const title = String(meta.seoTitle || `${meta.title} | Craftisle Free Tools`);
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

  const categorySlug = getCategorySlug(meta.category);

  return (
    <ToolDetailLayout
      toolId="handwriting-animation"
      categorySlug={categorySlug}
      meta={meta}
      jsonLd={jsonLd}
    >
      <HandwritingAnimationTool />
      <ToolDetailSections toolId="handwriting-animation" />
    </ToolDetailLayout>
  );
}
