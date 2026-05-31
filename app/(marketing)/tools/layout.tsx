"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { toolMeta, CATEGORIES } from "@/lib/tools";
import type { ToolMeta } from "@/lib/tools";

function getCategorySlug(categoryLabel: string): string {
  return Object.entries(CATEGORIES).find(([, v]) => v === categoryLabel)?.[0] || "other";
}

function ToolBreadcrumb({ toolId }: { toolId: string }) {
  const meta = toolMeta[toolId] as ToolMeta | undefined;
  if (!meta) return null;

  const categorySlug = getCategorySlug(meta.category);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground px-4 pt-6 max-w-5xl mx-auto">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link href="/tools" className="hover:text-foreground">
        Tools
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link
        href={`/tools?category=${categorySlug}`}
        className="hover:text-foreground"
      >
        {meta.category}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{meta.title}</span>
    </nav>
  );
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Only show breadcrumb on individual tool pages, not on /tools list
  const match = pathname?.match(/^\/tools\/([^/]+)$/);
  const toolId = match?.[1] || null;

  return (
    <>
      {toolId && <ToolBreadcrumb toolId={toolId} />}
      {children}
    </>
  );
}
