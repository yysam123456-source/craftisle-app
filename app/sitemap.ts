import { MetadataRoute } from "next";
import { toolMeta } from "@/lib/tools";
import { readFileSync } from "fs";
import { join } from "path";

const baseUrl = "https://craftisle.com";
const now = new Date();

// 读取资源分类数据
function getResourceCategories() {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-index.json");
    const raw = readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return data.categories || [];
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${baseUrl}/`, priority: 1.0, changeFreq: "daily" as const },
    { url: `${baseUrl}/games`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/tools`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory/search`, priority: 0.6, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/privacy`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/terms`, priority: 0.4, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // 资源分类页面
  const resourceCategories = getResourceCategories();
  const categoryPages = resourceCategories.map((cat: any) => ({
    url: `${baseUrl}/directory/${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
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
    { url: `${baseUrl}/pricing`, priority: 0.6, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // toolMeta is a plain object — Object.keys is static, safe at build time
  const toolPages = Object.keys(toolMeta).map((id) => ({
    url: `${baseUrl}/tools/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...playPages, ...otherPages, ...toolPages];
}
