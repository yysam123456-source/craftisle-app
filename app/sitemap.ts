import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

const baseUrl = "https://craftisle.com";
const now = new Date();

const staticRoutes = [
  { url: "/", priority: 1.0, changeFreq: "daily" as const },
  { url: "/games", priority: 0.8, changeFreq: "weekly" as const },
  { url: "/tools", priority: 0.8, changeFreq: "weekly" as const },
  { url: "/directory", priority: 0.7, changeFreq: "weekly" as const },
  { url: "/blog", priority: 0.7, changeFreq: "weekly" as const },
];

const playRoutes = [
  { url: "/play/island-builder", priority: 0.8, changeFreq: "monthly" as const },
  { url: "/play/tiny-world-builder", priority: 0.8, changeFreq: "monthly" as const },
];

function getToolRoutes(): string[] {
  try {
    const toolsPath = path.join(process.cwd(), "app/(marketing)/tools");
    const dirs = fs.readdirSync(toolsPath, { withFileTypes: true });
    return dirs
      .filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith("."))
      .map((d) => `/tools/${d.name}`);
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = staticRoutes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const playPages = playRoutes.map((r) => ({
    url: `${baseUrl}${r.url}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const toolPages = getToolRoutes().map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...playPages, ...toolPages];
}
