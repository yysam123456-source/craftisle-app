import type { Metadata } from "next";
import WatermarkRemoverClient from "./client";

export const metadata: Metadata = {
  title: "AI Watermark Remover Free — Remove Gemini/Doubao/Jimeng Watermark Online",
  description:
    "Free AI watermark remover online. Remove visible watermarks from Gemini, Doubao, Jimeng, Tongyi, Wenxin AI-generated images. Uses mathematically precise reverse alpha blending. 100% client-side, no upload, no signup required. Supports JPG, PNG, WebP formats.",
  keywords: [
    "remove Gemini watermark free",
    "Gemini AI watermark remover online",
    "remove AI image watermark free",
    "Gemini watermark removal tool",
    "AI image watermark eraser",
    "remove Gemini star logo online",
    "client side watermark remover",
    "Gemini image watermark remover free",
    "AI generated image watermark removal",
    "remove AI watermark from image free",
    "Gemini AI logo remover online",
    "free watermark remover no signup",
    "browser based AI watermark removal",
    "remove Doubao watermark free",
    "Doubao AI watermark remover online",
    "remove Jimeng watermark",
    "Jimeng AI watermark remover free",
    "remove Tongyi watermark",
    "Tongyi AI watermark remover",
    "remove Wenxin watermark",
    "Wenxin AI watermark remover",
    "remove AI watermark online free",
    "AI image watermark removal tool free",
    "how to remove AI image watermark",
    "best free AI watermark remover",
    "AI watermark eraser free no signup",
    "remove AI generated image watermark free",
    "clean AI image for presentation free",
    "remove AI watermark before printing",
    "lossless AI watermark removal free",
  ],
  openGraph: {
    title: "AI Watermark Remover Free — Remove Gemini/Doubao/Jimeng Watermark",
    description:
      "Remove visible watermarks from Gemini, Doubao, Jimeng AI-generated images online free. 100% browser-based, no upload, no registration.",
    type: "website",
    url: "https://craftisle.com/tools/ai-watermark-remover",
  },
  alternates: {
    canonical: "https://craftisle.com/tools/ai-watermark-remover",
  },
};

