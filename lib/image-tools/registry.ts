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
import { watermark } from "./process/watermark";
import { colorAdjust } from "./process/color-adjust";
import { passportPhoto } from "./process/passport-photo";
import { generateMeme } from "./process/generate-memes";
import { beautifyScreenshots } from "./process/beautify-screenshots";

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
  {
    id: "image-watermark",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: watermark,
  },
  {
    id: "image-color-adjust",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: colorAdjust,
  },
  {
    id: "image-passport-photo",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: passportPhoto,
  },
  {
    id: "image-generate-memes",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: generateMeme,
  },
  {
    id: "image-beautify-screenshots",
    acceptTypes: IMAGE_MIME_TYPES,
    maxFileSize: MAX_FILE_SIZE,
    processFile: beautifyScreenshots,
  },
];

/** Look up a tool definition by id */
export function getToolDefinition(id: string): ToolDefinition | undefined {
  return toolDefinitions.find((t) => t.id === id);
}

/** All registered image tool ids — used by tools/page.tsx for discovery */
export const imageToolIds = [
  ...toolDefinitions.map((t) => t.id),
  // Multi-file tools with dedicated routes (not ToolDefinition-compatible)
  "find-duplicates",
  "create-gif",
];
