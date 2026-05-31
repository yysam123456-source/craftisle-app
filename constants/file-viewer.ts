// ============================================================
// File Viewer — constants & supported formats
// Single source of truth for format lists used across components
// ============================================================

/** Maximum file size accepted (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

/** Cloudflare Pages viewer host */
export const VIEWER_ORIGIN = "https://viewer.craftisle.com";

/** Origin whitelist for postMessage (only accept from craftisle.com) */
export const ALLOWED_ORIGINS = ["https://craftisle.com", "http://localhost:3000"];

/** postMessage timeout (ms) — if viewer doesn't respond within this, show error */
export const VIEWER_TIMEOUT_MS = 10_000; // TODO: wire into PreviewFrame timeout for stuck iframes

/** Handshake timeout (ms) */
export const HANDSHAKE_TIMEOUT_MS = 5_000; // TODO: wire into PreviewFrame handshake timeout

/** Format category → extensions mapping */
export const SUPPORTED_FORMATS_CATEGORIES: Record<string, string[]> = {
  Documents: [".pdf", ".doc", ".docx", ".odt", ".rtf"],
  Spreadsheets: [".xls", ".xlsx", ".ods", ".csv"],
  Presentations: [".ppt", ".pptx", ".odp"],
  Images: [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp", ".ico", ".heic", ".heif"],
  "3D / CAD": [".stl", ".obj", ".dwg", ".dxf", ".gltf", ".glb", ".step", ".stp", ".igs", ".iges"],
  Archives: [".zip", ".tar", ".gz", ".7z", ".rar"],
  Code: [".html", ".css", ".js", ".jsx", ".ts", ".tsx", ".json", ".xml", ".yaml", ".yml", ".md", ".py", ".java", ".c", ".cpp", ".h", ".rs", ".go"],
  Audio: [".mp3", ".wav", ".ogg", ".flac"],
  Video: [".mp4", ".webm", ".mov", ".avi"],
  "E-Books": [".epub", ".mobi"],
  Fonts: [".ttf", ".otf", ".woff", ".woff2"],
} as const;

/** Flat set for quick lookup */
export const SUPPORTED_EXTENSIONS = new Set(
  Object.values(SUPPORTED_FORMATS_CATEGORIES).flat()
);

/** Total format count */
export const SUPPORTED_FORMATS_COUNT = SUPPORTED_EXTENSIONS.size;

/** MIME type → extension mapping (for remote URL content-type detection) */
export const MIME_TO_EXTENSION: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/webp": ".webp",
  "application/zip": ".zip",
  "application/x-7z-compressed": ".7z",
  "application/x-rar-compressed": ".rar",
  "text/html": ".html",
  "text/css": ".css",
  "application/json": ".json",
  "text/markdown": ".md",
  "application/epub+zip": ".epub",
  "model/stl": ".stl",
  "model/obj": ".obj",
  "model/gltf+json": ".gltf",
  "audio/mpeg": ".mp3",
  "video/mp4": ".mp4",
  "font/ttf": ".ttf",
  "font/otf": ".otf",
};

/** Quick filter: categories that are likely supported by file-viewer (non-exhaustive) */
export const QUICK_ACCESS_FORMATS = [
  { ext: ".pdf", label: "PDF", icon: "📄" },
  { ext: ".docx", label: "Word", icon: "📝" },
  { ext: ".xlsx", label: "Excel", icon: "📊" },
  { ext: ".pptx", label: "PPT", icon: "📽️" },
  { ext: ".jpg", label: "Image", icon: "🖼️" },
  { ext: ".zip", label: "Archive", icon: "📦" },
  { ext: ".dwg", label: "CAD", icon: "📐" },
  { ext: ".stl", label: "3D", icon: "🧊" },
];
