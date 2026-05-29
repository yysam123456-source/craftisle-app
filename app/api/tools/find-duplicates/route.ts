import { NextRequest, NextResponse } from "next/server";
import { findDuplicates } from "@/lib/image-tools/process/find-duplicates";

/**
 * Dedicated route for find-duplicates — handles multi-file FormData.
 * Static route (find-duplicates) takes priority over dynamic [tool] route.
 *
 * POST /api/tools/find-duplicates
 * FormData: file1=File, file2=File, file3=File (up to 5 files)
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

  // Collect all file fields
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
  const files: { name: string; buffer: Buffer }[] = [];

  // Extract files from FormData (file1, file2, file3...)
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("file") && value instanceof File) {
      if (value.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${value.name}" too large. Maximum: 4 MB` },
          { status: 413 },
        );
      }
      const buffer = Buffer.from(await value.arrayBuffer());
      files.push({ name: value.name, buffer });
    }
  }

  if (files.length < 2) {
    return NextResponse.json(
      { error: "At least 2 files required. Use file1, file2, ... fields." },
      { status: 400 },
    );
  }

  if (files.length > 5) {
    return NextResponse.json(
      { error: "Maximum 5 files allowed per comparison." },
      { status: 400 },
    );
  }

  try {
    const result = await findDuplicates(files);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Duplicate detection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
