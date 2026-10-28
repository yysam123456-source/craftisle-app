import { getToolMeta } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HtmlVisualEditorTool from "@/components/tools/HtmlVisualEditorTool";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";
import { getOverrideAsync } from "@/lib/seo/page-meta-db";


/**
 * 🔴 2026-10-15：加 revalidate 让本页进入 ISR。
 * 没有它时本页在构建期就把 metadata 烘死，运行时 page_meta 覆盖层写了也不生效
 * （page_meta_override 表里确实有记录，但页面 HTML 是旧的）。
 * 代价：不再是纯静态，首次请求走一次再生。收益：自动调优对本站真的可用。
 */
export const revalidate = 7200;

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("html-visual-editor");
  if (!meta) return {};

  const url = toolUrl("html-visual-editor");
  // 🔴 叠加 DB 覆盖层（auto-tune 写入的长尾词标题），与 app/tools/[tool] 动态段保持一致。
  // 静态段优先于动态段，不读覆盖层 ⇒ 调优对本站 11 个静态页全部无效。
  const ov = await getOverrideAsync(`/tools/html-visual-editor`);
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
