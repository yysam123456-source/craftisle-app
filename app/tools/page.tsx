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

export const metadata: Metadata = constructMetadata({
  title: "Free MS Project, Google Workspace & IntelliJ Alternatives + 160 Tools | Craftisle",
  description:
    "Looking for free MS Project, Google Workspace, or IntelliJ alternatives? Craftisle offers 160+ free browser-based tools — project planners, office & PDF utilities, dev tools, AI image editors, regex testers. No signup, no download, 100% client-side and private.",
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
      {/* AdSense inline ad — controlled by centralized config via AdSlot component */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
          <AdSlot slotId="tools-bottom" size="leaderboard" label="Tools Page Bottom" />
        </div>
      </section>
    </>
  );
}
