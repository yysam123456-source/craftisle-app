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

  // Strip server-only fields (processFile) before passing to client component
  const clientMeta: { id: string; acceptTypes: string[]; maxFileSize: number } = {
    id: definition.id,
    acceptTypes: definition.acceptTypes,
    maxFileSize: definition.maxFileSize,
  };

  return <ImageToolPage toolId={tool} definition={clientMeta} />;
}
