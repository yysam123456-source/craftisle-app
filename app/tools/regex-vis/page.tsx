import { getOverrideAsync } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { getToolMeta, toolMeta } from "@/lib/tools";
import { toolUrl } from "@/lib/tool-seo";
import RegexVisClient from "./client";
import { constructMetadata } from "@/lib/utils";
import { buildToolJsonLd, getToolCategorySlug } from "@/lib/tool-seo";

// ── ISR：让 page_meta DB 覆盖层对本页真正生效 ──
// 🔴 2026-10-16：原为 `export const dynamic = "force-dynamic"`。
// 它确实是为了 useSearchParams 而加的，但代价是**整页每次请求都动态渲染**：
// 既不进 CDN 缓存，也让「运行时改 DB meta 后 5 分钟内全站生效」这条 ISR 机制对本页失效。
// 实际上 useSearchParams 只在 ./client.tsx（"use client"）里用，且它已被 <Suspense> 包裹，
// 满足 Next.js App Router 的要求（Suspense 边界内的客户端组件可以安全用 useSearchParams），
// **不需要** force-dynamic。删掉后本页与其余 5 个静态工具页行为对齐。
export const revalidate = 300;

// ---------- Static metadata ----------
/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */
export async function generateMetadata(): Promise<Metadata> {
  // 🔴 单一数据源：改读 lib/tools.ts 的 toolMeta（与 app/tools/[tool] 动态段一致）。
  // 本页是静态段、在 Next.js 中优先于 [tool]，此前把文案硬编码在本文件
  // ⇒ 同一工具两个 meta 来源，改 lib/tools.ts 对本页不生效。
  // （原硬编码文案已回填 toolMeta，仅把 "JavaScript" 缩为 "JS" 以对齐 seoKeywords。）
  // keywords 与 canonical 仍保留本页专属值。
  const meta = toolMeta["regex-vis"];
  const ov = await getOverrideAsync(`/tools/regex-vis`);
  // 优先级：DB 覆盖层 > toolMeta
  const title = ov?.title ?? String(meta?.seoTitle || meta?.title || "Regex Visualizer");
  const description =
    ov?.description ??
    String(meta?.seoDesc || meta?.desc || "Visualize regular expressions online.");
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
  
    canonical: toolUrl("regex-vis"),
  });
}

// 注：原先这里声明并解构了 `searchParams: Promise<{ r?: string }>`，但函数体内
// **从未使用**它。仅接收 searchParams 就足以让 Next.js 把本页判定为动态渲染，
// 即使已删掉 force-dynamic 也无法进入 ISR ⇒ 连带 page_meta 覆盖层对本页失效。
// 查询参数由 ./client.tsx 里的 useSearchParams 在客户端读取，故此处直接删掉。
export default function RegexVisPage() {
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
