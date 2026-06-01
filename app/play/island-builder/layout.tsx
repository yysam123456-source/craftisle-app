import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Island Builder — Free Online Island Game | Craftisle",
  description:
    "Build your dream island for free in your browser. No download, no install. Creative sandbox island builder game online.",
  keywords: [
    "island builder game free",
    "sandbox island game browser",
    "free online builder game no download",
    "island building game HTML5",
    "play island builder online",
    "Craftisle game",
  ],
  openGraph: {
    title: "Island Builder — Free Online Game",
    description: "Build your dream island in browser. No download.",
    type: "website",
    locale: "en_US",
  },
};

export default function IslandBuilderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
