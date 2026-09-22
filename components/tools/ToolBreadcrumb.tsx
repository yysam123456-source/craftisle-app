"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toolMeta, CATEGORIES } from "@/lib/tools";
import type { ToolMeta } from "@/lib/tools";

function getCategoryHref(categoryLabel: string): string {
  const key =
    Object.entries(CATEGORIES).find(([, v]) => v === categoryLabel)?.[0] || "other";
  // 真实类目落地页 /l/<key>-tools 存在（11 个非 other 类目均有）；other 无落地页，回退查询参数
  return key === "other" ? `/tools?category=${key}` : `/l/${key}-tools`;
}

export function ToolBreadcrumb({ toolId }: { toolId: string }) {
  const meta = toolMeta[toolId] as ToolMeta | undefined;
  if (!meta) return null;

  const categoryHref = getCategoryHref(meta.category);

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Link href="/" className="hover:text-foreground">
        Home
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link href="/tools" className="hover:text-foreground">
        Tools
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link
        href={categoryHref}
        className="hover:text-foreground"
      >
        {meta.category}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{meta.title}</span>
    </nav>
  );
}
