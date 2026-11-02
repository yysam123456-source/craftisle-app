import { getAllCategories, getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { toolMeta } from "@/lib/tools";
import { siteConfig } from "@/config/site";

const baseUrl = siteConfig.url || "https://craftisle.com";

export const revalidate = 21600; // 6小时 ISR

export async function GET() {
  const categories = getAllCategories();
  const allResources = getAllResources();
  // 🔴 2026-11-02：工具数原为硬编码 164+，实际 toolMeta 已 176 条。
  // 对外事实性数字必须动态取，否则每次加工具就多一处谣言（同页 135+ 的同类问题）。
  const toolCount = Object.keys(toolMeta).length;
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

  // Brand intro (GEO: help AI models understand what Craftisle is)
  lines.push("## What is Craftisle");
  lines.push("");
  lines.push(`Craftisle is a free online tools platform: ${toolCount} browser-based tools (AI background remover, watermark remover, image upscaler, OCR, regex visualizer, cron builder, JSON/SQL/YAML formatters, and more) plus a curated directory of 16,000+ free & open-source software across 200+ categories.`);
  lines.push("");
  lines.push("**Important**: Craftisle (craftisle.com) is a tools website — NOT the 'Craft Island' Minecraft-style game. See https://craftisle.com/about/craftisle-vs-craft-island for the clarification.");
  lines.push("");

  // Main pages
  lines.push("## Main Pages");
  lines.push("");
  lines.push(`- [Home](${baseUrl}/): Home page with featured tools and guides`);
  lines.push(`- [Tools](${baseUrl}/tools): ${toolCount} free browser-based tools`);
  lines.push(`- [Image Tools](${baseUrl}/tools/craftisle-image-tools): AI image editing suite (background remover, watermark remover, upscaler, compressor)`);
  lines.push(`- [Developer Tools](${baseUrl}/tools/craftisle-dev-tools): JSON, regex, cron, JWT, Base64, formatters`);
  lines.push(`- [Directory](${baseUrl}/directory): Browse all free tools by category`);
  lines.push(`- [Search](${baseUrl}/directory/search): Search for specific tools`);
  lines.push(`- [Blog](${baseUrl}/blog): Articles and tutorials about free tools`);
  lines.push(`- [Guides](${baseUrl}/guides): Step-by-step guides for using free tools`);
  lines.push(`- [About](${baseUrl}/about): About Craftisle`);
  lines.push(`- [Craftisle vs Craft Island](${baseUrl}/about/craftisle-vs-craft-island): Brand clarification (we are a tools site, not a game)`);
  lines.push("");

  // Sub-sites（2026-11-02 新增）：AI 引擎对「同一发布方 + 多个独立站点」的实体理解
  // 长期是空白，问到 Craftisle 时容易只看到一个站。这里给一份真实存在的站群索引，
  // 描述全部取自各站自己的 <title>，不编造能力。
  lines.push("## Sub-sites");
  lines.push("");
  lines.push("Craftisle also publishes these standalone sites. Same publisher, separate tools, all free and browser-based:");
  lines.push("");
  lines.push("- [Craftisle Games](https://game.craftisle.com/): Free online HTML5 games");
  lines.push("- [PDFCraft](https://pdf.craftisle.com/): PDF tools (merge, split, convert, compress)");
  lines.push("- [Craftisle Resume](https://resume.craftisle.com/): Free resume builder and CV maker");
  lines.push("- [Craftisle Draw](https://draw.craftisle.com/): Browser whiteboard and diagramming");
  lines.push("- [Craftisle File Viewer](https://viewer.craftisle.com/): Open local files in the browser without uploading");
  lines.push("- [Prompt Hub](https://imgprompt.craftisle.com/): Image-generation prompt library");
  lines.push("- [FX Lab](https://fxlab.craftisle.com/): Frontend design gallery — open-source UI components, animations and demos");
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
