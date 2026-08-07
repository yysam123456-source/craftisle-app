import { NextResponse } from "next/server";
import { getAllCategories, getAllResources, getStats } from "@/lib/fmhy-data";

export const revalidate = 21600; // 6小时 ISR

/**
 * GET /api/directory
 * 公开只读目录数据接口（GEO 权威信号：让 AI/爬虫能结构化读取目录内容）
 *
 * Query 参数:
 *   ?category=<categoryId>   按分类过滤
 *   ?limit=50                返回条数（默认 50，上限 200）
 *   ?format=json|llm         输出格式（默认 json；llm 输出纯文本利于 LLM 消费）
 *   ?source=<sourceId>       按数据源过滤（fmhy / alternativeto ...）
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const source = searchParams.get("source") || "";
  const format = searchParams.get("format") || "json";
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

  const categories = getAllCategories();
  const allResources = getAllResources(source || undefined);

  const resources = category
    ? allResources.filter(r => r.category === category)
    : allResources;

  const sliced = resources.slice(0, limit);
  const stats = getStats();

  if (format === "llm") {
    // 面向 LLM 的纯文本格式（可被 AI 直接消费）
    const lines: string[] = [];
    lines.push(`# Craftisle Directory — ${category || "All Categories"}`);
    lines.push(`Total categories: ${categories.length} | Total resources: ${stats.total ?? resources.length}`);
    lines.push("");
    for (const r of sliced) {
      const desc = r.description && r.description !== "**" ? r.description.slice(0, 150) : "";
      lines.push(`- ${r.name}${desc ? `: ${desc}` : ""}`);
    }
    return new Response(lines.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=21600, s-maxage=21600" },
    });
  }

  return NextResponse.json(
    {
      ok: true,
      meta: {
        brand: "Craftisle",
        description: "Curated directory of 16,000+ free & open-source software",
        category,
        source: source || "all",
        totalCategories: categories.length,
        totalResources: stats.total ?? resources.length,
        returned: sliced.length,
      },
      categories: categories.slice(0, 50).map(c => ({ id: c.id, name: c.name })),
      resources: sliced.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        url: r.url,
        description: r.description,
        githubStars: r.githubStars ?? null,
        license: r.license ?? null,
      })),
    },
    {
      headers: { "Cache-Control": "public, max-age=21600, s-maxage=21600" },
    }
  );
}
