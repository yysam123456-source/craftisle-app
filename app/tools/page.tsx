import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { ToolsClient } from "@/components/tools-client";
import { toolMeta } from "@/lib/tools";
import { imageToolIds } from "@/lib/image-tools";
import { constructMetadata } from "@/lib/utils";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Metadata } from "next";
import { getResolvedMetaAsync } from "@/lib/seo/page-meta";
import { CATEGORY_LANDING_SLUGS, LANDING_PAGES } from "@/lib/seo/landing-pages";
import { CONVERT_PAIRS } from "@/lib/convert/pairs";

// 🔴 DEBT-25：原先是 `export const metadata = constructMetadata({ title: PAGE_META["/tools"].title })`。
// 那是**构建期常量** —— build 时就把值烤进静态 HTML，运行时 DB 覆盖层写了也不会变。
// 同时 PAGE_META 是同步 Proxy，冷缓存下 getOverride恒返回 undefined（静默回退静态值）。
// 两条叠加 ⇒ /tools 的覆盖层**从来就没生效过**。改成 generateMetadata + async 解析。
// revalidate = 300：进入 ISR，写 DB 后最多 5 分钟生效（与工具页覆盖层口径一致）。
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const m = await getResolvedMetaAsync("/tools");
  return constructMetadata({
    title: m?.title,
    description: m?.description,
  });
}

export default function ToolsPage() {
  // All tool keys from toolMeta + image tools
  const toolDirs = [
    ...Object.keys(toolMeta),
    ...imageToolIds.filter(id => !Object.keys(toolMeta).includes(id)),
  ];

  const baseUrl = "https://craftisle.com";

  // JSON-LD: CollectionPage + ItemList (top 20 tools)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Free Online Tools — Craftisle",
    description: "60+ free online tools for developers and creators",
    url: `${baseUrl}/tools`,
    isPartOf: {
      "@type": "WebSite",
      name: "Craftisle",
      url: baseUrl,
    },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: toolDirs.length,
    itemListElement: toolDirs.slice(0, 20).map((toolId, index) => {
      const meta = toolMeta[toolId];
      return {
        "@type": "ListItem",
        position: index + 1,
        name: meta?.title || toolId,
        description: meta?.desc || "Free online tool",
        url: `${baseUrl}/tools/${toolId}`,
      };
    }),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <ToolsClient toolDirs={toolDirs} />

      {/* 分类聚合页入口：/l/ 落地页此前在站内零入链（孤儿页），
          此处从高权重的工具索引页给出上下文相关的分类入口，传递权重并加速发现 */}
      <section className="py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold">Browse tools by category</h2>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {CATEGORY_LANDING_SLUGS.map((slug) => (
              <li key={slug}>
                <Link
                  href={`/l/${slug}`}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {LANDING_PAGES[slug].h1}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 格式对转页入口：/c/<from>-to-<to>
          这批页面向「png to jpg」这类低竞争长尾，不挂在 /tools 索引下会成孤儿页。
          从高权重的工具索引页给出入口，传递权重并加速收录。 */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-semibold">Convert between image formats</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every converter runs in your browser — files are never uploaded.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {CONVERT_PAIRS.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/c/${p.slug}`}
                  className="text-primary underline underline-offset-2 hover:no-underline"
                >
                  {p.phrase} Converter
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AdSense inline ad — controlled by centralized config via AdSlot component */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlot slotId="tools-bottom" size="leaderboard" label="Tools Page Bottom" />
        </div>
      </section>
    </>
  );
}
