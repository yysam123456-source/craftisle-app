import { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

// Static routes
const staticRoutes = [
  "/",
  "/games",
  "/tools",
  "/directory",
  "/blog",
  "/play/island-builder",
  "/play/tiny-world-builder",
];

// Dynamic tool routes - read from filesystem
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
  const baseUrl = "https://craftisle.com";
  const now = new Date();

  // Static pages
  const staticPages = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: (route === "/" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route === "/" ? 1.0 : 0.8,
  }));

  // Tool pages
  const toolRoutes = getToolRoutes();
  const toolPages = toolRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...toolPages];
}
