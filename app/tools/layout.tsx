"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { getToolMeta, CATEGORY_LIST } from "@/lib/tools";
import type { ToolMeta } from "@/lib/tools";
import { ToolActionBar } from "@/components/tools/ToolActionBar";
import { NavBar } from "@/components/layout/navbar";
import { NavMobile } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";

function getCategoryHref(categoryLabel: string): string {
  const entry = CATEGORY_LIST.find((c) => c.label === categoryLabel);
  const key = entry?.key ?? "utility";
  // 真实类目落地页 /l/<key>-tools 存在（11 个非 other 类目均有）；other 无落地页，回退查询参数
  return key === "other" ? `/tools?category=${key}` : `/l/${key}-tools`;
}

function ToolBreadcrumb({ toolId }: { toolId: string }) {
  const meta = getToolMeta(toolId);
  if (!meta) return null;

  const categoryHref = getCategoryHref(meta.category);

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
    <div className="flex min-h-screen flex-col">
      <NavMobile />
      <NavBar scroll={true} />
      <main className="flex-1">
        {toolId && <ToolBreadcrumb toolId={toolId} />}
        {children}
      </main>
      <SiteFooter />
      {toolId && <ToolActionBar toolId={toolId} />}
    </div>
  );
}
