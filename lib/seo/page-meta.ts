/**
 * 集中式 SEO 元数据注册表（自动优化器的唯一可信源）
 * ───────────────────────────────────────────────
 * 当前值均提取自各页面真实 export const metadata（见各 page.tsx / META_RECOMMENDATIONS），
 * 不编造。自动优化器基于 gap 分析生成的 title/description 改写，会回写到本文件，
 * 相关页面改为从本注册表读取（见 optimizer.ts 的 apply 与脚本）。
 *
 * 字段：
 *   route        页面路由（与 Next.js app 路由对应）
 *   title        当前标题（真实）
 *   description  当前描述（真实）
 *   provenance   "verified"（已从页面提取）| "recommended"（来自 META_RECOMMENDATIONS 建议值）
 *                | "generated"（被自动优化器改写过，已偏离原始页面 export 值）
 *   lastOptimized 上次被优化器改写的时间（ISO），未改写则 null
 */

export interface PageMeta {
  route: string;
  title: string;
  description: string;
  provenance: "verified" | "recommended" | "generated";
  lastOptimized: string | null;
}

export const PAGE_META: Record<string, PageMeta> = {
  "/tools": {
    route: "/tools",
    title: "Free MS Project, Google Workspace & IntelliJ Alternatives + 160 Tools | Craftisle",
    description:
      "Looking for free MS Project, Google Workspace, or IntelliJ alternatives? Craftisle offers 160+ free browser-based tools — project planners, office & PDF utilities, dev tools, AI image editors, regex testers. No signup, no download, 100% client-side and private.",
    provenance: "verified",
    lastOptimized: null,
  },
  "/tools/craftisle-dev-tools": {
    route: "/tools/craftisle-dev-tools",
    title: "Craftisle Developer Tools — Free Online JSON, Regex, Cron & Code Utilities",
    description:
      "Free browser-based developer tools: JSON/SQL/YAML/HTML formatters, regex tester & visualizer, cron generator, JWT decoder, Base64. No install, runs 100% client-side.",
    provenance: "verified",
    lastOptimized: null,
  },
  "/tools/craftisle-image-tools": {
    route: "/tools/craftisle-image-tools",
    title: "Craftisle Image Tools — Free Online Image Editor, Compressor & AI Background Remover",
    description:
      "Edit images free in your browser: compress, upscale, crop, convert, remove background, manipulate SVG. No upload to server, no signup. 100% client-side privacy.",
    provenance: "verified",
    lastOptimized: null,
  },
  "/about/craftisle-vs-craft-island": {
    route: "/about/craftisle-vs-craft-island",
    title: "Craftisle vs Craft Island — We're a Free Tools Site, Not a Game",
    description:
      "Craftisle.com is a free online tools platform (image, PDF, dev utilities) — NOT the Craft Island game. See the difference and browse 160+ free browser-based tools, no signup required.",
    provenance: "verified",
    lastOptimized: null,
  },
  "/": {
    route: "/",
    title: "Craftisle — Free Software Directory & Online Tools",
    description:
      "Search 16,000+ free & open-source software. Find alternatives, compare tools. Plus: use 100+ online tools.",
    provenance: "verified",
    lastOptimized: null,
  },
};

export function getPageMeta(route: string): PageMeta | undefined {
  return PAGE_META[route];
}
