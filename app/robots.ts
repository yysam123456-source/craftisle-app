import { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

// 🔴🔴 robots 分组语义（Google 官方规则，2026-11-04 核实）：
//   "Only one group is valid for a particular crawler... Other groups are ignored."
//   "User agent specific groups and global groups (*) are not combined."
//   ⇒ 命中具名 AI 组的爬虫**完全忽略** `*` 组，disallow 必须在每组重复一遍。
//   11-04 线上读回发现主站 6 个 AI 组只有 `Allow: /`，等于放行
//   /api/ /admin/ /dashboard/ 等受保护路由（crawl budget 泄漏 + 潜在暴露）。
//   修法：ALLOW / DISALLOW 抽成常量，每个组都用同一份，杜绝再次回归。
//
// AI 爬虫清单（按官方文档逐个核对）：
//   · OAI-SearchBot —— OpenAI 官方：ChatGPT Search 结果/搜索回答的收录与退出，
//     是「被 ChatGPT 引用」的关键 bot；此前 8 站全部漏声明。
//   · GPTBot —— OpenAI 官方：模型训练内容抓取，与 OAI-SearchBot 是独立设置。
//   · ChatGPT-User —— OpenAI 官方：用户触发的页面访问，非自动爬取；
//     保留具名组仅为日志可审计，不用于决定是否进 Search。
//   · ClaudeBot / Claude-SearchBot / anthropic-ai —— Anthropic 训练与检索。
//   · PerplexityBot / Perplexity-User —— Perplexity 索引与检索。
//   · Google-Extended —— Google 生成式 AI 训练退出开关（不影响 Googlebot 收录）。
//   · CCBot —— Common Crawl，多个 LLM 训练语料来源，显式声明便于日志归类。
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "CCBot",
];

// these routes really exist (app/(protected)/dashboard/**, app/(auth)/login|register,
// app/(protected)/admin/**); blocking them cannot hurt normal pages. /private/ is defense in depth.
// NOTE: /_next/ must stay allowed: it serves hashed CSS/JS needed to render pages.
const ALLOW = ["/"];
const DISALLOW = [
  "/api/",
  "/admin/",
  "/dashboard/",
  "/login",
  "/register",
  "/private/",
];

// 🔴 SEO-audit crawler block (2026-11-27, invalid-traffic governance).
// Cloudflare edge 30d (10-12..11-10, craftisle.com): seo_tool = 16,462 visits of
// 33,773 bot visits (48.7%), of which SemrushBot alone = 14,150 (41.9% of all bots).
// These bots crawl but never convert/click; they only inflate the bot/human ratio
// (bot 56.4% overall) that AdSense weighs as traffic-quality signal.
// They are compliant crawlers and honour robots.txt -> Disallow: / stops them.
// 🔴 robots group semantics (see top comment): a named group IGNORES the "*" group,
//   so each of these gets its own Disallow: / (do NOT rely on the "*" rules).
// 🔴 NEVER add here: Googlebot / bingbot / Applebot / Baiduspider / YandexBot
//   (search indexing) or OAI-SearchBot / ChatGPT-User / PerplexityBot / ClaudeBot
//   (GEO visibility). Note OAI-SearchBot was mis-bucketed under other_bot in the
//   CF report -- it is valuable and stays allowed via its own group above.
const SEO_TOOL_AGENTS = [
  "SemrushBot", // matches SemrushBot-OCOB / -SA / -BA via substring match
  "AhrefsBot",
  "MJ12bot", // Majestic
  "DotBot", // Moz
  "PetalBot", // Huawei SEO crawler
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      ...AI_AGENTS.map((userAgent) => ({
        userAgent,
        allow: ALLOW,
        disallow: DISALLOW,
      })),
      // named group with a bare Disallow: / -> fully blocked for these SEO bots
      ...SEO_TOOL_AGENTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
