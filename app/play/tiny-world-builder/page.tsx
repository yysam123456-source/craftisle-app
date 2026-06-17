import { constructMetadata } from "@/lib/utils";
import TinyWorldBuilderClient from "./client";

export const metadata = constructMetadata({
  title: "Tiny World Builder — Free Online World Builder Game | Craftisle",
  description: "Play Tiny World Builder free online. Build and explore tiny worlds in this creative browser game. No download required — play instantly.",
  keywords: ["tiny world builder", "world builder game", "free online game", "browser game", "creative game"],
  canonical: "https://craftisle.com/play/tiny-world-builder",
});

export default function TinyWorldBuilderPage() {
  return <TinyWorldBuilderClient />;
}
