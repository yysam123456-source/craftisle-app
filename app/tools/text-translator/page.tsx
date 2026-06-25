import TextTranslatorClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Free Text Translator — Translate Text Online | Craftisle",
  description: "Free online text translator. Translate text between 12+ languages including Chinese, English, Japanese, Korean, French, German, Spanish. No signup, browser-based, instant results.",
  canonical: "https://craftisle.com/tools/text-translator",
});

export default function TextTranslatorPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🌐 Text Translator — Free Online Translation Tool
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free online text translator. Translate text between 12+ languages including Chinese, English, Japanese, Korean, French, German, Spanish. 
          No signup required, instant results.
        </p>
      </div>
      <TextTranslatorClient />
      
      {/* SEO 内容 */}
      <div className="mt-12 prose prose-gray max-w-none">
        <h2>How to Use the Text Translator</h2>
        <ol>
          <li>Select the source language (or use "Auto Detect")</li>
          <li>Select the target language</li>
          <li>Enter or paste your text in the input box</li>
          <li>Click "Translate" button</li>
          <li>Copy the translated text to clipboard</li>
        </ol>
        
        <h2>Supported Languages</h2>
        <p>Our free translator supports 12+ languages:</p>
        <ul>
          <li><strong>Chinese (中文)</strong> - Translate to/from Chinese</li>
          <li><strong>English</strong> - Translate to/from English</li>
          <li><strong>Japanese (日本語)</strong> - Translate to/from Japanese</li>
          <li><strong>Korean (한국어)</strong> - Translate to/from Korean</li>
          <li><strong>French (Français)</strong> - Translate to/from French</li>
          <li><strong>German (Deutsch)</strong> - Translate to/from German</li>
          <li><strong>Spanish (Español)</strong> - Translate to/from Spanish</li>
          <li>And more: Portuguese, Russian, Arabic, Thai, Vietnamese</li>
        </ul>
        
        <h2>Why Use Our Free Translator?</h2>
        <ul>
          <li><strong>100% Free</strong> - No signup, no payment, no daily limits</li>
          <li><strong>Privacy-First</strong> - Text is processed securely, not stored</li>
          <li><strong>Fast & Accurate</strong> - Powered by LibreTranslate open-source engine</li>
          <li><strong>Browser-Based</strong> - Works on any device, no software installation</li>
        </ul>
      </div>
    </main>
  );
}
