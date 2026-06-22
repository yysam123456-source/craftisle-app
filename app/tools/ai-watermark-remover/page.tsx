import type { Metadata } from "next";
import WatermarkRemoverClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "AI Watermark Remover Free — Remove Gemini Watermark Online | Craftisle",
  description:
    "Free AI watermark remover online. Remove Gemini AI image watermarks (visible star logo) in browser. 100% client-side, no upload, no signup.",
  canonical: "https://craftisle.com/tools/ai-watermark-remover",
});

export default function AIWatermarkRemoverPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🧹 AI Watermark Remover — Remove Gemini Watermark
        </h1>
        <p className="mt-2 text-muted-foreground">
          Remove visible watermarks from Gemini AI-generated images. Uses mathematically
          precise reverse alpha blending for lossless removal. 100% browser-based, no
          signup.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <WatermarkRemoverClient />
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="mb-2 text-xl font-semibold">How to Use</h2>
          <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Upload a Gemini-generated image (with the visible star watermark).</li>
            <li>
              The tool auto-detects the watermark position and removes it using reverse
              alpha blending.
            </li>
            <li>Preview the result and download the cleaned image.</li>
          </ol>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">Important Notes</h2>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            <li>This tool only removes the visible Gemini star watermark.</li>
            <li>It does not remove invisible watermarks (SynthID) or watermarks from other AI tools.</li>
            <li>
              Removing watermarks may violate Google's Terms of Service. For personal/educational
              use only.
            </li>
            <li>All processing happens in your browser — no images are uploaded.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
