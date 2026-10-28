import { getOverrideAsync } from "@/lib/seo/page-meta-db";
import type { Metadata } from "next";
import ImageCompressClient from "./client";
import { constructMetadata } from "@/lib/utils";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolJsonLd } from "@/components/tools/ToolJsonLd";
import { toolMeta } from "@/lib/tools";
import { toolUrl } from "@/lib/tool-seo";

/**
 * 🔴 2026-10-15：原先是 `export const metadata = ...`（编译期常量），
 * generateMetadata 读不到任何运行时数据 ⇒ page_meta 覆盖层对本页**永久无效**，
 * 自动调优写进去也不会生效。改成函数式并叠加覆盖层，与 app/tools/[tool] 动态段一致。
 */

/**
 * 🔴 2026-10-15：加 revalidate 让本页进入 ISR。
 * 没有它时本页在构建期就把 metadata 烘死，运行时 page_meta 覆盖层写了也不生效
 * （page_meta_override 表里确实有记录，但页面 HTML 是旧的）。
 * 代价：不再是纯静态，首次请求走一次再生。收益：自动调优对本站真的可用。
 */
export const revalidate = 7200;

export async function generateMetadata(): Promise<Metadata> {
  // ── 单一数据源：lib/tools.ts 的 toolMeta ──
  // 🔴 本页此前把 title/description 硬编码在本文件里，而 app/tools/[tool]/page.tsx
  // 读的是 toolMeta ⇒ 同一个工具存在**两个meta 来源**。因为本页是静态段、
  // 在 Next.js 中优先于 [tool] 动态段，所以改 lib/tools.ts 对本页不生效，
  // 极易「改了源码却没上线」。现统一从 toolMeta 读取。
  // （原先硬编码的文案已回填进 toolMeta，措辞与覆盖面不缩水。）
  const meta = toolMeta["image-compress"];
  const ov = await getOverrideAsync(`/tools/image-compress`);
  // 优先级：DB 覆盖层 > toolMeta（与 app/tools/[tool] 动态段完全一致）
  const title = ov?.title ?? String(meta?.seoTitle || meta?.title || "Image Compressor");
  const description =
    ov?.description ?? String(meta?.seoDesc || meta?.desc || "Compress images online for free.");
  return constructMetadata({
    title,
    description,
    keywords: meta?.seoKeywords,
    canonical: toolUrl("image-compress"),
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
