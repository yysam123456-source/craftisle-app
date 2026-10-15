import { getToolMeta } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HtmlVisualEditorTool from "@/components/tools/HtmlVisualEditorTool";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";
import { getOverride } from "@/lib/seo/page-meta-db";

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("html-visual-editor");
  if (!meta) return {};

  const url = toolUrl("html-visual-editor");
  // 🔴 叠加 DB 覆盖层（auto-tune 写入的长尾词标题），与 app/tools/[tool] 动态段保持一致。
  // 静态段优先于动态段，不读覆盖层 ⇒ 调优对本站 11 个静态页全部无效。
  const ov = getOverride(`/tools/html-visual-editor`);
  const title = ov?.title ?? String(meta.seoTitle || `${meta.title}`);
  const description = ov?.description ?? String(meta.seoDesc || meta.desc || "Free online tool");

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
