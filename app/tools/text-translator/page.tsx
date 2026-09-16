import TextTranslatorClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";

export const metadata = constructMetadata({
  title: "Free Online Text Translator — 30+ Languages",
  description:
    "Translate text instantly between 30+ languages. Free online translator with auto-detect, real-time translation, text-to-speech, and copy. No signup required. Supports English, Chinese, Japanese, Korean, French, German, Spanish and more.",
  canonical: "https://craftisle.com/tools/text-translator",
});

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
