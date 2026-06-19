import { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { IDPhotoTool } from "@/components/tools/IDPhoto/IDPhotoTool";

export const metadata: Metadata = constructMetadata({
  title: "免费证件照制作 - AI 智能抠图换底 | Craftisle",
  description:
    "免费在线证件照制作工具，AI 自动抠图、换背景底色、调整尺寸。支持1寸、2寸、护照等多种规格，100% 浏览器本地处理，照片不上传服务器。",
  keywords: [
    "证件照",
    "证件照制作",
    "AI 抠图",
    "证件照换底",
    "免费证件照",
    "1寸照片",
    "2寸照片",
    "护照照片",
  ],
});

export default function IDPhotoPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      {/* Quick Answer / GEO */}
      <div className="quick-answer bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">
          What is the free ID photo maker? (Quick Answer)
        </h2>
        <p className="text-sm text-gray-700">
          This free ID photo maker uses AI to automatically remove backgrounds, replace
          background colors, and resize to standard ID photo sizes. All processing
          happens locally in your browser — your photo never leaves your device.
        </p>
      </div>

      {/* Main Tool */}
      <IDPhotoTool />

      {/* FAQ */}
      <FAQSection />
    </div>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "Is this ID photo maker really free?",
      a: "Yes, completely free. No registration, no watermarks, no limits.",
    },
    {
      q: "Is my photo uploaded to a server?",
      a: "No. All processing happens locally in your browser using AI models. Your photo never leaves your device.",
    },
    {
      q: "What sizes are supported?",
      a: "1-inch, 2-inch, passport photo, US visa photo, and custom sizes.",
    },
    {
      q: "Can I change the background color?",
      a: "Yes, you can choose white, blue, red, or any custom hex color.",
    },
  ];

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqs.map((item, i) => (
          <details key={i} className="border rounded-lg p-4">
            <summary className="font-medium cursor-pointer">{item.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
