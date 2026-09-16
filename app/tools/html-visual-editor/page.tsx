import { getToolMeta } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HtmlVisualEditorTool from "@/components/tools/HtmlVisualEditorTool";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("html-visual-editor");
  if (!meta) return {};

  const url = toolUrl("html-visual-editor");
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

export default function ToolPage() {
  const meta = getToolMeta("html-visual-editor");
  if (!meta) return null;

  // 此前这里手写了精简版 JSON-LD：只有 SoftwareApplication + FAQPage，
  // 缺 HowTo(tutorial)、url、author、publisher、inLanguage、isAccessibleForFree。
  // 改用共享构建器后与 app/tools/[tool]/ 模板完全一致。
  return (
    <ToolDetailLayout
      toolId="html-visual-editor"
      categorySlug={getToolCategorySlug(meta.category)}
      meta={meta}
      jsonLd={buildToolJsonLd("html-visual-editor", meta)}
    >
      <HtmlVisualEditorTool />
      <ToolDetailSections toolId="html-visual-editor" />
    </ToolDetailLayout>
  );
}
