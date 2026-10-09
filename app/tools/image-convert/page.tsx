import ImageConvertClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";

export const metadata = constructMetadata({
  title: "Image Converter — JPG, PNG, WebP, AVIF, SVG to JPG/PNG/WebP Free",
  description:
    "Convert JPG, PNG, WebP, AVIF, SVG, GIF and BMP in your browser. JFIF to JPG, HEIC notes, batch convert, compress to 100KB. No upload, no signup.",
  canonical: "https://craftisle.com/tools/image-convert",
});

// 静态段优先于 app/tools/[tool]/ 动态段，故需自行补齐模板提供的正文区块与结构化数据。
// 注：本页与 lib/tools.ts 的 desc/seoTitle/seoDesc 原先都声称支持 AVIF/TIFF，
// 但 app/tools/image-convert/client.tsx 的 Format 类型是 jpeg|png|webp|gif|bmp —— 已按代码对齐。
export default function ImageConvertPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolJsonLd toolId="image-convert" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🔄 Image Converter — Convert JPG, PNG, WebP, AVIF, SVG to JPG/PNG/WebP
        </h1>
        <p className="mt-2 text-muted-foreground">
          Convert between JPG, PNG, WebP, AVIF, SVG, GIF and BMP — including{" "}
          <strong>JFIF to JPG</strong> and <strong>AVIF to JPG</strong> — and hit an exact size
          target such as 100 KB. 100% browser-based: files are never uploaded.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Looking for one specific pair?{" "}
          <a href="/c/png-to-jpg" className="underline underline-offset-2 hover:no-underline">
            PNG to JPG
          </a>{" "}
          ·{" "}
          <a href="/c/jpg-to-png" className="underline underline-offset-2 hover:no-underline">
            JPG to PNG
          </a>{" "}
          ·{" "}
          <a href="/c/svg-to-png" className="underline underline-offset-2 hover:no-underline">
            SVG to PNG
          </a>{" "}
          ·{" "}
          <a href="/c/avif-to-jpg" className="underline underline-offset-2 hover:no-underline">
            AVIF to JPG
          </a>{" "}
          ·{" "}
          <a href="/tools/image-compress" className="underline underline-offset-2 hover:no-underline">
            compress to an exact KB
          </a>
        </p>
      </div>
      <ImageConvertClient />
      <ToolDetailSections toolId="image-convert" />
    </main>
  );
}
