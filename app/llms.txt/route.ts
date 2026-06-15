import { getAllCategories, getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { siteConfig } from "@/config/site";

const baseUrl = siteConfig.url || "https://craftisle.com";

export const revalidate = 21600; // 6小时 ISR

export async function GET() {
  const categories = getAllCategories();
  const allResources = getAllResources();
  const richInfoIds = getRichInfoResourceIds();
  const richResources = allResources.filter(r => richInfoIds.has(r.id));
  const topResources = richResources
    .sort((a, b) => {
      const scoreA = (a.githubStars || 0) + (a.description && a.description.length > 50 ? 50 : 0);
      const scoreB = (b.githubStars || 0) + (b.description && b.description.length > 50 ? 50 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 100);

  const lines: string[] = [];
  lines.push(`# ${siteConfig.name || "Craftisle"} — Free Resource Directory`);
  lines.push("");
  lines.push("> A curated directory of free online tools, software, and resources. All tools are manually reviewed and categorized.");
  lines.push("");

  // Main pages
  lines.push("## Main Pages");
  lines.push("");
  lines.push(`- [Home](${baseUrl}/): Home page with featured tools and guides`);
  lines.push(`- [Directory](${baseUrl}/directory): Browse all free tools by category`);
  lines.push(`- [Search](${baseUrl}/directory/search): Search for specific tools`);
  lines.push(`- [Blog](${baseUrl}/blog): Articles and tutorials about free tools`);
  lines.push(`- [Guides](${baseUrl}/guides): Step-by-step guides for using free tools`);
  lines.push("");

  // Categories
  lines.push("## Categories");
  lines.push("");
  for (const cat of categories) {
    lines.push(`- [${cat.name}](${baseUrl}/directory/${cat.id}): ${cat.description || `${cat.name} tools and resources`}`);
  }
  lines.push("");

  // Top resources
  lines.push("## Top Resources");
  lines.push("");
  for (const r of topResources) {
    const url = `${baseUrl}/directory/resource/${r.id}`;
    const desc = r.description && r.description !== '**' ? r.description.slice(0, 120) : `${r.name} — free online tool`;
    lines.push(`- [${r.name}](${url}): ${desc}`);
  }
  lines.push("");

  // Data sources
  lines.push("## Data Sources");
  lines.push("");
  lines.push("- [FMHY (Free Media Heck Yeah)](https://fmhy.net/): Primary data source for free tools and resources");
  lines.push("- [GitHub](https://github.com/): Source code and open-source tools");
  lines.push("- [AlternativeTo](https://alternativeto.net/): Alternative software recommendations");
  lines.push("");

  const body = lines.join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=21600, s-maxage=21600",
    },
  });
}
