/** All registered image tool ids — client-safe, no sharp dependencies */
export const imageToolIds = [
  "image-resize",
  "image-crop",
  "image-compress",
  "image-convert",
  "image-rotate",
  "image-color-palette",
  "image-favicon",
  "image-strip-metadata",
  "image-info",
  "image-border",
  "image-watermark",
  "image-color-adjust",
  "image-passport-photo",
  "image-generate-memes",
  "image-beautify-screenshots",
  // Multi-file tools with dedicated routes (not ToolDefinition-compatible)
  "find-duplicates",
  "create-gif",
];
