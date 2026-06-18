import { constructMetadata } from "@/lib/utils";
import TheLastGlimmerClient from "./client";

export const metadata = constructMetadata({
  title: "The Last Glimmer — Free Online Adventure Game | Craftisle",
  description: "Play The Last Glimmer free online. A ship, crew, lighthouse, and storm — an atmospheric adventure game. No download required — play instantly in browser.",
  keywords: ["the last glimmer", "adventure game", "free online game", "browser game", "atmospheric game"],
  canonical: "https://craftisle.com/play/the-last-glimmer",
});

export default function TheLastGlimmerPage() {
  return <TheLastGlimmerClient />;
}
