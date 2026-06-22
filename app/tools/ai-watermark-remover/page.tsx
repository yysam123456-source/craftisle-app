import type { Metadata } from "next";
import WatermarkRemoverClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "AI Watermark Remover Free — Remove AI Image Watermark Online | Craftisle",
  description:
    "Free AI watermark remover online. Remove visible watermarks from Gemini, Doubao, Jimeng, Tongyi, Wenxin AI-generated images. Uses mathematically precise reverse alpha blending. 100% client-side, no upload, no signup.",
  canonical: "https://craftisle.com/tools/ai-watermark-remover",
});

export default function AIWatermarkRemoverPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🧹 AI Watermark Remover — Multi-Platform
        </h1>
        <p className="mt-2 text-muted-foreground">
          Remove visible watermarks from AI-generated images (Gemini, Doubao, Jimeng,
          Tongyi, Wenxin, Leonardo.ai). Uses reverse alpha blending. 100% browser-based,
          no signup.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <WatermarkRemoverClient />
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-semibold">How to Use</h2>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Select the AI platform (or use "Auto Detect").</li>
            <li>Upload an AI-generated image with a visible watermark.</li>
            <li>
              The tool auto-detects the watermark position and removes it using reverse
              alpha blending.
            </li>
            <li>Preview the result and download the cleaned image.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Supported Platforms</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            <li><strong>Gemini (Google)</strong> — ⭐ star logo, bottom-right</li>
            <li><strong>Doubao (ByteDance)</strong> — text watermark</li>
            <li><strong>Jimeng (ByteDance)</strong> — text/logo watermark</li>
            <li><strong>Tongyi (Alibaba)</strong> — text watermark</li>
            <li><strong>Wenxin (Baidu)</strong> — text watermark</li>
            <li><strong>Leonardo.ai</strong> — logo watermark</li>
            <li><strong>Auto Detect</strong> — automatically identifies the platform</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Important Notes</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            <li>This tool only removes <strong>visible</strong> watermarks (semi-transparent logos/text).</li>
            <li>It does not remove invisible watermarks (SynthID, StableSignature) or watermarks from unsupported tools.</li>
            <li>
              Removal quality depends on the watermark type. Gemini has the best support
              (precise alpha map). Other platforms use an estimated alpha map.
            </li>
            <li>
              Removing watermarks may violate the AI platform's Terms of Service. For
              personal/educational use only.
            </li>
            <li>All processing happens in your browser — no images are uploaded.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
