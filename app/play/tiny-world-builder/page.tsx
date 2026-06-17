import type { Metadata } from "next";
import TinyWorldBuilderClient from "./client";

export const metadata: Metadata = {
  title: "Tiny World Builder — Free Online World Builder Game | Craftisle",
  description: "Play Tiny World Builder free online. Build and explore tiny worlds in this creative browser game. No download required — play instantly.",
  keywords: ["tiny world builder", "world builder game", "free online game", "browser game", "creative game"],
  openGraph: {
    title: "Tiny World Builder — Free Online World Builder Game",
    description: "Build and explore tiny worlds in this creative browser game.",
    url: "https://craftisle.com/play/tiny-world-builder",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiny World Builder — Free Online World Builder Game",
    description: "Build and explore tiny worlds in this creative browser game.",
  },
  alternates: {
    canonical: "https://craftisle.com/play/tiny-world-builder",
  },
};

export default function TinyWorldBuilderPage() {
  return <TinyWorldBuilderClient />;
}
