/**
 * B1 分类聚合页 → 替代品页的内链映射
 * ───────────────────────────────────────────────
 * 目的：/directory/alternatives/* 有 147 个厚重页面（5.8k–8.7k 词），但长期
 * 缺少内链入口（此前 125 个甚至不在 sitemap）。B1 分类页是天然的内链来源。
 *
 * 原则：
 *   1. 只放**语义真实相关**的映射 —— 弱相关的分类（json / time / formatter）
 *      宁可不加，不为链接而链接。
 *   2. 链接 slug 用 toSlug() 运行时生成，并对照 getAllAlternativeSlugs() 校验，
 *      不存在的条目自动跳过 —— 杜绝 404；将来条目改名，链接自动降级而不是烂掉。
 */

import { toSlug, getAllAlternativeSlugs } from "@/lib/alternatives";
import type { LandingLink } from "./landing-pages";

/** 付费工具名（保持与 alternatives 条目一致的写法）→ 所属 B1 分类键 */
export const CATEGORY_ALTERNATIVES: Record<string, string[]> = {
  // 开发环境与工作流
  dev: [
    "JetBrains IntelliJ IDEA",
    "GitHub Copilot",
    "Sublime Text",
    "Docker Desktop",
    "Bitbucket",
    "Kubernetes (Managed)",
  ],
  // 图像编辑与设计
  image: [
    "Adobe Photoshop",
    "Adobe Illustrator",
    "Affinity Photo",
    "CorelDRAW",
    "Canva Pro",
    "Procreate",
  ],
  // 写作与笔记（文本工具的用户群与笔记/写作工具高度重叠）
  text: ["Grammarly", "Notion (Paid Tier)", "Obsidian Premium", "Evernote"],
  // 系统与效率（压缩 / 下载 / 清理 / 远程）
  utility: [
    "WinRAR",
    "IDM (Internet Download Manager)",
    "CleanMyMac",
    "TeamViewer",
  ],
  // 密码管理器本身就是加密应用；VPN 是流量加密
  encryption: ["1Password", "Bitwarden Premium", "LastPass", "ExpressVPN"],
  // VPN / 远程桌面的核心都是网络链路
  network: ["ExpressVPN", "NordVPN", "Surfshark", "TeamViewer"],
  // AI 生成器
  generator: ["ChatGPT", "Midjourney", "GitHub Copilot"],
  // 文档→PDF 与压缩格式（该分类下仅这两条有诚实的相关性）
  converter: ["Adobe Acrobat Pro", "WinRAR"],
  // json / time / formatter：无足够语义相关性，刻意不加
};

/** 生成某分类的替代品内链；只输出真实存在的条目，杜绝 404 */
export function buildAlternativeLinks(categoryKey: string): LandingLink[] {
  const names = CATEGORY_ALTERNATIVES[categoryKey] ?? [];
  if (names.length === 0) return [];
  const valid = new Set(getAllAlternativeSlugs());
  const out: LandingLink[] = [];
  for (const name of names) {
    const slug = toSlug(name);
    if (!valid.has(slug)) {
      console.warn(`[alternative-links] 跳过不存在的替代品条目: "${name}" (slug: ${slug})`);
      continue;
    }
    // 锚文本去掉 "(Paid Tier)" 这类限定词，slug 匹配仍用原始全名
    const displayName = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
    out.push({
      label: `${displayName} alternatives`,
      href: `/directory/alternatives/${slug}`,
    });
  }
  return out;
}
