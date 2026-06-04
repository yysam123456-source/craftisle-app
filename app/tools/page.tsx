import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Wrench } from "lucide-react";
import { ToolsClient } from "@/components/tools-client";
import { toolMeta } from "@/lib/tools";
import { imageToolIds } from "@/lib/image-tools";
import { constructMetadata } from "@/lib/utils";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = constructMetadata({
  title: "60+ Free Online Tools — No Signup, No Download | Craftisle",
  description: "Free online tools for developers & creators. QR code generator, JSON/SQL/HTML formatter, Base64 encode/decode, hash tools, regex tester, image compress/resize/crop, PDF tools. 100% browser-based, no registration, no upload to server.",
});

export default function ToolsPage() {
  // All tool keys from toolMeta + image tools
  const toolDirs = [
    ...Object.keys(toolMeta),
    ...imageToolIds.filter(id => !Object.keys(toolMeta).includes(id)),
  ];

  return (
    <>
      <ToolsClient toolDirs={toolDirs} />
      {/* Ad slot hidden until AdSense is configured */}
      {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
        <section className="py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <AdSlot slotId="tools-bottom" size="leaderboard" label="Tools Page Bottom" />
          </div>
        </section>
      )}
    </>
  );
}
