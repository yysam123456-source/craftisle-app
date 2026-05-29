import { NextRequest, NextResponse } from "next/server";
import { createGif } from "@/lib/image-tools/process/create-gif";

/**
 * Dedicated route for create-gif — handles multi-frame FormData.
 * Static route takes priority over dynamic [tool] route.
 *
 * POST /api/tools/create-gif
 * FormData: frame1=File, frame2=File, ... + frameDelay=number
 *
 * Vercel free tier constraint: total body size ≤ 4.5 MB.
 * Recommended: ≤8 frames, ≤400×400px each.
 */
export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 },
    );
  }

  // Extract frame files (frame1, frame2, ...)
  const buffers: Buffer[] = [];
  let frameDelay: number | undefined;

  for (const [key, value] of formData.entries()) {
    if (key === "frameDelay") {
      frameDelay = Number(value);
      continue;
    }
    if (key.startsWith("frame") && value instanceof File) {
      const buffer = Buffer.from(await value.arrayBuffer());
      buffers.push(buffer);
    }
  }

  if (buffers.length === 0) {
    return NextResponse.json(
      { error: "No frames provided. Use frame1, frame2, ... fields." },
      { status: 400 },
    );
  }

  if (buffers.length > 20) {
    return NextResponse.json(
      {
        error:
          "Maximum 20 frames allowed. For best results on Vercel free tier, use ≤8 frames at ≤400×400px.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await createGif(buffers, {
      frameDelay: frameDelay ?? 500,
    });
    return new NextResponse(result.buffer, {
      headers: {
        "Content-Type": "image/gif",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "GIF creation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
