import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Tiny World Builder | Craftisle",
  description: "Build your mini world, unleash creativity. Play free online in your browser.",
});

export default function TinyWorldBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
