/**
 * 标题/描述优化建议（section 4「转化」维度）
 *
 * 数据来源：craftisle.com GSC 真实 Top 词（快照 2026-08-17）。
 * 现状：Top 词几乎全是「X alternative / X 替代品」类高意图对比查询，
 *       但全站 CTR ≈ 0%（avgPosition 52、展示 601、点击 1）。
 * 思路：把用户真实在搜的「替代品」意图写进页面 title/description，
 *       提升搜索结果点击率（CTR）。
 *
 * 已落地：/tools 目录页（见 app/tools/page.tsx）。
 * 本文件为其余高价值页面的可套用建议 + 原始数据，供逐个落地。
 */

export interface MetaRecommendation {
  /** 目标路由 */
  route: string;
  /** 命中该页的真实 GSC 查询词（节选） */
  matchedQueries: string[];
  /** 建议标题 */
  title: string;
  /** 建议描述 */
  description: string;
}

export const META_RECOMMENDATIONS: MetaRecommendation[] = [
  {
    route: "/tools",
    matchedQueries: [
      "ms project alternative",
      "microsoft project alternative",
      "google workspace alternative",
      "g suite alternatives free",
      "intellij community edition",
    ],
    title: "Free MS Project, Google Workspace & IntelliJ Alternatives + 160 Tools | Craftisle",
    description:
      "Looking for free MS Project, Google Workspace, or IntelliJ alternatives? Craftisle offers 160+ free browser-based tools — project planners, office & PDF utilities, dev tools, AI image editors. No signup, no download, 100% client-side and private.",
  },
  {
    route: "/tools/craftisle-dev-tools",
    matchedQueries: ["intellij community", "intellij idea community edition", "idea community edition", "intellij version"],
    title: "Free IntelliJ & IDE Alternatives — Online Dev Tools | Craftisle",
    description:
      "Need a free IntelliJ / IDE alternative? Use Craftisle's browser-based developer tools — code formatters, regex testers, Base64, hash, JSON/SQL converters. No install, runs 100% in your browser.",
  },
  {
    route: "/tools/craftisle-image-tools",
    matchedQueries: ["svg manipulation", "image compress", "image upscale", "ai background remover"],
    title: "Free Image Tools — Compress, Upscale, SVG Edit & BG Remover | Craftisle",
    description:
      "Edit images free in your browser: compress, upscale, crop, convert, remove background, manipulate SVG. No upload to server, no signup. 100% client-side privacy.",
  },
  {
    route: "/about/craftisle-vs-craft-island",
    matchedQueries: ["mykonos island voxels", "craftisle vs craft island"],
    title: "Craftisle vs Craft Island — Free Tools Site, Not a Game | Craftisle",
    description:
      "Craftisle.com is a free online tools platform (image, PDF, dev utilities) — NOT the Craft Island game. See the difference and browse 160+ free browser-based tools, no signup required.",
  },
];

/** 原始真实 Top 词（按展示排序，节选 20 条，用于人工核对） */
export const TOP_QUERIES_SNAPSHOT_2026_08_17: Array<{ query: string; impressions: number; position: number; ctr: number }> = [
  { query: "intellij idea community edition", impressions: 23, position: 39.5, ctr: 0 },
  { query: "intellij community edition", impressions: 16, position: 48.5, ctr: 0 },
  { query: "svg manipulation", impressions: 15, position: 92.2, ctr: 0 },
  { query: "intellij community", impressions: 14, position: 63.1, ctr: 0 },
  { query: "pokeapi", impressions: 14, position: 69.3, ctr: 0 },
  { query: "mykonos island voxels", impressions: 12, position: 4.8, ctr: 0 },
  { query: "is intellij no longer free?", impressions: 11, position: 37.9, ctr: 0 },
  { query: "alternative ms project", impressions: 10, position: 29.1, ctr: 0 },
  { query: "microsoft project alternative free", impressions: 8, position: 34, ctr: 0 },
  { query: "g suite alternatives free", impressions: 8, position: 17.6, ctr: 0 },
  { query: "free ms project alternative", impressions: 8, position: 21.1, ctr: 0 },
  { query: "google workspace free alternative", impressions: 8, position: 20.3, ctr: 0 },
  { query: "free project management software like ms project to create schedule", impressions: 8, position: 17.3, ctr: 0 },
  { query: "boona13/mykonos-island-voxels", impressions: 8, position: 10.8, ctr: 0 },
  { query: "microsoft project alternative", impressions: 7, position: 22.1, ctr: 0 },
  { query: "tableau vs powershell", impressions: 7, position: 213.4, ctr: 0 },
  { query: "rest countries", impressions: 7, position: 57.6, ctr: 0 },
  { query: "ms project online alternative", impressions: 7, position: 96.9, ctr: 0 },
  { query: "google workspace alternatives free", impressions: 6, position: 18.5, ctr: 0 },
  { query: "convertir pdf a excel", impressions: 5, position: 100.8, ctr: 0.2 },
];
