import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getToolMeta } from "@/lib/tools";

type Props = {
  params: Promise<{ tool: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) return {};

  const url = `https://craftisle.com/tools/${tool}`;
  const title = String(meta.seoTitle || `${meta.title} | Craftisle Free Tools`);
  const description = String(meta.seoDesc || meta.desc || "Free online tool");
  const keywords = meta.seoKeywords && meta.seoKeywords.length > 0
    ? meta.seoKeywords
    : ["free online tools", "web tools", meta.title, "Craftisle"];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "en-US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

export default function ToolLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
