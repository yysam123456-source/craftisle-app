import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tiny World Builder — Free Online World Builder Game | Craftisle",
  description:
    "Build your mini world for free in browser. Creative sandbox game, no download required. Unleash your creativity online.",
  keywords: [
    "world builder game free",
    "sandbox game browser no download",
    "free online building game",
    "tiny world builder HTML5",
    "Craftisle game",
  ],
  openGraph: {
    title: "Tiny World Builder — Free Online Game",
    description: "Build your mini world for free in browser. No download required.",
    type: "website",
    locale: "en_US",
  },
};

export default function TinyWorldBuilderLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
