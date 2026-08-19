import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/utils";
import { toolMeta } from "@/lib/tools";
import { PAGE_META } from "@/lib/seo/page-meta";

export const metadata: Metadata = constructMetadata({
  title: PAGE_META["/tools/craftisle-image-tools"].title,
  description: PAGE_META["/tools/craftisle-image-tools"].description,
  keywords: [
    "craftisle image tools",
    "free online image editor",
    "AI background remover free",
    "image compressor online",
    "watermark remover online",
    "image upscaler AI",
    "free image converter",
  ],
  canonical: "https://craftisle.com/tools/craftisle-image-tools",
});

const IMAGE_TOOLS = [
  {
    slug: "ai-watermark-remover",
    title: "AI Watermark Remover",
    desc: "Remove watermarks from images with AI — free, in browser, no upload.",
  },
  {
    slug: "ai-image-editor",
    title: "AI Image Editor",
    desc: "AI-powered editing: enhancement, inpainting, upscaling — all client-side.",
  },
  {
    slug: "image-compress",
    title: "Image Compressor",
    desc: "Compress images up to 80% without visible quality loss. Runs entirely in browser.",
  },
  {
    slug: "image-convert",
    title: "Image Converter",
    desc: "Convert between PNG, JPG, WEBP, AVIF and more formats instantly.",
  },
  {
    slug: "image-upscale",
    title: "AI Image Upscaler",
    desc: "Upscale low-resolution images with AI while preserving detail.",
  },
  {
    slug: "handwriting-animation",
    title: "Handwriting Animation",
    desc: "Turn text into realistic handwriting animation videos.",
  },
  {
    slug: "ocr-text",
    title: "OCR Text Extractor",
    desc: "Extract text from images and scanned documents with OCR.",
  },
];

export default function CraftisleImageToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Craftisle Image Tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Free online image tools from Craftisle — AI background removal,
              watermark removal, compression, conversion and upscaling.
              <strong> 100% browser-based: no upload, no signup, no paywall.</strong>
            </p>
          </div>

          {/* Tools grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {IMAGE_TOOLS.map((tool, i) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group rounded-xl border p-5 transition-all hover:border-teal-600/50 hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-teal-600/10 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
                    #{i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">Free</span>
                </div>
                <h2 className="font-semibold group-hover:text-teal-700 dark:group-hover:text-teal-400">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{tool.desc}</p>
              </Link>
            ))}
          </div>

          {/* Why choose Craftisle image tools */}
          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-bold">
              Why Use Craftisle Image Tools?
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border p-5">
                <h3 className="font-semibold">🔒 Privacy by Design</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All image processing happens in your browser. Your files never
                  leave your device — no server upload, no storage, no tracking.
                </p>
              </div>
              <div className="rounded-xl border p-5">
                <h3 className="font-semibold">⚡ Free, No Limits</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No signup, no watermark on output, no usage caps. Free for
                  personal and commercial use.
                </p>
              </div>
              <div className="rounded-xl border p-5">
                <h3 className="font-semibold">🤖 AI-Powered</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Background removal, watermark removal and upscaling are powered
                  by on-device AI models — accurate and fast.
                </p>
              </div>
            </div>
          </section>

          {/* Directory link */}
          <section className="mt-14 rounded-2xl border border-teal-600/30 bg-teal-600/5 p-6 text-center">
            <h2 className="text-xl font-bold">Looking for more?</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Craftisle also hosts a curated directory of 16,000+ free &amp;
              open-source software across 200+ categories.
            </p>
            <Link
              href="/directory"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Browse the Directory →
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
