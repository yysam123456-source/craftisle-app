import { getToolMeta } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HandwritingAnimationTool from "@/components/tools/handwriting-animation";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";

// Static page — /tools/handwriting-animation (exact match)
// NOT /tools/[tool] (dynamic catch-all)
//
// 静态段优先于动态段，所以本页不会经过 app/tools/[tool]/page.tsx 模板，
// 模板提供的正文区块(FAQ/HowTo/UseCases/RelatedTools)与结构化数据都得自己补齐。

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("handwriting-animation");
  if (!meta) return {};

  const url = toolUrl("handwriting-animation");
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
  const meta = getToolMeta("handwriting-animation");
  if (!meta) return null;

  // 此前本页手写了 FAQPage + HowTo 两个 schema，但缺 SoftwareApplication
  // —— 而 SoftwareApplication 正是应用类富媒体结果所依赖的那个。
  // 现统一走 buildToolJsonLd，与 app/tools/[tool]/ 模板同源，避免再次分叉。
  // 注：原手写 HowTo 的步骤文案更细（点名了 8 个字体），如需保留应回填进
  // lib/tools.ts 的 howToUse，而不是在这一页单独硬编码。
  return (
    <ToolDetailLayout
      toolId="handwriting-animation"
      categorySlug={getToolCategorySlug(meta.category)}
      meta={meta}
      jsonLd={buildToolJsonLd("handwriting-animation", meta)}
    >
      <HandwritingAnimationTool />
      <ToolDetailSections toolId="handwriting-animation" />
    </ToolDetailLayout>
  );
}
