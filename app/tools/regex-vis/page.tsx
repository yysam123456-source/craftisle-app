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
export const metadata = constructMetadata({
  title: "Regex Visualizer Free — Online AST Graph",
  description: "Free regex visualizer online. See AST tree graph, edit regex visually, test matches. Supports JS/Python/PCRE. 100% browser-based.",
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
