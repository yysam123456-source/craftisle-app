import { getToolDefinition } from "@/lib/image-tools";
import { ImageToolPage } from "@/components/tools/image-tool-page";
import { notFound } from "next/navigation";

/**
 * Dynamic tool page — catch-all for image tools without physical directories.
 *
 * Matched when no static tool directory exists.
 * Looks up tool definition from registry; renders 404 if not found.
 */
export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);

  if (!definition) {
    notFound();
  }

  return <ImageToolPage toolId={tool} definition={definition} />;
}
