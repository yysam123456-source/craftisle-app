import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── 通用爬虫 ──────────────────────────────────
      {
        userAgent: "*",
        allow: "/",
        // 🔴 合并 public/robots.txt 的规则。Next.js 中 app/robots.ts **优先于**
        // public/robots.txt，后者是死代码（已删除，见提交说明）。此前两份配置不一致：
        // 生效的 app/robots.ts 只禁 /api/ /admin/ /private/，漏掉了下面这三条，
        // 导致登录/注册/仪表盘这类无 SEO 价值的薄页面被爬虫抓取、浪费 crawl budget。
        //
        // 已核实这些路由**真实存在**，禁掉不会误伤正常页面：
        //   /dashboard/ → app/(protected)/dashboard/**
        //   /login      → app/(auth)/login/page.tsx
        //   /register   → app/(auth)/register/page.tsx
        //   /admin/     → app/(protected)/admin/**（已存在）
        // 注意 /private/ 在 app/ 下并不存在，保留为纵深防御（成本为零）。
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/login",
          "/register",
          "/private/",
        ],
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
