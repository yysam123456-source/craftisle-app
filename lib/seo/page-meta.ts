/**
 * 集中式 SEO 元数据注册表（自动优化器的唯一静态可信源）
 * ───────────────────────────────────────────────
 * 当前值均提取自各页面真实 export const metadata（见各 page.tsx / META_RECOMMENDATIONS），
 * 不编造。
 *
 * 自动优化器基于 gap 分析生成的 title/description 改写，不再回写本文件（那样需要
 * GitHub PAT 且 Vercel 的 GSC 密钥不可导出），而是写入 Postgres 覆盖层
 * （见 page-meta-db.ts）。本文件的 `PAGE_META` 是一个 Proxy：页面照常读取
 * `PAGE_META[route].title`，它会自动叠加数据库里的优化覆盖值；DB 不可用时回退静态值。
 *
 * 字段：
 *   route        页面路由（与 Next.js app 路由对应）
 *   title        当前标题（真实）
 *   description  当前描述（真实）
 *   provenance   "verified"（已从页面提取）| "recommended"（来自 META_RECOMMENDATIONS 建议值）
 *                | "generated"（被自动优化器改写过，已偏离原始页面 export 值）
 *   lastOptimized 上次被优化器改写的时间（ISO），未改写则 null
 */

import { getOverride } from "./page-meta-db";

export interface PageMeta {
  route: string;
  title: string;
  description: string;
  provenance: "verified" | "recommended" | "generated";
  lastOptimized: string | null;
}

export const PAGE_META_BASE: Record<string, PageMeta> = {
  "/tools": {
    route: "/tools",
    title: "Free MS Project, Google Workspace & IntelliJ Alternatives + 160 Tools",
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
    title: "Craftisle — 16,000+ Free Tools & Open-Source Software Directory",
    description:
      "Browse 16,000+ free & open-source tools across 200+ categories. Find the best free alternatives to paid software, compare options, and use 100+ online tools — no signup, ever.",
    provenance: "verified",
    lastOptimized: "2026-08-19",
  },
};

export function getPageMeta(route: string): PageMeta | undefined {
  return getResolvedMeta(route);
}

/**
 * PAGE_META 是 PAGE_META_BASE 的 Proxy：读取某路由时自动叠加数据库覆盖层
 * （自动优化器写入的标题/描述）。覆盖层加载失败或为空时，行为与静态注册表一致。
 * 页面无需任何改动即可获得优化后的元数据。
 */
export const PAGE_META: Record<string, PageMeta> = new Proxy(PAGE_META_BASE, {
  get(target, prop, receiver) {
    if (typeof prop === "symbol") return Reflect.get(target, prop, receiver);
    const key = String(prop);
    const base = target[key];
    if (!base) return Reflect.get(target, prop, receiver);
    const ov = getOverride(key);
    if (!ov) return base;
    return {
      ...base,
      ...(ov.title !== undefined ? { title: ov.title } : {}),
      ...(ov.description !== undefined ? { description: ov.description } : {}),
      provenance: ov.provenance,
      lastOptimized: ov.lastOptimized,
    };
  },
  ownKeys(target) {
    return Reflect.ownKeys(target);
  },
  getOwnPropertyDescriptor(target, prop) {
    return Reflect.getOwnPropertyDescriptor(target, prop);
  },
  has(target, prop) {
    return prop in target;
  },
});

/** 解析某路由的最终元数据（静态 + 数据库覆盖）。 */
export function getResolvedMeta(route: string): PageMeta | undefined {
  return (PAGE_META as Record<string, PageMeta>)[route];
}
