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
  /** Full description for DescriptionSection (HTML allowed) */
  description?: string;
  /** How-to-use steps for HowToUseSection */
  howToUse?: { heading: string; text: string }[];
  /** Use case cards for UseCasesSection */
  useCases?: { title: string; text: string }[];
  /** FAQ items for FAQSection */
  faq?: { q: string; a: string }[];
  /** Related tool IDs for RelatedToolsSection */
  relatedTools?: string[];
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
  "aes-des":        { title: "AES/DES Encrypt", desc: "Symmetric encryption tool", icon: "🔒", category: CATEGORIES.encryption,
    description: "Encrypt and decrypt text or files using AES (Advanced Encryption Standard) and DES (Data Encryption Standard) algorithms. Supports multiple key sizes and modes (ECB, CBC). All processing happens in your browser — no data is sent to our servers.",
    howToUse: [
      { heading: "Paste or type text", text: "Enter the text you want to encrypt in the input box." },
      { heading: "Choose algorithm & mode", text: "Select AES or DES, then pick a mode (ECB / CBC). AES supports 128/192/256-bit keys." },
      { heading: "Set a secret key", text: "Enter a passphrase. For AES-256, use a 32+ character key for maximum security." },
      { heading: "Encrypt / Decrypt", text: "Click the button. The result appears instantly and can be copied or downloaded." },
    ],
    useCases: [
      { title: "Secure messaging", text: "Encrypt sensitive text before sending over email or chat." },
      { title: "Password storage", text: "Encrypt passwords locally before storing them in a file." },
      { title: "Learning & teaching", text: "Experiment with classical encryption algorithms to understand how they work." },
    ],
    faq: [
      { q: "Is AES-256 secure?", a: "Yes. AES-256 is considered military-grade and is widely used by governments and financial institutions worldwide." },
      { q: "What is the difference between ECB and CBC?", a: "ECB (Electronic Codebook) encrypts identical blocks identically — it leaks patterns. CBC (Cipher Block Chaining) XORs each block with the previous one, making it much more secure." },
      { q: "Does this tool store my data?", a: "No. All encryption and decryption happens entirely in your browser. Nothing is uploaded to any server." },
    ],
    relatedTools: ["base64", "hash", "bcrypt", "jwt"],
  },
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
  "json-formatter":  { title: "JSON Formatter", desc: "JSON beautify and minify", icon: "📋", badge: "Hot", category: CATEGORIES.formatter,
    description: "Instantly format, validate, and minify JSON data in your browser. Features syntax highlighting, error detection with line numbers, tree view for exploring nested structures, and one-click copy or download. No file uploads — your data never leaves your device.",
    howToUse: [
      { heading: "Paste or type JSON", text: "Type or paste JSON into the left editor panel. You can also drag and drop a .json file." },
      { heading: "Auto-format", text: "The tool auto-detects if the JSON is valid. If valid, it beautifies immediately. If invalid, it highlights the error line." },
      { heading: "Adjust settings", text: "Set indentation (2 spaces, 4 spaces, or tab) and toggle tree view on/off." },
      { heading: "Copy or download", text: "Click Copy to copy to clipboard, or Download to save as a .json file." },
    ],
    useCases: [
      { title: "API debugging", text: "Quickly format minified API responses to readable JSON for debugging." },
      { title: "Config file editing", text: "Beautify package.json, tsconfig.json, or other config files before committing." },
      { title: "Data exploration", text: "Use tree view to explore complex nested JSON structures from APIs or databases." },
    ],
    faq: [
      { q: "Is there a size limit?", a: "The tool uses your browser's memory. For files over ~10 MB, consider splitting them first. Most JSON responses from APIs are well under this limit." },
      { q: "Does it validate JSON schema?", a: "It validates syntax (is this valid JSON?), but not schema (does it match a specific structure?). For schema validation, use a dedicated JSON Schema tool." },
      { q: "Is my data private?", a: "Yes. All formatting happens locally in your browser. Nothing is uploaded to any server." },
    ],
    relatedTools: ["csv-json", "yaml-formatter", "sql-formatter"],
  },
  jwt:               { title: "JWT Decoder", desc: "JSON Web Token decoder", icon: "🔐", category: CATEGORIES.encryption },
  keyboard:           { title: "Keyboard Test", desc: "Online keyboard key tester", icon: "⌨️", category: CATEGORIES.other },
  "lorem-ipsum":    { title: "Lorem Ipsum", desc: "Random text generator", icon: "📃", category: CATEGORIES.generator },
  mermaid:           { title: "Mermaid Chart", desc: "Online flowchart diagrams", icon: "📈", category: CATEGORIES.dev },
  "png-to-svg":     { title: "PNG to SVG", desc: "Image format conversion", icon: "🖼️", category: CATEGORIES.converter },
  pomodoro:          { title: "Pomodoro Timer", desc: "Pomodoro technique timer", icon: "🍅", category: CATEGORIES.other },
  qrcode:            { title: "QR Code Generator", desc: "Custom styled QR code generator", icon: "🔳", badge: "Hot", category: CATEGORIES.generator,
    description: "Generate high-quality QR codes with custom colors, sizes, and embedded logos. Perfect for linking to websites, Wi-Fi credentials, contact cards (vCard), and more. All generation happens in your browser — no data leaves your device.",
    howToUse: [
      { heading: "Enter content", text: "Type or paste the URL, text, Wi-Fi info, or contact details you want to encode." },
      { heading: "Customize style", text: "Pick foreground/background colors, size (px), margin, and error correction level." },
      { heading: "Add a logo (optional)", text: "Upload a small logo image to embed at the center of the QR code." },
      { heading: "Generate & download", text: "Click Generate. Preview the result and download as PNG or SVG." },
    ],
    useCases: [
      { title: "Website links", text: "Print QR codes on business cards, flyers, or posters to drive mobile traffic." },
      { title: "Wi-Fi sharing", text: "Encode your Wi-Fi SSID and password — guests scan to connect instantly, no typing needed." },
      { title: "Contact sharing", text: "Generate a vCard QR code and add it to your email signature or resume." },
    ],
    faq: [
      { q: "Is there a scan limit?", a: "No. A QR code is static data — it works forever and can be scanned unlimited times." },
      { q: "Can I add my company logo?", a: "Yes! Upload a small square logo (PNG or JPG). It will be centered inside the QR code. Make sure error correction is set to Medium or High so the logo doesn't break scanning." },
      { q: "What size should I use?", a: "For print, 300×300 px or larger is recommended. For screen display, 200×200 px is sufficient. Always test scanning with your target device before mass printing." },
    ],
    relatedTools: ["barcode", "base64", "url-encode"],
  },
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
