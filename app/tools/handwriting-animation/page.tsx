import { getToolMeta } from "@/lib/tools";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { Metadata } from "next";
import HandwritingAnimationTool from "@/components/tools/handwriting-animation";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";
import { getOverrideAsync, lastLoadError } from "@/lib/seo/page-meta-db";

// Static page — /tools/handwriting-animation (exact match)
// NOT /tools/[tool] (dynamic catch-all)
//
// 静态段优先于动态段，所以本页不会经过 app/tools/[tool]/page.tsx 模板，
// 模板提供的正文区块(FAQ/HowTo/UseCases/RelatedTools)与结构化数据都得自己补齐。


/**
 * 🔴 2026-10-15：加 revalidate 让本页进入 ISR。
 * 没有它时本页在构建期就把 metadata 烘死，运行时 page_meta 覆盖层写了也不生效
 * （page_meta_override 表里确实有记录，但页面 HTML 是旧的）。
 * 代价：不再是纯静态，首次请求走一次再生。收益：自动调优对本站真的可用。
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const meta = getToolMeta("handwriting-animation");
  if (!meta) return {};

  const url = toolUrl("handwriting-animation");
  // 🔴 叠加 DB 覆盖层（auto-tune 写入的长尾词标题），与 app/tools/[tool] 动态段保持一致。
  // 静态段优先于动态段，不读覆盖层 ⇒ 调优对本站 11 个静态页全部无效。
  const ov = await getOverrideAsync(`/tools/handwriting-animation`);
  const title = ov?.title ?? String(meta.seoTitle || `${meta.title}`);
  const description = ov?.description ?? String(meta.seoDesc || meta.desc || "Free online tool");

  // 🔴🔴 DEBT-33 临时探针（定位后必须删除）：语义同 app/tools/[tool]/page.tsx。
  return {
    title,
    description,
    keywords: meta.seoKeywords,
    openGraph: { title, description, url, type: "website" as const, locale: "en-US" },
    twitter: { card: "summary_large_image" as const, title, description },
    alternates: { canonical: url },
    other: {
      "x-diag-md": [
        ov ? "FOUND" : "MISS",
        "/tools/handwriting-animation",
        `db=${process.env.DATABASE_URL ? "y" : "n"}`,
        `err=${(lastLoadError ?? "none").slice(0, 60)}`,
        String(Date.now()),
      ].join("|"),
    },
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
