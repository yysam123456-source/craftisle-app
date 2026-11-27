/**
 * buildBreadcrumbJsonLd —— 从页面已有的可见面包屑生成 BreadcrumbList 结构化数据。
 *
 * 2026-11-27 新增，起因 audit:schema 报 5 类主战场页面全缺 BreadcrumbList
 * （替代页 / 落地页 / 对比页 / 分类页 / 工具页），而 audit:schema 是 CI 阻断层。
 *
 * 设计原则：
 *   1. **schema 必须与可见面包屑一致**：只描述页面真实渲染的导航层级，
 *      不为了 schema 凭空造导航。没有可见面包屑的页面（如 /l/*）不调用本函数。
 *   2. **统一 BASE_URL**：硬编码 https://craftisle.com，与 alternatives 页 baseUrl 一致。
 *      🔴 不用 config/site.ts 的 siteConfig.url —— 它在构建期读 env，CI/预构建可能
 *      拿到非生产值；而 schema 里的 URL 必须是规范域名。
 *   3. **末级 item 可省略**：Google 对 BreadcrumbList 最后一项（当前页）的 `item`
 *      不强制；传 undefined 时不输出该字段，避免与 canonical 冲突。
 */
const BASE_URL = "https://craftisle.com";

export interface Crumb {
  name: string;
  path: string; // 以 / 开头；末级传当前路径
}

export function buildBreadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${BASE_URL}${c.path}`,
    })),
  };
}

/** 常用前缀：首页 → 目录。主战场绝大多数页面的前两级面包屑。 */
export function directoryCrumbs(): Crumb[] {
  return [
    { name: "Home", path: "/" },
    { name: "Directory", path: "/directory" },
  ];
}
