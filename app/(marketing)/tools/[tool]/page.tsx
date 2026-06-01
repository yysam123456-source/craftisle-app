import type { Metadata } from "next";
import { getToolMeta } from "@/lib/tools";

type Props = {
  params: Promise<{ tool: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) return {};
  
  const url = `https://craftisle.com/tools/${tool}`;
  const title = meta.seoTitle || `${meta.title} | Craftisle Free Tools`;
  const description = meta.seoDesc || meta.desc || "Free online tool";
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

export default async function ToolPage({ params }: Props) {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  
  if (!meta) {
    // Use Next.js built-in notFound
    const { notFound } = await import("next/navigation");
    notFound();
    return null;
  }
  
  // Simple server-rendered page without client components
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>{meta.title}</h1>
      <p>{meta.desc}</p>
      <a href="/tools">← Back to all tools</a>
    </div>
  );
}
