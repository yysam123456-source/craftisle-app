import { getToolMeta, type ToolMeta } from "@/lib/tools";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TitleSetter } from "@/components/tools/TitleSetter";

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

  return {
    title,
    description,
    openGraph: { title, description, url, type: "website" as const, locale: "en-US" },
    twitter: { card: "summary_large_image" as const, title, description },
    alternates: { canonical: url },
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const meta = getToolMeta(tool);

  if (!meta) {
    notFound();
  }

  const seoTitle = String(meta.seoTitle || `${meta.title} | Craftisle Free Tools`);
  const seoDesc = String(meta.seoDesc || meta.desc || "Free online tool");

  return (
    <>
      <TitleSetter title={seoTitle} />
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold">UPDATED PAGE - {meta.title}</h1>
          <p className="mt-4 text-muted-foreground">{meta.desc}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            SEO Title: {seoTitle}
          </p>
        </div>
      </div>
    </>
  );
}
