import ImageCompressClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";

export const metadata = constructMetadata({
  title: "Image Compressor Free — Compress JPG/PNG/WebP Online",
  description: "Free image compressor online. Compress JPG, PNG, WebP, AVIF with quality control. Reduce image file size without losing quality. 100% browser-based, no signup.",
  canonical: "https://craftisle.com/tools/image-compress",
});

// 本页是静态段，优先于 app/tools/[tool]/ 动态段 ⇒ 拿不到模板的正文区块与结构化数据。
// 此前只有 h1 + 一段话 + 交互组件，而它承接的是 "compress image online" 这类高竞争词。
export default function ImageCompressPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolJsonLd toolId="image-compress" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🗜️ Image Compressor — Compress JPG/PNG/WebP Online
        </h1>
        <p className="mt-2 text-muted-foreground">
          Free image compressor online. Compress JPG, PNG, WebP, AVIF with quality control. 
          Reduce image file size without losing quality. 100% browser-based, no signup.
        </p>
      </div>
      <ImageCompressClient />
      <ToolDetailSections toolId="image-compress" />
    </main>
  );
}
