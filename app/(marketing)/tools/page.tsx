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
  title: "Free Online Tools | Craftisle",
  description: "60+ free online tools, no download required. QR codes, JSON formatting, image conversion and more — all in your browser.",
});

// Server Component: read tool directories
export default function ToolsPage() {
  let toolDirs: string[] = [];
  try {
    const fs = require("fs");
    const path = require("path");
    const toolsPath = path.join(
      process.cwd(),
      "app/(marketing)/tools"
    );
    toolDirs = fs
      .readdirSync(toolsPath, { withFileTypes: true })
      .filter((d: import("fs").Dirent) => d.isDirectory())
      .map((d: import("fs").Dirent) => d.name)
      .filter(
        (name: string) =>
          !name.startsWith("_") &&
          !name.startsWith(".") &&
          name !== "[tool]"
      );
  } catch {
    toolDirs = Object.keys(toolMeta);
  }

  // Merge dynamic image tools (no physical directories)
  for (const id of imageToolIds) {
    if (!toolDirs.includes(id)) {
      toolDirs.push(id);
    }
  }

  // External tools (no local page, link to subdomain)
  if (!toolDirs.includes("pdf-tools")) {
    toolDirs.push("pdf-tools");
  }

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
