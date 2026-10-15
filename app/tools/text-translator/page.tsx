import { getOverrideAsync } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import TextTranslatorClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";

/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */

/**
 * 🔴 2026-10-15：加 revalidate 让本页进入 ISR。
 * 没有它时本页在构建期就把 metadata 烘死，运行时 page_meta 覆盖层写了也不生效
 * （page_meta_override 表里确实有记录，但页面 HTML 是旧的）。
 * 代价：不再是纯静态，首次请求走一次再生。收益：自动调优对本站真的可用。
 */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const ov = await getOverrideAsync(`/tools/text-translator`);
  const title = ov?.title ?? "Free Online Text Translator — 30+ Languages";
  const description = ov?.description ?? "Translate text instantly between 30+ languages. Free online translator with auto-detect, real-time translation, text-to-speech, and copy. No signup required. Supports English, Chinese, Japanese, Korean, French, German, Spanish and more.";
  return constructMetadata({
    title,
    description,
    // 保留原有的 keywords / canonical / openGraph 等设置
  canonical: "https://craftisle.com/tools/text-translator",
  });
}

// 静态段优先于 app/tools/[tool]/ 动态段，故需自行补齐模板提供的正文区块与结构化数据。
// 注意：本工具未注册进 lib/tool-components.tsx 的 componentLoaders，因此不能删掉本页交由模板接管
// —— 否则 ToolLoader 找不到组件，交互功能会消失。
export default function TextTranslatorPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <ToolJsonLd toolId="text-translator" />
      {/* Page heading - minimal since client has its own toolbar */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Free Online Text Translator
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
          Translate text between 30+ languages instantly. Auto-detect source language,
          listen to pronunciation, copy results. 100% free, no signup required.
        </p>
      </div>

      <TextTranslatorClient />
      <ToolDetailSections toolId="text-translator" />
    </main>
  );
}
