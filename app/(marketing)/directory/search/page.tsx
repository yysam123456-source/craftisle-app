import type { Metadata } from "next";
import SearchResultsPageClient from "./client";

export const metadata: Metadata = {
  title: "Search Resources — Find Free Tools & Software | Craftisle",
  description: "Search across 10,000+ free resources, open-source projects, and tools. Find the best free alternatives, self-hosted solutions, and more.",
  keywords: ["search free tools", "find open source software", "free resource directory", "search Craftisle"],
  openGraph: {
    title: "Search Resources — Find Free Tools & Software",
    description: "Search across 10,000+ free resources, open-source projects, and tools.",
    url: "https://craftisle.com/directory/search",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Resources — Find Free Tools & Software",
    description: "Search across 10,000+ free resources, open-source projects, and tools.",
  },
  alternates: {
    canonical: "https://craftisle.com/directory/search",
  },
};

export default function SearchResultsPage() {
  return <SearchResultsPageClient />;
}
