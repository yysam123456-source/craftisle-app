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
  utility: "Utilities",
  other: "Other",
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_LIST = Object.entries(CATEGORIES).map(([key, label]) => ({
  key,
  label,
}));

export const toolMeta: Record<string, ToolMeta> = {
  // ==================== Encryption & Hashing ====================
  "aes-des": {
    title: "AES/DES Encrypt",
    desc: "Symmetric encryption tool",
    icon: "🔒",
    category: CATEGORIES.encryption,
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

  "bcrypt": {
    title: "Bcrypt Hash",
    desc: "Bcrypt password hashing",
    icon: "🔑",
    category: CATEGORIES.encryption,
    description: "Hash passwords securely with bcrypt — the gold standard for password storage. Features adjustable cost factor (work factor) to keep up with Moore's law. Never store plain-text passwords again.",
    howToUse: [
      { heading: "Enter a password", text: "Type the password you want to hash in the input box." },
      { heading: "Set cost factor", text: "Choose a work factor (10-12 is recommended for most use cases). Higher = slower but more secure." },
      { heading: "Generate hash", text: "Click Hash. The bcrypt hash appears instantly. Copy it for storage." },
      { heading: "Verify a hash", text: "Paste a bcrypt hash and the original password to verify they match." },
    ],
    useCases: [
      { title: "User registration", text: "Hash user passwords before storing them in your database." },
      { title: "Password migration", text: "Re-hash passwords with a higher cost factor during login to upgrade security over time." },
      { title: "Security auditing", text: "Verify that stored password hashes use a secure cost factor." },
    ],
    faq: [
      { q: "What cost factor should I use?", a: "In 2026, a cost factor of 12-14 is recommended for new passwords. Test on your production hardware to balance security and latency." },
      { q: "Is bcrypt still secure?", a: "Yes. bcrypt is still considered secure when used with a proper cost factor. It is resistant to GPU-based brute force attacks." },
      { q: "Should I use salt?", a: "bcrypt automatically generates and embeds a secure random salt. You don't need to manage salts separately." },
    ],
    relatedTools: ["hash", "aes-des", "jwt"],
  },

  "hash": {
    title: "Hash Tool",
    desc: "Multiple hash algorithms",
    icon: "#️",
    category: CATEGORIES.encryption,
    description: "Generate secure hashes using MD5, SHA-1, SHA-256, SHA-384, SHA-512, and more. Essential for file integrity verification, password storage (with salt), and digital signatures. 100% client-side.",
    howToUse: [
      { heading: "Paste or type input", text: "Enter the text or drag a file to hash." },
      { heading: "Select algorithm", text: "Choose from MD5, SHA-1, SHA-256, SHA-384, SHA-512, RIPEMD-160." },
      { heading: "Get the hash", text: "The hash appears instantly in hex format. Copy or download." },
    ],
    useCases: [
      { title: "File integrity", text: "Verify downloaded files haven't been tampered with by comparing hashes." },
      { title: "Password hashing", text: "Hash passwords with salt before storing (though bcrypt is preferred for passwords)." },
      { title: "Git commit verification", text: "Understand how Git uses SHA-1/SHA-256 to identify commits." },
    ],
    faq: [
      { q: "Is MD5 secure?", a: "No. MD5 has known collision vulnerabilities. Use SHA-256 or SHA-512 for security. MD5 is OK for non-security checksums." },
      { q: "What is a salt?", a: "A random string added to a password before hashing to prevent rainbow table attacks. bcrypt includes salt automatically." },
      { q: "Is my data private?", a: "Yes. All hashing happens in your browser. Nothing is uploaded." },
    ],
    relatedTools: ["bcrypt", "aes-des", "base64"],
  },

  "jwt": {
    title: "JWT Decoder",
    desc: "JSON Web Token decoder",
    icon: "🔐",
    category: CATEGORIES.encryption,
    description: "Decode and inspect JSON Web Tokens (JWT) in your browser. View header, payload, and signature. Verify token expiration and signature validity. Essential for debugging authentication flows.",
    howToUse: [
      { heading: "Paste a JWT", text: "Copy and paste the JWT string (starts with eyJ...) into the decoder." },
      { heading: "View decoded parts", text: "The header (alg, typ) and payload (sub, exp, iat) are displayed in readable JSON." },
      { heading: "Check expiration", text: "The tool highlights if the token is expired based on the exp claim." },
    ],
    useCases: [
      { title: "API debugging", text: "Inspect JWT payloads returned from authentication endpoints." },
      { title: "Security auditing", text: "Verify that JWTs don't contain sensitive data in the payload (they are signed, not encrypted)." },
      { title: "Learning JWT structure", text: "Understand the three parts of a JWT: header, payload, signature." },
    ],
    faq: [
      { q: "Can I verify the signature?", a: "This tool decodes (base64url) but doesn't verify signatures. For signature verification, use your backend's JWT library with the secret key." },
      { q: "Is a JWT encrypted?", a: "No. JWT payloads are only base64url-encoded, not encrypted. Anyone can decode them. Never put secrets in a JWT payload." },
      { q: "What does exp mean?", a: "exp is the expiration time (Unix timestamp). After this time, the token should be rejected by the server." },
    ],
    relatedTools: ["aes-des", "base64", "hash"],
  },

  // ==================== Formatters ====================
  "json-formatter": {
    title: "JSON Formatter",
    desc: "JSON beautify and minify",
    icon: "📋",
    badge: "Hot",
    category: CATEGORIES.formatter,
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

  "html-formatter": {
    title: "HTML Formatter",
    desc: "HTML code beautify and minify",
    icon: "🌐",
    category: CATEGORIES.formatter,
    description: "Beautify or minify HTML code with adjustable indentation. Removes extra whitespace, normalizes tags, and makes your HTML readable or production-ready. Supports HTML5, JSX-style tags, and Angular/Vue templates.",
    howToUse: [
      { heading: "Paste HTML code", text: "Type or paste your HTML/JSX code into the input editor." },
      { heading: "Choose mode", text: "Select Beautify (readable) or Minify (compact) mode." },
      { heading: "Adjust indentation", text: "Set indentation to 2 spaces, 4 spaces, or tab." },
      { heading: "Copy result", text: "Copy the formatted HTML or download as a .html file." },
    ],
    useCases: [
      { title: "Code cleanup", text: "Beautify minified HTML from production builds for debugging." },
      { title: "Production optimization", text: "Minify HTML to reduce file size and improve page load speed." },
      { title: "JSX/TSX formatting", text: "Format React JSX code that contains HTML-like tags." },
    ],
    faq: [
      { q: "Does it fix broken HTML?", a: "No. This tool formats valid HTML. For fixing broken HTML, use an HTML validator or linter first." },
      { q: "Does it handle embedded CSS/JS?", a: "Yes. It preserves <style> and <script> content and formats the HTML tags around them." },
      { q: "Is my code stored?", a: "No. All processing is in your browser. Nothing is sent to a server." },
    ],
    relatedTools: ["json-formatter", "sql-formatter", "yaml-formatter"],
  },

  "sql-formatter": {
    title: "SQL Formatter",
    desc: "SQL statement beautifier",
    icon: "🗃",
    category: CATEGORIES.formatter,
    description: "Format SQL queries for readability with customizable indentation, keyword casing (upper/lower), and line break rules. Supports SELECT, INSERT, UPDATE, DELETE, JOIN, and complex subqueries. Essential for code reviews and debugging slow queries.",
    howToUse: [
      { heading: "Paste SQL query", text: "Type or paste your SQL statement into the input area." },
      { heading: "Set formatting options", text: "Choose keyword case (UPPER, lower, or Original), indentation size, and line break style." },
      { heading: "Format", text: "Click Format. The beautified SQL appears in the output panel." },
      { heading: "Copy or download", text: "Copy to clipboard or save as a .sql file." },
    ],
    useCases: [
      { title: "Code reviews", text: "Format messy SQL from PRs to make reviews faster and more accurate." },
      { title: "Debugging slow queries", text: "Beautify complex JOIN queries to understand the execution plan." },
      { title: "ORM output inspection", text: "Format SQL logged by ORMs (Prisma, TypeORM, Django ORM) to understand what queries are being generated." },
    ],
    faq: [
      { q: "Which SQL dialects are supported?", a: "Standard SQL, MySQL, PostgreSQL, SQLite, and SQL Server syntax are all supported." },
      { q: "Does it optimize query performance?", a: "No. It only formats for readability. For performance optimization, use EXPLAIN and indexing strategies." },
      { q: "Is my query data private?", a: "Yes. All formatting happens in your browser. Table names and data in the query are not uploaded." },
    ],
    relatedTools: ["json-formatter", "yaml-formatter", "regex"],
  },

  "yaml-formatter": {
    title: "YAML Formatter",
    desc: "YAML code beautifier",
    icon: "📑",
    category: CATEGORIES.formatter,
    description: "Beautify or validate YAML files with proper indentation and syntax checking. Essential for Kubernetes manifests, GitHub Actions workflows, Docker Compose files, and any CI/CD configuration. 100% browser-based.",
    howToUse: [
      { heading: "Paste YAML content", text: "Type or paste your YAML into the editor. Drag and drop a .yml or .yaml file." },
      { heading: "Choose action", text: "Select Beautify (format), Validate (check syntax), or Minify." },
      { heading: "Copy result", text: "Copy the formatted YAML or download as a .yaml file." },
    ],
    useCases: [
      { title: "Kubernetes manifests", text: "Format K8s deployment.yml files for consistency across your team." },
      { title: "GitHub Actions", text: "Beautify .github/workflows/*.yml files to make CI/CD pipelines readable." },
      { title: "Docker Compose", text: "Format docker-compose.yml with consistent indentation (YAML is indentation-sensitive!)." },
    ],
    faq: [
      { q: "Why is indentation important in YAML?", a: "YAML uses indentation (not brackets) to denote structure. A misplaced space can break parsing. This tool auto-fixes indentation." },
      { q: "Does it support YAML anchors and aliases?", a: "Yes. Anchors (&) and aliases (*) are preserved and formatted correctly." },
      { q: "Is my data private?", a: "Yes. All processing is in your browser. Sensitive config values are not uploaded." },
    ],
    relatedTools: ["json-formatter", "sql-formatter", "text-formatter"],
  },

  "html-escape": {
    title: "HTML Escape",
    desc: "HTML special character escaping",
    icon: "🏷️",
    category: CATEGORIES.formatter,
    description: "Escape or unescape HTML special characters (<, >, &, \", ') for safe rendering in browsers. Prevents XSS attacks by converting special characters to their HTML entity equivalents. Also handles URL encoding/decoding.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text containing HTML special characters." },
      { heading: "Choose direction", text: "Select Escape (convert < to &lt;) or Unescape (convert &lt; to <)." },
      { heading: "Get result", text: "The converted text appears instantly. Copy or download." },
    ],
    useCases: [
      { title: "XSS prevention", text: "Escape user-generated content before rendering it in HTML pages." },
      { title: "Code documentation", text: "Escape HTML tags in code comments or Markdown documentation so they render as text." },
      { title: "XML/HTML generation", text: "Escape dynamic values before inserting them into XML or HTML templates." },
    ],
    faq: [
      { q: "What characters are escaped?", a: "The five special characters: < (less-than), > (greater-than), & (ampersand), \" (double-quote), and ' (single-quote)." },
      { q: "Should I escape on the server or client?", a: "Always escape on the server side. Client-side escaping is a secondary defense, not the primary one." },
      { q: "Is this the same as URL encoding?", a: "No. HTML escaping produces &lt; style entities. URL encoding produces %3C style encodings. Use url-encode for URLs." },
    ],
    relatedTools: ["url-encode", "text-formatter", "regex"],
  },

  // ==================== Converters ====================
  "base64": {
    title: "Base64 Encode/Decode",
    desc: "Base64 string encoding and decoding",
    icon: "🔤",
    badge: "Hot",
    category: CATEGORIES.converter,
    description: "The classic Base64 encoder and decoder. Encode files or text for safe transmission in JSON, XML, HTML, or email. Decode Base64 strings back to original data. Supports file upload and drag-and-drop.",
    howToUse: [
      { heading: "Encode text or file", text: "Type text or drag a file into the input area to encode to Base64." },
      { heading: "Decode Base64", text: "Paste a Base64 string to decode it back to original text or download as a file." },
      { heading: "Copy or download", text: "Copy the encoded string to clipboard or download the decoded file." },
    ],
    useCases: [
      { title: "Email attachments", text: "Base64-encode file attachments for MIME email transmission." },
      { title: "HTML image embedding", text: "Convert small images to Base64 data URIs to reduce HTTP requests." },
      { title: "API payloads", text: "Safely encode binary data for inclusion in JSON or XML API requests." },
    ],
    faq: [
      { q: "Does Base64 compress data?", a: "No. Base64 actually increases data size by about 33%. It is for encoding, not compression." },
      { q: "Is Base64 encryption?", a: "No. Base64 is encoding, not encryption. Anyone can decode it. For secure data, use AES or bcrypt." },
      { q: "Is my data private?", a: "Yes. All encoding happens in your browser. Files are never uploaded to any server." },
    ],
    relatedTools: ["image-base64", "url-encode", "csv-json"],
  },

  "base32": {
    title: "Base32 Encode",
    desc: "Base32 encoding and decoding",
    icon: "🔤",
    category: CATEGORIES.converter,
    description: "Encode or decode any text or binary data to and from Base32 format. Base32 uses only uppercase letters A-Z and digits 2-7, making it safe for case-insensitive filesystems and human transcription.",
    howToUse: [
      { heading: "Paste your data", text: "Enter the text or hex data you want to encode, or Base32 string to decode." },
      { heading: "Choose direction", text: "Select Encode (to Base32) or Decode (from Base32)." },
      { heading: "Copy the result", text: "The result appears instantly. Click Copy or Download." },
    ],
    useCases: [
      { title: "File naming", text: "Encode binary data into filenames that are safe across all filesystems." },
      { title: "API tokens", text: "Generate Base32-encoded random tokens for API authentication." },
      { title: "Data transmission", text: "Encode binary data for transmission over channels that only support ASCII." },
    ],
    faq: [
      { q: "Why use Base32 instead of Base64?", a: "Base32 is case-insensitive and doesn't use special characters, making it safer for filenames, DNS names, and human transcription." },
      { q: "Is Base32 the same as Base32Hex?", a: "No. Standard Base32 uses A-Z and 2-7. Base32Hex (RFC 4648) uses 0-9 and A-V. Check which your system expects." },
      { q: "Is my data private?", a: "Yes. All encoding and decoding happens in your browser. Nothing is uploaded." },
    ],
    relatedTools: ["base64", "base58", "radix-converter"],
  },

  "base58": {
    title: "Base58 Encode",
    desc: "Base58 encoding and decoding",
    icon: "🔤",
    category: CATEGORIES.converter,
    description: "Encode or decode data using Base58 — the encoding used in Bitcoin addresses and IPFS hashes. Base58 excludes confusing characters (0, O, I, l) to make manual transcription safer.",
    howToUse: [
      { heading: "Enter your data", text: "Paste the text or hex string you want to encode, or Base58 string to decode." },
      { heading: "Select operation", text: "Choose Encode or Decode." },
      { heading: "Get the result", text: "The result appears instantly. Base58 is more compact than Base64 for the same data." },
    ],
    useCases: [
      { title: "Bitcoin addresses", text: "Understand how Bitcoin public keys are encoded into wallet addresses." },
      { title: "IPFS hashes", text: "Decode IPFS content hashes (CIDv0/v1) for distributed web applications." },
      { title: "Human-readable keys", text: "Generate short, unambiguous identifiers for user-facing systems." },
    ],
    faq: [
      { q: "Why does Bitcoin use Base58?", a: "Base58 avoids confusing characters (0/O/I/l) and doesn't use padding, making it more human-friendly than Base64." },
      { q: "What is the difference between Base58 and Base58Check?", a: "Base58Check adds a 4-byte checksum to detect transcription errors. Bitcoin addresses use Base58Check." },
      { q: "Is this tool affiliated with Bitcoin?", a: "No. This is an independent utility tool. Always verify addresses with official wallet software before sending funds." },
    ],
    relatedTools: ["base64", "base32", "hash"],
  },

  "radix-converter": {
    title: "Radix Converter",
    desc: "Multi-base number conversion",
    icon: "🔢",
    category: CATEGORIES.converter,
    description: "Convert numbers between binary (base-2), octal (base-8), decimal (base-10), hexadecimal (base-16), and any custom base (2-36). Essential for programmers working with low-level data, memory addresses, and bit manipulation.",
    howToUse: [
      { heading: "Enter a number", text: "Type a number in any base (binary, hex, decimal, etc.)." },
      { heading: "Set input base", text: "Tell the tool what base your input number is in (e.g., 16 for hex)." },
      { heading: "View all conversions", text: "All base conversions appear simultaneously. Copy any of them." },
    ],
    useCases: [
      { title: "Bitmask debugging", text: "Convert decimal numbers to binary to inspect individual bit flags." },
      { title: "Memory addresses", text: "Convert between decimal and hex when reading core dumps or debugger output." },
      { title: "Color values", text: "Convert hex color codes (#FF5733) to RGB decimal values for CSS or canvas." },
    ],
    faq: [
      { q: "What bases are supported?", a: "Any integer base from 2 to 36. Common ones: base-2 (binary), base-8 (octal), base-10 (decimal), base-16 (hexadecimal)." },
      { q: "Can I convert floating-point numbers?", a: "This tool converts integers. For floating-point, use a dedicated IEEE-754 converter." },
      { q: "What is two's complement?", a: "It is how negative numbers are represented in binary. This tool works with unsigned integers; for signed, use a dedicated signed integer converter." },
    ],
    relatedTools: ["base64", "base32", "ip-calc"],
  },

  "csv-json": {
    title: "CSV/JSON Converter",
    desc: "Convert between CSV and JSON",
    icon: "📊",
    category: CATEGORIES.converter,
    description: "Convert CSV data to JSON (array of objects) and JSON to CSV. Handles nested JSON, custom delimiters, and auto-detects column types. Essential for data import/export between spreadsheets and APIs.",
    howToUse: [
      { heading: "Paste CSV or JSON", text: "Type or paste CSV data or JSON array into the input area." },
      { heading: "Choose conversion direction", text: "Select CSV → JSON or JSON → CSV." },
      { heading: "Adjust options", text: "Set delimiter (comma, tab, semicolon), and toggle pretty-print for JSON." },
      { heading: "Convert and copy", text: "Click Convert. Copy the result or download as a file." },
    ],
    useCases: [
      { title: "API data export", text: "Convert JSON API responses to CSV for Excel analysis." },
      { title: "Spreadsheet import", text: "Convert CSV exports from Google Sheets to JSON for API consumption." },
      { title: "Data migration", text: "Transform data between systems that use different formats." },
    ],
    faq: [
      { q: "How are nested JSON objects handled?", a: "Nested objects are flattened using dot notation (e.g., user.name) in the CSV output." },
      { q: "What delimiters are supported?", a: "Comma, tab, semicolon, pipe (|), and custom single-character delimiters." },
      { q: "Is there a row limit?", a: "Limited by your browser's memory. For very large files, process in chunks or use a desktop tool." },
    ],
    relatedTools: ["json-formatter", "yaml-formatter", "sql-formatter"],
  },

  "url-encode": {
    title: "URL Encode/Decode",
    desc: "URL encoding and decoding",
    icon: "🔗",
    category: CATEGORIES.converter,
    description: "Encode or decode URL components safely. Converts special characters to percent-encoded format (%20) or back to readable text. Essential for building API requests, handling query parameters, and debugging redirect URLs.",
    howToUse: [
      { heading: "Paste URL or text", text: "Type or paste the URL or text you want to encode/decode." },
      { heading: "Choose direction", text: "Select Encode (to %20 style) or Decode (from %20 style)." },
      { heading: "Copy result", text: "The result appears instantly. Copy to clipboard." },
    ],
    useCases: [
      { title: "API request building", text: "Properly encode query parameters before appending them to API URLs." },
      { title: "Debugging redirects", text: "Decode encoded URLs in server logs to understand redirect chains." },
      { title: "Email link generation", text: "Encode subject and body parameters in mailto: links." },
    ],
    faq: [
      { q: "What is the difference between encodeURI and encodeURIComponent?", a: "encodeURI preserves URL-special chars (/, :, ?). encodeURIComponent encodes everything — use it for query parameter values." },
      { q: "Should I encode the entire URL?", a: "No. Only encode the path segments and query parameter values. The protocol, domain, and / separators should not be encoded." },
      { q: "Is my data private?", a: "Yes. All encoding happens in your browser." },
    ],
    relatedTools: ["base64", "html-escape", "text-formatter"],
  },

  "image-base64": {
    title: "Image to Base64",
    desc: "Convert images to/from Base64",
    icon: "🖼️",
    category: CATEGORIES.converter,
    description: "Convert images (PNG, JPG, GIF, WebP, SVG) to Base64-encoded strings and back. Useful for embedding images directly in HTML/CSS (data URIs), reducing HTTP requests for small images.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image file, or click to browse." },
      { heading: "Get Base64 string", text: "The Base64-encoded string appears instantly. Copy or download." },
      { heading: "Decode (optional)", text: "Paste a Base64 string to decode it back to an image file." },
    ],
    useCases: [
      { title: "CSS background images", text: "Embed small images as Base64 data URIs in CSS to eliminate HTTP requests." },
      { title: "HTML email images", text: "Embed images in HTML emails as Base64 to ensure they display without external requests." },
      { title: "API image upload", text: "Encode images as Base64 for JSON APIs that don't support binary file upload." },
    ],
    faq: [
      { q: "When should I NOT use Base64 images?", a: "For images larger than ~10KB, Base64 adds ~33% overhead. Use normal <img> tags with cached files instead." },
      { q: "Which formats are supported?", a: "PNG, JPG/JPEG, GIF, WebP, SVG, BMP, and ICO." },
      { q: "Is my image data private?", a: "Yes. The conversion happens entirely in your browser. The image is not uploaded to any server." },
    ],
    relatedTools: ["base64", "png-to-svg", "image-convert"],
  },

  "png-to-svg": {
    title: "PNG to SVG",
    desc: "Image format conversion",
    icon: "🖼️",
    category: CATEGORIES.converter,
    description: "Convert raster images (PNG, JPG) to scalable SVG format using edge detection and path tracing. Also convert SVG to PNG at custom resolutions. Essential for logos, icons, and graphics that need to scale without quality loss.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop a PNG or JPG image. SVG upload is also supported for reverse conversion." },
      { heading: "Adjust tracing settings", text: "Set corner threshold, blur, and path precision for PNG→SVG conversion." },
      { heading: "Convert and download", text: "Click Convert. Preview the result and download as SVG or PNG." },
    ],
    useCases: [
      { title: "Logo conversion", text: "Convert a PNG logo to SVG for crisp rendering at any size." },
      { title: "Icon system", text: "Convert raster icons to SVG for use in React components or icon fonts." },
      { title: "Print preparation", text: "Convert low-res PNGs to vector format for high-quality printing." },
    ],
    faq: [
      { q: "Does PNG to SVG produce perfect vectors?", a: "It produces traced paths that approximate the original. For complex photos, the result may look like an outline drawing rather than a perfect vector." },
      { q: "What is the best use case for PNG→SVG?", a: "Logos, icons, diagrams, and simple graphics with flat colors and sharp edges." },
      { q: "Is my image data private?", a: "Yes. All processing happens in your browser using Canvas and SVG APIs." },
    ],
    relatedTools: ["image-base64", "image-convert", "svg-editor"],
  },

  "ip-radix": {
    title: "IP Radix Converter",
    desc: "IP address radix conversion",
    icon: "🔢",
    category: CATEGORIES.network,
    description: "Convert IP addresses between decimal, hex, octal, and binary representations. Useful for understanding how IP addresses are stored in memory, analyzing low-level network data, and working with historical systems that use octal IP notation.",
    howToUse: [
      { heading: "Enter an IP address", text: "Type an IPv4 address (e.g., 192.168.1.1) or IPv6 address." },
      { heading: "View conversions", text: "All radix representations appear: decimal, hex, octal, binary." },
      { heading: "Copy any format", text: "Click to copy the representation you need." },
    ],
    useCases: [
      { title: "Low-level networking", text: "Understand how IP addresses are represented in system memory or packet captures." },
      { title: "Security analysis", text: "Decode obfuscated IP addresses in malware C2 configurations that use hex or decimal notation." },
      { title: "Historical systems", text: "Work with legacy systems that accept octal IP notation (ping 0300.0250.0001.0001)." },
    ],
    faq: [
      { q: "What is 0x7F000001?", a: "That is 127.0.0.1 (localhost) in hexadecimal. The tool shows all representations side-by-side." },
      { q: "Does this work for IPv6?", a: "Yes. IPv6 addresses are shown in expanded hex, compressed hex, and binary." },
      { q: "Is this useful for subnetting?", a: "Use ip-calc for subnet math. This tool is for format conversion only." },
    ],
    relatedTools: ["ip-calc", "radix-converter", "user-agent"],
  },

  // ==================== Developer Tools ====================
  "cron": {
    title: "Cron Expression",
    desc: "Cron job expression builder",
    icon: "⏰",
    category: CATEGORIES.dev,
    description: "Build and validate cron expressions with an interactive editor. Supports standard 5-field cron format plus optional seconds and year fields. Includes human-readable descriptions (in English) and next-run-time preview. Essential for CI/CD scheduling, backup jobs, and task automation.",
    howToUse: [
      { heading: "Build cron expression", text: "Use the interactive builder to set minute, hour, day, month, and weekday fields." },
      { heading: "Preview human-readable description", text: "The tool shows what the cron means in plain English (e.g., 'At 00:00 every day')." },
      { heading: "Test next run times", text: "See the next 5 scheduled run times based on the current time." },
    ],
    useCases: [
      { title: "CI/CD scheduling", text: "Set up cron jobs for automated builds, tests, and deployments." },
      { title: "Database backups", text: "Schedule daily or weekly database backup scripts using cron expressions." },
      { title: "Maintenance tasks", text: "Schedule log rotation, cache clearing, and cleanup scripts." },
    ],
    faq: [
      { q: "What is the difference between * and */5?", a: "* means every possible value. */5 means every 5th value (every 5 minutes, every 5 hours, etc.)." },
      { q: "Does this support non-standard cron fields?", a: "Yes. You can optionally add a seconds field (6 total) and a year field (7 total), which some systems (Quartz, some CI tools) support." },
      { q: "What is @daily / @weekly?", a: "These are cron 'nicknames' (also called special strings). @daily = 0 0 * * *, @weekly = 0 0 * * 0." },
    ],
    relatedTools: ["regex", "json-formatter", "color-picker"],
  },

  "regex": {
    title: "Regex Tester",
    desc: "Test regular expressions online",
    icon: "🔍",
    category: CATEGORIES.dev,
    description: "Test regular expressions against sample text with real-time matching highlights. Supports JavaScript, Python, and PCRE regex flavors. Features match groups display, replace preview, and common pattern library. Essential for form validation, data extraction, and text processing.",
    howToUse: [
      { heading: "Enter a regex pattern", text: "Type your regular expression pattern (e.g., ^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$)." },
      { heading: "Add test string", text: "Paste or type the text you want to test against." },
      { heading: "View matches", text: "Matching portions are highlighted. Match groups are displayed below." },
      { heading: "Test replace", text: "Optionally enter a replacement string to preview the result of regex replace." },
    ],
    useCases: [
      { title: "Form validation", text: "Test email, phone, and password validation regex patterns before deploying." },
      { title: "Data extraction", text: "Build regex patterns to extract URLs, dates, or structured data from text." },
      { title: "Log analysis", text: "Create regex patterns to parse and filter server log files." },
    ],
    faq: [
      { q: "Which regex flavor is used?", a: "By default, JavaScript regex (ECMAScript). You can switch to Python or PCRE mode for advanced features like lookbehind." },
      { q: "What does the 'g' flag do?", a: "The 'g' (global) flag finds ALL matches, not just the first one." },
      { q: "Why is my regex not matching?", a: "Common issues: forgetting to escape special chars (., *, +), or using greedy quantifiers (*) when you want lazy (*?). Check the flags too." },
    ],
    relatedTools: ["json-formatter", "sql-formatter", "text-formatter"],
  },

  "mermaid": {
    title: "Mermaid Chart",
    desc: "Online flowchart diagrams",
    icon: "📈",
    category: CATEGORIES.dev,
    description: "Create flowcharts, sequence diagrams, Gantt charts, and more using Mermaid syntax. Live preview updates as you type. Export to SVG or PNG. Perfect for documentation, architecture diagrams, and process flows. No account required.",
    howToUse: [
      { heading: "Write Mermaid syntax", text: "Type Mermaid diagram code in the editor (e.g., graph TD; A-->B;)." },
      { heading: "Preview live", text: "The diagram updates in real-time as you type. Errors are highlighted." },
      { heading: "Export", text: "Download as SVG (vector) or PNG (raster) for use in documents and presentations." },
    ],
    useCases: [
      { title: "Documentation diagrams", text: "Add flowcharts and sequence diagrams to Markdown documentation (GitHub supports Mermaid!)." },
      { title: "Architecture visualization", text: "Diagram system architecture, API flows, and database relationships." },
      { title: "Project planning", text: "Create Gantt charts for project timelines and milestone tracking." },
    ],
    faq: [
      { q: "Does GitHub support Mermaid?", a: "Yes! GitHub Flavored Markdown supports Mermaid diagrams. You can paste Mermaid code directly into .md files." },
      { q: "What diagram types are supported?", a: "Flowchart, sequence diagram, class diagram, Gantt, pie chart, gitgraph, and more." },
      { q: "Can I collaborate with others?", a: "Share the Mermaid code. Others can paste it into their own Mermaid editor to view and edit." },
    ],
    relatedTools: ["svg-editor", "color-picker", "lorem-ipsum"],
  },

  "svg-editor": {
    title: "SVG Editor",
    desc: "Online SVG editor",
    icon: "✏️",
    category: CATEGORIES.dev,
    description: "Edit SVG files with a code editor and live preview. Supports layer management, element inspection, and export to PNG/SVG. Features syntax highlighting, auto-complete for SVG attributes, and a built-in element picker. 100% browser-based.",
    howToUse: [
      { heading: "Open or paste SVG", text: "Paste SVG code into the code editor, or drag and drop an .svg file." },
      { heading: "Edit with live preview", text: "Edit the SVG code. The preview panel updates in real-time." },
      { heading: "Export", text: "Download as SVG or export to PNG at custom resolution." },
    ],
    useCases: [
      { title: "Icon editing", text: "Tweak SVG icons from icon libraries to match your brand colors and stroke widths." },
      { title: "Data visualization", text: "Create custom SVG charts and diagrams for reports and dashboards." },
      { title: "Web graphics", text: "Optimize SVGs for web use by removing editor metadata and simplifying paths." },
    ],
    faq: [
      { q: "Is this a vector graphics editor like Illustrator?", a: "It is code-based. You edit the SVG XML directly. For drag-and-drop vector editing, use a desktop tool. This is best for developers who prefer code." },
      { q: "Can I import from Figma/Sketch?", a: "Export as SVG from Figma/Sketch, then paste the SVG code here for cleanup and optimization." },
      { q: "Does it minify SVG output?", a: "Yes. You can choose pretty-printed (readable) or minified (smaller file size) SVG output." },
    ],
    relatedTools: ["mermaid", "png-to-svg", "image-color-palette"],
  },

  // ==================== Generators ====================
  "qrcode": {
    title: "QR Code Generator",
    desc: "Custom styled QR code generator",
    icon: "🔳",
    badge: "Hot",
    category: CATEGORIES.generator,
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

  "lorem-ipsum": {
    title: "Lorem Ipsum",
    desc: "Random text generator",
    icon: "📃",
    category: CATEGORIES.generator,
    description: "Generate Lorem Ipsum placeholder text for design mockups, documentation, and UI layouts. Customize paragraph count, sentence length, and starting paragraph. Also supports custom text seed for reproducible output. 100% client-side.",
    howToUse: [
      { heading: "Set parameters", text: "Choose number of paragraphs, sentences per paragraph, and words per sentence." },
      { heading: "Generate", text: "Click Generate. Lorem Ipsum text appears instantly." },
      { heading: "Copy or download", text: "Copy to clipboard or download as a .txt file." },
    ],
    useCases: [
      { title: "Design mockups", text: "Fill UI layouts with realistic-looking placeholder text during the design phase." },
      { title: "Documentation examples", text: "Use Lorem Ipsum in code documentation and README examples." },
      { title: "Typesetting tests", text: "Test font rendering, line height, and paragraph spacing with multi-paragraph text." },
    ],
    faq: [
      { q: "What is Lorem Ipsum?", a: "A truncated passage from Cicero's 'De finibus bonorum et malorum' (45 BC). It has been the standard placeholder text since the 1500s." },
      { q: "Can I use custom seed text?", a: "Yes. You can provide custom starting text to generate reproducible placeholder content." },
      { q: "Is there a word count limit?", a: "You can generate up to ~50 paragraphs at once. For more, generate in batches." },
    ],
    relatedTools: ["random-string", "ascii-art", "case-converter"],
  },

  "random-string": {
    title: "Random String",
    desc: "Generate random strings",
    icon: "🎲",
    category: CATEGORIES.generator,
    description: "Generate cryptographically secure random strings for passwords, API keys, tokens, and test data. Customize length, character set (uppercase, lowercase, digits, symbols), and quantity. Uses the browser's Crypto.getRandomValues() API for true randomness.",
    howToUse: [
      { heading: "Set length and count", text: "Choose the string length and how many strings to generate." },
      { heading: "Choose character set", text: "Toggle uppercase, lowercase, digits, and symbols on/off." },
      { heading: "Generate", text: "Click Generate. Copy individual strings or all at once." },
    ],
    useCases: [
      { title: "API key generation", text: "Generate secure random API keys and secrets for your applications." },
      { title: "Test data", text: "Generate random strings for database seeding and automated testing." },
      { title: "Password inspiration", text: "Generate a strong random password as a starting point, then customize." },
    ],
    faq: [
      { q: "Is this cryptographically secure?", a: "Yes. We use the browser's Crypto.getRandomValues() API, which is suitable for security-sensitive random generation." },
      { q: "Can I generate a UUID instead?", a: "Use the UUID Generator tool for RFC-4122 compliant UUIDs (v4)." },
      { q: "What is the maximum length?", a: "Up to 512 characters per string. Generate up to 100 strings at once." },
    ],
    relatedTools: ["uuid", "base64", "bcrypt"],
  },

  "random-group": {
    title: "Random Group",
    desc: "Split list into random groups",
    icon: "🎲",
    category: CATEGORIES.generator,
    description: "Split a list of names or items into random groups of equal (or custom) size. Perfect for team assignments, tournament brackets, classroom activities, and randomly assigning reviewers. Fair, reproducible (with seed), and 100% browser-based.",
    howToUse: [
      { heading: "Enter your list", text: "Paste a list of names or items (one per line or comma-separated)." },
      { heading: "Set group size or count", text: "Choose number of groups, or group size (items per group)." },
      { heading: "Shuffle and assign", text: "Click Shuffle. Groups are displayed with members assigned randomly." },
      { heading: "Copy results", text: "Copy the group assignments or download as a text file." },
    ],
    useCases: [
      { title: "Team assignments", text: "Randomly assign team members to projects or study groups." },
      { title: "Tournament brackets", text: "Randomly assign players or teams to bracket positions." },
      { title: "Classroom activities", text: "Split students into random pairs or small groups for collaborative work." },
    ],
    faq: [
      { q: "Is the shuffle truly random?", a: "Yes. We use Fisher-Yates shuffle with Crypto.getRandomValues() for cryptographic-quality randomness." },
      { q: "Can I reproduce the same grouping?", a: "Yes. Set a seed value. The same seed always produces the same grouping." },
      { q: "What if the list doesn't divide evenly?", a: "Some groups will have 1 more item than others. The tool distributes the remainder as evenly as possible." },
    ],
    relatedTools: ["random-string", "coin-flip", "wheel"],
  },

  "uuid": {
    title: "UUID Generator",
    desc: "Generate UUID/GUID",
    icon: "🆔",
    category: CATEGORIES.generator,
    description: "Generate RFC-4122 compliant UUIDs (v4, random) in bulk. Features multiple output formats (with/without hyphens, uppercase/lowercase), and batch generation (up to 100 at once). Uses cryptographic randomness. Essential for database primary keys, distributed system IDs, and API resource identifiers.",
    howToUse: [
      { heading: "Choose UUID version", text: "Select UUID v4 (random) — the most commonly used version." },
      { heading: "Set batch size", text: "Choose how many UUIDs to generate (1-100)." },
      { heading: "Choose format", text: "Toggle hyphens on/off, and uppercase/lowercase hex digits." },
      { heading: "Generate and copy", text: "Click Generate. Copy individual UUIDs or all at once." },
    ],
    useCases: [
      { title: "Database primary keys", text: "Generate unique IDs for distributed databases where auto-increment is not feasible." },
      { title: "API resource IDs", text: "Assign unique identifiers to API resources (users, orders, products) in microservices." },
      { title: "Test data generation", text: "Generate unique IDs for test fixtures and mock data." },
    ],
    faq: [
      { q: "What is the collision probability of UUID v4?", a: "Extremely low. With 122 random bits, you need to generate 2^61 UUIDs before a collision becomes likely. Practically zero for most applications." },
      { q: "Should I use UUID v4 or v7?", a: "v4 is random (no time info). v7 includes a timestamp, making it sortable by creation time. v7 is better for database indexing." },
      { q: "Is this compliant with RFC 4122?", a: "Yes. UUIDs generated follow RFC 4122 v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx where y is 8, 9, a, or b." },
    ],
    relatedTools: ["random-string", "base64", "timestamp"],
  },

  "image-to-pixel": {
    title: "Pixel Art Generator",
    desc: "Convert images to pixel style",
    icon: "🟧",
    category: CATEGORIES.generator,
    description: "Convert any image into pixel art style with customizable pixel size, color palette reduction, and dithering options. Create retro-style graphics, game sprites, and social media avatars. Download as PNG with transparent background support.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Adjust pixel size", text: "Set pixel block size. Larger = more pixelated, smaller = closer to original." },
      { heading: "Reduce colors (optional)", text: "Limit the color palette to 8, 16, 32, or 64 colors for authentic retro look." },
      { heading: "Download result", text: "Preview the pixel art and download as PNG." },
    ],
    useCases: [
      { title: "Game sprites", text: "Convert character art to pixel art style for retro games (Phaser, Unity, RPG Maker)." },
      { title: "Social media avatars", text: "Create pixel-art profile pictures from photos for a retro aesthetic." },
      { title: "NFT / crypto art", text: "Generate pixel art for blockchain-based art projects." },
    ],
    faq: [
      { q: "What pixel size should I use?", a: "For 32×32 or 64×64 output (classic sprite size), use pixel size 8-16 for a 256×256 input. Experiment to find the look you like." },
      { q: "Can I control the color palette?", a: "Yes. You can limit to 8, 16, 32, or 64 colors. Fewer colors = more authentic retro look." },
      { q: "Is my image data private?", a: "Yes. All processing happens in your browser using Canvas API." },
    ],
    relatedTools: ["image-color-palette", "ascii-art", "qrcode"],
  },

  // ==================== Text Tools ====================
  "case-converter": {
    title: "Case Converter",
    desc: "Convert between naming conventions",
    icon: "Aa",
    category: CATEGORIES.text,
    description: "Instantly convert text between camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE, and more. Essential for developers working across different naming conventions in JavaScript, Python, Rust, and SQL.",
    howToUse: [
      { heading: "Paste your text", text: "Enter or paste the text you want to convert." },
      { heading: "Choose target format", text: "Select the naming convention you want to convert to." },
      { heading: "Copy the result", text: "All converted formats appear simultaneously. Copy the one you need." },
    ],
    useCases: [
      { title: "Cross-language development", text: "Convert variable names when moving code between JavaScript (camelCase) and Python (snake_case)." },
      { title: "Database column naming", text: "Convert between snake_case (SQL) and camelCase (JSON API responses)." },
      { title: "CSS class naming", text: "Convert between kebab-case (CSS classes) and camelCase (React/JSX style props)." },
    ],
    faq: [
      { q: "What is the difference between PascalCase and camelCase?", a: "PascalCase starts with a capital letter (UsedForClassNames). camelCase starts with lowercase (usedForVariables)." },
      { q: "Can I convert an entire code file?", a: "This tool converts individual strings. For bulk file refactoring, use your IDE's rename symbol feature." },
      { q: "Does it handle acronyms correctly?", a: "The tool follows common conventions: URL becomes Url in PascalCase, but you can manually adjust if your style guide differs." },
    ],
    relatedTools: ["text-formatter", "regex", "unicode"],
  },

  "text-formatter": {
    title: "Text Formatter",
    desc: "Text processing and formatting",
    icon: "📄",
    category: CATEGORIES.text,
    description: "Format and transform text with 20+ operations: word count, character count, line sorting, deduplication, whitespace cleanup, find-and-replace, and more. Essential for writers, editors, and developers cleaning up text data.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste the text you want to process." },
      { heading: "Choose an operation", text: "Select from: word count, sort lines, remove duplicates, trim whitespace, etc." },
      { heading: "Apply and copy", text: "Click Apply. The transformed text appears. Copy or download." },
    ],
    useCases: [
      { title: "Content editing", text: "Clean up copied text: remove extra line breaks, normalize whitespace, fix encoding issues." },
      { title: "Data preparation", text: "Deduplicate and sort lists of emails, URLs, or product SKUs." },
      { title: "Code cleanup", text: "Remove trailing whitespace and normalize line endings in source code." },
    ],
    faq: [
      { q: "Is there a character limit?", a: "Limited by browser memory. For very large texts (100K+ words), process in sections." },
      { q: "Does it support regex find-and-replace?", a: "Yes. The find-and-replace operation supports regular expressions for power users." },
      { q: "Is my text data private?", a: "Yes. All processing happens in your browser." },
    ],
    relatedTools: ["case-converter", "regex", "unicode"],
  },

  "diff": {
    title: "Text Diff",
    desc: "Compare two texts for differences",
    icon: "🔄",
    category: CATEGORIES.text,
    description: "Compare two texts side-by-side and highlight differences with color-coding. Supports word-level and character-level diff, inline and side-by-side views, and diff export. Essential for code reviews, document version comparison, and debugging configuration changes.",
    howToUse: [
      { heading: "Paste original text", text: "Type or paste the original text in the left panel." },
      { heading: "Paste modified text", text: "Type or paste the modified text in the right panel." },
      { heading: "View differences", text: "Differences are highlighted. Choose side-by-side or inline view." },
      { heading: "Export diff", text: "Download the diff as a patch file or copy the diff summary." },
    ],
    useCases: [
      { title: "Code reviews", text: "Compare code versions before and after changes to understand exactly what was modified." },
      { title: "Config file comparison", text: "Diff production vs. staging config files to catch missing settings." },
      { title: "Document versioning", text: "Compare draft versions of contracts, articles, or specifications." },
    ],
    faq: [
      { q: "What diff algorithm is used?", a: "Myers' diff algorithm (the same one used by Git). It produces the minimal edit distance." },
      { q: "Can I ignore whitespace changes?", a: "Yes. Toggle 'Ignore whitespace' to focus on meaningful code changes." },
      { q: "Can I merge differences?", a: "This tool shows differences. For merging, use a dedicated merge tool or Git merge." },
    ],
    relatedTools: ["text-formatter", "regex", "json-formatter"],
  },

  "unicode": {
    title: "Unicode Tool",
    desc: "Unicode character utilities",
    icon: "🔣",
    category: CATEGORIES.text,
    description: "Explore, search, and convert Unicode characters. Look up character names, code points, and categories. Convert between Unicode escape formats (\\uXXXX, &#xXXXX;, U+XXXX). Essential for internationalization (i18n) work and debugging mojibake (encoding corruption).",
    howToUse: [
      { heading: "Search or paste a character", text: "Type a character, search by name, or paste a Unicode escape sequence." },
      { heading: "View character details", text: "See code point, UTF-8/UTF-16 bytes, character category, and bidirectional type." },
      { heading: "Convert format", text: "Convert between \\uXXXX, &#xXXXX;, U+XXXX, and raw character formats." },
    ],
    useCases: [
      { title: "i18n debugging", text: "Identify why a specific Unicode character is not rendering correctly in your app." },
      { title: "Encoding corruption fix", text: "Debug mojibake (garbled text from encoding mismatch) by inspecting the actual code points." },
      { title: "Font testing", text: "Find which Unicode block a character belongs to and test if your font supports it." },
    ],
    faq: [
      { q: "What is the difference between UTF-8 and UTF-16?", a: "UTF-8 uses 1-4 bytes per character and is backward-compatible with ASCII. UTF-16 uses 2 or 4 bytes. UTF-8 is preferred for web and JSON." },
      { q: "Why does my emoji show as a box (□)?", a: "The font being used doesn't have a glyph for that emoji. Use a font that supports the Emoji Unicode block (Noto Color Emoji, Apple Color Emoji, etc.)." },
      { q: "What is the maximum Unicode code point?", a: "U+10FFFF (1,114,111 code points). The Basic Multilingual Plane (BMP) covers U+0000 to U+FFFF." },
    ],
    relatedTools: ["text-formatter", "case-converter", "base64"],
  },

  "tts": {
    title: "Text to Speech",
    desc: "Online TTS conversion",
    icon: "🔊",
    category: CATEGORIES.generator,
    description: "Convert text to natural-sounding speech using the browser's built-in Web Speech API. Supports multiple languages and voices (depending on your OS). Adjust speed, pitch, and volume. Download as WAV. Essential for accessibility testing, content creation, and language learning.",
    howToUse: [
      { heading: "Type or paste text", text: "Enter the text you want to convert to speech (up to ~500 characters for best results)." },
      { heading: "Choose voice and language", text: "Select from available system voices. Different OSes provide different voice options." },
      { heading: "Adjust settings", text: "Set speech rate (speed), pitch, and volume." },
      { heading: "Play or download", text: "Click Play to preview. Click Download to save as a WAV file." },
    ],
    useCases: [
      { title: "Accessibility testing", text: "Test how screen readers will pronounce your app's UI text and error messages." },
      { title: "Language learning", text: "Hear correct pronunciation of foreign language text." },
      { title: "Content creation", text: "Generate voiceovers for videos, presentations, and social media posts." },
    ],
    faq: [
      { q: "Why do I have fewer voices than expected?", a: "Available voices depend on your operating system. macOS has more built-in voices than Windows or Linux. Chrome also provides extra voices via Google's speech synthesis." },
      { q: "Can I use this for commercial voiceovers?", a: "The Web Speech API voices are licensed for personal/system use. For commercial projects, consider a paid TTS API (ElevenLabs, Azure TTS, etc.)." },
      { q: "Is there a character limit?", a: "For best performance, keep input under 500 characters. Longer texts may be truncated or cause slow rendering." },
    ],
    relatedTools: ["lorem-ipsum", "text-formatter", "unicode"],
  },

  // ==================== Network Tools ====================
  "ip-calc": {
    title: "IP Calculator",
    desc: "IP address calculation tool",
    icon: "🌐",
    category: CATEGORIES.network,
    description: "Calculate IPv4 and IPv6 subnet information: network address, broadcast address, CIDR notation, wildcard mask, and usable host range. Supports CIDR notation (192.168.1.0/24) and subnet mask input. Essential for network engineers, DevOps, and cloud infrastructure planning.",
    howToUse: [
      { heading: "Enter IP and subnet", text: "Type an IPv4 or IPv6 address with CIDR suffix (e.g., 192.168.1.0/24)." },
      { heading: "View results", text: "Network address, broadcast address, usable host range, total hosts, and subnet mask are displayed." },
      { heading: "Copy results", text: "Copy individual values or the full subnet report." },
    ],
    useCases: [
      { title: "Cloud VPC planning", text: "Calculate subnet sizes for AWS VPC, Azure VNet, or GCP VPC subnets." },
      { title: " firewall rule configuration", text: "Determine the correct CIDR block for firewall allow/deny rules." },
      { title: "Network documentation", text: "Generate subnet calculation reports for network architecture diagrams." },
    ],
    faq: [
      { q: "What is CIDR?", a: "Classless Inter-Domain Routing. /24 means the first 24 bits are the network portion. /32 is a single host. Smaller number = larger subnet." },
      { q: "Why can't I use the network address or broadcast address?", a: "Network address (all host bits 0) identifies the subnet. Broadcast address (all host bits 1) is for broadcast traffic. Neither can be assigned to a host." },
      { q: "Does this support IPv6?", a: "Yes. Enter an IPv6 address with CIDR suffix (e.g., 2001:db8::/32). IPv6 subnetting works differently from IPv4 — typically /64 for LAN segments." },
    ],
    relatedTools: ["ip-radix", "user-agent", "timestamp"],
  },

  "user-agent": {
    title: "User-Agent Parser",
    desc: "Parse browser UA strings",
    icon: "🤖",
    category: CATEGORIES.network,
    description: "Parse User-Agent strings to detect browser, operating system, device type, and rendering engine. Useful for debugging analytics discrepancies, implementing device-specific logic, and understanding your site's traffic. Also includes a UA string generator for testing.",
    howToUse: [
      { heading: "Paste a User-Agent string", text: "Type or paste a UA string (e.g., from your server logs or browser dev tools)." },
      { heading: "Parse", text: "Click Parse. The browser, OS, device type, and engine are displayed." },
      { heading: "Generate test UA (optional)", text: "Generate UA strings for specific browsers/devices to test your site's responsive behavior." },
    ],
    useCases: [
      { title: "Analytics debugging", text: "Verify that your analytics tool is correctly identifying browser and OS from UA strings." },
      { title: "Device-specific logic", text: "Test UA parsing logic in your code that serves different content to mobile vs. desktop." },
      { title: "Bot detection", text: "Identify search engine bots (Googlebot, Bingbot) vs. real user traffic in server logs." },
    ],
    faq: [
      { q: "Are User-Agent strings reliable for device detection?", a: "They can be spoofed. For reliable device detection, use a combination of UA parsing, screen size detection, and feature detection." },
      { q: "What is the difference between UA detection and feature detection?", a: "UA detection checks the browser name/version string. Feature detection (modern approach) checks if a specific API exists (e.g., 'fetch' in window). Feature detection is more reliable." },
      { q: "Is this tool affiliated with any browser vendor?", a: "No. This is an independent utility. UA parsing is based on the public UA string specification." },
    ],
    relatedTools: ["ip-calc", "regex", "json-formatter"],
  },

  // ==================== Other Tools ====================
  "coin-flip": {
    title: "Coin Flip",
    desc: "Random coin flip simulator",
    icon: "🪙",
    category: CATEGORIES.utility,
    description: "Flip a virtual coin with realistic animation and sound. Uses cryptographic randomness for true 50/50 probability. Perfect for decision making, games, disputes, and probability experiments. Tracks flip history and statistics.",
    howToUse: [
      { heading: "Click Flip", text: "Press the Flip button to toss the coin. Watch the animation." },
      { heading: "View result", text: "The result (Heads or Tails) is displayed with animation." },
      { heading: "Flip again", text: "Click again for another toss. Statistics are tracked automatically." },
    ],
    useCases: [
      { title: "Decision making", text: "Can't decide between two options? Let the coin decide." },
      { title: "Games and sports", text: "Determine starting positions, possession, or resolve tie-breakers." },
      { title: "Probability teaching", text: "Demonstrate the law of large numbers by tracking results over many flips." },
    ],
    faq: [
      { q: "Is the coin flip truly random?", a: "Yes. We use the browser's Crypto.getRandomValues() API, which provides cryptographic-quality randomness." },
      { q: "Can I customize the coin faces?", a: "Currently the tool shows standard Heads/Tails. Custom labels (Yes/No, A/B) is a planned feature." },
      { q: "Is there a history of my flips?", a: "Yes! The tool tracks your flip history and statistics (heads count, tails count, percentage) in the current session." },
    ],
    relatedTools: ["random-string", "random-group", "wheel"],
  },

  "counter": {
    title: "Counter",
    desc: "Simple counter tool",
    icon: "🔢",
    category: CATEGORIES.utility,
    description: "A simple, accessible counter with increment, decrement, reset, and custom step size. Features keyboard shortcuts, session persistence, and a large display. Perfect for counting items, tracking reps at the gym, or any situation where you need a quick tally.",
    howToUse: [
      { heading: "Click + or -", text: "Use the buttons or keyboard arrow keys to increment or decrement." },
      { heading: "Set step size", text: "Change the step size (default: 1) to count by 5s, 10s, etc." },
      { heading: "Reset", text: "Click Reset to set the counter back to 0." },
    ],
    useCases: [
      { title: "Gym reps tracking", text: "Count exercise repetitions during workouts." },
      { title: "Inventory counting", text: "Tally items during stocktakes or inventory audits." },
      { title: "Event attendance", text: "Count people as they enter a venue or event." },
    ],
    faq: [
      { q: "Does the counter persist after refresh?", a: "Yes. The counter value is saved in your browser's local storage and restored when you return." },
      { q: "Is there a maximum value?", a: "The counter uses 32-bit signed integer range (-2,147,483,648 to 2,147,483,647). Practically unlimited for normal use." },
      { q: "Can I share the counter with someone?", a: "Currently the counter is local to your browser. A 'share count' feature is planned." },
    ],
    relatedTools: ["stopwatch", "countdown", "pomodoro"],
  },

  "countdown": {
    title: "Countdown",
    desc: "Custom countdown timer",
    icon: "⏳",
    category: CATEGORIES.utility,
    description: "Create custom countdown timers for events, deadlines, or Pomodoro sessions. Set hours, minutes, and seconds. Features a visual progress bar, optional alarm sound, and fullscreen mode.",
    howToUse: [
      { heading: "Set the duration", text: "Enter hours, minutes, and seconds for your countdown." },
      { heading: "Start the timer", text: "Click Start. The countdown begins with a visual progress bar." },
      { heading: "Get notified", text: "When time is up, an alarm sound plays and the browser tab flashes." },
    ],
    useCases: [
      { title: "Presentation timing", text: "Keep your conference talks or class presentations on schedule." },
      { title: "Pomodoro sessions", text: "Set a 25-minute timer for focused work sessions with 5-minute breaks." },
      { title: "Event countdown", text: "Set a countdown to an important deadline and keep the tab open for live tracking." },
    ],
    faq: [
      { q: "Will the alarm sound if I switch tabs?", a: "Yes. The alarm uses the Web Audio API and will play even if the tab is in the background (with your permission)." },
      { q: "Can I save multiple countdowns?", a: "The current version supports one active countdown. You can bookmark the page with a URL parameter for quick access." },
      { q: "Does it work offline?", a: "Yes. Once the page loads, the countdown timer works entirely offline." },
    ],
    relatedTools: ["stopwatch", "pomodoro", "counter"],
  },

  "stopwatch": {
    title: "Stopwatch",
    desc: "Online stopwatch tool",
    icon: "⏱️",
    category: CATEGORIES.utility,
    description: "A precise stopwatch with start, pause, lap, and reset functions. Features millisecond precision, lap history, and fullscreen mode. Uses performance.now() for high-precision timing. Essential for sports timing, experiments, and productivity tracking.",
    howToUse: [
      { heading: "Click Start", text: "Press Start to begin timing. The display shows HH:MM:SS.mmm." },
      { heading: "Record laps (optional)", text: "Click Lap to record split times without stopping the main timer." },
      { heading: "Pause or Reset", text: "Pause to freeze the time. Reset to set back to 00:00:00.000." },
    ],
    useCases: [
      { title: "Sports timing", text: "Time runs, swims, cycles, or any sporting activity with lap splits." },
      { title: "Productivity tracking", text: "Time how long specific tasks take to identify productivity bottlenecks." },
      { title: "Science experiments", text: "Measure precise time intervals for physics or chemistry experiments." },
    ],
    faq: [
      { q: "How precise is this stopwatch?", a: "It uses performance.now() which has microsecond precision in modern browsers. Display is limited to milliseconds (mmm)." },
      { q: "Does the stopwatch keep running if I switch tabs?", a: "Yes. The timer uses the Web Worker API to keep timing accurate even when the tab is in the background." },
      { q: "Is there a limit to lap history?", a: "Up to 99 laps can be recorded in a single session. Older laps scroll off the top." },
    ],
    relatedTools: ["countdown", "pomodoro", "counter"],
  },

  "pomodoro": {
    title: "Pomodoro Timer",
    desc: "Pomodoro technique timer",
    icon: "🍅",
    category: CATEGORIES.utility,
    description: "Implement the Pomodoro Technique with a customizable timer: 25 minutes focused work, 5 minutes short break, 15 minutes long break after 4 cycles. Tracks completed pomodoros, sends desktop notifications, and works offline. Boost your productivity with structured work intervals.",
    howToUse: [
      { heading: "Start a Pomodoro", text: "Click Start to begin a 25-minute focused work session." },
      { heading: "Work until the timer rings", text: "Stay focused. The timer will alert you when 25 minutes are up." },
      { heading: "Take a break", text: "Take a 5-minute short break. After 4 pomodoros, take a 15-30 minute long break." },
      { heading: "Repeat", text: "Track your completed pomodoros and aim for 8 per day." },
    ],
    useCases: [
      { title: "Deep work sessions", text: "Structure your day into focused 25-minute blocks with enforced breaks." },
      { title: "Study sessions", text: "Use Pomodoro intervals for studying, with breaks to prevent burnout." },
      { title: "Team productivity", text: "Sync Pomodoro timers with your team for collective focused work sessions." },
    ],
    faq: [
      { q: "What is the science behind Pomodoro?", a: "The technique leverages the brain's natural ultradian rhythm (90-120 min cycles) by breaking work into manageable 25-min chunks with rest intervals." },
      { q: "Can I customize the interval lengths?", a: "Yes. You can adjust work duration (default 25 min), short break (5 min), and long break (15 min) in settings." },
      { q: "Does it work offline?", a: "Yes. The timer is entirely client-side and works offline once loaded." },
    ],
    relatedTools: ["countdown", "stopwatch", "counter"],
  },

  "wheel": {
    title: "Spin Wheel",
    desc: "Random spin wheel tool",
    icon: "🎡",
    category: CATEGORIES.utility,
    description: "Create a custom spin wheel with your own labels and colors. Add up to 50 segments. Features realistic spin animation, sound effects, and result history. Perfect for giveaways, random name picking, and decision making.",
    howToUse: [
      { heading: "Add wheel segments", text: "Type labels for each wheel segment. Set colors or use auto-colors." },
      { heading: "Spin the wheel", text: "Click Spin. Watch the wheel spin with realistic physics." },
      { heading: "View result", text: "The winning segment is highlighted. Result is added to history." },
    ],
    useCases: [
      { title: "Giveaways and contests", text: "Pick random winners for raffles, giveaways, or prize draws." },
      { title: "Classroom name picker", text: "Randomly select students for questions or presentations." },
      { title: "Decision making", text: "Can't decide where to eat? Put options on the wheel and spin." },
    ],
    faq: [
      { q: "Is the spin truly random?", a: "Yes. The stopping position uses cryptographic randomness, not a predictable animation path." },
      { q: "Can I save my wheel configuration?", a: "Yes. The wheel configuration is saved in your browser's local storage." },
      { q: "Is there a segment limit?", a: "Up to 50 segments per wheel. For more, consider splitting into multiple wheels." },
    ],
    relatedTools: ["random-group", "coin-flip", "random-string"],
  },

  "scoreboard": {
    title: "Scoreboard",
    desc: "Real-time score tracker",
    icon: "📊",
    category: CATEGORIES.utility,
    description: "Track scores for games, sports, quizzes, and competitions with a real-time scoreboard. Supports multiple players/teams, undo last change, and fullscreen presentation mode. Perfect for trivia nights, classroom games, and friendly competitions.",
    howToUse: [
      { heading: "Add players/teams", text: "Type names for each player or team. Set initial scores (default 0)." },
      { heading: "Update scores", text: "Click + or - buttons to update scores. Changes animate in real-time." },
      { heading: "Fullscreen mode", text: "Click Fullscreen to display the scoreboard on a projector or large screen." },
    ],
    useCases: [
      { title: "Trivia nights", text: "Track team scores during pub quizzes or trivia events." },
      { title: "Classroom games", text: "Keep score for educational games and friendly classroom competitions." },
      { title: "Sports matches", text: "Track points for casual games (basketball, table tennis, etc.)." },
    ],
    faq: [
      { q: "Does the scoreboard persist after refresh?", a: "Yes. Scores are saved in your browser's local storage." },
      { q: "Can I share the scoreboard on a big screen?", a: "Yes! Use fullscreen mode and connect your device to a projector or TV." },
      { q: "Is there an undo feature?", a: "Yes. Click Undo to revert the last score change." },
    ],
    relatedTools: ["counter", "wheel", "random-group"],
  },

  "keyboard": {
    title: "Keyboard Test",
    desc: "Online keyboard key tester",
    icon: "⌨️",
    category: CATEGORIES.dev,
    description: "Test all keys on your keyboard in real-time. Detects key presses, shows key codes (key, code, keyCode), and identifies unresponsive or stuck keys. Supports modifier keys detection and displays which keys are being held simultaneously. Essential for troubleshooting keyboard hardware issues.",
    howToUse: [
      { heading: "Focus the test area", text: "Click on the keyboard test area to give it focus." },
      { heading: "Press keys", text: "Type on your keyboard. Each key press lights up on the virtual keyboard." },
      { heading: "Check key codes", text: "View the key (character), code (physical key), and keyCode (legacy) values for each keypress." },
    ],
    useCases: [
      { title: "Keyboard troubleshooting", text: "Identify dead or stuck keys on a physical keyboard." },
      { title: "Keybinding development", text: "Understand which key codes your app will receive for specific key combinations." },
      { title: "Accessibility testing", text: "Verify that all keys on a specialized keyboard (ergonomic, gaming) are recognized." },
    ],
    faq: [
      { q: "What is the difference between key and code?", a: "'key' is the character value (e.g., 'a', 'A', '1'). 'code' is the physical key position (e.g., 'KeyA') regardless of keyboard layout." },
      { q: "Why doesn't my media key show up?", a: "Media keys (play/pause, volume) are often handled at the OS level and don't generate standard keyboard events. They may not appear in the tester." },
      { q: "Is this tool useful for game development?", a: "Yes. Use it to understand which physical keys map to which key codes when implementing WASD or arrow key controls." },
    ],
    relatedTools: ["color-picker", "unicode", "case-converter"],
  },

  // ==================== Image Tools ====================
  "image-resize": {
    title: "Image Resizer",
    desc: "Resize images by width, height, or fit mode",
    icon: "📐",
    category: CATEGORIES.image,
    description: "Resize images to exact dimensions with fit modes (cover, contain, stretch). Supports JPG, PNG, WebP, and AVIF output formats. Maintains aspect ratio or stretches to fit. All processing uses Sharp (server-side) for high-quality resampling.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Set target size", text: "Enter target width and height in pixels. Choose fit mode: Cover (crop), Contain (letterbox), or Stretch." },
      { heading: "Choose output format", text: "Select JPG, PNG, WebP, or AVIF. Set quality (for lossy formats)." },
      { heading: "Resize and download", text: "Click Resize. Preview and download the result." },
    ],
    useCases: [
      { title: "Social media images", text: "Resize images to exact dimensions required by Twitter, Instagram, Facebook, LinkedIn." },
      { title: "Web optimization", text: "Generate multiple sizes from a single source image for responsive srcset." },
      { title: "Print preparation", text: "Resize images to print resolution (300 DPI) from screen resolution (72 DPI)." },
    ],
    faq: [
      { q: "What fit mode should I use?", a: "Cover = crop to fill (may cut off edges). Contain = fit inside (may add letterbox). Stretch = force exact dimensions (may distort)." },
      { q: "What is the best output format?", a: "WebP = smallest file size with good quality. AVIF = even smaller but less browser support. JPG = max compatibility. PNG = only if you need transparency." },
      { q: "Is my image data private?", a: "Images are processed server-side (using Sharp). They are not stored permanently. Uploaded images are deleted after processing." },
    ],
    relatedTools: ["image-compress", "image-convert", "image-crop"],
  },

  "image-crop": {
    title: "Image Cropper",
    desc: "Crop images to exact pixel coordinates",
    icon: "✂️",
    category: CATEGORIES.image,
    description: "Crop images to exact pixel coordinates with an interactive crop box. Supports aspect ratio lock (1:1, 4:3, 16:9, freeform) and preset sizes. Server-side processing with Sharp for high-quality output. Essential for profile pictures, social media posts, and print layouts.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Adjust crop box", text: "Drag the corners to set the crop region. Or enter exact X, Y, width, height values." },
      { heading: "Set aspect ratio (optional)", text: "Lock aspect ratio to 1:1 (square), 4:3, 16:9, or freeform." },
      { heading: "Crop and download", text: "Click Crop. Download the result as JPG, PNG, or WebP." },
    ],
    useCases: [
      { title: "Profile pictures", text: "Crop photos to 1:1 square for profile pictures (Twitter, LinkedIn, GitHub)." },
      { title: "Social media posts", text: "Crop to 16:9 (landscape) or 9:16 (portrait/story) for social platforms." },
      { title: "Print layouts", text: "Crop images to exact print dimensions (e.g., 4×6 inches at 300 DPI)." },
    ],
    faq: [
      { q: "Can I crop to a specific aspect ratio?", a: "Yes. Lock the aspect ratio to 1:1, 4:3, 16:9, or any custom ratio." },
      { q: "Does cropping reduce image quality?", a: "Cropping itself doesn't reduce quality. But if you crop a small region and then enlarge it, quality will degrade. Always start with the highest-resolution source available." },
      { q: "Is my image data private?", a: "Images are processed server-side and deleted after processing. Not permanently stored." },
    ],
    relatedTools: ["image-resize", "image-compress", "image-border"],
  },

  "image-compress": {
    title: "Image Compressor",
    desc: "Compress images with quality control",
    icon: "🗜️",
    category: CATEGORIES.image,
    description: "Reduce image file size without noticeable quality loss. Supports JPG (quality slider), PNG (palette reduction), and WebP/AVIF (superior compression). Shows before/after file size and visual comparison. Essential for web performance optimization.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image (JPG, PNG, WebP, AVIF) or click to browse." },
      { heading: "Adjust compression level", text: "For JPG/WebP: set quality (0-100). Lower = smaller file. For PNG: reduce color palette." },
      { heading: "Preview and compare", text: "See before/after file size and visual quality comparison." },
      { heading: "Download", text: "Download the compressed image. Keep the original as a backup." },
    ],
    useCases: [
      { title: "Web performance", text: "Compress images before uploading to your website to improve page load speed." },
      { title: "Email attachments", text: "Reduce image file sizes to stay within email attachment limits (usually 10-25 MB)." },
      { title: "Mobile app optimization", text: "Compress images for mobile apps to reduce app bundle size and data usage." },
    ],
    faq: [
      { q: "What quality setting should I use for JPG?", a: "80-85 is a good balance between file size and visual quality. Below 70, artifacts become noticeable." },
      { q: "Is WebP always smaller than JPG?", a: "Yes, for the same visual quality, WebP is typically 25-35% smaller. But not all browsers support WebP (very old Safari/Chrome)." },
      { q: "Should I compress PNG?", a: "PNG is lossless. Compression reduces the color palette (lossy) or re-compresses with Zlib (lossless). For photos, convert to JPG/WebP for better compression." },
    ],
    relatedTools: ["image-resize", "image-convert", "image-strip-metadata"],
  },

  "image-convert": {
    title: "Image Converter",
    desc: "Convert between JPEG, PNG, WebP, AVIF, TIFF",
    icon: "🔄",
    category: CATEGORIES.image,
    description: "Convert images between JPG, PNG, WebP, AVIF, and TIFF formats. Supports batch conversion, quality settings for lossy formats, and transparency preservation for PNG/WebP. Server-side processing with Sharp for fast, high-quality conversion.",
    howToUse: [
      { heading: "Upload images", text: "Drag and drop one or multiple images. Supports JPG, PNG, WebP, AVIF, TIFF, BMP, GIF." },
      { heading: "Choose output format", text: "Select target format: JPG, PNG, WebP, or AVIF." },
      { heading: "Set options", text: "For JPG/WebP: set quality. For PNG: choose palette size. For AVIF: set speed vs. compression tradeoff." },
      { heading: "Convert and download", text: "Click Convert. Download individual files or as a ZIP." },
    ],
    useCases: [
      { title: "Web migration", text: "Convert all site images from PNG to WebP/AVIF for better compression and faster loading." },
      { title: "Print preparation", text: "Convert WebP/AVIF (which printers don't support) to high-quality JPG or TIFF." },
      { title: "App store assets", text: "Convert images to PNG (required by iOS App Store and Google Play Store)." },
    ],
    faq: [
      { q: "What format should I use for my website?", a: "WebP for photos (best compression). PNG for logos/icons with transparency. AVIF is even better but has limited browser support (check caniuse.com/avif)." },
      { q: "Does converting JPG→PNG improve quality?", a: "No. JPG is lossy. Converting to PNG preserves the compressed JPG quality (artifacts included) but doesn't improve it. PNG is best for images that were created as PNG originally." },
      { q: "Is AVIF ready for production use?", a: "AVIF has ~90% browser support (all modern browsers except very old ones). Provide WebP as fallback." },
    ],
    relatedTools: ["image-compress", "image-resize", "png-to-svg"],
  },

  "image-rotate": {
    title: "Image Rotator",
    desc: "Rotate images by any angle",
    icon: "↪️",
    category: CATEGORIES.image,
    description: "Rotate images by exact angle (0-360°) or use preset rotations (90°, 180°, 270°). Supports auto-rotate based on EXIF orientation (fixes sideways photos from cameras and phones). Server-side processing with Sharp.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Set rotation angle", text: "Enter angle in degrees (e.g., 45 for diagonal tilt) or use preset buttons (90°, 180°, 270°)." },
      { heading: "Auto-rotate from EXIF (optional)", text: "Toggle 'Auto-rotate from EXIF' to fix sideways photos automatically." },
      { heading: "Rotate and download", text: "Click Rotate. Download the result." },
    ],
    useCases: [
      { title: "Fix sideways photos", text: "Auto-rotate photos that appear sideways due to EXIF orientation metadata." },
      { title: "Creative design", text: "Rotate images by non-90° angles for creative layout designs." },
      { title: "Scanned document correction", text: "Rotate scanned pages that were fed upside-down into the scanner." },
    ],
    faq: [
      { q: "What is EXIF orientation?", a: "Cameras and phones record which way the device was held when taking a photo. EXIF orientation tag tells viewers to rotate the image. Some viewers ignore it, causing sideways photos." },
      { q: "Does rotating reduce image quality?", a: "Rotating by 90°/180°/270° is lossless (just rearranges pixels). Rotating by arbitrary angles requires resampling and may slightly reduce quality." },
      { q: "Can I rotate multiple images at once?", a: "Batch rotation is a planned feature. Currently, rotate images one at a time." },
    ],
    relatedTools: ["image-crop", "image-resize", "image-color-adjust"],
  },

  "image-color-palette": {
    title: "Color Palette",
    desc: "Extract dominant colors from any image",
    icon: "🎨",
    category: CATEGORIES.image,
    description: "Extract the dominant color palette from any image using K-means clustering. Get HEX, RGB, and HSL values for each color. Visualize the palette and copy values for use in CSS, design tools, or brand guidelines. Essential for brand color extraction and design inspiration.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Set palette size", text: "Choose how many dominant colors to extract (3, 5, 8, 16, or 32)." },
      { heading: "View palette", text: "Dominant colors are displayed as swatches with HEX, RGB, and HSL values." },
      { heading: "Copy colors", text: "Click any color to copy its HEX code. Or copy the entire palette as a CSS custom properties block." },
    ],
    useCases: [
      { title: "Brand color extraction", text: "Upload a logo or brand asset to extract the official color palette." },
      { title: "Design inspiration", text: "Upload photos from nature, architecture, or art to extract beautiful color palettes for your designs." },
      { title: "Website theming", text: "Extract a color palette from a hero image to use as your website's accent colors." },
    ],
    faq: [
      { q: "How does color extraction work?", a: "We use K-means clustering to group similar pixels by color, then find the center of each cluster. This gives the most visually dominant colors." },
      { q: "Can I extract colors from a specific region?", a: "Not currently. The entire image is analyzed. Crop the image first if you want region-specific colors." },
      { q: "What format are the color values in?", a: "HEX (#FF5733), RGB (255, 87, 51), and HSL (11°, 100%, 60%). All three are shown for each color." },
    ],
    relatedTools: ["color-picker", "image-border", "svg-editor"],
  },

  "image-favicon": {
    title: "Favicon Generator",
    desc: "Generate favicon from any image",
    icon: "🖼️",
    category: CATEGORIES.image,
    description: "Generate favicon.ico files from any image. Auto-resizes to 16×16, 32×32, 48×48, and 64×64 pixels. Supports transparency and produces a multi-size .ico file compatible with all browsers. Also exports individual PNG sizes for Apple touch icons and Android Chrome icons.",
    howToUse: [
      { heading: "Upload an image", text: "Use a square image (PNG with transparency works best). The tool will crop to square if needed." },
      { heading: "Preview favicon", text: "Preview how the favicon looks at 16×16, 32×32, and 64×64 pixels." },
      { heading: "Generate and download", text: "Click Generate. Download favicon.ico plus optional PNG sizes for Apple/Android." },
    ],
    useCases: [
      { title: "Website branding", text: "Generate a favicon from your logo for your website's browser tab icon." },
      { title: "App icon creation", text: "Create favicon and touch icons from a single source image for your web app manifest." },
      { title: "Browser tab optimization", text: "Ensure your site stands out in users' browser tab bars with a recognizable icon." },
    ],
    faq: [
      { q: "What image format should I use as input?", a: "PNG with transparent background works best. SVG also works (it will be rasterized). JPG works but transparency will be lost." },
      { q: "What sizes are included in the .ico file?", a: "16×16, 32×32, 48×48, and 64×64 pixels. Browsers automatically pick the best size." },
      { q: "Do I also need Apple touch icons?", a: "Yes, for iOS home screen bookmarks. The tool can export 180×180 and 192×192 PNGs for this purpose." },
    ],
    relatedTools: ["image-resize", "image-crop", "image-color-palette"],
  },

  "image-strip-metadata": {
    title: "Strip Metadata",
    desc: "Remove EXIF and metadata from images",
    icon: "🧹",
    category: CATEGORIES.image,
    description: "Remove all metadata (EXIF, GPS location, camera model, creation date, software info) from images before sharing them online. Protects your privacy by stripping location data and device info. Supports JPG, PNG, WebP, TIFF, and AVIF.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse. JPG, PNG, WebP, TIFF, AVIF are supported." },
      { heading: "View current metadata (optional)", text: "Toggle 'Show metadata' to see what info is currently embedded." },
      { heading: "Strip metadata", text: "Click Strip. A clean copy of the image is generated without any metadata." },
      { heading: "Download", text: "Download the cleaned image. The original (with metadata) is not modified." },
    ],
    useCases: [
      { title: "Privacy protection", text: "Remove GPS location data from photos before sharing on social media." },
      { title: "File size reduction", text: "Metadata can add 10-50KB per image. Stripping it reduces file size slightly." },
      { title: "Professional sharing", text: "Remove camera model, lens info, and software details before sending photos to clients." },
    ],
    faq: [
      { q: "What metadata is removed?", a: "EXIF (camera settings, GPS), XMP (Adobe metadata), ICC color profiles (optional), and software-specific tags." },
      { q: "Does stripping metadata reduce image quality?", a: "No. The image pixels are untouched. Only the metadata blocks are removed. Quality is preserved." },
      { q: "Should I keep color profile (ICC) metadata?", a: "If you're printing, keep it. If you're displaying on the web, you can safely strip it (browsers ignore embedded ICC profiles and use sRGB)." },
    ],
    relatedTools: ["image-compress", "image-convert", "image-info"],
  },

  "image-info": {
    title: "Image Info",
    desc: "Read dimensions, format, and metadata",
    icon: "📋",
    category: CATEGORIES.image,
    description: "Read image properties: dimensions (width × height), file format, MIME type, file size, color space, EXIF metadata, and more. Supports JPG, PNG, WebP, AVIF, GIF, SVG, TIFF, BMP. Essential for verifying image assets before using them in production.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "View image properties", text: "Dimensions, file size, format, color space, and EXIF metadata are displayed." },
      { heading: "Copy info (optional)", text: "Copy specific properties or the full info report as JSON." },
    ],
    useCases: [
      { title: "Pre-upload verification", text: "Check image dimensions and file size before uploading to a CMS with size limits." },
      { title: "SEO auditing", text: "Verify that images have reasonable file sizes and dimensions for web performance." },
      { title: "Debugging image issues", text: "Check if an image is truly transparent (PNG) or if the color space is correct (sRGB vs. Adobe RGB)." },
    ],
    faq: [
      { q: "What is the difference between dimensions and pixel count?", a: "Dimensions = width × height in pixels. Pixel count = width × height (total pixels). A 1920×1080 image has ~2 megapixels." },
      { q: "Why does my image look different on different devices?", a: "Color space mismatch. sRGB is the standard for web. Adobe RGB or ProPhoto RGB images may look desaturated on devices that don't support wide gamut." },
      { q: "Can I see GPS location from EXIF?", a: "Yes, if the photo was taken with a GPS-enabled camera/phone and geotagging was enabled. Use 'Strip Metadata' tool to remove it before sharing." },
    ],
    relatedTools: ["image-strip-metadata", "image-resize", "image-color-palette"],
  },

  "image-border": {
    title: "Image Border",
    desc: "Add colored borders to images",
    icon: "🖼️",
    category: CATEGORIES.image,
    description: "Add customizable solid-color borders to images. Set border width (px), color (HEX or color picker), and padding between image and border. Supports round corners and shadow effects. Essential for product photos, social media posts, and framed screenshots.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Set border properties", text: "Choose border width (px), color (HEX or use color picker), and corner radius (for rounded corners)." },
      { heading: "Add padding (optional)", text: "Set padding between the image and the border for a mat/frame effect." },
      { heading: "Apply and download", text: "Click Apply. Preview and download the result." },
    ],
    useCases: [
      { title: "Product photos", text: "Add consistent borders to product images for e-commerce catalogs." },
      { title: "Social media posts", text: "Add branded color borders to images for Instagram, Pinterest, or Twitter." },
      { title: "Screenshot framing", text: "Add a border to screenshots to make them stand out in presentations." },
    ],
    faq: [
      { q: "Can I add a gradient border?", a: "Currently only solid color borders are supported. Gradient borders are a planned feature." },
      { q: "Does the border increase the image file size?", a: "Yes, slightly. The border is part of the image pixels. Expect a small file size increase." },
      { q: "Can I add different border widths per side?", a: "Currently uniform border width is applied to all sides. Asymmetric borders are a planned feature." },
    ],
    relatedTools: ["image-color-adjust", "image-watermark", "color-picker"],
  },

  "image-watermark": {
    title: "Watermark",
    desc: "Add text watermarks to images",
    icon: "©️",
    category: CATEGORIES.image,
    description: "Add customizable text watermarks to images for copyright protection. Set text content, font, size, color, opacity, rotation angle, and position. Supports batch watermarking. Essential for photographers, designers, and content creators protecting their work.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Set watermark text and style", text: "Type watermark text (e.g., © 2026 Your Name). Set font, size, color, and opacity." },
      { heading: "Position the watermark", text: "Choose position (corners, center, tile) and rotation angle (for diagonal watermark)." },
      { heading: "Apply and download", text: "Click Apply. Preview and download the watermarked image." },
    ],
    useCases: [
      { title: "Copyright protection", text: "Add © watermark to photos before sharing them online to deter unauthorized use." },
      { title: "Branding", text: "Add your company name or logo as a watermark to marketing materials." },
      { title: "Draft watermarking", text: "Mark preview images as 'DRAFT' or 'CONFIDENTIAL' before sharing with clients." },
    ],
    faq: [
      { q: "Is a watermark legally enforceable copyright?", a: "No. Watermarks deter casual theft but don't establish legal copyright (which is automatic upon creation in most countries). Use them as a deterrent, not a legal protection." },
      { q: "Can I remove a watermark from an image?", a: "Not perfectly. Watermark removal requires advanced image editing (Clone Stamp, Content-Aware Fill). It is always visible to some degree. Don't rely on watermarks alone for high-value content." },
      { q: "Can I use an image (logo) as watermark instead of text?", a: "Currently text-only. Image watermark (logo) is a planned feature." },
    ],
    relatedTools: ["image-border", "image-text-overlay", "image-color-adjust"],
  },

  "image-color-adjust": {
    title: "Color Adjust",
    desc: "Adjust brightness, contrast, saturation",
    icon: "🎚️",
    category: CATEGORIES.image,
    description: "Adjust image brightness, contrast, saturation, hue, and sharpness with live preview. Supports auto-enhance (auto contrast + saturation) and preset filters (vintage, sepia, black & white, vivid). Essential for photo touch-ups before posting online.",
    howToUse: [
      { heading: "Upload an image", text: "Drag and drop an image or click to browse." },
      { heading: "Adjust sliders", text: "Use sliders for brightness, contrast, saturation, hue, and sharpness. Preview updates in real-time." },
      { heading: "Apply preset filter (optional)", text: "Choose from Vintage, Sepia, B&W, Vivid, Cool, or Warm presets." },
      { heading: "Apply and download", text: "Click Apply. Download the adjusted image." },
    ],
    useCases: [
      { title: "Social media photos", text: "Enhance photos before posting to Instagram, Twitter, or LinkedIn." },
      { title: "Product photography", text: "Adjust brightness and contrast of product photos for e-commerce." },
      { title: "Real estate photos", text: "Enhance interior/exterior shots for property listings." },
    ],
    faq: [
      { q: "Does this tool use AI enhancement?", a: "No. Adjustments are traditional image processing (histogram adjustment, convolution filters). AI enhancement is a planned feature." },
      { q: "What is the difference between saturation and vibrance?", a: "Saturation boosts all colors equally. Vibrance boosts muted colors more than already-saturated ones, preventing skin tones from looking unnatural." },
      { q: "Is my image data private?", a: "Images are processed server-side and deleted after processing. Not permanently stored." },
    ],
    relatedTools: ["image-compress", "image-border", "image-watermark"],
  },

  "image-passport-photo": {
    title: "Passport Photo",
    desc: "Generate passport and visa photos",
    icon: "📸",
    category: CATEGORIES.image,
    description: "Generate compliant passport and visa photos from a regular photo. Auto-detects face position, crops to correct dimensions, and adjusts background color to meet official requirements (white, light gray, or off-white). Supports US, UK, EU, China, and 50+ other country specifications.",
    howToUse: [
      { heading: "Upload a photo", text: "Use a frontal face photo with neutral expression and plain background." },
      { heading: "Select country specification", text: "Choose the country (US, UK, Schengen, China, etc.) to auto-apply correct dimensions and background." },
      { heading: "Adjust crop and background", text: "Fine-tune face position and background color if auto-detection needs correction." },
      { heading: "Generate and download", text: "Click Generate. Download the passport-compliant photo." },
    ],
    useCases: [
      { title: "Visa applications", text: "Generate visa-compliant photos for US, UK, Schengen, or other visa applications." },
      { title: "Passport renewal", text: "Create passport-compliant photos from home instead of going to a photo studio." },
      { title: "ID card photos", text: "Generate photos that meet national ID card specifications." },
    ],
    faq: [
      { q: "Is this accepted by official passport agencies?", a: "The tool follows official dimension and background specifications. However, some countries require photos to be taken by an approved studio. Always check the official requirements." },
      { q: "What are the common specifications?", a: "US passport: 2×2 inches (51×51 mm). Schengen visa: 35×45 mm. UK passport: 35×45 mm. China passport: 33×48 mm." },
      { q: "Can I fix background color?", a: "Yes. The tool can replace background with white, light gray, or off-white to meet official requirements." },
    ],
    relatedTools: ["image-crop", "image-resize", "image-color-adjust"],
  },

  "image-generate-memes": {
    title: "Meme Generator",
    desc: "Add top and bottom text to any image",
    icon: "😂",
    category: CATEGORIES.image,
    description: "Create memes by adding customizable top and bottom text to any image. Choose from classic meme fonts (Impact, Arial), set text size, color, outline, and alignment. Also includes a library of popular meme templates. Download as PNG for social sharing.",
    howToUse: [
      { heading: "Upload an image or choose template", text: "Upload your own image or pick from popular meme templates (Distracted Boyfriend, Drake, etc.)." },
      { heading: "Add top and bottom text", text: "Type top text and bottom text. Adjust font size, color, and outline." },
      { heading: "Preview and download", text: "Preview the meme. Click Download to save as PNG." },
    ],
    useCases: [
      { title: "Social media marketing", text: "Create meme-style posts to increase engagement on Twitter, Instagram, LinkedIn." },
      { title: "Team communication", text: "Create lighthearted memes for team chats and internal newsletters." },
      { title: "Event promotion", text: "Create funny memes to promote events, product launches, or campaigns." },
    ],
    faq: [
      { q: "What font is used for memes?", a: "Impact (bold, white with black outline) is the classic meme font. This tool also supports Arial and Comic Sans." },
      { q: "Can I use this for commercial purposes?", a: "Using popular meme templates is generally fine for commercial use. However, ensure you have rights to the source image if you're not using the built-in templates." },
      { q: "Can I add more text boxes?", a: "Currently top + bottom only. Multi-text-box support is a planned feature." },
    ],
    relatedTools: ["image-watermark", "image-border", "text-formatter"],
  },

  "image-beautify-screenshots": {
    title: "Beautify Screenshots",
    desc: "Add padding, shadow, and borders to screenshots",
    icon: "✨",
    category: CATEGORIES.image,
    description: "Transform raw screenshots into polished marketing assets. Add padding, rounded corners, drop shadow, browser window frame, and gradient background. Essential for product hunt launches, documentation, and sales decks. Make your app screenshots look professional with one click.",
    howToUse: [
      { heading: "Upload a screenshot", text: "Drag and drop a browser or app screenshot. PNG with transparency works best." },
      { heading: "Choose a style preset", text: "Select from: Browser Window, Phone Frame, Drop Shadow, Gradient Background, or Minimal." },
      { heading: "Customize", text: "Adjust padding, corner radius, shadow intensity, and background gradient." },
      { heading: "Apply and download", text: "Click Apply. Download as PNG with transparent background or solid background." },
    ],
    useCases: [
      { title: "Product Hunt launch", text: "Create beautiful screenshot assets for your Product Hunt launch gallery." },
      { title: "Documentation", text: " Beautify screenshots for user guides, tutorials, and API docs." },
      { title: "Sales decks", text: "Add polished screenshots to investor pitches and sales presentations." },
    ],
    faq: [
      { q: "What is the best output format?", a: "PNG with transparent background gives you the most flexibility for placing screenshots on different backgrounds in your designs." },
      { q: "Can I add a browser window frame?", a: "Yes. The Browser Window preset adds a macOS-style title bar (red/yellow/green dots) above your screenshot." },
      { q: "Is my screenshot data private?", a: "Images are processed server-side and deleted after processing. Not stored permanently." },
    ],
    relatedTools: ["image-border", "image-color-adjust", "svg-editor"],
  },

  "find-duplicates": {
    title: "Find Duplicates",
    desc: "Compare images and detect duplicates with perceptual hashing",
    icon: "🔍",
    category: CATEGORIES.image,
    description: "Detect duplicate or near-duplicate images using perceptual hashing (pHash). Finds images that are visually similar even if they have different file names, formats, or slight color/size variations. Essential for cleaning up photo libraries and removing redundant assets.",
    howToUse: [
      { heading: "Upload images to compare", text: "Drag and drop 2 or more images. Or upload an entire folder of images for batch comparison." },
      { heading: "Set similarity threshold", text: "Adjust the threshold (0-100%). Higher = only exact duplicates. Lower = includes visually similar images." },
      { heading: "Scan for duplicates", text: "Click Scan. The tool computes perceptual hashes and compares them." },
      { heading: "Review results", text: "Duplicate/near-duplicate pairs are displayed with similarity score. Choose which to delete." },
    ],
    useCases: [
      { title: "Photo library cleanup", text: "Find and remove duplicate photos from your collection (same photo saved multiple times, edited vs. original, etc.)." },
      { title: "Asset deduplication", text: "Clean up design asset folders by finding visually identical images with different names or formats." },
      { title: "Copyright enforcement", text: "Find unauthorized copies of your images that have been slightly modified (cropped, recompressed, color-adjusted)." },
    ],
    faq: [
      { q: "What is perceptual hashing?", a: "Unlike cryptographic hashing (MD5, SHA), perceptual hashing generates similar hashes for visually similar images. Two images that are 90% similar will have similar pHash values." },
      { q: "Can it detect cropped or resized duplicates?", a: "Yes. Perceptual hash is resilient to resizing and minor cropping. But heavily cropped images may not match." },
      { q: "What similarity threshold should I use?", a: "90%+ = near-exact duplicates. 70-90% = visually very similar (likely duplicates with minor edits). Below 70% = similar but possibly different images." },
    ],
    relatedTools: ["image-info", "image-compress", "image-strip-metadata"],
  },

  "file-viewer": {
    title: "File Viewer",
    desc: "Preview 135+ file formats — PDF, Word, Excel, CAD, 3D, images & more",
    icon: "👁️",
    category: CATEGORIES.dev,
    badge: "New",
    description: "Preview <strong>135+ file formats</strong> directly in your browser — no software installation needed. Supports PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PowerPoint (PPT/PPTX), CAD files (DWG/DXF), 3D models (STL/OBJ/GLTF), images (JPG/PNG/GIF/WEBP/HEIC), archives (ZIP/RAR/7Z), code files, e-books (EPUB), audio/video, fonts, and more.<br/><br/><strong>100% private:</strong> All processing happens locally in your browser. Files are never uploaded to any server. Your data stays on your device.",
    howToUse: [
      { heading: "Upload or drag & drop", text: "Drag a file onto the upload zone, or click to browse your computer. You can also paste a direct file URL." },
      { heading: "Wait for preview", text: "The file is processed locally in your browser and rendered in the preview viewer. No upload — just instant local rendering." },
      { heading: "Explore the file", text: "Zoom, pan, scroll, and navigate through your file. The viewer supports page navigation for multi-page documents." },
      { heading: "Open another file", text: "Click 'Close' or drop another file to preview something different. Each preview is independent." },
    ],
    useCases: [
      { title: "Quick document check", text: "Open a Word/Excel/PPT attachment without launching Microsoft Office. Perfect for email attachments and Slack files." },
      { title: "Design review", text: "Preview CAD files (DWG/DXF) and 3D models (STL/OBJ) from clients without installing AutoCAD or Fusion 360." },
      { title: "Archive inspection", text: "Peek inside ZIP/RAR archives before extracting. Preview archived images and documents directly." },
      { title: "Code browsing", text: "Quickly view source code files with syntax awareness. Supports JavaScript, Python, Java, C++, Rust, and more." },
    ],
    faq: [
      { q: "Are my files uploaded to a server?", a: "No. Files are processed entirely in your browser using local Blob URLs. No data ever leaves your device." },
      { q: "What is the maximum file size?", a: "50 MB. Larger files may cause performance issues in the browser." },
      { q: "Which file formats are supported?", a: "135+ formats across 11 categories: Documents, Spreadsheets, Presentations, Images, 3D/CAD, Archives, Code, Audio, Video, E-Books, and Fonts. See the full list on the tool page." },
      { q: "Does it work on mobile?", a: "Yes. The viewer is fully responsive and works on iOS Safari and Android Chrome. Use the floating action button to access file controls." },
      { q: "Can I edit files?", a: "No. This is a preview-only tool. For PDF editing, check out our dedicated PDF tools." },
    ],
    relatedTools: ["pdf-viewer", "markdown", "diff", "csv-json"],
  },

  "create-gif": {
    title: "Create GIF",
    desc: "Create animated GIFs from multiple image frames",
    icon: "🎞️",
    category: CATEGORIES.image,
    description: "Create animated GIFs from multiple image frames. Upload sequential images (frame1.png, frame2.png, ...) or extract frames from a video. Set frame delay (speed), loop count (once or infinite), and optimize for file size. Essential for creating animated demos, loading spinners, and social media animations.",
    howToUse: [
      { heading: "Upload image frames", text: "Drag and drop multiple images in order (they will be animated sequentially)." },
      { heading: "Set animation parameters", text: "Set frame delay (ms per frame), loop count (1 = play once, 0 = loop infinitely)." },
      { heading: "Preview animation", text: "Preview the animated GIF. Adjust timing if needed." },
      { heading: "Generate and download", text: "Click Generate GIF. Download the result." },
    ],
    useCases: [
      { title: "Loading spinners", text: "Create animated loading indicators for websites and apps." },
      { title: "Product demos", text: "Create GIF animations showing how to use a feature in your app." },
      { title: "Social media animations", text: "Create short animated posts for Twitter, LinkedIn, or Slack." },
    ],
    faq: [
      { q: "What is the maximum GIF file size?", a: "Limited by browser memory. For GIFs over ~10 MB, consider using MP4 or WebM (video) instead — they have much better compression for animations." },
      { q: "Can I edit an existing GIF?", a: "Upload the GIF frames (you'll need to extract frames first using another tool). This tool creates GIFs from images; it doesn't edit existing GIFs." },
      { q: "Why is my GIF file so large?", a: "GIF uses lossless compression and is limited to 256 colors per frame. For smaller files, use video format (MP4) or convert to WebP animated image." },
    ],
    relatedTools: ["image-to-pixel", "image-convert", "image-compress"],
  },

  // ==================== PDF Tools (external) ====================
  "pdf-tools": {
    title: "PDF Tools",
    desc: "Merge, split, compress, convert PDF files online",
    icon: "📄",
    badge: "New",
    category: CATEGORIES.converter,
    external: true,
    url: "https://pdf.craftisle.com",
  },
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
