import { NextRequest, NextResponse } from "next/server";
import { getToolDefinition } from "@/lib/image-tools";

/**
 * Generic image processing API route factory.
 *
 * Receives POST with FormData:
 * - file: File — uploaded image
 * - params: string — JSON-encoded tool parameters
 *
 * Route: /api/tools/[tool]
 * Maps to tool definition via getToolDefinition(tool).processFile()
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tool: string }> },
) {
  const { tool } = await params;
  const definition = getToolDefinition(tool);

  if (!definition) {
    return NextResponse.json(
      { error: `Tool not found: ${tool}` },
      { status: 404 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  // 4 MB hard limit — Vercel free tier body limit is 4.5 MB
  if (file.size > definition.maxFileSize) {
    return NextResponse.json(
      { error: `File too large. Maximum: ${definition.maxFileSize / 1024 / 1024} MB` },
      { status: 413 },
    );
  }

  let toolParams: Record<string, unknown> = {};
  const paramsRaw = formData.get("params");
  if (paramsRaw && typeof paramsRaw === "string") {
    try {
      toolParams = JSON.parse(paramsRaw);
    } catch {
      return NextResponse.json(
        { error: "Invalid params JSON" },
        { status: 400 },
      );
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await definition.processFile(buffer, toolParams);

    // JSON-only tools (info, color-palette)
    if (!result.buffer) {
      return NextResponse.json(result.metadata ?? {});
    }

    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
