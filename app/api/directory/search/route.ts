import { getAllResources, type Resource } from "@/lib/fmhy-data";

/**
 * GET /api/directory/search?q=xxx&source=fmhy&limit=50
 *
 * Server-side search across all directory resources.
 * Returns matching resources as JSON.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const source = searchParams.get("source") || "";
  const category = searchParams.get("category") || "";
  const limitStr = searchParams.get("limit") || "50";
  const limit = Math.min(parseInt(limitStr, 10) || 50, 100);

  if (!q.trim()) {
    return Response.json({ results: [], total: 0 });
  }

  const all = getAllResources();
  const query = q.toLowerCase();

  let results = all.filter((r) => {
    const text = [
      r.name,
      r.url,
      r.description || "",
      r.categoryName || "",
      r.category || "",
      (r.tags || []).join(" "),
    ].join(" ").toLowerCase();
    return text.includes(query);
  });

  // Apply filters
  if (source) {
    results = results.filter((r) => r.source === source);
  }
  if (category) {
    results = results.filter((r) => r.category === category || r.categoryName === category);
  }

  const total = results.length;
  results = results.slice(0, limit);

  return Response.json({
    results: results.map((r) => ({
      id: r.id,
      name: r.name,
      url: r.url,
      description: r.description,
      category: r.category,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
      source: r.source,
      tags: r.tags,
      githubStars: r.githubStars,
    })),
    total,
    limit,
    q,
  });
}
