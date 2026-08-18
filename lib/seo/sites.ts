/**
 * 受监测的 8 个站点清单（craftisle 主站 + 7 个子站）
 *
 * 数据来源：craftisle-app/components/home/featured-sites.tsx 的 SUB_SITES 列表。
 * 扩展性：新加子站只需在此数组追加 + 在 GSC/Cloudflare 放行（无需新增 GSC property，
 *       因 GSC 用的是 Domain property `sc-domain:craftisle.com`，按 page 维度拆分即可）。
 */

export interface SiteConfig {
  slug: string;
  name: string;
  host: string;
  color: string;
  description: string;
}

export const SITES: SiteConfig[] = [
  { slug: "craftisle",  name: "Craftisle (Main)",       host: "craftisle.com",       color: "#336EE8", description: "主站：160+ 通用工具入口" },
  { slug: "pdf",        name: "PDF Tools",              host: "pdf.craftisle.com",   color: "#ef4444", description: "PDF 合并 / 拆分 / 转换 / 压缩" },
  { slug: "resume",     name: "Resume Builder",         host: "resume.craftisle.com",color: "#3b82f6", description: "ATS 简历生成器 + AI 优化建议" },
  { slug: "viewer",     name: "File Viewer",            host: "viewer.craftisle.com",color: "#22c55e", description: "在线预览 100+ 文件格式" },
  { slug: "whiteboard", name: "Online Whiteboard",      host: "draw.craftisle.com",  color: "#06b6d4", description: "实时协作白板 / 视频通话集成" },
  { slug: "imgprompt",  name: "Image Prompt",           host: "imgprompt.craftisle.com", color: "#d946ef", description: "AI 图像提示词生成与优化（Midjourney / DALL-E / SD）" },
  { slug: "games",      name: "Games",                  host: "game.craftisle.com",  color: "#10b981", description: "13+ 免费浏览器游戏" },
  { slug: "fxlab",      name: "FX Lab",                 host: "fxlab.craftisle.com", color: "#f59e0b", description: "前端代码工具集（格式化 / 正则 / CSS 生成）" },
];

/** host → slug 映射（含 www. 前缀兼容） */
const HOST_TO_SLUG = new Map<string, string>();
for (const s of SITES) {
  HOST_TO_SLUG.set(s.host, s.slug);
  if (s.host === "craftisle.com") HOST_TO_SLUG.set("www.craftisle.com", s.slug);
}

/** 从 GSC page 维度 URL 中提取主机名并匹配站点 slug；未识别返回 null */
export function resolveSiteSlug(pageUrl: string): string | null {
  try {
    const u = new URL(pageUrl);
    return HOST_TO_SLUG.get(u.hostname.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

/** 拿站点配置 */
export function getSiteBySlug(slug: string): SiteConfig | null {
  return SITES.find((s) => s.slug === slug) ?? null;
}