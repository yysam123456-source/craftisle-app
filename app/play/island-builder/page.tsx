import type { Metadata } from "next";
import IslandBuilderClient from "./client";

export const metadata: Metadata = {
  title: "Island Builder — Free Online World Builder Game | Craftisle",
  description: "Play Island Builder free online. Build your dream island in this creative world builder game. No download required — play instantly in browser.",
  keywords: ["island builder", "world builder game", "free online game", "browser game", "creative game"],
  openGraph: {
    title: "Island Builder — Free Online World Builder Game",
    description: "Build your dream island in this creative world builder game. Play free online.",
    url: "https://craftisle.com/play/island-builder",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Island Builder — Free Online World Builder Game",
    description: "Build your dream island in this creative world builder game.",
  },
  alternates: {
    canonical: "https://craftisle.com/play/island-builder",
  },
};

export default function IslandBuilderPage() {
  return <IslandBuilderClient />;
}
