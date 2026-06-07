import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Resources | Free Tools Directory | Craftisle",
  description:
    "Search 6,000+ free resources across AI tools, education, privacy, gaming, music, and more. Find the best free software, open-source tools, and online utilities.",
  keywords: [
    "free resource search",
    "free tools search",
    "open source software finder",
    "free software directory",
    "best free online tools",
    "free utility search",
    "free app finder",
    "open source tool search",
  ],
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
