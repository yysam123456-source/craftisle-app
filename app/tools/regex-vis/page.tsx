import { getOverride } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { getToolMeta } from "@/lib/tools";
import RegexVisClient from "./client";
import { constructMetadata } from "@/lib/utils";
import { buildToolJsonLd, getToolCategorySlug } from "@/lib/tool-seo";

// Force dynamic rendering for useSearchParams
export const dynamic = "force-dynamic";

// ---------- Static metadata ----------
/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */
export function generateMetadata(): Metadata {
  const ov = getOverride(`/tools/regex-vis`);
  const title = ov?.title ?? "Regex Visualizer Free — Online AST Graph";
  const description = ov?.description ?? "Free regex visualizer online. See AST tree graph, edit regex visually, test matches. Supports JS/Python/PCRE. 100% browser-based.";
  return constructMetadata({
    title,
    description,
    // 保留原有的 keywords / canonical / openGraph 等设置
  keywords: [  
      "regex visualizer online free",  
      "regex AST graph",  
      "regular expression visual editor",  
      "regex tree view online",  
      "regex visual tester",  
      "Craftisle regex tool",  
    ],  
    canonical: "https://craftisle.com/tools/regex-vis",
  });
}

interface PageProps {
  searchParams: Promise<{ r?: string }>;
}

export default function RegexVisPage({ searchParams }: PageProps) {
  // 此前这里手写了一个最小 stub meta（只有 title/desc/icon/category），
  // 于是布局渲染的 h1 与 ToolDetailSections 读到的真实 toolMeta 不一致，
  // 且 jsonLd 传的是空对象 —— 整个页面没有任何结构化数据。
  const meta = getToolMeta("regex-vis");

  return (
    <ToolDetailLayout
      toolId="regex-vis"
      categorySlug={getToolCategorySlug(meta.category)}
      meta={meta}
      jsonLd={buildToolJsonLd("regex-vis", meta)}
    >
      <Suspense fallback={<div className="flex items-center justify-center h-64"><p>Loading Regex Visualizer...</p></div>}>
        <RegexVisClient />
      </Suspense>
      <ToolDetailSections toolId="regex-vis" />
    </ToolDetailLayout>
  );
}
