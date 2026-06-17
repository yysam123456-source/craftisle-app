import SearchResultsPageClient from "./client";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Search Resources — Find Free Tools & Software | Craftisle",
  description: "Search across 10,000+ free resources, open-source projects, and tools. Find the best free alternatives, self-hosted solutions, and more.",
  keywords: ["search free tools", "find open source software", "free resource directory", "search Craftisle"],
  canonical: "https://craftisle.com/directory/search",
});

export default function SearchResultsPage() {
  return <SearchResultsPageClient />;
}
