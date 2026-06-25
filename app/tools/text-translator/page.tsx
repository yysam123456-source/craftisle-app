import TextTranslatorClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Free Text Translator — Translate Text Online | Craftisle",
  description: "Free online text translator. Translate text between 20+ languages including English, Chinese, Japanese, Korean, French, German, Spanish. No signup, browser-based, instant results.",
  canonical: "https://craftisle.com/tools/text-translator",
});

export default function TextTranslatorPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🌐 Text Translator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free online text translator supporting 20+ languages. No signup required, instant results.
        </p>
      </div>
      <TextTranslatorClient />

      {/* SEO content */}
      <div className="mt-12 prose prose-gray max-w-none">
        <h2>How to Use the Text Translator</h2>
        <ol>
          <li>Select the source language (or use "Auto Detect")</li>
          <li>Select the target language</li>
          <li>Enter or paste your text in the input box</li>
          <li>Click "Translate" to get instant results</li>
          <li>Copy the translated text to clipboard</li>
        </ol>

        <h2>Supported Languages</h2>
        <p>Our free translator supports 20+ languages:</p>
        <ul>
          <li><strong>English</strong> — Translate to/from English</li>
          <li><strong>Chinese (Simplified)</strong> — Translate to/from 中文</li>
          <li><strong>Chinese (Traditional)</strong> — Translate to/from 繁體中文</li>
          <li><strong>Japanese</strong> — Translate to/from 日本語</li>
          <li><strong>Korean</strong> — Translate to/from 한국어</li>
          <li><strong>French</strong> — Translate to/from Français</li>
          <li><strong>German</strong> — Translate to/from Deutsch</li>
          <li><strong>Spanish</strong> — Translate to/from Español</li>
          <li>And more: Portuguese, Russian, Arabic, Thai, Vietnamese, Italian, Dutch, Polish, Turkish, Hindi</li>
        </ul>

        <h2>Why Use Our Free Translator?</h2>
        <ul>
          <li><strong>100% Free</strong> — No signup, no payment, no daily limits</li>
          <li><strong>Privacy-First</strong> — Text is processed securely via API, not stored</li>
          <li><strong>Fast & Accurate</strong> — Powered by MyMemory Translation API</li>
          <li><strong>Browser-Based</strong> — Works on any device, no software installation</li>
        </ul>
      </div>
    </main>
  );
}
