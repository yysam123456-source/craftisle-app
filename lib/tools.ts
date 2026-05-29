// Tool metadata for SEO
// Used by app/(marketing)/tools/[tool]/layout.tsx to generate dynamic metadata

export interface ToolMeta {
  title: string;
  desc: string;
  icon: string;
  badge?: string;
  category: string;
  external?: boolean;
  url?: string;
}

// Category constants
export const CATEGORIES = {
  encryption: "Encryption & Hashing",
  formatter: "Formatters",
  converter: "Converters",
  dev: "Developer Tools",
  generator: "Generators",
  text: "Text Tools",
  network: "Network Tools",
  image: "Image",
  other: "Other",
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, label]) => ({
  key,
  label,
}));

export const toolMeta: Record<string, ToolMeta> = {
  "aes-des":        { title: "AES/DES Encrypt", desc: "Symmetric encryption tool", icon: "🔒", category: CATEGORIES.encryption },
  "ascii-art":      { title: "ASCII Art", desc: "Generate ASCII art text", icon: "🎨", category: CATEGORIES.generator },
  barcode:          { title: "Barcode Generator", desc: "Generate various barcodes", icon: "📳", category: CATEGORIES.generator },
  base32:           { title: "Base32 Encode", desc: "Base32 encoding and decoding", icon: "🔤", category: CATEGORIES.converter },
  base58:           { title: "Base58 Encode", desc: "Base58 encoding and decoding", icon: "🔤", category: CATEGORIES.converter },
  base64:           { title: "Base64 Encode/Decode", desc: "Base64 string encoding and decoding", icon: "🔤", badge: "Hot", category: CATEGORIES.converter },
  bcrypt:           { title: "Bcrypt Hash", desc: "Bcrypt password hashing", icon: "🔑", category: CATEGORIES.encryption },
  "case-converter": { title: "Case Converter", desc: "Convert between naming conventions", icon: "Aa", category: CATEGORIES.text },
  "coin-flip":      { title: "Coin Flip", desc: "Random coin flip simulator", icon: "🪙", category: CATEGORIES.other },
  "color-picker":   { title: "Color Picker", desc: "Pick and preview color values", icon: "🎨", category: CATEGORIES.dev },
  countdown:         { title: "Countdown", desc: "Custom countdown timer", icon: "⏳", category: CATEGORIES.other },
  counter:           { title: "Counter", desc: "Simple counter tool", icon: "🔢", category: CATEGORIES.other },
  cron:              { title: "Cron Expression", desc: "Cron job expression builder", icon: "⏰", category: CATEGORIES.dev },
  "csv-json":       { title: "CSV/JSON Converter", desc: "Convert between CSV and JSON", icon: "📊", category: CATEGORIES.converter },
  diff:              { title: "Text Diff", desc: "Compare two texts for differences", icon: "🔄", category: CATEGORIES.text },
  hash:              { title: "Hash Tool", desc: "Multiple hash algorithms", icon: "#️", category: CATEGORIES.encryption },
  "html-escape":    { title: "HTML Escape", desc: "HTML special character escaping", icon: "🏷️", category: CATEGORIES.formatter },
  "html-formatter":  { title: "HTML Formatter", desc: "HTML code beautify and minify", icon: "🌐", category: CATEGORIES.formatter },
  "image-base64":   { title: "Image to Base64", desc: "Convert images to/from Base64", icon: "🖼️", category: CATEGORIES.converter },
  "image-to-pixel": { title: "Pixel Art Generator", desc: "Convert images to pixel style", icon: "🟧", category: CATEGORIES.generator },
  "ip-calc":        { title: "IP Calculator", desc: "IP address calculation tool", icon: "🌐", category: CATEGORIES.network },
  "ip-radix":       { title: "IP Radix Converter", desc: "IP address radix conversion", icon: "🔢", category: CATEGORIES.network },
  "json-formatter":  { title: "JSON Formatter", desc: "JSON beautify and minify", icon: "📋", badge: "Hot", category: CATEGORIES.formatter },
  jwt:               { title: "JWT Decoder", desc: "JSON Web Token decoder", icon: "🔐", category: CATEGORIES.encryption },
  keyboard:           { title: "Keyboard Test", desc: "Online keyboard key tester", icon: "⌨️", category: CATEGORIES.other },
  "lorem-ipsum":    { title: "Lorem Ipsum", desc: "Random text generator", icon: "📃", category: CATEGORIES.generator },
  mermaid:           { title: "Mermaid Chart", desc: "Online flowchart diagrams", icon: "📈", category: CATEGORIES.dev },
  "png-to-svg":     { title: "PNG to SVG", desc: "Image format conversion", icon: "🖼️", category: CATEGORIES.converter },
  pomodoro:          { title: "Pomodoro Timer", desc: "Pomodoro technique timer", icon: "🍅", category: CATEGORIES.other },
  qrcode:            { title: "QR Code Generator", desc: "Custom styled QR code generator", icon: "🔳", badge: "Hot", category: CATEGORIES.generator },
  "radix-converter": { title: "Radix Converter", desc: "Multi-base number conversion", icon: "🔢", category: CATEGORIES.converter },
  "random-group":    { title: "Random Group", desc: "Split list into random groups", icon: "🎲", category: CATEGORIES.generator },
  "random-string":   { title: "Random String", desc: "Generate random strings", icon: "🎲", category: CATEGORIES.generator },
  regex:             { title: "Regex Tester", desc: "Test regular expressions online", icon: "🔍", category: CATEGORIES.dev },
  scoreboard:        { title: "Scoreboard", desc: "Real-time score tracker", icon: "📊", category: CATEGORIES.other },
  "sql-formatter":   { title: "SQL Formatter", desc: "SQL statement beautifier", icon: "🗃", category: CATEGORIES.formatter },
  stopwatch:          { title: "Stopwatch", desc: "Online stopwatch tool", icon: "⏱️", category: CATEGORIES.other },
  "svg-editor":      { title: "SVG Editor", desc: "Online SVG editor", icon: "✏️", category: CATEGORIES.dev },
  "text-formatter":  { title: "Text Formatter", desc: "Text processing and formatting", icon: "📄", category: CATEGORIES.text },
  timestamp:         { title: "Timestamp Converter", desc: "Convert between timestamps and dates", icon: "🕐", category: CATEGORIES.converter },
  tts:               { title: "Text to Speech", desc: "Online TTS conversion", icon: "🔊", category: CATEGORIES.generator },
  unicode:           { title: "Unicode Tool", desc: "Unicode character utilities", icon: "🔣", category: CATEGORIES.text },
  "url-encode":      { title: "URL Encode/Decode", desc: "URL encoding and decoding", icon: "🔗", category: CATEGORIES.converter },
  "user-agent":      { title: "User-Agent Parser", desc: "Parse browser UA strings", icon: "🤖", category: CATEGORIES.network },
  uuid:              { title: "UUID Generator", desc: "Generate UUID/GUID", icon: "🆔", category: CATEGORIES.generator },
  wheel:             { title: "Spin Wheel", desc: "Random spin wheel tool", icon: "🎡", category: CATEGORIES.other },
  "yaml-formatter":  { title: "YAML Formatter", desc: "YAML code beautifier", icon: "📑", category: CATEGORIES.formatter },

  // Image tools (server-side Sharp processing)
  "image-resize":          { title: "Image Resizer", desc: "Resize images by width, height, or fit mode", icon: "📐", category: CATEGORIES.image },
  "image-crop":            { title: "Image Cropper", desc: "Crop images to exact pixel coordinates", icon: "✂️", category: CATEGORIES.image },
  "image-compress":        { title: "Image Compressor", desc: "Compress images with quality control", icon: "🗜️", category: CATEGORIES.image },
  "image-convert":         { title: "Image Converter", desc: "Convert between JPEG, PNG, WebP, AVIF, TIFF", icon: "🔄", category: CATEGORIES.image },
  "image-rotate":          { title: "Image Rotator", desc: "Rotate images by any angle", icon: "↪️", category: CATEGORIES.image },
  "image-color-palette":   { title: "Color Palette", desc: "Extract dominant colors from any image", icon: "🎨", category: CATEGORIES.image },
  "image-favicon":         { title: "Favicon Generator", desc: "Generate favicon from any image", icon: "🖼️", category: CATEGORIES.image },
  "image-strip-metadata":  { title: "Strip Metadata", desc: "Remove EXIF and metadata from images", icon: "🧹", category: CATEGORIES.image },
  "image-info":            { title: "Image Info", desc: "Read dimensions, format, and metadata", icon: "📋", category: CATEGORIES.image },
  "image-border":          { title: "Image Border", desc: "Add colored borders to images", icon: "🖼️", category: CATEGORIES.image },
  "image-watermark":                { title: "Watermark", desc: "Add text watermarks to images", icon: "©️", category: CATEGORIES.image },
  "image-color-adjust":             { title: "Color Adjust", desc: "Adjust brightness, contrast, saturation", icon: "🎚️", category: CATEGORIES.image },
  "image-passport-photo":           { title: "Passport Photo", desc: "Generate passport and visa photos", icon: "📸", category: CATEGORIES.image },
  "image-generate-memes":           { title: "Meme Generator", desc: "Add top and bottom text to any image", icon: "😂", category: CATEGORIES.image },
  "image-beautify-screenshots":     { title: "Beautify Screenshots", desc: "Add padding, shadow, and borders to screenshots", icon: "✨", category: CATEGORIES.image },
  "find-duplicates":               { title: "Find Duplicates", desc: "Compare images and detect duplicates with perceptual hashing", icon: "🔍", category: CATEGORIES.image },
  "create-gif":                    { title: "Create GIF", desc: "Create animated GIFs from multiple image frames", icon: "🎞️", category: CATEGORIES.image },

  // PDF Tools (external subdomain)
  "pdf-tools":     { title: "PDF Tools", desc: "Merge, split, compress, convert PDF files online", icon: "📄", badge: "New", category: CATEGORIES.other, external: true, url: "https://pdf.craftisle.com" },
};

export function getToolMeta(toolName: string): ToolMeta {
  return toolMeta[toolName] || { title: toolName, desc: "Utility tool", icon: "🔧", category: CATEGORIES.other };
}

/** Get all unique categories with tool counts */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const tool of Object.values(toolMeta)) {
    counts[tool.category] = (counts[tool.category] || 0) + 1;
  }
  return counts;
}
