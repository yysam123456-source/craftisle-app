import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

interface Resource {
  id: string;
  category: string;
  categoryName?: string;
  name: string;
  url: string;
  description: string;
  source?: string;
  githubStars?: number;
  githubLastUpdated?: string;
  isOpenSource?: boolean;
  isSelfHosted?: boolean;
  tags?: string[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const source = searchParams.get("source") || "";
  const category = searchParams.get("category") || "";
  const sortBy = searchParams.get("sortBy") || "relevance";
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  const sources = ["fmhy", "free-for-dev", "public-apis", "awesome-selfhosted"];
  const allResources: Resource[] = [];

  for (const src of sources) {
    try {
      const filePath = join(process.cwd(), "public", "data", `${src}-resources.json`);
      const data = JSON.parse(readFileSync(filePath, "utf-8"));

      if (src === "fmhy" && data.categories) {
        for (const [catId, catData] of Object.entries(data.categories) as [string, any][]) {
          for (const r of (catData.resources || [])) {
            allResources.push({ ...r, source: src });
          }
        }
      } else if (data.resources) {
        for (const r of data.resources) {
          if (r.id && r.name && r.url) {
            allResources.push({ ...r, source: src });
          }
        }
      }
    } catch {}
  }

  // Dedup by ID
  const seen = new Set<string>();
  const deduped: Resource[] = [];
  for (const r of allResources) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      deduped.push(r);
    }
  }

  // Filter by query
  const q = query.toLowerCase();
  let filtered = deduped.filter((r) => {
    const text = `${r.name} ${r.url} ${r.description || ""} ${r.categoryName || ""}`.toLowerCase();
    return text.includes(q);
  });

  // Filter by source
  if (source) {
    filtered = filtered.filter((r) => r.source === source);
  }

  // Filter by category
  if (category) {
    filtered = filtered.filter((r) => r.category === category || r.categoryName === category);
  }

  // Sort
  if (sortBy === "stars") {
    filtered.sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0));
  } else if (sortBy === "name") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Limit
  filtered = filtered.slice(0, limit);

  return NextResponse.json({ results: filtered });
}
