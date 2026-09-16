/**
 * 工具页结构化数据注入器（服务端组件）。
 *
 * 用途：给不走 app/tools/[tool]/page.tsx 模板的静态工具页补上完整 JSON-LD。
 * 那 8 个静态页（静态段优先于动态段）此前要么完全没有结构化数据，要么只挂了
 * 一个残缺的 faqSchema，拿不到 SoftwareApplication / HowTo / RelatedTools。
 *
 * 用法：在页面里放一行 <ToolJsonLd toolId="image-compress" />。
 */
import { getToolMeta } from "@/lib/tools";
import { buildToolJsonLd } from "@/lib/tool-seo";

export function ToolJsonLd({ toolId }: { toolId: string }) {
  const meta = getToolMeta(toolId);
  if (!meta) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(buildToolJsonLd(toolId, meta)),
      }}
    />
  );
}
