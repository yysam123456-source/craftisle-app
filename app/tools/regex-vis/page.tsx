import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolDetailLayout } from "@/components/tools/ToolDetailLayout";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import type { ToolMeta } from "@/lib/tools";
import RegexVisClient from "./client";

// Force dynamic rendering for useSearchParams
export const dynamic = "force-dynamic";

// ---------- Static metadata ----------
export const metadata: Metadata = {
  title: "Regex Visualizer Free — Online AST Graph | Craftisle",
  description:
    "Free regex visualizer online. See AST tree graph, edit regex visually, test matches. Supports JS/Python/PCRE. 100% browser-based.",
  keywords: [
    "regex visualizer online free",
    "regex AST graph",
    "regular expression visual editor",
    "regex tree view online",
    "regex visual tester",
    "Craftisle regex tool",
  ],
};

const meta: ToolMeta = {
  title: "Regex Visualizer",
  desc: "Visual regex editor & AST viewer",
  icon: "🎨",
  category: "Developer Tools",
};

interface PageProps {
  searchParams: Promise<{ r?: string }>;
}

export default function RegexVisPage({ searchParams }: PageProps) {
  return (
    <ToolDetailLayout toolId="regex-vis" categorySlug="dev" meta={meta} jsonLd={{}}>
      <Suspense fallback={<div className="flex items-center justify-center h-64"><p>Loading Regex Visualizer...</p></div>}>
        <RegexVisClient />
      </Suspense>
      <ToolDetailSections toolId="regex-vis" />
    </ToolDetailLayout>
  );
}
