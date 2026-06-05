import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── 通用爬虫 ──────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/private/"],
      },
      // ── AI 爬虫：允许抓取（GEO 优化）───
      {
        userAgent: "GPTBot",
        allow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
      },
      {
        userAgent: "anthropic-ai",
        allow: "/",
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
      },
      // ── 禁止非友好爬虫（可选）───
      // {
      //   userAgent: "CCBot",
      //   disallow: "/",
      // },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
