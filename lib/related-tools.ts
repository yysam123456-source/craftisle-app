// 相关工具配置文件
// 为每个工具定义互链工具，用于交叉链接
// 兜底：无手配条目时，按「同分类」自动取同分类兄弟工具，保证每个工具页都有互链聚类（孤儿页铁律）
//
// 🔴 2026-10-16 两处修复（均由 scripts/audit-related-tools.mjs 断言守护）：
//
// DEBT-18：原 RELATED_TOOLS 里有 25 个引用指向 toolMeta 中不存在的 slug
//   （pdf-split / hash-text / markdown-editor / barcode-generator …）。而
//   app/tools/[tool]/page.tsx 设了 dynamicParams=false 且直查 toolMeta 后 notFound()
//   ⇒ 这些 URL 全部 404。另有 6 个 key（pdf-merge / pdf-split / pdf-compress /
//   hash-text / text-diff / markdown-editor）本身就���在 toolMeta 里 —— 它们从来没被渲染过，
//   所以这些死链此前从未暴露。已改指真实 slug 或整条删除。
//
// DEBT-17：getRelatedTools() 曾是死代码 —— ToolDetailLayout 声明并解构了
//   relatedTools prop 却从未使用；真正渲染互链的是 ToolDetailSections 读 meta.relatedTools。
//   兜底（同分类 slice）因此从未产生任何内链。现由 ToolDetailSections 调用
//   mergeRelatedTools()，合并 meta.relatedTools（精选，优先）与兜底（补位）。

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
  // ── 图片工具 ──────────────────────────────────────────────────────────
  "image-compress": ["image-resize", "image-convert", "image-crop", "image-watermark"],
  // 兼作 image-generate-memes 的入站宿主
  "image-resize": [
    "image-compress",
    "image-crop",
    "image-convert",
    "image-border",
    "image-generate-memes",
  ],
  // 兼作 ai-image-editor 的入站宿主
  "image-convert": [
    "image-compress",
    "image-resize",
    "image-watermark",
    "image-border",
    "ai-image-editor",
  ],
  // 兼作 image-beautify-screenshots 的入站宿主
  "image-border": [
    "image-resize",
    "image-crop",
    "image-watermark",
    "image-color-adjust",
    "image-beautify-screenshots",
  ],
  // 兼作 find-duplicates 的入站宿主
  "image-favicon": [
    "image-resize",
    "image-border",
    "find-duplicates",
    "image-color-palette",
  ],

  // ── 开发 / JSON 工具 ──────────────────────────────────────────────────
  "json-formatter": ["json-validator", "json-to-csv", "sql-formatter", "html-formatter"],
  // 原 hash-text（不存在）→ regex-vis：同为正则工具，语义最近
  "regex": ["json-formatter", "base64", "regex-vis", "sql-formatter"],
  // 原 base64-file / hash-text（均不存在）→ image-base64 / hash（编码·加密族）
  "base64": ["image-base64", "hash", "regex", "json-formatter"],
  // 兼作 arithmetic-sequence / text-compare 的入站宿主
  "regex-vis": ["regex", "json-formatter", "color-picker", "extract-substring", "text-compare"],
  "text-replacer": ["text-compare", "extract-substring", "arithmetic-sequence"],
  // 兼作 gitignore-generator / morse-code 的入站宿主
  "curl-to-code": ["http-status", "regex", "gitignore-generator", "morse-code"],
  "http-status": ["curl-to-code", "gitignore-generator", "user-agent"],
  // 兼作 csv-rows-to-columns / find-incomplete-csv 的入站宿主
  "insert-csv-column": ["csv-rows-to-columns", "find-incomplete-csv", "transpose-csv"],
  "swap-csv-columns": ["csv-rows-to-columns", "transpose-csv", "insert-csv-column"],
  "mermaid": ["markdown", "html-visual-editor", "group-lines"],

  // ── 文本工具 ─────────────────────────────────────────────────────────
  // 原 text-diff / text-counter / markdown-editor（均不存在）→ diff / string-statistic / markdown
  "case-converter": [
    "diff",
    "string-statistic",
    "markdown",
    "html-formatter",
    "string-randomize-case",
  ],
  // 兼作 slug-generator 的入站宿主
  "string-statistic": ["text-formatter", "case-converter", "diff", "slug-generator"],
  // 兼作 string-rotate / string-truncate 的入站宿主
  "string-reverse": [
    "text-formatter",
    "case-converter",
    "string-statistic",
    "string-rotate",
    "string-truncate",
  ],
  // 兼作 find-popular 的入站宿主
  "diff": ["text-formatter", "regex", "json-formatter", "find-popular"],
  // 兼作 truncate-lines / unwrap-lines 的入站宿主
  "wrap-lines": ["truncate-lines", "unwrap-lines", "reverse-lines", "sort-lines"],
  // 兼作 censor 的入站宿主
  "rot13": ["string-reverse", "unicode", "string-rotate", "censor"],
  // 兼作 palindrome 的入站宿主
  "unicode": ["text-formatter", "case-converter", "base64", "palindrome"],
  // 兼作 group-lines 的入站宿主
  "sort-lines": ["find-popular", "truncate-lines", "unwrap-lines", "group-lines"],
  "markdown": ["html-formatter", "text-formatter", "case-converter", "mermaid"],
  // 兼作 quote 的入站宿主（趣味文本生成同族）
  "ascii-art": ["barcode", "qrcode", "text-formatter", "random-string", "quote"],

  // ── 二维码 / 生成器 ──────────────────────────────────────────────────
  // 原 barcode-generator（不存在）→ barcode：二维码的天然同族
  // 兼作 qr-scanner 的入站宿主
  "qrcode": ["barcode", "color-picker", "json-formatter", "regex", "qr-scanner"],
  "barcode": ["qrcode", "ascii-art", "color-picker", "random-string"],
  "color-picker": ["signature-maker", "color-contrast", "gradient-generator"],
  "signature-maker": ["color-contrast", "gradient-generator", "placeholder-generator"],
  // 兼作 password-strength / tts 的入站宿主
  "random-string": ["uuid", "base64", "bcrypt", "password-strength", "tts"],
  "lorem-ipsum": ["random-string", "ascii-art", "case-converter", "tts"],
  "password-generator": ["random-string", "bcrypt", "password-strength"],

  // ── 工具 / 实用类 ────────────────────────────────────────────────────
  // 兼作 percentage-calculator / fake-data-generator / truncate-time 的入站宿主
  "counter": [
    "typing-test",
    "text-formatter",
    "hidden-character-detector",
    "percentage-calculator",
    "fake-data-generator",
    "truncate-time",
  ],
  "text-formatter": ["typing-test", "counter", "html-visual-editor"],
  // 兼作 time-to-decimal / truncate-time 的入站宿主
  "seconds-to-time": [
    "time-between-dates",
    "truncate-time",
    "time-to-decimal",
    "discord-timestamp",
  ],
  // 兼作 placeholder-generator 的入站宿主
  "xml-beautifier": ["placeholder-generator", "json-formatter", "yaml-formatter"],
  "html-visual-editor": ["css-minifier", "meta-tags-generator", "escape-json"],
  "escape-json": ["css-minifier", "meta-tags-generator", "html-visual-editor"],
  // 兼作 cron-parser 的入站宿主（cron 与时间戳同族）
  "unix-to-date": [
    "cron-parser",
    "time-between-dates",
    "discord-timestamp",
    "seconds-to-time",
  ],

  // ── 转换器 ──────────────────────────────────────────────────────────
  // 兼作 csv-to-yaml 的入站宿主
  "yaml-formatter": ["json-formatter", "csv-json", "sql-formatter", "csv-to-yaml"],
  // 兼作 video-compress 的入站宿主
  "csv-to-tsv": ["csv-json", "csv-to-yaml", "transpose-csv", "video-compress"],
  "unit-converter": ["byte-converter", "radix-converter", "video-compress"],
  "csv-json": ["json-formatter", "yaml-formatter", "sql-formatter"],
};

