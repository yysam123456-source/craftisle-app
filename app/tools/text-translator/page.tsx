import TextTranslatorClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Free Online Text Translator — 30+ Languages | Craftisle",
  description:
    "Translate text instantly between 30+ languages. Free online translator with auto-detect, real-time translation, text-to-speech, and copy. No signup required. Supports English, Chinese, Japanese, Korean, French, German, Spanish and more.",
  canonical: "https://craftisle.com/tools/text-translator",
});

export default function TextTranslatorPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
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
    </main>
  );
}
