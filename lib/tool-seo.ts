/**
 * 工具页 SEO 构建器 —— 从 app/tools/[tool]/page.tsx 抽出。
 *
 * 抽出的原因：有 8 个工具（ai-watermark-remover / handwriting-animation /
 * html-visual-editor / image-compress / image-convert / media-downloader /
 * regex-vis / text-translator）在 app/tools/<name>/page.tsx 各有独立的静态页，
 * 静态段优先于 [tool] 动态段 ⇒ 它们不经过模板，拿不到模板的 JSON-LD 与正文区块。
 * 修法是让这 8 页复用同一套构建器，而不是把同样 80 行 JSON-LD 复制 9 遍。
 */
import type { ToolMeta } from "@/lib/tools";
import { CATEGORY_LIST } from "@/lib/tools";

const SITE = "https://craftisle.com";

export const toolUrl = (toolId: string) => `${SITE}/tools/${toolId}`;

/** 工具所属分类的对外 slug（用于 ToolDetailLayout 的分类面包屑/内链） */
export function getToolCategorySlug(categoryLabel: string): string {
  const entry = CATEGORY_LIST.find((c) => c.label === categoryLabel);
  return entry?.key ?? "utility";
}

/**
 * 完整结构化数据：SoftwareApplication + FAQPage + HowTo。
 *
 * 三者缺一不可 —— FAQPage 与 HowTo 只有在该工具确实填了 faq / howToUse 时才挂上，
 * 空数组不能挂（会被 Search Console 判为无效结构化数据）。
 */
export function buildToolJsonLd(toolId: string, meta: ToolMeta): Record<string, unknown> {
  const url = toolUrl(toolId);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: meta.title,
    description: meta.desc,
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "Craftisle Team",
      url: `${SITE}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo.png`,
      },
    },
    inLanguage: "en-US",
    isAccessibleForFree: true,
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

  if (meta.howToUse && meta.howToUse.length > 0) {
    jsonLd.tutorial = {
      "@type": "HowTo",
      name: `How to Use ${meta.title}`,
      description: meta.desc || `Step-by-step guide for using ${meta.title} free online.`,
      step: meta.howToUse.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.heading,
        text: s.text,
      })),
    };
  }

  return jsonLd;
}
