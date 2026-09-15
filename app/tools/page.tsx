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
import { PAGE_META } from "@/lib/seo/page-meta";
import { CATEGORY_LANDING_SLUGS, LANDING_PAGES } from "@/lib/seo/landing-pages";

export const metadata: Metadata = constructMetadata({
  title: PAGE_META["/tools"].title,
  description: PAGE_META["/tools"].description,
});

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

      {/* AdSense inline ad — controlled by centralized config via AdSlot component */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlot slotId="tools-bottom" size="leaderboard" label="Tools Page Bottom" />
        </div>
      </section>
    </>
  );
}