export default function AIWatermarkRemoverPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What AI watermarks can this tool remove?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "This tool removes visible watermarks from Gemini (Google), Doubao (ByteDance), Jimeng (ByteDance), Tongyi (Alibaba), Wenxin (Baidu), and Leonardo.ai. It uses reverse alpha blending to mathematically restore the original pixels.",
        },
      },
      {
        "@type": "Question",
        name: "Is the watermark removal lossless?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For Gemini images, the removal is mathematically lossless because we use the exact alpha map from the official watermark. For other platforms, the result is near-lossless using an estimated alpha map.",
        },
      },
      {
        "@type": "Question",
        name: "Is this tool free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, completely free. No signup, no registration, no payment. All processing happens in your browser.",
        },
      },
      {
        "@type": "Question",
        name: "Are my images uploaded to a server?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. All processing happens entirely in your browser. Your images never leave your device.",
        },
      },
      {
        "@type": "Question",
        name: "Can I remove invisible watermarks like SynthID?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. This tool only removes visible watermarks (semi-transparent logos or text). Invisible watermarks like SynthID, StableSignature, or TreeRing require AI model inference and cannot be removed by this tool.",
        },
      },
      {
        "@type": "Question",
        name: "How do I remove a Gemini AI watermark?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Simply upload your Gemini-generated image (with the star logo in the bottom-right corner), select 'Gemini' platform, and click 'Remove Watermark'. The tool will automatically detect and remove the watermark.",
        },
      },
      {
        "@type": "Question",
        name: "Does removing AI watermarks violate Terms of Service?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Removing watermarks may violate the AI platform's Terms of Service. This tool is provided for educational and personal use only. Do not use watermark-removed images for commercial purposes without permission.",
        },
      },
      {
        "@type": "Question",
        name: "What image formats are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "JPG/JPEG, PNG, and WebP formats are all supported. The output image will be in PNG format by default.",
        },
      },
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Remove AI Image Watermark Free Online",
    description:
      "Step-by-step guide to remove visible watermarks from AI-generated images using Craftisle free online tool.",
    step: [
      {
        "@type": "HowToStep",
        name: "Upload AI image",
        text: "Drag and drop your AI-generated image (JPG, PNG, or WebP) onto the upload area, or click to browse and select your file.",
      },
      {
        "@type": "HowToStep",
        name: "Select AI platform",
        text: "Choose the AI platform that generated the image (Gemini, Doubao, Jimeng, Tongyi, Wenxin, Leonardo.ai) or use 'Auto Detect' for automatic identification.",
      },
      {
        "@type": "HowToStep",
        name: "Remove watermark",
        text: "Click the 'Remove Watermark' button. The tool will process the image in your browser using reverse alpha blending.",
      },
      {
        "@type": "HowToStep",
        name: "Download cleaned image",
        text: "Preview the result, compare before and after, and click 'Download' to save the cleaned image to your device.",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            🧹 AI Watermark Remover Free Online
          </h1>
          <p className="mt-2 text-muted-foreground">
            Remove visible watermarks from AI-generated images (Gemini, Doubao,
            Jimeng, Tongyi, Wenxin, Leonardo.ai). Uses reverse alpha blending.
            100% browser-based, no signup, completely free.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <WatermarkRemoverClient />
        </div>

        <div className="mt-10 space-y-8">
          <section>
            <h2 className="mb-2 text-xl font-semibold">
              How to Remove AI Image Watermark Free Online
            </h2>
            <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Upload your AI image</strong> — Drag and drop a JPG, PNG,
                or WebP image generated by AI, or click to browse and select your
                file.
              </li>
              <li>
                <strong>Select the AI platform</strong> — Choose Gemini, Doubao,
                Jimeng, Tongyi, Wenxin, Leonardo.ai, or use "Auto Detect" to
                let the tool identify the platform automatically.
              </li>
              <li>
                <strong>Click "Remove Watermark"</strong> — The tool uses
                reverse alpha blending to mathematically restore the original pixels
                behind the watermark.
              </li>
              <li>
                <strong>Preview and download</strong> — Compare the before and
                after images, then click "Download" to save the cleaned image to
                your device.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Supported AI Platforms
            </h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Our free AI watermark remover supports visible watermark removal
              from the following AI image generation platforms:
            </p>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                <strong>Gemini (Google AI)</strong> — ⭐ Star logo watermark,
                bottom-right corner. <em>Best support</em> with precise alpha map
                for lossless removal.
              </li>
              <li>
                <strong>Doubao (ByteDance)</strong> — Text watermark. Uses
                estimated alpha map for near-lossless removal.
              </li>
              <li>
                <strong>Jimeng (ByteDance)</strong> — Text/logo watermark.
                Uses estimated alpha map.
              </li>
              <li>
                <strong>Tongyi (Alibaba)</strong> — Text watermark. Uses
                estimated alpha map.
              </li>
              <li>
                <strong>Wenxin (Baidu)</strong> — Text watermark. Uses
                estimated alpha map.
              </li>
              <li>
                <strong>Leonardo.ai</strong> — Logo watermark. Uses estimated
                alpha map.
              </li>
              <li>
                <strong>Auto Detect</strong> — Automatically identifies the AI
                platform by analyzing the watermark position and pattern.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Why Choose Our Free AI Watermark Remover?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">100% Free, No Signup</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No registration, no payment, no limits. Completely free AI
                  watermark remover online.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Browser-Based, Private</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  All processing happens in your browser. Your images never leave
                  your device. 100% private and secure.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Lossless for Gemini</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Uses the exact alpha map from Gemini's official watermark for
                  mathematically lossless removal.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold">Fast Processing</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No server upload wait time. Process images instantly in your
                  browser with reverse alpha blending.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  What AI watermarks can this tool remove?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  This tool removes <strong>visible watermarks</strong> from
                  Gemini (Google), Doubao (ByteDance), Jimeng (ByteDance),
                  Tongyi (Alibaba), Wenxin (Baidu), and Leonardo.ai. It uses
                  reverse alpha blending to mathematically restore the original
                  pixels behind semi-transparent watermarks.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  Is the watermark removal lossless?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  For <strong>Gemini images</strong>, the removal is
                  mathematically <strong>lossless</strong> because we use the
                  exact alpha map from the official Gemini watermark. For other
                  platforms (Doubao, Jimeng, etc.), the result is{" "}
                  <strong>near-lossless</strong> using an estimated alpha map.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  Is this tool really free? No signup required?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  Yes, <strong>completely free</strong>. No signup, no
                  registration, no payment, no hidden fees. All processing
                  happens in your browser. No account needed.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  Are my images uploaded to a server?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  <strong>No.</strong> All processing happens entirely in your
                  browser. Your images <strong>never leave your device</strong>.
                  This is the most private way to remove AI watermarks.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  Can I remove invisible watermarks like SynthID?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  No. This tool only removes <strong>visible watermarks</strong>{" "}
                  (semi-transparent logos or text). Invisible watermarks like
                  SynthID, StableSignature, or TreeRing require AI model
                  inference and cannot be removed by this tool.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  How do I remove a Gemini AI watermark?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  Simply upload your Gemini-generated image (with the ⭐ star logo
                  in the bottom-right corner), select "Gemini" platform, and
                  click "Remove Watermark". The tool will automatically detect and
                  remove the watermark with lossless quality.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  What image formats are supported?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  JPG/JPEG, PNG, and WebP formats are all supported. The output
                  image will be in PNG format by default for best quality.
                </p>
              </details>
              <details className="rounded-lg border p-4">
                <summary className="cursor-pointer font-semibold">
                  Does removing AI watermarks violate Terms of Service?
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">
                  Removing watermarks may violate the AI platform's Terms of
                  Service. This tool is provided for{" "}
                  <strong>educational and personal use only</strong>. Do not use
                  watermark-removed images for commercial purposes without
                  permission.
                </p>
              </details>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold">
              Important Notes
            </h2>
            <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
              <li>
                This tool only removes <strong>visible</strong> watermarks
                (semi-transparent logos/text). It does not remove invisible
                watermarks (SynthID, StableSignature) or watermarks from
                unsupported tools (DALL-E, Midjourney).
              </li>
              <li>
                Removal quality depends on the watermark type. Gemini has the
                best support (precise alpha map). Other platforms use an
                estimated alpha map.
              </li>
              <li>
                Removing watermarks may violate the AI platform's Terms of
                Service. For personal/educational use only.
              </li>
              <li>
                All processing happens in your browser — no images are uploaded
                to any server.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
