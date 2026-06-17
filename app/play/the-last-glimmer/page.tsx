import type { Metadata } from "next";
import TheLastGlimmerClient from "./client";

export const metadata: Metadata = {
  title: "The Last Glimmer — Free Online Adventure Game | Craftisle",
  description: "Play The Last Glimmer free online. A ship, crew, lighthouse, and storm — an atmospheric adventure game. No download required — play instantly in browser.",
  keywords: ["the last glimmer", "adventure game", "free online game", "browser game", "atmospheric game"],
  openGraph: {
    title: "The Last Glimmer — Free Online Adventure Game",
    description: "A ship, crew, lighthouse, and storm — an atmospheric adventure game.",
    url: "https://craftisle.com/play/the-last-glimmer",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Last Glimmer — Free Online Adventure Game",
    description: "A ship, crew, lighthouse, and storm — an atmospheric adventure game.",
  },
  alternates: {
    canonical: "https://craftisle.com/play/the-last-glimmer",
  },
};

export default function TheLastGlimmerPage() {
  return <TheLastGlimmerClient />;
}
