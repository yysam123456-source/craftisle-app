import { toolMeta } from "@/lib/tools";
import { getToolDefinition } from "@/lib/image-tools/registry";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { ToolLoader } from "@/lib/tool-components";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getOverride } from "@/lib/seo/page-meta-db";
import { getRelatedTools } from "@/lib/related-tools";
import { buildToolJsonLd, getToolCategorySlug, toolUrl } from "@/lib/tool-seo";

interface ToolPageProps {
  params: Promise<{ tool: string }>;
}

/**
 * 构建期预渲染全部工具页。
 *
 * 此前本页没有任何 generateStaticParams / dynamic / revalidate 声明，164 个工具页
 * 全部走动态 SSR —— 每次请求都要在服务器渲染一遍，HTML 也不进 CDN 缓存。
 * 页面数据全部来自构建期的 toolMeta，天然是静态的，没有理由不做预渲染。
 *
 * dynamicParams = false：未列出的 slug 直接 404。
 * 这一点很重要 —— getToolMeta() 带有兜底 stub（`toolMeta[x] || {title: x, ...}`），
 * 永远不返回 undefined，所以旧代码里的 `if (!meta) notFound()` 从来不会触发，
 * 任意 /tools/<乱码> 都会返回一个 200 的桩页面，等于一台软 404 生成器。
 * 已核对：17 个 imageToolIds 全部存在于 toolMeta，故收紧后不会误伤任何正常工具。
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(toolMeta).map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool } = await params;
  // 直查 toolMeta，理由同下（getToolMeta 永不返回 undefined）
  const meta = toolMeta[tool];
  if (!meta) return {};

  // 叠加自动优化器写入的 DB 覆盖层（长尾词 meta 重写，零部署即时生效）。
  // 覆盖层不存在时回退静态 toolMeta，行为不变。
  const route = `/tools/${tool}`;
  const ov = getOverride(route);
  const title = ov?.title ?? String(meta.seoTitle || `${meta.title}`);
  const description = ov?.description ?? String(meta.seoDesc || meta.desc || "Free online tool");

  return constructMetadata({
    title,
    description,
    keywords: meta.seoKeywords,
    // canonical 必须显式传入：constructMetadata 里写的是
    //   alternates: canonical ? { canonical } : undefined
    // 不传就完全没有 canonical，而且 openGraph.url 会回退到站点根
    // ⇒ 此前 156 个走本模板的工具页既无 canonical，OG url 又全部指向首页。
    canonical: toolUrl(tool),
  });
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);
  // 必须直查 toolMeta —— getToolMeta() 带兜底 stub（永不返回 undefined），
  // 会让下面这个 notFound() 永远不触发，任意 slug 都渲染成 200 的桩页面。
  const meta = toolMeta[tool];

  if (!meta) {
    notFound();
  }

  const jsonLd = buildToolJsonLd(tool, meta);
  const categorySlug = getToolCategorySlug(meta.category);
  const relatedTools = getRelatedTools(tool);

  // Image tools: use ImageToolPage
  if (definition) {
    const clientDef = {
      id: definition.id,
      acceptTypes: definition.acceptTypes,
      maxFileSize: definition.maxFileSize,
    };
    return (
      <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url} author="Craftisle Team" relatedTools={relatedTools}>
        <ImageToolPage toolId={tool} definition={clientDef} />
        <ToolDetailSections toolId={tool} />
      </ToolDetailLayout>
    );
  }

  // Non-image tools: try ToolLoader first, fallback to ToolDetailSections
  return (
    <ToolDetailLayout toolId={tool} categorySlug={categorySlug} meta={meta} jsonLd={jsonLd} externalUrl={meta.url} author="Craftisle Team" relatedTools={relatedTools}>
      <ToolLoader toolId={tool} />
      <ToolDetailSections toolId={tool} />
    </ToolDetailLayout>
  );
}
