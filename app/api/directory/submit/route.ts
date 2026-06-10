import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const SUBMISSIONS_FILE = join(
  process.cwd(),
  "public",
  "data",
  "pending-submissions.json",
);

interface Submission {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  githubUrl: string;
  email: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
}

function loadSubmissions(): Submission[] {
  try {
    if (!existsSync(SUBMISSIONS_FILE)) return [];
    const raw = readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(raw) as Submission[];
  } catch {
    return [];
  }
}

function saveSubmissions(data: Submission[]) {
  writeFileSync(
    SUBMISSIONS_FILE,
    JSON.stringify(data, null, 2),
    "utf-8",
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, url, description, category, githubUrl, email } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Resource name and URL are required." },
        { status: 400 },
      );
    }

    // Basic URL validation
    try { new URL(url); } catch {
      return NextResponse.json(
        { error: "Invalid URL." },
        { status: 400 },
      );
    }

    const submissions = loadSubmissions();
    const newSubmission: Submission = {
      id: `subm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      url: url.trim(),
      description: (description || "").trim(),
      category: category || "Other",
      githubUrl: (githubUrl || "").trim(),
      email: (email || "").trim(),
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    submissions.push(newSubmission);
    saveSubmissions(submissions);

    return NextResponse.json({ success: true, id: newSubmission.id });
  } catch (err: any) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
