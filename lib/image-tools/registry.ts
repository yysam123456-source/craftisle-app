import type { ToolDefinition } from "./types";
import { resize } from "./process/resize";
import { crop } from "./process/crop";
import { compress } from "./process/compress";
import { convert } from "./process/convert";
import { rotate } from "./process/rotate";
import { colorPalette } from "./process/color-palette";
import { favicon } from "./process/favicon";
import { stripMetadata } from "./process/strip-metadata";
import { info } from "./process/info";
import { border } from "./process/border";

const IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/tiff",
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB (Vercel free tier)

/** All registered image tool definitions */
export const toolDefinitions: ToolDefinition[] = [
  {
    id: "image-resize",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: resize,
  },
  {
    id: "image-crop",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: crop,
  },
  {
    id: "image-compress",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: compress,
  },
  {
    id: "image-convert",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: convert,
  },
  {
    id: "image-rotate",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: rotate,
  },
  {
    id: "image-color-palette",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: colorPalette,
  },
  {
    id: "image-favicon",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: favicon,
  },
  {
    id: "image-strip-metadata",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: stripMetadata,
  },
  {
    id: "image-info",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: info,
  },
  {
    id: "image-border",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: border,
  },
];

/** Look up a tool definition by id */
export function getToolDefinition(id: string): ToolDefinition | undefined {
  return toolDefinitions.find((t) => t.id === id);
}

/** All registered image tool ids — used by tools/page.tsx for discovery */
export const imageToolIds = toolDefinitions.map((t) => t.id);