/**
 * 取某工具的互链候选列表（单一权威来源）。
 * 1) 优先使用手配的 RELATED_TOOLS（精选，意图最准）；
 * 2) 无手配时，回退到「同分类兄弟工具」（最多 limit 个），保证每个工具页都有互链聚类。
 *
 * 注意：这里只给「候选来源」，去重/过滤/截断由 mergeRelatedTools 完成，
 * 因为它需要把 meta.relatedTools 一起合并进来。
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

/**
 * 合并互链来源，返回**最终渲染**的 slug 列表（DEBT-17 的真正修复点）。
 *
 * 顺序：meta.relatedTools（精选，来自 toolMeta，优先）→ getRelatedTools()（兜底补位）。
 * 规则：
 *  - 过滤掉 toolMeta 中不存在的 slug（死链防御：即便配置写错也不渲染 404 链接）
 *  - 去重，并剔除自身
 *  - 截断到 limit，避免兜底把精选挤掉后页面过长
 *
 * 放在 lib 而不是组件里，是为了让 audit:related 能断言「真正会渲染出来的互链」，
 * 而不是断言一份没人调用的配置。
 */
export function mergeRelatedTools(
  toolId: string,
  metaRelated?: string[],
  limit = 8
): string[] {
  const valid = new Set(ALL_TOOL_IDS);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of [...(metaRelated || []), ...getRelatedTools(toolId)]) {
    if (!id || id === toolId || seen.has(id) || !valid.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}
