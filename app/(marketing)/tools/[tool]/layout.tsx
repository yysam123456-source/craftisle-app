import { Metadata } from "next";
import { getToolMeta, type ToolMeta } from "@/lib/tools";
import AdSlot from "@/components/ads/AdSlot";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const meta: ToolMeta = getToolMeta(tool);

  return {
    title: `${meta.title} | Craftisle Free Tools`,
    description: meta.desc,
    keywords: ["free online tools", "web tools", meta.title, "Craftisle"],
    openGraph: {
      title: `${meta.title} | Craftisle`,
      description: meta.desc,
      type: "website",
      locale: "en_US",
    },
  };
}

export default function ToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Top leaderboard ad */}
      <div className="flex justify-center py-4">
        <AdSlot slotId="tools-top-leaderboard" size="leaderboard" />
      </div>

      {children}

      {/* Bottom rectangle ad */}
      <div className="flex justify-center py-6">
        <AdSlot slotId="tools-bottom-rectangle" size="rectangle" />
      </div>
    </div>
  );
}
