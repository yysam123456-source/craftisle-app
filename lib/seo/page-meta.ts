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

import { getOverride, getOverrideAsync } from "./page-meta-db";

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
 * 🔴 DEBT-25 修复：把静态基值与 DB 覆盖层的合并逻辑抽成一个纯函数，
 * 供「同步 Proxy」与「异步解析」两条路径共用。
 */
function mergeOverride(base: PageMeta, ov: { title?: string; description?: string; provenance: PageMeta["provenance"]; lastOptimized: string } | undefined): PageMeta {
  if (!ov) return base;
  return {
    ...base,
    ...(ov.title !== undefined ? { title: ov.title } : {}),
    ...(ov.description !== undefined ? { description: ov.description } : {}),
    provenance: ov.provenance,
    lastOptimized: ov.lastOptimized,
  };
}

/**
 * ✅ **这是页面该用的入口**：确保覆盖层已加载后再解析。
 *
 * 🔴 为什么不直接用 PAGE_META（Proxy）：
 * Proxy 的 `get` trap 是**同步**的，而 `refreshOverrides()` 是 async。
 * 同步读在冷缓存下**必然返回 undefined** —— refresh 还在飞，本次请求已经错过它，
 * 于是静默回退静态值（page-meta-db.ts:96-107 早已写明这个失效模式）。
 * 实测复刻该时序：冷缓存 `getOverride("/")` → undefined。
 *
 * 而且 Proxy **无法**改成 async：trap 返回 Promise 时，调用方拿到的是
 * Promise 对象本身，`title: PAGE_META[x].title` 会变成undefined/报错。
 * （已用 Node 实测确认该语义。）所以只能另开一条显式 async 路径。
 *
 * ⚠️ 另一个独立的失效层（与同步读无关，必须一起修）：
 * `export const metadata = { title: PAGE_META["/"].title }` 是**构建期常量**，
 * 在 build 时就把值烤进静态 HTML ⇒ 即便覆盖层完全正常，运行时也永远不会变。
 * 消费页面必须改成 `generateMetadata` 才能吃到覆盖层。
 */
export async function getResolvedMetaAsync(route: string): Promise<PageMeta | undefined> {
  const base = PAGE_META_BASE[route];
  if (!base) return undefined;
  const ov = await getOverrideAsync(route);
  return mergeOverride(base, ov);
}

/** 同上，但接受一组路由，返回 Map（便于一次刷多个路由的 meta）。 */
export async function getResolvedMetaBatch(
  routes: string[],
): Promise<Map<string, PageMeta>> {
  const out = new Map<string, PageMeta>();
  await Promise.all(
    routes.map(async (route) => {
      const m = await getResolvedMetaAsync(route);
      if (m) out.set(route, m);
    }),
  );
  return out;
}

/**
 * ⚠️ 保留 Proxy 仅供**构建期/非 async 上下文**兼容使用。
 *
 * 🔴 它在冷缓存下必然读不到覆盖层（见上方说明），因此：
 *   - **不要**在 `generateMetadata` 里用它；
 *   - 请改用 `getResolvedMetaAsync()`。
 * 之所以保留，是因为 optimizer / auto-optimize / ai-briefing 等只读静态基值，
 * 用 `PAGE_META_BASE` 即可，不必引入 async；而少数遗留调用点仍按Record 形态访问它。
 * 保留 Proxy 也避免了一次性改动 10 个消费点造成的回归风险。
 */
export const PAGE_META: Record<string, PageMeta> = new Proxy(PAGE_META_BASE, {
  get(target, prop, receiver) {
    if (typeof prop === "symbol") return Reflect.get(target, prop, receiver);
    const key = String(prop);
    const base = target[key];
    if (!base) return Reflect.get(target, prop, receiver);
    // 🔴 同步读：冷缓存下这里恒为 undefined，属已知降级（见上方注释）。
    // 保持行为不变以免影响既有调用点，但**不要**把它当作能读到覆盖层的通道。
    const ov = getOverride(key);
    return mergeOverride(base, ov);
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

/** 解析某路由的最终元数据（静态 + 数据库覆盖）。⚠️ 同步，见上方警告。 */
export function getResolvedMeta(route: string): PageMeta | undefined {
  return (PAGE_META as Record<string, PageMeta>)[route];
}
