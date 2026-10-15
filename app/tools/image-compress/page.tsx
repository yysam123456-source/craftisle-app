import { getOverride } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import ImageCompressClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";

/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */
export function generateMetadata(): Metadata {
  const ov = getOverride(`/tools/image-compress`);
  const title = ov?.title ?? "Image Compressor to 100KB — Compress Image to Exact Size Free";
  const description = ov?.description ?? "Compress image to an exact file size — 100 KB, 200 KB, 500 KB, 1 MB. Also free JPG/PNG/WebP quality compression. Runs in your browser, no upload.";
  return constructMetadata({
    title,
    description,
    // 保留原有的 keywords / canonical / openGraph 等设置
  canonical: "https://craftisle.com/tools/image-compress",
  });
}

// 本页是静态段，优先于 app/tools/[tool]/ 动态段 ⇒ 拿不到模板的正文区块与结构化数据。
// 此前只有 h1 + 一段话 + 交互组件，而它承接的是 "compress image online" 这类高竞争词。
export default function ImageCompressPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ToolJsonLd toolId="image-compress" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          🗜️ Image Compressor — Compress Image to 100KB or Any Target Size
        </h1>
        <p className="mt-2 text-muted-foreground">
          Compress an image to an exact file size — 100 KB, 200 KB, 500 KB, 1 MB — or dial quality manually.
          Runs on the canvas API in your browser; nothing is uploaded, queued or stored.
        </p>
      </div>
      <ImageCompressClient />
      <ToolDetailSections toolId="image-compress" />
    </main>
  );
}
