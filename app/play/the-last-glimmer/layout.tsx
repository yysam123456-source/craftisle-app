import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "The Last Glimmer — Free Survival Island Game | Craftisle",
  description:
    "Survive the storm in this free HTML5 survival game. Ship, five crew, one lighthouse. Play instantly in browser — no download.",
  keywords: [
    "survival island game free",
    "HTML5 survival game browser",
    "free survival game no download",
    "online survival game 2026",
    "play survival island game free",
    "Craftisle game",
  ],
  openGraph: {
    title: "The Last Glimmer — Free Survival Game",
    description: "Survive the storm in this free HTML5 survival game. Play in browser.",
    type: "website",
    locale: "en_US",
  },
};

export default function TheLastGlimmerLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
