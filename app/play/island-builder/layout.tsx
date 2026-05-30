import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Mykos Island Builder | Craftisle",
  description: "Build your dream island, explore endless possibilities. Play free online in your browser.",
});

export default function IslandBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
