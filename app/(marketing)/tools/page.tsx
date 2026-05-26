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

export const metadata = {
  title: "Free Online Tools | Craftisle",
  description: "50+ free online tools, no download required.",
};

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

  return <ToolsClient toolDirs={toolDirs} />;
}
