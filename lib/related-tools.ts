// 相关工具配置文件
// 为每个工具定义3-5个相关工具，用于交叉链接

import type { ToolMeta } from "@/lib/tools";

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
};

export function getRelatedTools(toolId: string): string[] {
  return RELATED_TOOLS[toolId] || [];
}
