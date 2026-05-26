import { Metadata } from "next";
import { getToolMeta, type ToolMeta } from "@/lib/tools";

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
  return <>{children}</>;
}
