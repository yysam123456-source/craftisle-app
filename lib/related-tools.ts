// 相关工具配置文件
// 为每个工具定义3-5个相关工具，用于交叉链接
// 兜底：无手配条目时，按「同分类」自动取同分类兄弟工具，保证每个工具页都有互链聚类（孤儿页铁律）

import type { ToolMeta } from "@/lib/tools";
import { toolMeta } from "@/lib/tools";
import { imageToolIds } from "@/lib/image-tools/ids";

// 构建 分类 -> 工具id[] 映射（用于无手配时的兜底互链）
const ALL_TOOL_IDS = Array.from(
  new Set([...Object.keys(toolMeta), ...imageToolIds])
);
const CATEGORY_TOOLS: Record<string, string[]> = {};
for (const id of ALL_TOOL_IDS) {
  const cat = toolMeta[id]?.category;
  if (!cat) continue;
  (CATEGORY_TOOLS[cat] ||= []).push(id);
}

export const RELATED_TOOLS: Record<string, string[]> = {
  // 图片工具
  "image-compress": ["image-resize", "image-convert", "image-crop", "image-watermark"],
  "image-resize": ["image-compress", "image-crop", "image-convert", "image-border"],
  "image-convert": ["image-compress", "image-resize", "image-watermark", "image-border"],
  "image-crop": ["image-resize", "image-compress", "image-border", "image-watermark"],
  
  // PDF工具
  "pdf-merge": ["pdf-split", "pdf-compress", "pdf-organize", "pdf-extract-pages"],
  "pdf-split": ["pdf-merge", "pdf-extract-pages", "pdf-organize", "pdf-compress"],
  "pdf-compress": ["pdf-merge", "pdf-split", "pdf-organize", "pdf-ocr"],
  
  // 开发工具
  "json-formatter": ["json-validator", "json-to-csv", "sql-formatter", "html-formatter"],
  "regex": ["json-formatter", "base64", "hash-text", "sql-formatter"],
  "base64": ["base64-file", "hash-text", "regex", "json-formatter"],
  "hash-text": ["hash-file", "base64", "base64-file", "regex"],
  
  // 文本工具
  "case-converter": ["text-diff", "text-counter", "markdown-editor", "html-formatter"],
  "text-diff": ["text-counter", "case-converter", "markdown-editor", "json-formatter"],
  "markdown-editor": ["markdown-to-html", "case-converter", "text-diff", "html-formatter"],
  
  // 二维码和工具
  "qrcode": ["barcode-generator", "color-picker", "json-formatter", "regex"],

  // 🔴 2026-10-15：显式给 4 个新工具安排入站宿主。
  // getRelatedTools 的兜底用同分类兄弟 + .slice(0, 6)，而新工具追加在
  // toolMeta 末尾 ⇒ 排在 slice 之外 ⇒ 没有任何页面链到它们 = 孤儿页。
  // 所以这里不是「给新工具配 relatedTools」，而是**给老工具配新工具**——
  // 内链是有向的，A 的 relatedTools 里出现 B，才是 B 的入站。
  "counter": ["typing-test", "text-formatter", "hidden-character-detector"],
  "text-formatter": ["typing-test", "counter", "html-visual-editor"],
  "color-picker": ["signature-maker", "color-contrast", "gradient-generator"],

  // html-visual-editor 同时是 css-minifier / meta-tags-generator 的入站宿主
  "html-visual-editor": ["css-minifier", "meta-tags-generator", "escape-json"],
  "escape-json": ["css-minifier", "meta-tags-generator", "html-visual-editor"],
};

/**
 * 取某工具的互链工具列表。
 * 1) 优先使用手配的 RELATED_TOOLS（精选 3-5 个，意图最准）；
 * 2) 无手配时，回退到「同分类兄弟工具」（最多 limit 个），保证每个工具页都有互链聚类，
 *    避免 149/164 工具页长期零互链、丧失内链权威传递。
 */
export function getRelatedTools(toolId: string, limit = 6): string[] {
  const manual = RELATED_TOOLS[toolId];
  if (manual && manual.length > 0) return manual;

  const cat = toolMeta[toolId]?.category;
  if (!cat) return [];
  return (CATEGORY_TOOLS[cat] || [])
    .filter((id) => id !== toolId)
    .slice(0, limit);
}
