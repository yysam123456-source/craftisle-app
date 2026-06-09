import { MetadataRoute } from "next";
import { toolMeta } from "@/lib/tools";
import { getAllCategories, getAllResources } from "@/lib/fmhy-data";
import { ALTERNATIVES_MAP } from "@/lib/alternatives";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const baseUrl = "https://craftisle.com";
const now = new Date();

function loadReviewSlugs(): string[] {
  try {
    const dir = join(process.cwd(), "public", "data", "reviews");
    const files = readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("_"));
    return files.map(f => {
      const r = JSON.parse(readFileSync(join(dir, f), "utf-8"));
      return r.resourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    });
  } catch { return []; }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${baseUrl}/`, priority: 1.0, changeFreq: "daily" as const },
    { url: `${baseUrl}/games`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/tools`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory/search`, priority: 0.6, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory/favorites`, priority: 0.5, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog/category/news`, priority: 0.6, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog/category/education`, priority: 0.6, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog/review`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog/tools`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog/how-to`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/privacy`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/terms`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/cookie-policy`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/disclaimer`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/about`, priority: 0.5, changeFreq: "monthly" as const },
    { url: `${baseUrl}/contact`, priority: 0.5, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // 资源分类页面
  const resourceCategories = getAllCategories();
  const categoryPages = resourceCategories.map((cat) => ({
    url: `${baseUrl}/directory/${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ★ 新增：资源详情页（每个资源一个独立 URL）
  const allResources = getAllResources();
  const resourceDetailPages = allResources.slice(0, 5000).map((r) => ({
    url: `${baseUrl}/directory/resource/${r.id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // ★ 新增：替代品页面
  const alternativePages = Object.keys(ALTERNATIVES_MAP).map((tool) => ({
    url: `${baseUrl}/directory/alternatives/${encodeURIComponent(tool.toLowerCase().replace(/\s+/g, "-"))}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：评测博文页面
  const reviewSlugs = loadReviewSlugs();
  const reviewPages = reviewSlugs.map((slug) => ({
    url: `${baseUrl}/blog/review/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ★ 新增：工具教程博文页面
  const toolBlogSlugs = (() => {
    try {
      const manifestPath = join(process.cwd(), "public", "data", "tool-blogs", "_manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return (Array.isArray(manifest) ? manifest : []).map((b: any) => b.slug);
    } catch { return []; }
  })();
  const toolBlogPages = toolBlogSlugs.map((slug: string) => ({
    url: `${baseUrl}/blog/tools/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const playPages = [
    { url: `${baseUrl}/play/island-builder`, priority: 0.8, changeFreq: "monthly" as const },
    { url: `${baseUrl}/play/tiny-world-builder`, priority: 0.8, changeFreq: "monthly" as const },
    { url: `${baseUrl}/play/the-last-glimmer`, priority: 0.7, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const otherPages = [
    { url: `${baseUrl}/guides`, priority: 0.7, changeFreq: "monthly" as const },
    { url: `${baseUrl}/blog/how-to`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/compare`, priority: 0.6, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const toolPages = Object.keys(toolMeta).map((id) => ({
    url: `${baseUrl}/tools/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...resourceDetailPages,
    ...alternativePages,
    ...reviewPages,
    ...toolBlogPages,
    ...playPages,
    ...otherPages,
    ...toolPages,
  ];
}
