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
  /** Star rating 1-5, used for homepage Top Tools ranking */
  stars?: number;
  /** SEO-optimized title (for <title> tag) */
  seoTitle?: string;
  /** SEO-optimized description (150-160 chars, for <meta description>) */
  seoDesc?: string;
  /** SEO keywords array for <meta keywords> */
  seoKeywords?: string[];
}

// Category constants
export const CATEGORIES = {
  encryption: "Encryption & Hashing",
  formatter: "Formatters",
  converter: "Converters",
  dev: "Developer Tools",
  generator: "Generators",
  text: "Text Tools",
  json: "JSON Tools",
  time: "Time Tools",
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
    stars: 5,
    seoTitle: "AES/DES Encrypt & Decrypt Free — Online Symmetric Encryption | Craftisle",
    seoDesc: "Free AES & DES encryption tool online. Encrypt and decrypt text or files in browser. Supports ECB/CBC modes, 128/256-bit keys. No upload, 100% client-side.",
    seoKeywords: [
    "AES encryption online free no signup",
    "DES encrypt decrypt text online",
    "symmetric encryption tool free browser",
    "AES-256 online tool no registration",
    "encrypt text online free tool",
    "AES ECB mode online free",
    "AES CBC mode online free",
    "DES encryption online decrypt",
    "free AES tool online no upload",
    "client side AES encryption online",
    "secure text encryption online free",
    "AES vs DES which is better",
    "encrypt file online free AES",
    "decrypt AES online free tool",
    "AES 128 192 256 bit online",
    "free online AES encrypt decrypt"
  ],
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
    stars: 4,
    seoTitle: "Bcrypt Hash Tool Free — Password Hashing Online | Craftisle",
    seoDesc: "Free bcrypt password hashing tool online. Securely hash passwords with adjustable cost factor. GPU-resistant, client-side processing. No signup required.",
    seoKeywords: [
    "Base64 encoder online free",
    "Base64 decoder online free",
    "encode to Base64 free online",
    "decode Base64 string online",
    "Base64 file upload online free",
    "Base64 encode no signup free",
    "decode Base64 online free tool",
    "Base64 converter online free",
    "free Base64 tool browser based",
    "Base64 string encoder online",
    "online Base64 encoder free",
    "Base64 file encoder online"
  ],
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
    seoTitle: "Hash Generator Free — MD5/SHA256/SHA512 Online | Craftisle",
    seoDesc: "Free hash generator online. Generate MD5, SHA-1, SHA-256, SHA-512, RIPEMD-160 hashes. File integrity check. 100% client-side, no upload.",
    seoKeywords: ["hash generator online free", "MD5 online tool", "SHA256 hash online", "file integrity check", "SHA-512 generator free", "Craftisle hash tool"],
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
    seoTitle: "JWT Decoder Free — Debug JSON Web Tokens | Craftisle",
    seoDesc: "Free JWT decoder online. Inspect header, payload and signature of JSON Web Tokens. Check expiration. Debug authentication flows in browser.",
    seoKeywords: ["JWT decoder online free", "decode JWT token", "JWT payload viewer", "JSON web token debugger", "JWT expiration check", "Craftisle JWT tool"],
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
    seoTitle: "JSON Formatter & Validator Free Online | Craftisle",
    seoDesc: "Free JSON formatter and validator online. Beautify, minify, tree view. Validate JSON syntax with line numbers. No upload — 100% browser-based.",
    seoKeywords: [
    "JSON formatter online free",
    "JSON validator online free",
    "beautify JSON online free",
    "minify JSON online free",
    "JSON tree view online free",
    "validate JSON syntax online",
    "JSON formatter no signup free",
    "format JSON online pretty",
    "JSON minify online free tool",
    "JSON validator line number",
    "free JSON tool browser based",
    "JSON error checker online",
    "format JSON online no upload",
    "online JSON beautifier free"
  ],
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
  "json-minify": {
    title: "Minify JSON",
    desc: "Remove whitespace from JSON",
    icon: "📦",
    category: CATEGORIES.json,
    seoTitle: "Minify JSON Free — Online Tool | Craftisle",
    seoDesc: "Free minify JSON online tool. Remove whitespace from JSON. 100% browser-based.",
    seoKeywords: ["minify json", "compress json", "json minifier", "remove whitespace"],
    description: "Remove whitespace from JSON to make it compact.",
    howToUse: [
      { heading: "Enter JSON", text: "Type or paste JSON to minify." },
      { heading: "Process", text: "Click Minify to remove whitespace." },
      { heading: "Copy Result", text: "Copy the minified JSON." }
    ],
    faq: [
      { q: "What does minify do?", a: "Minify removes all unnecessary whitespace from JSON, making it compact." },
      { q: "Is the original JSON validated?", a: "Yes, the input must be valid JSON before minification." }
    ],
    relatedTools: ["json-formatter", "json-validator", "yaml-minify"]
  },

  "json-comparison": {
    title: "JSON Compare",
    desc: "Compare two JSON objects and find differences",
    icon: "🔍",
    category: CATEGORIES.json,
    seoTitle: "JSON Compare Free — Online Tool | Craftisle",
    seoDesc: "Free JSON compare online tool. Compare two JSON objects and find differences. 100% browser-based.",
    seoKeywords: ["json compare", "compare json", "json diff", "json difference"],
    description: "Compare two JSON objects and find differences between them.",
    howToUse: [
      { heading: "Enter JSON", text: "Type or paste two JSON objects to compare." },
      { heading: "Compare", text: "Click Compare to find differences." },
      { heading: "Review", text: "Review the differences in text or JSON format." }
    ],
    faq: [
      { q: "What format is the output?", a: "You can choose text (human-readable) or JSON (structured) output format." },
      { q: "Does it support nested objects?", a: "Yes, the tool recursively compares nested objects and arrays." }
    ],
    relatedTools: ["json-formatter", "json-validator", "diff-checker"]
  },

  "json-sort": {
    title: "Sort JSON",
    desc: "Sort JSON keys alphabetically",
    icon: "🔤",
    category: CATEGORIES.json,
    seoTitle: "Sort JSON Free — Online Tool | Craftisle",
    seoDesc: "Free sort JSON online tool. Sort JSON keys alphabetically. 100% browser-based.",
    seoKeywords: ["sort json", "json sort", "order json keys", "alphabetize json"],
    description: "Sort JSON object keys alphabetically (ascending or descending).",
    howToUse: [
      { heading: "Enter JSON", text: "Type or paste JSON to sort." },
      { heading: "Configure", text: "Choose sort order (ascending/descending)." },
      { heading: "Sort", text: "Click Sort to reorder keys." }
    ],
    faq: [
      { q: "Does it work with arrays?", a: "Yes, it sorts keys of objects in arrays too." },
      { q: "Can I sort by value?", a: "Currently only sorting by key is supported." }
    ],
    relatedTools: ["json-formatter", "json-minify", "yaml-sort"]
  },

  "json-escape": {
    title: "Escape JSON",
    desc: "Escape or unescape JSON strings",
    icon: "✏️",
    category: CATEGORIES.json,
    seoTitle: "Escape JSON Free — Online Tool | Craftisle",
    seoDesc: "Free escape JSON online tool. Escape or unescape JSON strings. 100% browser-based.",
    seoKeywords: ["escape json", "unescape json", "json escape", "json string"],
    description: "Escape or unescape JSON strings (convert text to/from JSON-encoded strings).",
    howToUse: [
      { heading: "Enter Text", text: "Type or paste text to escape, or JSON string to unescape." },
      { heading: "Choose Mode", text: "Select Escape or Unescape mode." },
      { heading: "Process", text: "Click Process to convert." }
    ],
    faq: [
      { q: "What does escape do?", a: "Escape converts text to a JSON-encoded string (e.g., quotes become \")." },
      { q: "What does unescape do?", a: "Unescape converts a JSON string back to readable text." }
    ],
    relatedTools: ["json-formatter", "json-stringify", "string-escape"]
  },

  "json-stringify": {
    title: "Stringify JSON",
    desc: "Convert JavaScript objects to JSON strings",
    icon: "📝",
    category: CATEGORIES.json,
    seoTitle: "Stringify JSON Free — Online Tool | Craftisle",
    seoDesc: "Free stringify JSON online tool. Convert JavaScript objects to JSON strings. 100% browser-based.",
    seoKeywords: ["stringify json", "js to json", "javascript to json", "object to json"],
    description: "Convert JavaScript objects/arrays to JSON strings.",
    howToUse: [
      { heading: "Enter JS Object", text: "Type or paste a JavaScript object (not JSON)." },
      { heading: "Configure", text: "Choose indentation and HTML escaping options." },
      { heading: "Stringify", text: "Click Stringify to convert to JSON." }
    ],
    faq: [
      { q: "What input format is expected?", a: "JavaScript object/array syntax (e.g., {name: 'John'}), not JSON." },
      { q: "Why would I use this?", a: "Useful for converting JS code to JSON for APIs or storage." }
    ],
    relatedTools: ["json-formatter", "json-escape", "yaml-to-json"]
  },

  "html-formatter": {
    title: "HTML Formatter",
    desc: "HTML code beautify and minify",
    icon: "🌐",
    category: CATEGORIES.formatter,
    seoTitle: "HTML Formatter Free — Beautify & Minify Online | Craftisle",
    seoDesc: "Free HTML formatter online. Beautify or minify HTML code with adjustable indentation. Supports HTML5, JSX, Angular/Vue templates. 100% browser-based.",
    seoKeywords: [
        "CSV to JSON converter online free",
        "JSON to CSV converter online free",
        "convert CSV to JSON online free",
        "CSV JSON converter no signup free",
        "free CSV JSON converter browser",
        "online CSV to JSON converter free",
        "convert JSON to CSV online free",
        "CSV to JSON array online free",
        "nested JSON CSV converter online",
        "free online CSV JSON tool",
        "custom delimiter CSV converter online",
        "online data format converter free"
      ],
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
    seoTitle: "SQL Formatter Free — Beautify & Format SQL Online | Craftisle",
    seoDesc: "Free SQL formatter online. Beautify or minify SQL queries with customizable indentation. Supports SELECT, INSERT, JOIN. 100% browser-based.",
    seoKeywords: ["SQL formatter online free", "format SQL query online", "SQL beautifier free", "SQL minify online", "SQL formatter no signup", "Craftisle SQL tool"],
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
    seoTitle: "YAML Formatter Free — Beautify & Validate YAML Online | Craftisle",
    seoDesc: "Free YAML formatter online. Beautify or validate YAML files with proper indentation. Supports Kubernetes, GitHub Actions, Docker Compose. 100% browser-based.",
    seoKeywords: [
    "regex tester online free",
    "regular expression tester online",
    "regex test online no signup",
    "regex flags tester online",
    "JavaScript regex tester online",
    "free regex tool browser based",
    "online regex tester free",
    "test regular expression online",
    "regex matcher online free",
    "free online regex tester",
    "regex pattern tester online"
  ],
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
    seoTitle: "HTML Escape Free — Escape & Unescape HTML Characters | Craftisle",
    seoDesc: "Free HTML escape tool online. Escape or unescape HTML special characters (&lt;, &gt;, &amp;). Prevent XSS attacks. 100% browser-based.",
    seoKeywords: [
        "text formatter online free tool",
        "format text online free tool",
        "text beautifier online free tool",
        "clean text formatting online free",
        "free text formatter browser based",
        "online text formatter free tool",
        "format plain text online free",
        "text indentation fixer online free",
        "free online text formatting tool",
        "normalize text formatting online free",
        "text cleaner online free tool",
        "online text beautifier free tool"
      ],
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
    seoTitle: "Base64 Encode/Decode Free — Online Base64 Tool | Craftisle",
    seoDesc: "Free Base64 encoder and decoder online. Encode files or text for safe transmission. Supports file upload, drag-and-drop. 100% browser-based, no signup.",
    seoKeywords: [
        "URL encode online free tool",
        "URL decode online free tool",
        "percent encoding tool online free",
        "encode URI component online free",
        "URL parameter encoding online free",
        "free URL encode tool browser",
        "decode URL encoded string online",
        "URL encode no signup free online",
        "online URL encoder decoder free",
        "URL special characters encode online",
        "free online URL encode tool",
        "URL decode online free no upload"
      ],
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
    seoTitle: "Base32 Encode/Decode Free — Online Base32 Tool | Craftisle",
    seoDesc: "Free Base32 encoder and decoder online. Safe for case-insensitive filesystems and human transcription. 100% browser-based, no upload.",
    seoKeywords: [
        "Base32 encoder online free",
        "Base32 decode online free",
        "Base32 vs Base64 online",
        "encode to Base32 free online",
        "Base32 online tool no signup",
        "free Base32 tool browser based",
        "Base32 decoder online free",
        "Base32 encoding standard online",
        "Base32 online no upload free",
        "convert to Base32 online free",
        "Base32 string decoder online",
        "online Base32 encoder free tool"
      ],
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
    seoTitle: "Base58 Encode/Decode Free — Bitcoin Base58 Tool | Craftisle",
    seoDesc: "Free Base58 encoder and decoder online. Used in Bitcoin addresses and IPFS hashes. Excludes confusing characters (0,O,I,l). 100% browser-based.",
    seoKeywords: [
        "radix converter online free",
        "binary to decimal converter online",
        "hex to decimal converter online",
        "number base converter online free",
        "octal converter online free tool",
        "free radix converter browser based",
        "convert number base online free",
        "decimal to binary online free",
        "hexadecimal converter online free",
        "free online radix converter tool",
        "base 2 to base 16 converter online",
        "online number system converter free"
      ],
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
    seoTitle: "Radix Converter Free — Binary/Octal/Decimal/Hex | Craftisle",
    seoDesc: "Free radix converter online. Convert numbers between binary, octal, decimal, hexadecimal and custom bases (2-36). Essential for programmers.",
    seoKeywords: ["radix converter online free", "binary to decimal converter", "hex to decimal converter", "number base converter", "octal converter online", "Craftisle dev tool"],
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
    seoTitle: "CSV to JSON Converter Free — Online Data Converter | Craftisle",
    seoDesc: "Free CSV to JSON converter online. Convert CSV data to JSON array and JSON to CSV. Handles nested JSON, custom delimiters. No signup.",
    seoKeywords: [
        "IP calculator online free tool",
        "subnet calculator online free",
        "IPv4 calculator online free tool",
        "free IP calculator browser based",
        "online IP address calculator free",
        "subnet mask calculator online free",
        "IP range calculator online free tool",
        "free online network calculator tool",
        "CIDR calculator online free tool",
        "IPv4 subnet calculator online free",
        "online IP math calculator free tool",
        "free network tools browser based"
      ],
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
    seoTitle: "URL Encode/Decode Free — Percent Encoding Online | Craftisle",
    seoDesc: "Free URL encode and decode tool online. Convert special characters to percent-encoded format (%20). Essential for API requests, query parameters, redirect URLs.",
    seoKeywords: ["URL encode online free", "URL decode online", "percent encoding tool", "encode URI component", "URL parameter encoding", "Craftisle URL tool"],
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
    seoTitle: "Image to Base64 Free — Convert Image to Base64 Online | Craftisle",
    seoDesc: "Free image to Base64 converter online. Convert PNG, JPG, GIF, WebP to Base64 data URIs. Embed images in HTML/CSS. 100% browser-based.",
    seoKeywords: ["image to Base64 free", "Base64 image converter online", "PNG to Base64", "image data URI generator", "Base64 to image decoder", "Craftisle image tool"],
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
    seoTitle: "PNG to SVG Converter Free — Raster to Vector Online | Craftisle",
    seoDesc: "Free PNG to SVG converter online. Convert raster images to scalable vector format using edge detection. Supports JPG input. 100% browser-based.",
    seoKeywords: [
        "image converter online free tool",
        "convert image online free tool",
        "free image converter browser based",
        "PNG to JPG online free tool",
        "WEBP to PNG online free tool",
        "free online image format converter",
        "image converter no signup free online",
        "convert image format online free tool",
        "free browser based image converter",
        "batch image converter online free tool"
      ],
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
    seoTitle: "IP Radix Converter Free — Decimal/Hex/Binary/Octal | Craftisle",
    seoDesc: "Free IP radix converter online. Convert IPv4/IPv6 addresses between decimal, hex, octal, and binary. Useful for networking and security analysis.",
    seoKeywords: [
        "IP radix converter online free",
        "IPv4 to binary converter online",
        "IPv6 hex converter online free",
        "IP address format conversion online",
        "free IP radix tool browser based",
        "IPv4 decimal to hex online",
        "IPv6 address converter online free",
        "IP address binary converter online",
        "free online IP converter tool",
        "octal IP notation converter online",
        "online IP address format converter",
        "IPv4 to IPv6 converter online free"
      ],
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

  // ==================== Number Tools (omni-tools port) ====================
  "byte-converter": {
    title: "Byte Converter",
    desc: "Convert between bytes, KB, MB, GB, TB, PB",
    icon: "💾",
    category: CATEGORIES.converter,
    stars: 4,
    seoTitle: "Byte Converter Free — Online Tool | Craftisle",
    seoDesc: "Free byte converter online tool. Convert between bytes, KB, MB, GB, TB, PB. Supports binary (1024) conversion.",
    seoKeywords: ["byte converter online free", "MB to GB converter", "KB to MB converter", "data size converter free", "bytes to megabytes online"],
    description: "Convert data sizes between Bytes, Kilobytes (KB), Megabytes (MB), Gigabytes (GB), Terabytes (TB), and Petabytes (PB). Uses binary conversion (1 KB = 1024 B). Essential for understanding file sizes, storage capacity, and data transfer rates.",
    howToUse: [
      { heading: "Enter a number", text: "Type the number you want to convert in the input box." },
      { heading: "Select units", text: "Choose the source unit (From) and target unit (To)." },
      { heading: "Set precision", text: "Adjust decimal places for the output (default: 4)." },
      { heading: "Convert", text: "Click Convert. The result appears instantly." },
    ],
    useCases: [
      { title: "File size understanding", text: "Convert file sizes from bytes to human-readable units (MB, GB)." },
      { title: "Storage capacity planning", text: "Calculate how many GB a TB drive can hold, accounting for filesystem overhead." },
      { title: "Data transfer estimation", text: "Estimate transfer time by converting file sizes to bandwidth-friendly units." },
    ],
    faq: [
      { q: "Why does 1 KB = 1024 B, not 1000 B?", a: "Computers use binary, so 1 KB = 2^10 = 1024 bytes. This is the standard in most operating systems and programming languages. Some contexts (hard drive manufacturing) use decimal (1 KB = 1000 B)." },
      { q: "What is the difference between MB and MiB?", a: "MB (megabyte) = 1000^2 bytes (decimal). MiB (mebibyte) = 1024^2 bytes (binary). This tool uses the binary standard (1024), which is most common in software." },
    ],
    relatedTools: ["radix-converter", "generic-calc", "string-statistic"],
  },

  "sum": {
    title: "Sum Numbers",
    desc: "Calculate sum of numbers in text",
    icon: "➕",
    category: CATEGORIES.converter,
    stars: 4,
    seoTitle: "Sum Numbers Free — Online Tool | Craftisle",
    seoDesc: "Free sum numbers online tool. Calculate sum of numbers extracted from text. Smart mode finds all numbers automatically.",
    seoKeywords: ["sum numbers online free", "add numbers in text", "calculate sum online free", "number sum tool free", "running sum calculator online"],
    description: "Calculate the sum of numbers in text. Smart mode automatically extracts all numbers from text (e.g. 'I have 3 apples and 5 oranges' → sum = 8). Delimiter mode splits by a separator (comma, space, etc.). Also supports running sum (cumulative).",
    howToUse: [
      { heading: "Enter text or numbers", text: "Type or paste text containing numbers, or enter numbers directly." },
      { heading: "Choose extraction mode", text: "Smart mode: extracts all numbers from text. Delimiter mode: splits by separator." },
      { heading: "Compute", text: "Click Compute Sum. The result appears in the output." },
      { heading: "Running sum (optional)", text: "Enable 'Running sum' to see cumulative sum after each number." },
    ],
    useCases: [
      { title: "Quick addition", text: "Add up numbers in a paragraph or list without manual calculation." },
      { title: "Data analysis", text: "Sum values from copied spreadsheet data or CSV exports." },
      { title: "Expense tracking", text: "Sum expenses listed in a text document or notes." },
    ],
    faq: [
      { q: "What does 'smart mode' do?", a: "Smart mode uses regex to find all numbers in the input text, regardless of surrounding words. Example: 'The 3 items cost $50 each, total $150' → numbers found: 3, 50, 150 → sum = 203." },
      { q: "Does this support decimals and negatives?", a: "Yes. Both positive/negative decimals are supported. Example: '-5.5, 10.2' → sum = 4.7." },
    ],
    relatedTools: ["string-statistic", "generic-calc", "byte-converter"],
  },

  // ==================== Developer Tools ====================
  "cron": {
    title: "Cron Expression",
    desc: "Cron job expression builder",
    icon: "⏰",
    category: CATEGORIES.dev,
    seoTitle: "Cron Expression Builder Free — Online Cron Tester | Craftisle",
    seoDesc: "Free cron expression builder & tester online. Build, validate, preview human-readable description & next run times. Supports 5-7 fields. 100% browser-based.",
    seoKeywords: [
        "user agent parser online free tool",
        "parse user agent string online free",
        "user agent detector online free tool",
        "free user agent parser browser based",
        "online user agent analyzer free tool",
        "detect browser from user agent online",
        "user agent string decoder online free",
        "free online user agent parsing tool",
        "browser detector online free tool",
        "user agent info extractor online free",
        "online device detector from UA free",
        "free web developer user agent tool"
      ],
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
    seoTitle: "Regex Tester Free Online — Test Regular Expressions | Craftisle",
    seoDesc: "Free online regex tester. Test regular expressions with real-time matching, flags support (g/i/m). Highlight matches. No registration required.",
    seoKeywords: ["regex tester online free", "regular expression tester", "regex test online no signup", "regex flags tester", "JavaScript regex tester", "Craftisle regex tool"],
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

  "regex-vis": {
    title: "Regex Visualizer",
    desc: "Visual regex editor & AST viewer",
    icon: "🎨",
    category: CATEGORIES.dev,
    stars: 5,
    seoTitle: "Regex Visualizer Free — Online AST Graph | Craftisle",
    seoDesc: "Free regex visualizer online. See AST tree graph, edit regex visually, test matches. Supports JavaScript/Python/PCRE. 100% browser-based.",
    seoKeywords: [
        "regex visualizer online free",
        "regex AST graph online free",
        "regular expression visual editor online",
        "regex tree view online free tool",
        "regex visual tester online free",
        "free regex visualizer browser based",
        "online regex AST viewer free",
        "visual regex builder online free",
        "regex visualizer no signup free",
        "online regular expression visualizer",
        "regex graph generator online free",
        "free online regex visualization tool"
      ],
    description: "Visualize regular expressions as an interactive AST (Abstract Syntax Tree) graph. Edit nodes directly on the graph, test against sample text with real-time highlights. Supports JavaScript, Python, and PCRE regex flavors. Perfect for learning regex, debugging complex patterns, and sharing visual explanations.",
    howToUse: [
      { heading: "① Type or paste a regex", text: "Enter any regular expression in the input box (e.g. /(\\d{3})-\\d{4}/). The AST graph appears instantly as you type. Supported flags: g (global), i (case-insensitive), m (multiline), s (dotall), u (unicode), y (sticky)." },
      { heading: "② Read the AST graph", text: "Each node represents one regex construct: Character (direct match), CharacterClass (brackets [...]), Group (capturing/non-capturing/named), Quantifier (* + ? {n,m}), Assertion (^ $ \\b), and Alternation (|). Hover a node to see its properties; click to select it." },
      { heading: "③ Edit visually (Edit tab)", text: "Select a node on the graph → the Edit tab lights up. You can: insert a node before/after, wrap selection in a group, add a quantifier, change character class type, toggle flags, and more. The regex updates in real-time as you edit." },
      { heading: "④ Test with sample text (Test tab)", text: "Switch to the Test tab, paste your sample text. All matches are highlighted in real-time. Use the flavor dropdown (JS / Python / PCRE) to switch regex engines. The match list shows each capture group's value." },
      { heading: "⑤ Share & export", text: "Click 'Copy permalink' to get a URL with your regex encoded. Share it — opening the link restores the exact graph. Use the Legends tab to learn what each node shape/color means." },
    ],
    useCases: [
      { title: "Learning regex", text: "See how any regex decomposes into an AST. Great for understanding groups, quantifiers, lookahead/lookbehind, and character classes visually instead of guessing from the string." },
      { title: "Debugging complex patterns", text: "When a regex matches unexpectedly, paste it in and inspect the graph. Each node is selectable — you can pinpoint exactly which group or quantifier is causing the issue." },
      { title: "Writing regex by visual editing", text: "Don't want to write the regex string by hand? Build it visually: add nodes, group them, add quantifiers — the regex updates automatically as you edit the graph." },
      { title: "Teaching & documentation", text: "Generate AST screenshots to include in blog posts, docs, or Stack Overflow answers. A picture of the AST is worth 1000 words of regex explanation." },
      { title: "Cross-flavor testing", text: "Test the same regex under JS, Python, and PCRE flavors. See how behavior differs (e.g. lookbehind support, Unicode handling)." },
    ],
    faq: [
      { q: "What is an AST in regex?", a: "AST stands for Abstract Syntax Tree. It is a tree representation of your regex pattern. Each node is a construct: Group, Quantifier, CharacterClass, Assertion, etc. The tree structure shows how they nest — which is much clearer than reading the raw string." },
      { q: "Can I edit the regex visually without writing the string?", a: "Yes! Select a node in the graph and use the Edit tab to modify that specific construct (add quantifier, change group type, insert characters, etc.). The regex string updates automatically as you edit." },
      { q: "Which regex flavors are supported?", a: "JavaScript (ECMAScript), Python, and PCRE. Switch flavors using the dropdown in the Test tab. Note: not all syntax is supported in all flavors — the tool will warn you." },
      { q: "What do the node colors/shapes mean?", a: "See the Legends tab (📖 icon) for a full legend: blue = character/class, green = group, orange = quantifier, purple = assertion, gray = alternation. The legend is always one click away." },
      { q: "How do I share my regex with someone else?", a: "Click 'Copy permalink' in the top-right. The URL encodes your regex and flags. Send it — when they open it, the exact same graph and test text load automatically." },
      { q: "Why does my regex look different in the graph vs. what I typed?", a: "The parser normalizes your regex: redundant groups are simplified, character classes are expanded for clarity, and implicit concatenations become explicit nodes. This is intentional — it helps you see the true structure." },
    ],
    relatedTools: ["regex", "json-formatter", "color-picker"],
  },

  "mermaid": {
    title: "Mermaid Chart",
    desc: "Online flowchart diagrams",
    icon: "📈",
    category: CATEGORIES.dev,
    seoTitle: "Mermaid Chart Free — Online Diagram Maker | Craftisle",
    seoDesc: "Free Mermaid diagram maker online. Create flowcharts, sequence diagrams, Gantt charts. Live preview, export SVG/PNG. 100% browser-based.",
    seoKeywords: [
    "Mermaid diagram maker online free",
    "flowchart maker online free",
    "sequence diagram tool online free",
    "Gantt chart online free tool",
    "Mermaid chart export SVG online",
    "Mermaid live preview online free",
    "free Mermaid tool browser based",
    "create Mermaid diagram online",
    "Mermaid diagram generator free",
    "online Mermaid editor free",
    "draw flowchart online free"
  ],
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
    seoTitle: "SVG Editor Free — Online SVG Code Editor | Craftisle",
    seoDesc: "Free SVG editor online. Edit SVG code with live preview, syntax highlighting, layer management. Export SVG/PNG. 100% browser-based.",
    seoKeywords: [
    "Lorem Ipsum generator free online",
    "placeholder text online free",
    "Lorem Ipsum online tool free",
    "dummy text generator online",
    "design mockup text online free",
    "Lorem Ipsum no signup free",
    "free Lorem Ipsum tool browser",
    "generate Lorem Ipsum online",
    "placeholder text generator free",
    "Lorem Ipsum text online free",
    "online Lorem Ipsum generator"
  ],
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
    seoTitle: "QR Code Generator Free — Custom QR Codes Online | Craftisle",
    seoDesc: "Free QR code generator online. Custom colors, logo upload, high error correction. Download PNG/SVG. No signup required.",
    seoKeywords: [
        "color palette generator from image online free",
        "extract colors from image online free",
        "free color palette browser based tool",
        "image color palette online free tool",
        "online color extractor from image free",
        "free online color palette generator",
        "color palette no signup free online tool",
        "extract color scheme from image online free",
        "free browser based color palette tool",
        "image color analyzer online free tool"
      ],
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
    seoTitle: "Lorem Ipsum Generator Free — Placeholder Text Online | Craftisle",
    seoDesc: "Free Lorem Ipsum generator online. Generate placeholder text for design mockups, UI layouts. Custom paragraphs, sentences. 100% browser-based.",
    seoKeywords: ["Lorem Ipsum generator free", "placeholder text online", "Lorem Ipsum online tool", "dummy text generator", "design mockup text", "Craftisle generator"],
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
    seoTitle: "Random String Generator Free — Secure Random Strings | Craftisle",
    seoDesc: "Free random string generator online. Cryptographically secure, customizable length & character set. Generate passwords, API keys, tokens. 100% browser-based.",
    seoKeywords: [
        "case converter online free tool",
        "text case converter online free",
        "camelCase to snake_case online",
        "uppercase lowercase converter online",
        "free case converter browser based",
        "online text case converter free",
        "convert text case online free tool",
        "string case converter online free",
        "free online case conversion tool",
        "title case converter online free",
        "sentence case converter online free",
        "online case formatter free tool"
      ],
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
    seoTitle: "Random Group Generator Free — Split List Into Groups | Craftisle",
    seoDesc: "Free random group generator online. Split names or items into random groups. Team assignments, tournament brackets. Fair & reproducible with seed.",
    seoKeywords: ["random group generator free", "split list into random groups", "team assignment tool", "random group maker online", "tournament bracket generator", "Craftisle generator"],
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
    seoTitle: "UUID Generator Free — Online Tool | Craftisle",
    seoDesc: "Free uuid generator online tool. Generate UUID/GUID 100% browser-based, no signup required.",
    seoKeywords: [
        "spin wheel online free tool",
        "online spinning wheel free tool",
        "free wheel spinner browser based",
        "random name picker wheel online free",
        "online decision wheel free tool",
        "free online spin wheel picker tool",
        "wheel no signup free online tool",
        "online raffle wheel free tool",
        "free browser based wheel spinner",
        "custom wheel spinner online free tool"
      ],
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
    seoTitle: "Pixel Art Generator Free — Convert Image to Pixel Art | Craftisle",
    seoDesc: "Free pixel art generator online. Convert images to retro pixel art style. Customize pixel size, color palette, dithering. Download PNG. 100% browser-based.",
    seoKeywords: [
        "image to pixel art online free",
        "pixelate image online free tool",
        "convert image to pixels online free",
        "pixel art generator online free",
        "free image pixelator browser based",
        "online image to pixel art converter",
        "pixelate photo online free tool",
        "image pixel effect online free",
        "free online pixel art maker",
        "convert photo to pixel art online",
        "pixel image generator online free",
        "online image pixel editor free tool"
      ],
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
    seoTitle: "Case Converter Free — Online Tool | Craftisle",
    seoDesc: "Free case converter online tool. Convert between naming conventions 100% browser-based, no signup required.",
    seoKeywords: ['case converter online free', 'free case converter tool', 'case converter no signup', 'online case converter browser', 'Craftisle case converter'],
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
    seoTitle: "Text Formatter Free — Process & Format Text Online | Craftisle",
    seoDesc: "Free text formatter online. Word count, sort lines, remove duplicates, whitespace cleanup. 20+ text operations. 100% browser-based, no signup.",
    seoKeywords: [
        "unicode text converter online free",
        "unicode to text online free tool",
        "unicode character inspector online",
        "free unicode tool browser based",
        "online unicode converter free tool",
        "unicode codepoint viewer online free",
        "convert unicode to text online free",
        "unicode text analyzer online free tool",
        "free online unicode character tool",
        "unicode string converter online free",
        "view unicode characters online free",
        "online unicode text converter free tool"
      ],
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
    seoTitle: "Text Diff Free — Online Categories.Text Tool | Craftisle",
    seoDesc: "Free text diff online tool. Compare two texts for differences 100% browser-based, no signup required.",
    seoKeywords: [
        "diff tool online free",
        "text diff comparator online free",
        "compare text online free tool",
        "file diff viewer online free",
        "free diff tool browser based",
        "online text comparison free tool",
        "diff two files online free",
        "text difference checker online free",
        "free online diff comparator tool",
        "compare code online free diff tool",
        "diff checker online free no signup",
        "online file diff tool free browser"
      ],
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
    seoTitle: "Unicode Tool Free — Online Categories.Text Tool | Craftisle",
    seoDesc: "Free unicode tool online tool. Unicode character utilities 100% browser-based, no signup required.",
    seoKeywords: ['unicode tool online free', 'free unicode tool tool', 'unicode tool no signup', 'online unicode tool browser', 'Craftisle unicode tool'],
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

  // ==================== Text Tools (omni-tools port) ====================
  "string-reverse": {
    title: "Reverse Text",
    desc: "Reverse text or each line independently",
    icon: "🔄",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Reverse Text Free — Online Tool | Craftisle",
    seoDesc: "Free reverse text online tool. Reverse strings or each line independently. Client-side processing, no upload.",
    seoKeywords: ["reverse text online free", "reverse each line online", "string reverse tool free", "text reverser online"],
    description: "Reverse text strings or process each line independently. Options to remove empty lines and trim whitespace. Useful for debugging encoded strings, creating mirrored text effects, and data transformation.",
    howToUse: [
      { heading: "Paste your text", text: "Enter the text you want to reverse in the input box." },
      { heading: "Toggle options", text: "Choose whether to reverse each line independently, remove empty lines, or trim whitespace." },
      { heading: "Reverse", text: "Click Reverse. The result appears instantly." },
    ],
    useCases: [
      { title: "Debugging encoded strings", text: "Reverse a string to check if it contains hidden patterns or encoded data." },
      { title: "Creating text effects", text: "Reverse text for mirrored or artistic effects in designs." },
      { title: "Data transformation", text: "Reverse lines of a data file for specific processing needs." },
    ],
    faq: [
      { q: "Does this modify the original text?", a: "No. The original text remains unchanged in the input box. The reversed result appears separately." },
      { q: "Can I reverse only specific lines?", a: "Use the multi-line mode to reverse each line independently, then manually edit the result." },
    ],
    relatedTools: ["text-formatter", "case-converter", "string-statistic"],
  },

  "string-statistic": {
    title: "Text Statistics",
    desc: "Analyze text statistics: characters, words, lines, sentences",
    icon: "📊",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Text Statistics Free — Online Tool | Craftisle",
    seoDesc: "Free text statistics online tool. Count characters, words, lines, sentences, paragraphs. Client-side processing.",
    seoKeywords: ["text statistics online free", "word count tool free", "character count online", "text analyzer free"],
    description: "Analyze text and get detailed statistics: character count, word count, line count, sentence count, paragraph count, plus optional word and character frequency analysis.",
    howToUse: [
      { heading: "Paste your text", text: "Enter or paste the text you want to analyze in the input box." },
      { heading: "Configure options", text: "Toggle word frequency and/or character frequency display." },
      { heading: "Analyze", text: "Click Analyze. Statistics appear in the result box." },
    ],
    useCases: [
      { title: "Writing & editing", text: "Check word counts for articles, essays, and social media posts against platform limits." },
      { title: "SEO optimization", text: "Verify meta description length (155-160 chars) and title length (50-60 chars)." },
      { title: "Data analysis", text: "Understand text structure and character distribution." },
    ],
    faq: [
      { q: "What counts as a sentence?", a: "Sentences end with . ! ? or ... The delimiters can be customized in options." },
      { q: "Is there a word limit?", a: "No. The tool processes text entirely in your browser, so even long documents work." },
    ],
    relatedTools: ["text-formatter", "case-converter", "diff"],
  },

  "slug-generator": {
    title: "Slug Generator",
    desc: "Generate URL-friendly slugs from text",
    icon: "🔗",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Slug Generator Free — Online Tool | Craftisle",
    seoDesc: "Free slug generator online tool. Convert text to URL-friendly slugs. Supports multi-line. Client-side.",
    seoKeywords: ["slug generator online free", "URL slug maker free", "SEO slug generator online", "text to slug free"],
    description: "Convert any text into a URL-friendly slug: lowercase, remove special characters, replace spaces with hyphens. Processes multiple lines at once. Essential for SEO-friendly URLs, blog post slugs, and file naming.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to convert to a slug." },
      { heading: "Adjust options", text: "Toggle case sensitivity if you want to preserve uppercase letters." },
      { heading: "Generate", text: "Click Generate Slug. The result appears instantly." },
    ],
    useCases: [
      { title: "Blog post URLs", text: "Generate SEO-friendly slugs for blog post titles automatically." },
      { title: "File naming", text: "Convert document titles to filesystem-safe names." },
      { title: "E-commerce product URLs", text: "Generate clean product page URLs from product names." },
    ],
    faq: [
      { q: "What is a slug?", a: "A slug is a URL-friendly version of a string — lowercase, hyphens instead of spaces, no special characters. Example: 'My Blog Post!' becomes 'my-blog-post'." },
      { q: "Does this handle non-English characters?", a: "Yes. Accented characters (é, ü, ñ) are converted to their ASCII equivalents (e, u, n) using Unicode normalization." },
    ],
    relatedTools: ["text-formatter", "case-converter", "url-encode"],
  },

  "rot13": {
    title: "ROT13 Cipher",
    desc: "Apply ROT13 substitution cipher",
    icon: "🔐",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "ROT13 Cipher Free — Online Tool | Craftisle",
    seoDesc: "Free ROT13 cipher online tool. Encode or decode text with ROT13 substitution. Client-side processing.",
    seoKeywords: ["ROT13 cipher online free", "ROT13 encoder online", "ROT13 decoder online", "substitution cipher free"],
    description: "Apply the ROT13 cipher — a simple substitution cipher that replaces each letter with the 13th letter after it in the alphabet. ROT13 is its own inverse, so applying it twice restores the original text.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to encode/decode." },
      { heading: "Apply ROT13", text: "Click Apply ROT13. Since ROT13 is its own inverse, the same button encodes and decodes." },
    ],
    useCases: [
      { title: "Obscuring text", text: "Lightly obfuscate text in forum posts or code comments (not secure encryption)." },
      { title: "Learning cryptography", text: "Understand how substitution ciphers work as a first step into cryptography." },
      { title: "Puzzle solving", text: "Decode ROT13-encoded puzzles and riddles." },
    ],
    faq: [
      { q: "Is ROT13 secure?", a: "No. ROT13 is not encryption — it's a simple substitution cipher that can be broken instantly. It's only for fun/obfuscation, not security." },
      { q: "Why is ROT13 its own inverse?", a: "Because there are 26 letters in the English alphabet. Rotating by 13 twice gives 26, which wraps around to the original letter." },
    ],
    relatedTools: ["aes-des", "hash", "base64"],
  },

  "string-randomize-case": {
    title: "Randomize Case",
    desc: "Randomly capitalize letters in text",
    icon: "🎲",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Randomize Case Free — Online Tool | Craftisle",
    seoDesc: "Free randomize case online tool. Randomly capitalize letters in text. Fun text effects, client-side.",
    seoKeywords: ["randomize case online free", "random caps generator", "sPoNgEbOb text generator", "fun text effects free"],
    description: "Randomly capitalize or lowercase each letter in your text. Creates playful 'sPoNgEbOb case' effects. Each click produces a different random result.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to randomize." },
      { heading: "Randomize", text: "Click Randomize Case. Each letter gets a random case." },
    ],
    useCases: [
      { title: "Social media posts", text: "Create playful, attention-grabbing text for social media captions." },
      { title: "Mocking meme text", text: "Generate 'sPoNgEbOb' style text for memes and jokes." },
      { title: "A/B testing headlines", text: "Generate variations of headlines with different casing for testing." },
    ],
    faq: [
      { q: "Is the result truly random?", a: "Yes, each letter is assigned a random case using JavaScript's Math.random()." },
      { q: "Can I get the same result twice?", a: "Possible but unlikely for long text. Each execution produces a fresh random result." },
    ],
    relatedTools: ["case-converter", "text-formatter", "string-reverse"],
  },

  "quote": {
    title: "Quote Text",
    desc: "Add quotation marks to text lines",
    icon: "❝",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Quote Text Free — Online Tool | Craftisle",
    seoDesc: "Free quote text online tool. Add custom quotation marks to text lines. Supports multi-line processing.",
    seoKeywords: ["quote text online free", "add quotes to text", "text quoting tool free", "CSV quoting tool"],
    description: "Add custom quotation marks to text lines. Supports multi-line processing, empty line handling, and double-quote mode. Useful for formatting code strings, CSV fields, and text data.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text lines you want to quote." },
      { heading: "Set quote characters", text: "Customize left and right quote characters (default: double quotes)." },
      { heading: "Apply quotes", text: "Click Apply Quotes. Each line will be wrapped with the specified quotes." },
    ],
    useCases: [
      { title: "CSV field quoting", text: "Add quotes to fields in CSV data for proper parsing." },
      { title: "Code string formatting", text: "Wrap text lines in quotes for use in code (e.g. Python, JavaScript)." },
      { title: "Text data preparation", text: "Prepare text data for import into databases or spreadsheets." },
    ],
    faq: [
      { q: "What is double quote mode?", a: "In double quote mode, existing quoted text is not quoted again. This prevents double-quoting already-quoted lines." },
      { q: "Can I use custom quote characters?", a: "Yes. You can set any character as left/right quote, e.g. « and » for French quotes." },
    ],
    relatedTools: ["text-formatter", "case-converter", "string-reverse"],
  },

  "censor": {
    title: "Text Censor",
    desc: "Censor sensitive words in text",
    icon: "🆘",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Text Censor Free — Online Tool | Craftisle",
    seoDesc: "Free text censor online tool. Replace sensitive words with symbols or placeholder text. Word boundary respected.",
    seoKeywords: ["text censor online free", "word filter tool free", "censor text online", "sensitive word replacement"],
    description: "Censor sensitive or inappropriate words in text by replacing them with symbols or placeholder text. Word boundaries are respected (partial matches are not censored). Supports symbol mode (e.g. ***), word mode (e.g. [censored]), and per-letter symbol repetition.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to censor." },
      { heading: "Enter words to censor", text: "List words to censor, one per line." },
      { heading: "Configure options", text: "Choose symbol mode or word mode, set symbol character, enable per-letter repetition." },
      { heading: "Censor", text: "Click Censor. Words will be replaced according to your settings." },
    ],
    useCases: [
      { title: "Content moderation", text: "Censor profanity or sensitive terms in user-generated content." },
      { title: "Data anonymization", text: "Replace personally identifiable information (PII) with placeholders." },
      { title: "Text sanitization", text: "Clean text data before publishing or sharing." },
    ],
    faq: [
      { q: "Are word boundaries respected?", a: "Yes. Only whole words are censored. For example, 'hell' will not match 'hello'. This prevents over-censoring." },
      { q: "What is 'each letter' mode?", a: "In symbol mode, enabling 'each letter' repeats the symbol for each character in the word. E.g. 'bad' → '***' (3 symbols for 3 letters)." },
    ],
    relatedTools: ["text-formatter", "string-replace", "diff"],
  },

  "palindrome": {
    title: "Palindrome Checker",
    desc: "Check if words are palindromes",
    icon: "🔤",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Palindrome Checker Free — Online Tool | Craftisle",
    seoDesc: "Free palindrome checker online tool. Check if words are palindromes (read same forwards and backwards).",
    seoKeywords: ["palindrome checker online free", "check palindrome text", "palindrome tool free", "word palindrome tester"],
    description: "Check if words are palindromes — words that read the same forwards and backwards (e.g. 'aba', 'racecar'). Results are returned as 'true' or 'false' for each word, joined by the separator.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text containing words to check." },
      { heading: "Set separator", text: "Choose how words are separated (space, comma, or custom regex)." },
      { heading: "Check", text: "Click Check Palindrome. Results (true/false) appear in the output." },
    ],
    useCases: [
      { title: "Word games & puzzles", text: "Check candidate words for palindrome property in word games." },
      { title: "Linguistic research", text: "Analyze text corpora for palindromic words." },
      { title: "Coding challenges", text: "Test your palindrome-checking logic against known examples." },
    ],
    faq: [
      { q: "What is a palindrome?", a: "A palindrome is a word, phrase, or sequence that reads the same backwards as forwards. Examples: 'level', 'madam', 'racecar'. This tool checks individual words, not phrases." },
      { q: "Does case matter?", a: "No. The check is case-insensitive. 'Aba' and 'aba' are both palindromes." },
    ],
    relatedTools: ["text-formatter", "string-reverse", "diff"],
  },

  // ==================== Generator Tools (continued) ====================
  "tts": {
    title: "Text to Speech",
    desc: "Online TTS conversion",
    icon: "🔊",
    category: CATEGORIES.generator,
    seoTitle: "Text to Speech Free — Online Tool | Craftisle",
    seoDesc: "Free text to speech online tool. Online TTS conversion 100% browser-based, no signup required.",
    seoKeywords: [
        "text to speech online free tool",
        "TTS voice generator online free",
        "convert text to audio online free",
        "free text to speech browser based",
        "online TTS generator free tool",
        "text to voice online free tool",
        "download TTS audio online free",
        "free online text to speech tool",
        "TTS no signup free online tool",
        "generate speech from text online free",
        "online voice generator free tool",
        "free browser based TTS tool"
      ],
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

  "remove-duplicate-lines": {
    title: "Remove Duplicate Lines",
    desc: "Remove duplicate lines from text with multiple modes",
    icon: "📄",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Remove Duplicate Lines Free — Online Tool | Craftisle",
    seoDesc: "Free remove duplicate lines online tool. Remove duplicate lines from text with multiple modes: all, consecutive, unique only.",
    seoKeywords: ["remove duplicate lines online free", "delete duplicate lines text", "text deduplication tool free", "remove duplicates from text online"],
    description: "Remove duplicate lines from text with multiple modes: remove all duplicates (keep first occurrence), remove only consecutive duplicates, or keep only unique lines. Also supports sorting, trimming, and empty line handling.",
    howToUse: [
      { heading: "Paste your text", text: "Enter the text with duplicate lines in the input box." },
      { heading: "Choose mode", text: "Select removal mode: all duplicates, consecutive only, or unique only." },
      { heading: "Configure options", text: "Set newline handling, sorting, and trimming options." },
      { heading: "Remove duplicates", text: "Click Remove Duplicates. Clean text appears in the output." },
    ],
    useCases: [
      { title: "Data cleaning", text: "Remove duplicate entries from CSV data, log files, or text lists." },
      { title: "List deduplication", text: "Clean up email lists, URL lists, or keyword lists." },
      { title: "Log analysis", text: "Remove repeated log entries to focus on unique events." },
    ],
    faq: [
      { q: "What is 'unique only' mode?", a: "Unique only mode keeps only lines that appear exactly once. Lines that appear 2+ times are removed entirely." },
      { q: "Does trimming affect duplicate detection?", a: "Yes. When 'Trim lines' is enabled, '  hello  ' and 'hello' are treated as duplicates because both trim to 'hello'." },
    ],
    relatedTools: ["text-formatter", "diff", "string-reverse"],
  },

  "string-rotate": {
    title: "Rotate Text",
    desc: "Rotate characters in text by N positions",
    icon: "🔃",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Rotate Text Free — Online Tool | Craftisle",
    seoDesc: "Free rotate text online tool. Rotate characters in text by N positions left or right. Multi-line support.",
    seoKeywords: ["rotate text online free", "character rotation tool", "caesar cipher online free", "text rotation tool"],
    description: "Rotate characters in text by N positions left or right. Like a Caesar cipher but for arbitrary rotation amounts. Multi-line mode rotates each line independently.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to rotate." },
      { heading: "Set step and direction", text: "Choose rotation step (number of positions) and direction (left or right)." },
      { heading: "Rotate", text: "Click Rotate. The rotated text appears in the output." },
    ],
    useCases: [
      { title: "Caesar cipher exploration", text: "Try different rotation steps to explore Caesar cipher encryption." },
      { title: "Text transformation", text: "Create rotated text effects for puzzles or games." },
      { title: "Data encoding", text: "Apply simple rotation as a step in data encoding pipelines." },
    ],
    faq: [
      { q: "Is this a Caesar cipher?", a: "Yes, when step=3 and right=true, this is exactly the Caesar cipher (rotate by 3). But this tool supports any step value." },
      { q: "What happens with multi-line mode?", a: "Each line is rotated independently. This is useful for rotating multiple strings at once." },
    ],
    relatedTools: ["rot13", "aes-des", "hash"],
  },

  "string-split": {
    title: "Split Text",
    desc: "Split text by separator, regex, length, or chunks",
    icon: "✂️",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Split Text Free — Online Tool | Craftisle",
    seoDesc: "Free split text online tool. Split text by separator, regex, fixed length, or into chunks. Flexible text splitting.",
    seoKeywords: ["split text online free", "text splitter tool free", "split string by delimiter online", "text chunk splitter free"],
    description: "Split text by separator, regex, fixed length, or into a specific number of chunks. Supports custom output separator. Essential for text processing, data parsing, and string manipulation.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to split." },
      { heading: "Choose split mode", text: "Select: by symbol (delimiter), by regex, by fixed length, or into N chunks." },
      { heading: "Configure options", text: "Set separator, regex pattern, length, or chunk count. Set output separator." },
      { heading: "Split", text: "Click Split. The split parts appear in the output, joined by the output separator." },
    ],
    useCases: [
      { title: "CSV parsing", text: "Split CSV lines by comma to extract individual fields." },
      { title: "Text chunking", text: "Split long text into fixed-length chunks for processing or display." },
      { title: "Data transformation", text: "Split text by regex patterns (e.g. split by whitespace, punctuation)." },
    ],
    faq: [
      { q: "What is 'by length' mode?", a: "Splits text into substrings of exactly N characters (except possibly the last chunk). Useful for fixed-width text processing." },
      { q: "What is 'into chunks' mode?", a: "Splits text into exactly N chunks of approximately equal size. You can also add prefix/suffix to each chunk." },
    ],
    relatedTools: ["string-join", "text-formatter", "regex"],
  },

  "string-join": {
    title: "Join Lines",
    desc: "Join multiple lines into one with a separator",
    icon: "🤝",
    category: CATEGORIES.text,
    stars: 4,
    seoTitle: "Join Lines Free — Online Tool | Craftisle",
    seoDesc: "Free join lines online tool. Join multiple text lines into one line with a custom separator. Remove blank lines and trim spaces.",
    seoKeywords: ["join lines online free", "merge lines into one", "text join tool free", "concatenate lines online"],
    description: "Join multiple text lines into a single line with a custom separator. Optionally remove blank lines and trim trailing spaces from each line. The inverse of the Split Text tool.",
    howToUse: [
      { heading: "Enter text lines", text: "Type or paste text with multiple lines in the input box." },
      { heading: "Set separator", text: "Choose the separator to insert between lines (comma, space, newline, etc.)." },
      { heading: "Configure options", text: "Toggle blank line removal and trailing space trimming." },
      { heading: "Join", text: "Click Join Lines. The merged line appears in the output." },
    ],
    useCases: [
      { title: "CSV creation", text: "Join lines with comma separator to create CSV data." },
      { title: "Array creation", text: "Join lines with comma+space to create JavaScript/Python arrays." },
      { title: "Sentence merging", text: "Join lines with space to merge broken sentences into paragraphs." },
    ],
    faq: [
      { q: "What happens to blank lines?", a: "When 'Delete blank lines' is enabled, blank lines are removed before joining. Otherwise, they produce empty segments in the output." },
      { q: "Is this the inverse of Split Text?", a: "Yes. If you split by comma and then join by comma, you get back the original text (minus blank lines and trailing spaces if those options are enabled)." },
    ],
    relatedTools: ["string-split", "text-formatter", "csv-json"],
  },

  "string-repeat": {
    title: "Repeat Text",
    desc: "Repeat text N times with a delimiter",
    icon: "🔁",
    category: CATEGORIES.text,
    stars: 3,
    seoTitle: "Repeat Text Free — Online Tool | Craftisle",
    seoDesc: "Free repeat text online tool. Repeat text N times with a custom delimiter. Generate test data and patterns.",
    seoKeywords: ["repeat text online free", "text repeater tool", "string repetition online", "generate repeated text free"],
    description: "Repeat text N times with a custom delimiter between copies. Useful for generating test data, repeated patterns, filler text, or any situation where you need multiple copies of the same string.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste the text you want to repeat." },
      { heading: "Set repeat count", text: "Enter the number of times to repeat the text." },
      { heading: "Set delimiter", text: "Choose the separator to insert between repeated copies (space, comma, newline, etc.)." },
      { heading: "Repeat", text: "Click Repeat Text. The repeated text appears in the output." },
    ],
    useCases: [
      { title: "Test data generation", text: "Generate repeated test data for development and testing." },
      { title: "Pattern creation", text: "Create repeated patterns for text art, dividers, or formatting." },
      { title: "Filler text", text: "Generate filler text for layout testing or placeholder content." },
    ],
    faq: [
      { q: "Can I repeat without a separator?", a: "Yes. Set the delimiter to empty string (delete all characters in the delimiter field)." },
      { q: "Is there a limit on repeat count?", a: "The tool processes in your browser, so very large repeat counts (e.g. 100,000+) may cause performance issues. For reasonable counts (under 10,000), it works fine." },
    ],
    relatedTools: ["text-formatter", "lorem-ipsum", "string-reverse"],
  },

  // ==================== Network Tools ====================
  "ip-calc": {
    title: "IP Calculator",
    desc: "IP address calculation tool",
    icon: "🌐",
    category: CATEGORIES.network,
    seoTitle: "IP Calculator Free — Online Tool | Craftisle",
    seoDesc: "Free ip calculator online tool. IP address calculation tool 100% browser-based, no signup required.",
    seoKeywords: ['ip calculator online free', 'free ip calculator tool', 'ip calculator no signup', 'online ip calculator browser', 'Craftisle ip calculator'],
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

  "random-port-generator": {
    title: "Random Port Generator",
    desc: "Generate random network port numbers",
    icon: "🔌",
    category: CATEGORIES.network,
    stars: 4,
    seoTitle: "Random Port Generator Free — Online Tool | Craftisle",
    seoDesc: "Free random port generator online tool. Generate random network port numbers for testing. Supports well-known, registered, and dynamic port ranges.",
    seoKeywords: ["random port generator online free", "generate random ports", "network port generator free", "random TCP port generator", "port number generator online"],
    description: "Generate random network port numbers for testing, development, and configuration. Supports standard IANA port ranges: Well-Known (1-1023), Registered (1024-49151), and Dynamic/Private (49152-65535). Optionally allow duplicates, sort results, and set custom range.",
    howToUse: [
      { heading: "Set count", text: "Enter the number of ports to generate (1-1000)." },
      { heading: "Choose port range", text: "Select a standard range or set a custom min/max." },
      { heading: "Configure options", text: "Toggle duplicate allowance and result sorting." },
      { heading: "Generate", text: "Click Generate Ports. The ports appear in the result grid." },
    ],
    useCases: [
      { title: "Development testing", text: "Generate random ports for testing application connectivity and port conflict scenarios." },
      { title: "Configuration templates", text: "Generate port numbers for Docker Compose, Kubernetes, or firewall rule templates." },
      { title: "Security testing", text: "Generate random high-numbered ports to test firewall rules and port scanning defenses." },
    ],
    faq: [
      { q: "What are Well-Known ports?", a: "Ports 1-1023 are reserved for system services (HTTP 80, HTTPS 443, SSH 22, etc.). Most OSes require admin privileges to bind to these ports." },
      { q: "What port range should I use for my app?", a: "For custom applications, use Registered ports (1024-49151) or Dynamic ports (49152-65535). Avoid Well-Known ports unless you're implementing a standard service." },
    ],
    relatedTools: ["ip-calc", "user-agent", "network"],
  },

  "user-agent": {
    title: "User-Agent Parser",
    desc: "Parse browser UA strings",
    icon: "🤖",
    category: CATEGORIES.network,
    seoTitle: "User-Agent Parser Free — Online Tool | Craftisle",
    seoDesc: "Free user-agent parser online tool. Parse browser UA strings 100% browser-based, no signup required.",
    seoKeywords: ['user-agent parser online free', 'free user-agent parser tool', 'user-agent parser no signup', 'online user-agent parser browser', 'Craftisle user-agent parser'],
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
    seoTitle: "Coin Flip Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free coin flip online tool. Random coin flip simulator 100% browser-based, no signup required.",
    seoKeywords: ['coin flip online free', 'free coin flip tool', 'coin flip no signup', 'online coin flip browser', 'Craftisle coin flip'],
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
    seoTitle: "Counter Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free counter online tool. Simple counter tool 100% browser-based, no signup required.",
    seoKeywords: [
        "counter online free tool",
        "online counter free tool",
        "click counter online free tool",
        "free counter browser based tool",
        "online visitor counter free tool",
        "count clicks online free tool",
        "free online counting tool",
        "tap counter online free tool",
        "counter no signup free online tool",
        "online number counter free tool",
        "free browser based counter tool"
      ],
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
    seoTitle: "Countdown Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free countdown online tool. Custom countdown timer 100% browser-based, no signup required.",
    seoKeywords: [
        "pomodoro timer online free tool",
        "online pomodoro timer free tool",
        "free pomodoro browser based tool",
        "pomodoro technique timer online free",
        "online focus timer free tool",
        "free online pomodoro productivity tool",
        "pomodoro no signup free online",
        "online study timer free tool",
        "free browser based pomodoro tool",
        "work break timer online free tool"
      ],
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
    seoTitle: "Stopwatch Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free stopwatch online tool. Online stopwatch tool 100% browser-based, no signup required.",
    seoKeywords: ['stopwatch online free', 'free stopwatch tool', 'stopwatch no signup', 'online stopwatch browser', 'Craftisle stopwatch'],
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
    seoTitle: "Pomodoro Timer Free — Online Tool | Craftisle",
    seoDesc: "Free pomodoro timer online tool. Pomodoro technique timer 100% browser-based, no signup required.",
    seoKeywords: ['pomodoro timer online free', 'free pomodoro timer tool', 'pomodoro timer no signup', 'online pomodoro timer browser', 'Craftisle pomodoro timer'],
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
    seoTitle: "Spin Wheel Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free spin wheel online tool. Random spin wheel tool 100% browser-based, no signup required.",
    seoKeywords: ['spin wheel online free', 'free spin wheel tool', 'spin wheel no signup', 'online spin wheel browser', 'Craftisle spin wheel'],
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
    seoTitle: "Scoreboard Free — Online Categories.Utility Tool | Craftisle",
    seoDesc: "Free scoreboard online tool. Real-time score tracker 100% browser-based, no signup required.",
    seoKeywords: [
        "scoreboard online free tool",
        "online scoreboard free tool",
        "free scoreboard browser based tool",
        "sports scoreboard online free tool",
        "online game score tracker free tool",
        "free online scoreboard keeper tool",
        "scoreboard no signup free online",
        "online score counter free tool",
        "free browser based scoreboard tool",
        "tournament scoreboard online free tool"
      ],
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
    seoTitle: "Keyboard Test Free — Online Categories.Dev Tool | Craftisle",
    seoDesc: "Free keyboard test online tool. Online keyboard key tester 100% browser-based, no signup required.",
    seoKeywords: [
        "online keyboard tester free tool",
        "keyboard keys tester online free",
        "free keyboard tester browser based",
        "keyboard key rollover tester online",
        "online keyboard diagnostic free tool",
        "free online keyboard testing tool",
        "keyboard tester no signup free online",
        "online key press detector free tool",
        "free browser based keyboard tool",
        "mechanical keyboard tester online free"
      ],
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
    seoTitle: "Image Resizer Free — Online Tool | Craftisle",
    seoDesc: "Free image resizer online tool. Resize images by width, height, or fit mode 100% browser-based, no signup required.",
    seoKeywords: [
        "image resizer online free tool",
        "resize image online free tool",
        "free image resizer browser based",
        "change image size online free tool",
        "online photo resizer free tool",
        "free online image dimension tool",
        "image resizer no signup free online",
        "online bulk image resizer free tool",
        "free browser based image resizer",
        "resize PNG JPG online free tool"
      ],
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
    seoTitle: "Image Cropper Free — Online Tool | Craftisle",
    seoDesc: "Free image cropper online tool. Crop images to exact pixel coordinates 100% browser-based, no signup required.",
    seoKeywords: [
        "image compressor online free tool",
        "compress image online free tool",
        "free image compressor browser based",
        "reduce image file size online free",
        "online image optimizer free tool",
        "free online image compression tool",
        "image compressor no signup free online",
        "compress PNG JPG online free tool",
        "free browser based image compressor",
        "lossy image compression online free tool"
      ],
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
  "image-change-opacity": {
    title: "Change Image Opacity",
    desc: "Adjust image opacity (solid or gradient mode)",
    icon: "🔳",
    category: CATEGORIES.image,
    seoTitle: "Change Image Opacity Free — Online Tool | Craftisle",
    seoDesc: "Free change image opacity online tool. Adjust transparency with solid or gradient mode. 100% browser-based.",
    seoKeywords: ["change opacity", "image opacity", "transparent image", "adjust transparency"],
    description: "Adjust image opacity with solid or gradient mode.",
    howToUse: [
      { heading: "Upload Image", text: "Select an image file to process." },
      { heading: "Adjust Opacity", text: "Set opacity level (0-1) and mode (solid/gradient)." },
      { heading: "Download", text: "Download the processed image." }
    ],
    faq: [
      { q: "What does solid mode do?", a: "Solid mode applies the same opacity level to all pixels." },
      { q: "What does gradient mode do?", a: "Gradient mode creates a smooth opacity transition (linear or radial)." }
    ],
    relatedTools: ["image-crop", "image-resize", "image-rotate"]
  },

  "image-create-transparent": {
    title: "Create Transparent PNG",
    desc: "Make specific colors transparent in an image",
    icon: "🔴",
    category: CATEGORIES.image,
    seoTitle: "Create Transparent PNG Free — Online Tool | Craftisle",
    seoDesc: "Free create transparent PNG online tool. Make specific colors transparent. 100% browser-based.",
    seoKeywords: ["transparent png", "remove background", "color to transparent", "create transparent"],
    description: "Make specific colors in an image transparent.",
    howToUse: [
      { heading: "Upload Image", text: "Select an image file to process." },
      { heading: "Select Color", text: "Choose the color to make transparent and set similarity threshold." },
      { heading: "Download", text: "Download the transparent PNG." }
    ],
    faq: [
      { q: "What is similarity?", a: "Similarity controls how closely matching colors are included (0-100%)." },
      { q: "What format is the output?", a: "The output is a PNG file with transparency." }
    ],
    relatedTools: ["image-crop", "image-resize", "image-compress"]
  },

  "image-split": {
    title: "Split Image",
    desc: "Split an image into multiple tiles",
    icon: "✂️",
    category: CATEGORIES.image,
    seoTitle: "Split Image Free — Online Tool | Craftisle",
    seoDesc: "Free split image online tool. Split an image into multiple tiles. 100% browser-based.",
    seoKeywords: ["split image", "image tiles", "divide image", "image grid"],
    description: "Split an image into multiple tiles of specified size.",
    howToUse: [
      { heading: "Upload Image", text: "Select an image file to split." },
      { heading: "Set Tile Size", text: "Enter the width and height of each tile in pixels." },
      { heading: "Download", text: "Download all tiles as separate PNG files." }
    ],
    faq: [
      { q: "What happens to edge tiles?", a: "Edge tiles are automatically resized to fit the remaining pixels." },
      { q: "What format are the tiles?", a: "All tiles are saved as PNG files." }
    ],
    relatedTools: ["image-crop", "image-resize", "image-to-pixel"]
  },

  "image-compress": {
    title: "Image Compressor",
    desc: "Compress images with quality control",
    icon: "🗜️",
    category: CATEGORIES.image,
    seoTitle: "Image Compressor Free — Online Tool | Craftisle",
    seoDesc: "Free image compressor online tool. Compress images with quality control 100% browser-based, no signup required.",
    seoKeywords: [
        "image border adder online free tool",
        "add border to image online free tool",
        "free image border browser based tool",
        "online photo border maker free tool",
        "add frame to image online free tool",
        "free online image border adder tool",
        "image border no signup free online tool",
        "custom border image online free tool",
        "free browser based image border tool",
        "add polaroid border to image online free"
      ],
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
    seoTitle: "Image Converter Free — Online Tool | Craftisle",
    seoDesc: "Free image converter online tool. Convert between JPEG, PNG, WebP, AVIF, TIFF 100% browser-based, no signup required.",
    seoKeywords: [
        "strip image metadata online free tool",
        "remove EXIF data online free tool",
        "free metadata remover browser based",
        "clear photo metadata online free tool",
        "online image privacy protector free tool",
        "free online EXIF remover tool",
        "strip metadata no signup free online",
        "remove image location data online free tool",
        "free browser based metadata cleaner",
        "clean image metadata online free tool"
      ],
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
    seoTitle: "Image Rotator Free — Online Tool | Craftisle",
    seoDesc: "Free image rotator online tool. Rotate images by any angle 100% browser-based, no signup required.",
    seoKeywords: [
        "image rotator online free tool",
        "rotate image online free tool",
        "free image rotator browser based",
        "rotate PNG JPG online free tool",
        "online photo rotator free tool",
        "free online image rotation tool",
        "image rotator no signup free online",
        "rotate image 90 180 online free tool",
        "free browser based image rotator",
        "flip image online free tool"
      ],
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
    seoTitle: "Color Palette Free — Online Tool | Craftisle",
    seoDesc: "Free color palette online tool. Extract dominant colors from any image 100% browser-based, no signup required.",
    seoKeywords: [
        "image color adjuster online free tool",
        "adjust image brightness online free tool",
        "free color adjust browser based tool",
        "online image contrast changer free tool",
        "tune image colors online free tool",
        "free online image color adjustment tool",
        "color adjust no signup free online tool",
        "edit image colors online free tool",
        "free browser based image color tool",
        "image saturation changer online free tool"
      ],
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
    seoTitle: "Favicon Generator Free — Online Tool | Craftisle",
    seoDesc: "Free favicon generator online tool. Generate favicon from any image 100% browser-based, no signup required.",
    seoKeywords: [
        "favicon generator online free tool",
        "create favicon online free tool",
        "free favicon generator browser based",
        "generate favicon from image online free",
        "online favicon maker free tool",
        "free online favicon generator tool",
        "favicon generator no signup free online",
        "create website favicon online free tool",
        "free browser based favicon maker",
        "favicon generator 64x64 online free tool"
      ],
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
    seoTitle: "Strip Metadata Free — Online Tool | Craftisle",
    seoDesc: "Free strip metadata online tool. Remove EXIF and metadata from images 100% browser-based, no signup required.",
    seoKeywords: ['strip metadata online free', 'free strip metadata tool', 'strip metadata no signup', 'online strip metadata browser', 'Craftisle strip metadata'],
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
    seoTitle: "Image Info Free — Online Categories.Image Tool | Craftisle",
    seoDesc: "Free image info online tool. Read dimensions, format, and metadata 100% browser-based, no signup required.",
    seoKeywords: [
        "image info viewer online free tool",
        "get image metadata online free tool",
        "free image info browser based tool",
        "view image EXIF online free tool",
        "online image properties viewer free tool",
        "free online image information tool",
        "image info no signup free online tool",
        "check image resolution online free tool",
        "free browser based image info viewer",
        "image dimension checker online free tool"
      ],
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
    seoTitle: "Image Border Free — Online Categories.Image Tool | Craftisle",
    seoDesc: "Free image border online tool. Add colored borders to images 100% browser-based, no signup required.",
    seoKeywords: ['image border online free', 'free image border tool', 'image border no signup', 'online image border browser', 'Craftisle image border'],
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
    seoTitle: "Watermark Free — Online Categories.Image Tool | Craftisle",
    seoDesc: "Free watermark online tool. Add text watermarks to images 100% browser-based, no signup required.",
    seoKeywords: [
        "image watermark adder online free tool",
        "add watermark to image online free",
        "free watermark browser based tool",
        "online photo watermark maker free tool",
        "watermark PNG JPG online free tool",
        "free online image watermark adder",
        "watermark no signup free online tool",
        "batch watermark images online free tool",
        "free browser based watermark tool",
        "custom text watermark image online free"
      ],
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
    seoTitle: "Color Adjust Free — Online Categories.Image Tool | Craftisle",
    seoDesc: "Free color adjust online tool. Adjust brightness, contrast, saturation 100% browser-based, no signup required.",
    seoKeywords: ['color adjust online free', 'free color adjust tool', 'color adjust no signup', 'online color adjust browser', 'Craftisle color adjust'],
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

  "id-photo": {
    title: "AI 证件照制作",
    desc: "AI 智能抠图换底，支持多种证件照尺寸",
    icon: "📷",
    category: CATEGORIES.image,
    stars: 5,
    seoTitle: "免费证件照制作 - AI 智能抠图换底 | Craftisle",
    seoDesc: "免费在线证件照制作工具，AI 自动抠图、换背景底色、调整尺寸。支持1寸、2寸、护照等多种规格，100% 浏览器本地处理，照片不上传服务器。",
    seoKeywords: [
      "证件照",
      "证件照制作",
      "AI 抠图",
      "证件照换底",
      "免费证件照",
      "1寸照片",
      "2寸照片",
      "护照照片",
    ],
    description: "使用 AI 自动抠图并更换证件照背景底色，支持多种标准证件照尺寸。所有处理均在浏览器本地完成——您的照片不会上传到任何服务器。",
    howToUse: [
      { heading: "上传照片", text: "点击上方区域上传正面免冠照片，JPG 或 PNG 格式均可。" },
      { heading: "选择尺寸", text: "选择证件照尺寸：1寸、2寸、护照照片、美国签证等。" },
      { heading: "选择底色", text: "点击颜色按钮选择背景底色：白色、蓝色、红色等。" },
      { heading: "开始制作", text: "点击「开始制作证件照」按钮，AI 将自动处理。" },
      { heading: "下载证件照", text: "处理完成后，点击「下载证件照」保存 JPG 文件。" },
    ],
    useCases: [
      { title: "护照申请", text: "生成符合规范的护照照片，省去照相馆费用。" },
      { title: "签证申请", text: "生成符合美国、申根、英国等签证规范的证件照。" },
      { title: "考试报名", text: "生成符合公务员考试、高考等报名要求的证件照。" },
    ],
    faq: [
      { q: "这个证件照工具真的免费吗？", a: "是的，完全免费。无需注册，无水印，无使用次数限制。" },
      { q: "我的照片会被上传到服务器吗？", a: "不会。所有处理均在您的浏览器本地完成，使用 AI 模型。您的照片不会离开您的设备。" },
      { q: "支持哪些证件照尺寸？", a: "1寸、2寸、护照照片、美国签证照片，以及自定义尺寸。" },
      { q: "可以更换背景底色吗？", a: "可以，您可以选择白色、蓝色、红色或任何自定义 HEX 颜色。" },
    ],
    relatedTools: ["image-passport-photo", "image-resize", "image-convert"],
  },

  "image-passport-photo": {
    title: "Passport Photo",
    desc: "Generate passport and visa photos",
    icon: "📸",
    category: CATEGORIES.image,
    seoTitle: "Passport Photo Free — Online Tool | Craftisle",
    seoDesc: "Free passport photo online tool. Generate passport and visa photos 100% browser-based, no signup required.",
    seoKeywords: [
        "passport photo maker online free tool",
        "create passport photo online free tool",
        "free passport photo browser based tool",
        "online ID photo generator free tool",
        "passport photo size online free tool",
        "free online passport photo maker tool",
        "passport photo no signup free online",
        "create visa photo online free tool",
        "free browser based passport photo tool",
        "passport photo background remover online free"
      ],
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
    seoTitle: "Meme Generator Free — Online Tool | Craftisle",
    seoDesc: "Free meme generator online tool. Add top and bottom text to any image 100% browser-based, no signup required.",
    seoKeywords: [
        "meme generator online free tool",
        "create meme online free tool",
        "free meme generator browser based",
        "online meme maker free tool",
        "custom meme creator online free tool",
        "free online meme generator tool",
        "meme generator no signup free online",
        "add text to image meme online free tool",
        "free browser based meme maker",
        "funny meme generator online free tool"
      ],
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
    seoTitle: "Beautify Screenshots Free — Online Tool | Craftisle",
    seoDesc: "Free beautify screenshots online tool. Add padding, shadow, and borders to screenshots 100% browser-based, no signup required.",
    seoKeywords: [
        "screenshot beautifier online free tool",
        "beautify screenshot online free tool",
        "free screenshot beautifier browser based",
        "online screenshot enhancer free tool",
        "add shadow to screenshot online free tool",
        "free online screenshot beautifier tool",
        "screenshot beautifier no signup free online",
        "mockup screenshot online free tool",
        "free browser based screenshot enhancer",
        "device frame screenshot online free tool"
      ],
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
    seoTitle: "Find Duplicates Free — Online Tool | Craftisle",
    seoDesc: "Free find duplicates online tool. Compare images and detect duplicates with perceptual hashing 100% browser-based, no signup required.",
    seoKeywords: [
        "find duplicate files online free tool",
        "duplicate file finder online free tool",
        "free duplicate finder browser based tool",
        "online duplicate photo finder free tool",
        "find duplicate images online free tool",
        "free online duplicate file detector tool",
        "duplicate finder no signup free online tool",
        "remove duplicate files online free tool",
        "free browser based duplicate detector",
        "find duplicate documents online free tool"
      ],
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
    url: "https://viewer.craftisle.com",
    seoTitle: "Free Online File Viewer — Open PDF, Word, Excel, DWG, STL, 135+ Formats | Craftisle",
    seoDesc: "Open and preview 135+ file formats in your browser — PDF, DOCX, XLSX, PPTX, DWG, DXF, STL, OBJ, GLTF, EPUB, ZIP, images, code & more. No install, no upload, 100% private. Free online file viewer.",
    seoKeywords: [
        "file viewer online free tool",
        "view file online free tool",
        "free file viewer browser based tool",
        "online document viewer free tool",
        "preview file online free tool",
        "free online file previewer tool",
        "file viewer no signup free online tool",
        "open file online free tool",
        "free browser based file viewer tool",
        "view PDF image text online free tool"
      ],
    badge: "New",
    description: "<strong>Preview 135+ file formats directly in your browser</strong> — no software installation, no upload, 100% private.<br/><br/><strong>Documents:</strong> Open PDF, Word (DOC, DOCX), Excel (XLS, XLSX, CSV), PowerPoint (PPT, PPTX), TXT, RTF, and ODT files instantly.<br/><br/><strong>Design & Engineering:</strong> View CAD drawings (DWG, DXF, DWF), 3D models (STL, OBJ, GLTF, GLB, FBX, PLY), and blueprints without AutoCAD or Fusion 360.<br/><br/><strong>Images:</strong> Preview JPG, PNG, GIF, WEBP, BMP, TIFF, SVG, HEIC, RAW (CR2, NEF, ARW), PSD, and ICO files.<br/><br/><strong>Archives:</strong> Browse ZIP, RAR, 7Z, TAR, GZ archive contents without extracting.<br/><br/><strong>Code & Data:</strong> View source code (JS, TS, Python, Java, C++, Rust, Go, JSON, XML, YAML, HTML, CSS) and data files.<br/><br/><strong>Media & E-Books:</strong> Read EPUB e-books, play audio/video, preview fonts (TTF, OTF, WOFF).<br/><br/><strong>How it works:</strong> All processing happens locally in your browser. Files are never uploaded to any server. Your data stays on your device — perfect for confidential documents, proprietary CAD files, and sensitive data.",
    howToUse: [
      { heading: "Upload or drag & drop any file", text: "Drag a file onto the upload zone, or click to browse. Supports 135+ formats including PDF, DOCX, XLSX, DWG, STL, EPUB, ZIP, images, code files, and more." },
      { heading: "Instant local preview", text: "The file is processed entirely in your browser using local rendering. No upload, no server — just instant preview. Multi-page documents support page navigation." },
      { heading: "Explore and interact", text: "Zoom, pan, rotate (3D models), scroll, and navigate. CAD and 3D files support orbit controls. PDFs support page thumbnails and text search." },
      { heading: "Open another file", text: "Drop another file or click Browse. Each preview is independent. Compare different files by opening them side by side in multiple tabs." },
    ],
    useCases: [
      { title: "Open email attachments instantly", text: "Preview Word, Excel, PDF, and PowerPoint attachments from email without downloading or opening desktop apps. Works on any device including mobile." },
      { title: "View CAD drawings on the go", text: "Open DWG/DXF drawings from clients or colleagues directly in your browser. No AutoCAD license needed. Supports zoom, pan, and measure." },
      { title: "Preview 3D models anywhere", text: "View STL, OBJ, GLTF, FBX 3D models for 3D printing, game dev, or design review. Rotate, zoom, and inspect meshes without installing heavy 3D software." },
      { title: "Inspect archives without extracting", text: "Browse ZIP, RAR, and 7Z archive contents. Preview individual files inside archives — images, documents, and text files — without extracting." },
      { title: "Read EPUB and documents on mobile", text: "Open EPUB e-books, PDFs, and Office documents on your phone or tablet. No app installation needed — works in Safari and Chrome." },
      { title: "Quick code file viewer", text: "View source code files with syntax highlighting. Supports 20+ programming languages including JavaScript, Python, Java, C++, Rust, Go, and TypeScript." },
    ],
    faq: [
      { q: "Are my files uploaded to a server?", a: "No. All files are processed entirely in your browser using local Blob URLs and browser APIs. No data ever leaves your device. This makes it safe for confidential documents, proprietary designs, and sensitive data." },
      { q: "What is the maximum file size?", a: "50 MB per file. Larger files may cause performance issues due to browser memory limits. For files over 50 MB, consider using dedicated desktop software." },
      { q: "Can I open DWG files without AutoCAD?", a: "Yes. The viewer renders DWG and DXF files entirely in the browser. You get full zoom, pan, and layer control without installing AutoCAD, DraftSight, or any CAD software." },
      { q: "Does it support 3D model formats for 3D printing?", a: "Yes. STL, OBJ, GLTF/GLB, PLY, and FBX are all supported. You can rotate, zoom, inspect mesh topology, and verify models before sending them to a 3D printer." },
      { q: "Can I view HEIC photos from iPhone?", a: "Yes. The viewer supports HEIC/HEIF image format, so you can preview iPhone photos directly in the browser without converting to JPG first." },
      { q: "Does it work on mobile phones and tablets?", a: "Yes. The viewer is fully responsive and works on iOS Safari, Android Chrome, and iPad browsers. Touch gestures are supported for zoom and pan." },
      { q: "Can I edit PDFs or Word documents?", a: "No. This is a preview/viewer tool only. For PDF editing, check out our dedicated PDF tools. For Word editing, use Google Docs or Microsoft Office Online." },
      { q: "What archive formats are supported?", a: "ZIP, RAR, 7Z, TAR, GZ, and BZ2. You can browse the archive contents and preview individual files without extracting the entire archive." },
    ],
    relatedTools: ["pdf-viewer", "markdown", "diff", "csv-json", "image-info", "svg-editor"],
  },

  "create-gif": {
    title: "Create GIF",
    desc: "Create animated GIFs from multiple image frames",
    icon: "🎞️",
    category: CATEGORIES.image,
    seoTitle: "Create GIF Free — Online Categories.Image Tool | Craftisle",
    seoDesc: "Free create gif online tool. Create animated GIFs from multiple image frames 100% browser-based, no signup required.",
    seoKeywords: [
        "GIF creator online free tool",
        "create GIF online free tool",
        "free GIF maker browser based tool",
        "online animated GIF creator free tool",
        "make GIF from images online free tool",
        "free online GIF generator tool",
        "GIF creator no signup free online tool",
        "create animated GIF online free tool",
        "free browser based GIF maker tool",
        "GIF maker from video online free tool"
      ],
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

  // ==================== Handwriting Animation ====================
  "handwriting-animation": {
    title: "Handwriting Animation Generator",
    desc: "Convert text into beautiful handwriting animations, free online tool",
    icon: "✍️",
    badge: "New",
    category: CATEGORIES.generator,
    stars: 5,
    seoTitle: "Handwriting Animation Generator Free — Online Tool | Craftisle",
    seoDesc: "Convert any text into beautiful handwriting animations. Free online tool, no sign-up required. 8 built-in fonts, customizable speed and loop.",
    seoKeywords: [
        "handwriting animation maker online free tool",
        "create handwriting animation online free",
        "free handwriting animation browser based tool",
        "online text animation generator free tool",
        "handwriting effect online free tool",
        "free online handwriting animation maker",
        "handwriting animation no signup free online",
        "create animated text online free tool",
        "free browser based animation maker tool",
        "SVG handwriting animation online free tool"
      ],
    description:
      "<strong>Convert any text into beautiful handwriting animations</strong> — completely free, no sign-up required.<br/><br/>" +
      "<strong>8 built-in fonts:</strong> Caveat, Italianno, Tangerine, Parisienne, Suez One, Klee One, Amiri, Tilana — each with authentic stroke order animation.<br/><br/>" +
      "<strong>Custom speed:</strong> Choose slow, normal, or fast animation speed. Loop mode plays continuously; single-play mode runs once.<br/><br/>" +
      "<strong>100% browser-based:</strong> All rendering happens locally in your browser. No data is uploaded to any server. Your text stays private.",
    howToUse: [
      { heading: "Enter your text", text: "Type or paste any text into the text area. Supports all languages and Unicode characters." },
      { heading: "Choose a font", text: "Select from 8 beautiful handwriting fonts. Each font animates with authentic stroke order." },
      { heading: "Adjust settings", text: "Set animation speed (slow/normal/fast), font size, and loop mode. Click Replay to preview." },
      { heading: "Export (optional)", text: "Use your browser's screen recorder (Cmd+Shift+5 on Mac) to capture the animation as a video." },
    ],
    useCases: [
      { title: "Social media content", text: "Create handwriting animation videos for Instagram, TikTok, Twitter, and YouTube Shorts." },
      { title: "Educational videos", text: "Show proper stroke order for calligraphy or language learning content." },
      { title: "Personalized greetings", text: "Generate handwriting animations for birthday/holiday cards and send as video messages." },
      { title: "Product demos", text: "Add a human touch to product videos with handwritten annotation animations." },
    ],
    faq: [
      { q: "Is this tool really free?", a: "Yes. 100% free, no sign-up required, no usage limits. All processing happens in your browser." },
      { q: "Can I download the animation as a video?", a: "Use your browser's built-in screen recorder (Cmd+Shift+5 on Mac, Win+G on Windows) to capture the animation as a video file." },
      { q: "Does it support Chinese/Japanese/Korean characters?", a: "Yes. Tegaki supports Unicode and animates CJK characters with proper stroke order using the Amiri and other appropriate fonts." },
      { q: "Can I use my own font?", a: "Currently 8 built-in fonts are supported. Custom font support requires generating a Tegaki font bundle using the Tegaki Generator tool." },
      { q: "Is my text sent to a server?", a: "No. All rendering is done 100% in your browser using Canvas API. Your text never leaves your device." },
    ],
    relatedTools: ["create-gif", "image-to-pixel", "markdown"],
  },

  // ==================== HTML Visual Editor ====================
  "html-visual-editor": {
    title: "HTML Visual Editor",
    desc: "Upload or paste HTML, then edit visually with live preview. 100% browser-based, no upload.",
    icon: "🖊️",
    category: CATEGORIES.dev,
    seoTitle: "HTML Visual Editor Free — Online Tool | Craftisle",
    seoDesc: "Free HTML visual editor online. Upload or paste HTML code, edit visually with live preview. 100% browser-based, no signup required.",
    seoKeywords: [
    "HTML visual editor free online",
    "visual HTML editor online free",
    "edit HTML visually online free",
    "free HTML editor online no signup",
    "what you see is what you get HTML editor",
    "HTML visual editor no upload free",
    "free online HTML visual editor",
    "browser based HTML editor free",
    "visual web page editor online",
    "free HTML design editor online",
    "online visual HTML editor free"
  ],
    howToUse: [
      { heading: "Upload or paste HTML", text: "Click Upload to load an HTML file from your device, or paste HTML code directly into the editor." },
      { heading: "Edit visually", text: "Click any element in the preview to select it. Use the floating toolbar to edit text, change styles, and adjust attributes." },
      { heading: "Live preview", text: "All changes are reflected instantly in the live preview panel. No refresh needed." },
      { heading: "Export", text: "Click Export to download the edited HTML file. The output is clean, editor-free HTML ready for use." },
    ],
    useCases: [
      { title: "Quick HTML prototyping", text: "Design and tweak HTML snippets visually without writing code by hand." },
      { title: "Email template editing", text: "Load an HTML email template, tweak copy and styles, and export the result." },
      { title: "Landing page tweaks", text: "Make quick visual changes to a static HTML landing page without a full IDE." },
      { title: "Learning HTML/CSS", text: "See how changes in attributes and styles affect the rendered result in real time." },
    ],
    faq: [
      { q: "Is this tool really free?", a: "Yes. 100% free, no sign-up required, no usage limits. All processing happens in your browser." },
      { q: "Does it support CSS and JavaScript?", a: "Yes. The editor preserves all original CSS and JS in the HTML. Inline style editing is supported; external resources load normally." },
      { q: "Is my HTML uploaded to a server?", a: "No. All HTML is processed 100% locally using the browser FileReader API. Your code never leaves your device." },
      { q: "Can I edit complex frameworks like React or Vue HTML output?", a: "The editor works on final rendered HTML. It can edit the static output, but not the source components." },
      { q: "What file size is supported?", a: "Files up to 10MB are supported. Larger files may slow down the browser." },
    ],
    relatedTools: ["regex-vis", "handwriting-animation", "markdown"],
    stars: 4,
  },

  // ==================== Time Tools ====================
  "unix-to-date": {
    title: "Unix Timestamp Converter",
    desc: "Convert between Unix timestamps and human-readable dates",
    icon: "🕐",
    category: CATEGORIES.utility,
    seoTitle: "Unix Timestamp Converter Free — Online Tool | Craftisle",
    seoDesc: "Free Unix timestamp converter online. Convert Unix timestamps to dates and dates to Unix timestamps. Supports UTC and local time. 100% browser-based.",
    seoKeywords: ["unix timestamp converter", "unix to date", "date to unix", "timestamp converter online", "epoch converter"],
    description: "Convert between Unix timestamps (seconds since Jan 1, 1970) and human-readable dates. Supports both directions: Unix→Date and Date→Unix. Choose UTC or local time output. Essential for developers working with APIs, databases, and logging systems.",
    howToUse: [
      { heading: "Choose conversion mode", text: "Select 'Unix → Date' to convert timestamps, or 'Date → Unix' to convert dates." },
      { heading: "Enter timestamps or dates", text: "Paste Unix timestamps (one per line) or dates in YYYY-MM-DD HH:mm:ss format." },
      { heading: "Select time zone", text: "Choose UTC or local time for output. Optionally add UTC label." },
      { heading: "Convert", text: "Click Convert. Results appear in the output panel." },
    ],
    useCases: [
      { title: "API debugging", text: "Convert API timestamps to readable dates for debugging and logging." },
      { title: "Database queries", text: "Convert dates to Unix timestamps for SQL queries and database operations." },
      { title: "Log analysis", text: "Convert log timestamps to local time for easier analysis." },
    ],
    faq: [
      { q: "What is a Unix timestamp?", a: "A Unix timestamp is the number of seconds that have elapsed since January 1, 1970 (UTC). It's widely used in programming and databases." },
      { q: "Does it handle milliseconds?", a: "This tool expects seconds. For millisecond timestamps, divide by 1000 first." },
      { q: "What time zone is used?", a: "You can choose UTC or local time. UTC is the standard for Unix timestamps." },
    ],
    relatedTools: ["time-between-dates", "discord-timestamp", "seconds-to-time"],
  },

  "discord-timestamp": {
    title: "Discord Timestamp Generator",
    desc: "Generate Discord timestamp strings from dates",
    icon: "💬",
    category: CATEGORIES.utility,
    seoTitle: "Discord Timestamp Generator Free — Online Tool | Craftisle",
    seoDesc: "Free Discord timestamp generator online. Create Discord timestamp strings (<t:unix:format>) from dates. Supports all Discord formats. 100% browser-based.",
    seoKeywords: ["discord timestamp generator", "discord time format", "discord epoch", "discord date format", "discord embed timestamp"],
    description: "Generate Discord timestamp strings from dates. Discord uses a special format (<t:unix:format>) to display timestamps that automatically adjust to each user's local time zone. Supports all 7 Discord timestamp formats: short time, long time, short date, long date, short datetime, long datetime, and relative time.",
    howToUse: [
      { heading: "Enter dates", text: "Type or paste dates in YYYY-MM-DD HH:mm:ss format (one per line)." },
      { heading: "Choose format", text: "Select a Discord timestamp format from the dropdown." },
      { heading: "Generate", text: "Click Generate. Copy the Discord timestamp strings." },
      { heading: "Use in Discord", text: "Paste the timestamp strings in Discord messages. They'll display as formatted times." },
    ],
    useCases: [
      { title: "Discord bots", text: "Generate timestamps for bot embed messages and responses." },
      { title: "Event announcements", text: "Create timestamps for event announcements that show in each user's local time." },
      { title: "Moderation logs", text: "Add timestamps to moderation logs that are readable in any time zone." },
    ],
    faq: [
      { q: "What format should I use?", a: "Use 'F' (long datetime) for most cases. Use 'R' (relative time) for '2 hours ago' style display." },
      { q: "Does Discord need UTC?", a: "Yes. This tool treats input as UTC by default. Enable 'Treat input as local time' for local time input." },
      { q: "Where do I use these timestamps?", a: "In any Discord message, embed, or webhook. Discord automatically renders them as formatted timestamps." },
    ],
    relatedTools: ["unix-to-date", "time-between-dates"],
  },

  "seconds-to-time": {
    title: "Seconds to Time Converter",
    desc: "Convert seconds to HH:MM:SS time format",
    icon: "⏱️",
    category: CATEGORIES.utility,
    seoTitle: "Seconds to Time Converter Free — Online Tool | Craftisle",
    seoDesc: "Free seconds to time converter online. Convert seconds to HH:MM:SS format. Optional zero-padding. 100% browser-based.",
    seoKeywords: ["seconds to time", "seconds to hh:mm:ss", "convert seconds to time", "time format converter", "seconds calculator"],
    description: "Convert seconds to HH:MM:SS time format. Useful for converting durations, video lengths, and time intervals. Optionally pad with zeros (00:05:30 instead of 0:5:30). Supports batch conversion of multiple values.",
    howToUse: [
      { heading: "Enter seconds", text: "Type or paste seconds values (one per line)." },
      { heading: "Choose padding", text: "Enable 'Pad with zeros' for two-digit format (00:05:30). Disable for minimal format (0:5:30)." },
      { heading: "Convert", text: "Click Convert. Results appear in HH:MM:SS format." },
    ],
    useCases: [
      { title: "Video editing", text: "Convert video durations from seconds to time format for editing software." },
      { title: "Audio metadata", text: "Format track lengths for audio file metadata and playlists." },
      { title: "Data export", text: "Convert time values in datasets from seconds to readable time format." },
    ],
    faq: [
      { q: "What is the maximum value?", a: "No fixed maximum. The tool handles any positive integer." },
      { q: "Does it support milliseconds?", a: "This tool expects whole seconds. For milliseconds, divide by 1000 first or use a dedicated milliseconds tool." },
      { q: "Why use zero-padding?", a: "Zero-padding ensures consistent column width in tables and makes time values easier to read." },
    ],
    relatedTools: ["time-to-seconds", "unix-to-date"],
  },

  "time-between-dates": {
    title: "Time Between Dates Calculator",
    desc: "Calculate duration between two dates",
    icon: "📅",
    category: CATEGORIES.utility,
    seoTitle: "Time Between Dates Calculator Free — Online Tool | Craftisle",
    seoDesc: "Free time between dates calculator online. Calculate duration between two dates in days, hours, minutes, or auto mode. 100% browser-based.",
    seoKeywords: ["time between dates", "date difference calculator", "days between dates", "date duration calculator", "time span calculator"],
    description: "Calculate the duration between two dates. Supports multiple output units: auto (years, months, days), days, hours, minutes, or seconds. Useful for project planning, age calculation, and deadline tracking.",
    howToUse: [
      { heading: "Enter start date", text: "Select or type the start date in YYYY-MM-DD format." },
      { heading: "Enter end date", text: "Select or type the end date in YYYY-MM-DD format." },
      { heading: "Choose output unit", text: "Select 'Auto' for years/months/days, or choose a specific unit (days, hours, etc.)." },
      { heading: "Calculate", text: "Click Calculate. The duration appears in the selected unit." },
    ],
    useCases: [
      { title: "Project planning", text: "Calculate project duration and track deadlines." },
      { title: "Age calculation", text: "Calculate exact age in years, months, and days." },
      { title: "Event planning", text: "Count days until an event or since an event." },
    ],
    faq: [
      { q: "Does it include the end date?", a: "The calculation counts full days between dates. The end date is not counted as a full day." },
      { q: "Can I calculate negative durations?", a: "The tool always returns a positive duration. If end date is before start date, it swaps them automatically." },
      { q: "What is 'Auto' mode?", a: "Auto mode breaks down the duration into years, months, and days for human-readable output." },
    ],
    relatedTools: ["unix-to-date", "leap-year"],
  },

  "cron-parser": {
    title: "Cron Expression Parser",
    desc: "Parse and explain cron expressions",
    icon: "⏰",
    category: CATEGORIES.dev,
    seoTitle: "Cron Expression Parser Free — Online Tool | Craftisle",
    seoDesc: "Free cron expression parser online. Parse and explain cron expressions for crontab. Supports all standard cron formats. 100% browser-based.",
    seoKeywords: ["cron parser", "crontab guru", "cron expression decoder", "cron format explainer", "cron schedule parser"],
    description: "Parse and explain cron expressions. Cron is a time-based job scheduler in Unix-like operating systems. This tool helps you understand cron expressions by breaking down each field (minute, hour, day, month, weekday) and explaining what the cron job will do.",
    howToUse: [
      { heading: "Enter cron expression", text: "Type or paste a cron expression (e.g., '0 * * * *' for every hour)." },
      { heading: "Parse", text: "Click Parse. The tool explains each field and shows what the cron job does." },
      { heading: "Check examples", text: "Use the example cron expressions in the help text to learn the format." },
    ],
    useCases: [
      { title: "Server administration", text: "Understand cron jobs when setting up scheduled tasks on Linux servers." },
      { title: "CI/CD pipelines", text: "Configure scheduled builds and deployments in Jenkins, GitLab CI, or GitHub Actions." },
      { title: "Database backups", text: "Set up automated database backup schedules using cron expressions." },
    ],
    faq: [
      { q: "What is a cron expression?", a: "A cron expression is a string of 5 fields: minute, hour, day of month, month, day of week. Each field can be *, a number, a range, or a step value." },
      { q: "Does it support special strings?", a: "This tool supports standard 5-field cron expressions. Special strings like '@daily' are not supported yet." },
      { q: "Where do I use cron expressions?", a: "In crontab files on Linux/Unix systems, and in CI/CD tools like Jenkins, GitLab, and GitHub Actions." },
    ],
    relatedTools: ["unix-to-date", "time-between-dates"],
  },

  "leap-year": {
    title: "Leap Year Checker",
    desc: "Check if years are leap years",
    icon: "📆",
    category: CATEGORIES.utility,
    seoTitle: "Leap Year Checker Free — Online Tool | Craftisle",
    seoDesc: "Free leap year checker online. Check if years are leap years. Supports batch checking of multiple years. 100% browser-based.",
    seoKeywords: ["leap year checker", "is leap year", "leap year calculator", "leap year list", "gregorian calendar leap year"],
    description: "Check if one or multiple years are leap years. A leap year has 366 days instead of 365, with February 29 as the extra day. Leap years are divisible by 4, except for years divisible by 100 but not by 400.",
    howToUse: [
      { heading: "Enter years", text: "Type or paste years (one per line). Supports batch checking." },
      { heading: "Check", text: "Click Check. Results show which years are leap years." },
    ],
    useCases: [
      { title: "Date calculations", text: "Verify if a year is a leap year when calculating dates and durations." },
      { title: "Payroll systems", text: "Check if February has 28 or 29 days for payroll calculations." },
      { title: "Event planning", text: "Plan events that occur every 4 years (like leap day celebrations)." },
    ],
    faq: [
      { q: "What is a leap year?", a: "A leap year is a year with 366 days instead of 365. The extra day (February 29) keeps our calendar aligned with Earth's orbit." },
      { q: "Why are century years special?", a: "Century years (like 1900) are NOT leap years unless divisible by 400 (like 2000). This corrects for over-correction in the 4-year rule." },
      { q: "When is the next leap year?", a: "2024, 2028, 2032, etc. (every 4 years, with century year exceptions)." },
    ],
    relatedTools: ["time-between-dates", "unix-to-date"],
  },

  // ==================== List Tools ====================
  "shuffle-lines": {
    title: "Shuffle Lines",
    desc: "Randomize the order of lines in text",
    icon: "🔀",
    category: CATEGORIES.text,
    seoTitle: "Shuffle Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free shuffle lines online tool. Randomize the order of lines in text. Preserve or remove empty lines. 100% browser-based.",
    seoKeywords: ["shuffle lines", "randomize lines", "random line order", "shuffle text lines", "randomize text order"],
    description: "Randomize the order of lines in text using Fisher-Yates shuffle algorithm. Useful for randomizing lists, creating fair team assignments, or generating random orderings. Optionally preserve or remove empty lines.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose options", text: "Enable 'Preserve empty lines' to keep blank lines in the shuffled output." },
      { heading: "Shuffle", text: "Click Shuffle. The lines are randomized." },
      { heading: "Copy result", text: "Copy the shuffled text or download as a file." },
    ],
    useCases: [
      { title: "Team assignments", text: "Randomly assign people to teams or tasks." },
      { title: "Playlist ordering", text: "Shuffle a playlist or reading list for variety." },
      { title: "Sampling", text: "Randomly order a list before selecting a sample." },
    ],
    faq: [
      { q: "Is the shuffle truly random?", a: "Yes. This tool uses the Fisher-Yates shuffle algorithm, which produces uniform random permutations." },
      { q: "Can I shuffle comma-separated values?", a: "This tool shuffles lines. For comma-separated values, convert to lines first (one value per line), shuffle, then convert back." },
      { q: "Does it preserve line breaks?", a: "Yes. Each line is treated as a unit and shuffled as a whole." },
    ],
    relatedTools: ["sort-lines", "unique-lines"],
  },

  "sort-lines": {
    title: "Sort Lines",
    desc: "Sort lines alphabetically, numerically, or by length",
    icon: "📝",
    category: CATEGORIES.text,
    seoTitle: "Sort Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free sort lines online tool. Sort lines alphabetically, numerically, or by length. Remove duplicates. Case-insensitive option. 100% browser-based.",
    seoKeywords: ["sort lines", "alphabetize lines", "sort text lines", "line sorter", "text line sorter"],
    description: "Sort lines in text alphabetically (A→Z or Z→A), numerically, or by string length. Remove duplicates during sorting. Case-insensitive option available. Essential for organizing lists, cleaning data, and preparing text for analysis.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose sort options", text: "Select direction (ascending/descending), sort type (alphabetical/numeric/length), and case sensitivity." },
      { heading: "Remove duplicates (optional)", text: "Enable 'Remove duplicates' to deduplicate while sorting." },
      { heading: "Sort", text: "Click Sort. The sorted lines appear in the output." },
    ],
    useCases: [
      { title: "Data cleaning", text: "Sort and deduplicate lists of emails, URLs, or product codes." },
      { title: "Code organization", text: "Sort import statements, function lists, or configuration keys." },
      { title: "Content preparation", text: "Organize outlines, bibliographies, or reference lists alphabetically." },
    ],
    faq: [
      { q: "What is 'numeric' sort?", a: "Numeric sort parses each line as a number (if possible) and sorts by value. Lines that can't be parsed are sorted alphabetically." },
      { q: "Does case-insensitive sort work with non-English characters?", a: "Yes. The tool uses Unicode case folding, which handles accented characters correctly." },
      { q: "Can I sort by multiple criteria?", a: "This tool sorts by one criterion at a time. For multi-criteria sorting, sort multiple times in reverse priority order." },
    ],
    relatedTools: ["shuffle-lines", "unique-lines", "remove-duplicate-lines"],
  },

  "unique-lines": {
    title: "Find Unique Lines",
    desc: "Extract lines that appear exactly once",
    icon: "🔍",
    category: CATEGORIES.text,
    seoTitle: "Find Unique Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free find unique lines online tool. Extract lines that appear exactly once. Case-sensitive option. Count mode available. 100% browser-based.",
    seoKeywords: ["unique lines", "find unique lines", "extract unique lines", "lines that appear once", "text deduplication"],
    description: "Extract lines that appear exactly once in a text. Lines that appear multiple times are excluded. Useful for finding singletons in data, identifying unique entries, and cleaning lists. Supports case-sensitive and case-insensitive comparison.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose options", text: "Enable 'Case-sensitive comparison' to treat 'Apple' and 'apple' as different. Enable 'Count only' to see the number of unique lines without listing them." },
      { heading: "Find Unique", text: "Click Find Unique. Unique lines (or count) appear in output." },
    ],
    useCases: [
      { title: "Data analysis", text: "Find unique entries in datasets, logs, or survey responses." },
      { title: "List cleaning", text: "Extract unique items from a list that has duplicates." },
      { title: "Debugging", text: "Find unique error messages or log entries that appear only once." },
    ],
    faq: [
      { q: "What does 'appear exactly once' mean?", a: "A line is 'unique' if it appears exactly one time in the input. Lines that appear 2+ times are excluded." },
      { q: "How is this different from 'Remove Duplicates'?", a: " 'Remove Duplicates' keeps one copy of each line. 'Find Unique' only keeps lines that have NO duplicates." },
      { q: "Does it preserve original order?", a: "Yes. Unique lines are returned in the order they first appeared in the input." },
    ],
    relatedTools: ["remove-duplicate-lines", "sort-lines", "shuffle-lines"],
  },

  // ==================== CSV Tools ====================
  "csv-to-json": {
    title: "CSV to JSON Converter",
    desc: "Convert CSV data to JSON format",
    icon: "📊",
    category: CATEGORIES.converter,
    seoTitle: "CSV to JSON Converter Free — Online Tool | Craftisle",
    seoDesc: "Free CSV to JSON converter online. Convert CSV data to JSON array of objects or array of arrays. Custom delimiter support. 100% browser-based.",
    seoKeywords: ["csv to json", "convert csv to json", "csv to json online", "csv json converter", "csv to json array"],
    description: "Convert CSV (Comma-Separated Values) data to JSON format. Supports two output formats: array of objects (each row is an object with column names as keys) or array of arrays (first row as headers). Custom delimiter support (comma, semicolon, tab, pipe).",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data with headers in the first row." },
      { heading: "Choose options", text: "Select output format (objects or arrays) and delimiter (comma, semicolon, tab, pipe)." },
      { heading: "Convert", text: "Click Convert. The JSON output appears, formatted with 2-space indentation." },
      { heading: "Copy or download", text: "Copy the JSON or download as a .json file." },
    ],
    useCases: [
      { title: "API development", text: "Convert CSV data from spreadsheets to JSON for API requests and responses." },
      { title: "Data migration", text: "Transform CSV exports from legacy systems to JSON for modern applications." },
      { title: "Web development", text: "Convert CSV data to JSON for use in JavaScript applications and frontend frameworks." },
    ],
    faq: [
      { q: "What delimiter should I use?", a: "Comma (,) is standard for CSV. Semicolon (;) is common in European Excel exports. Tab is used for TSV files." },
      { q: "Does it handle quoted values?", a: "Yes. The tool handles quoted values (e.g., 'Value with, comma') correctly." },
      { q: "What format should I choose?", a: "Use 'objects' format for most cases (easier to work with in JavaScript). Use 'arrays' format for minimal output or when processing with other tools." },
    ],
    relatedTools: ["json-to-csv", "csv-formatter"],
  },

  // ==================== JSON Tools ====================
  "json-to-csv": {
    title: "JSON to CSV Converter",
    desc: "Convert JSON data to CSV format",
    icon: "📋",
    category: CATEGORIES.converter,
    seoTitle: "JSON to CSV Converter Free — Online Tool | Craftisle",
    seoDesc: "Free JSON to CSV converter online. Convert JSON array of objects to CSV format. Custom delimiter support. 100% browser-based.",
    seoKeywords: ["json to csv", "convert json to csv", "json to csv online", "json csv converter", "export json to csv"],
    description: "Convert JSON data to CSV (Comma-Separated Values) format. Supports JSON arrays of objects (most common format). Custom delimiter support (comma, semicolon, tab, pipe). Handles string escaping for values containing delimiters or quotes.",
    howToUse: [
      { heading: "Paste JSON data", text: "Type or paste JSON data (array of objects format works best)." },
      { heading: "Choose delimiter", text: "Select delimiter (comma, semicolon, tab, pipe)." },
      { heading: "Convert", text: "Click Convert. The CSV output appears with headers in the first row." },
      { heading: "Copy or download", text: "Copy the CSV or download as a .csv file." },
    ],
    useCases: [
      { title: "Data export", text: "Export JSON data from APIs or databases to CSV for Excel analysis." },
      { title: "Reporting", text: "Convert JSON data to CSV for business reports and spreadsheets." },
      { title: "Interoperability", text: "Convert JSON to CSV for systems that only accept CSV input." },
    ],
    faq: [
      { q: "What JSON format is supported?", a: "Array of objects (e.g., [{'name': 'Alice', 'age': 25}]) works best. The tool extracts all unique keys as CSV headers." },
      { q: "Does it handle nested objects?", a: "Nested objects are converted to '[object Object]' by default. Flatten nested objects before conversion for better results." },
      { q: "How are special characters handled?", a: "Values containing delimiters or quotes are wrapped in double quotes with internal quotes escaped (CSV standard)." },
    ],
    relatedTools: ["csv-to-json", "json-formatter"],
  },

  // ==================== More Time Tools ====================
  "days-to-hours": {
    title: "Days to Hours Converter",
    desc: "Convert days to hours",
    icon: "⏱️",
    category: CATEGORIES.utility,
    seoTitle: "Days to Hours Converter Free — Online Tool | Craftisle",
    seoDesc: "Free days to hours converter online. Convert days to hours. Simple and fast. 100% browser-based.",
    seoKeywords: ["days to hours", "convert days to hours", "days to hours calculator", "time conversion"],
    description: "Convert days to hours. Simple multiplication: 1 day = 24 hours. Useful for converting time durations, project planning, and scheduling.",
    howToUse: [
      { heading: "Enter days", text: "Type or paste day values (one per line)." },
      { heading: "Convert", text: "Click Convert. Results appear in hours." },
    ],
    useCases: [
      { title: "Project planning", text: "Convert project duration from days to hours for detailed scheduling." },
      { title: "Work tracking", text: "Convert work days to hours for timesheets and billing." },
      { title: "Event planning", text: "Convert days to hours for detailed event schedules." },
    ],
    faq: [
      { q: "How many hours in a day?", a: "There are 24 hours in a day." },
      { q: "Can I convert partial days?", a: "Yes. Decimal values are supported (e.g., 1.5 days = 36 hours)." },
    ],
    relatedTools: ["hours-to-days", "seconds-to-time"],
  },

  "hours-to-days": {
    title: "Hours to Days Converter",
    desc: "Convert hours to days",
    icon: "📅",
    category: CATEGORIES.utility,
    seoTitle: "Hours to Days Converter Free — Online Tool | Craftisle",
    seoDesc: "Free hours to days converter online. Convert hours to days with adjustable decimal accuracy. 100% browser-based.",
    seoKeywords: ["hours to days", "convert hours to days", "hours to days calculator", "time conversion"],
    description: "Convert hours to days. Supports decimal accuracy adjustment (0-6 decimal places). Useful for converting work hours to days, calculating project duration, and time analysis.",
    howToUse: [
      { heading: "Enter hours", text: "Type or paste hour values (one per line)." },
      { heading: "Set accuracy", text: "Choose decimal accuracy (0-6 decimal places)." },
      { heading: "Convert", text: "Click Convert. Results appear in days with specified accuracy." },
    ],
    useCases: [
      { title: "Work tracking", text: "Convert work hours to days for timesheets." },
      { title: "Project planning", text: "Convert task hours to days for project scheduling." },
      { title: "Time analysis", text: "Analyze time logs by converting hours to days." },
    ],
    faq: [
      { q: "How many hours in a day?", a: "There are 24 hours in a day." },
      { q: "What accuracy should I use?", a: "Use 0 for whole days, 2 for most cases, 6 for high precision." },
    ],
    relatedTools: ["days-to-hours", "time-between-dates"],
  },

  "time-to-seconds": {
    title: "Time to Seconds Converter",
    desc: "Convert HH:MM:SS to seconds",
    icon: "⏲",
    category: CATEGORIES.utility,
    seoTitle: "Time to Seconds Converter Free — Online Tool | Craftisle",
    seoDesc: "Free time to seconds converter online. Convert HH:MM:SS time format to seconds. Supports partial time formats. 100% browser-based.",
    seoKeywords: ["time to seconds", "hh:mm:ss to seconds", "convert time to seconds", "time format converter"],
    description: "Convert time in HH:MM:SS format to total seconds. Supports partial formats (MM:SS or just seconds). Useful for video editing, audio processing, and time calculations.",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values in HH:MM:SS format (one per line)." },
      { heading: "Convert", text: "Click Convert. Results appear in total seconds." },
    ],
    useCases: [
      { title: "Video editing", text: "Convert timecodes to seconds for video editing software." },
      { title: "Audio processing", text: "Convert audio timestamps to seconds for processing." },
      { title: "Data analysis", text: "Convert time values to seconds for calculations." },
    ],
    faq: [
      { q: "What formats are supported?", a: "HH:MM:SS, MM:SS, or just seconds. The tool auto-detects the format." },
      { q: "Does it handle milliseconds?", a: "This tool expects whole seconds. For milliseconds, multiply by 1000 or use a dedicated tool." },
    ],
    relatedTools: ["seconds-to-time", "unix-to-date"],
  },

  "truncate-time": {
    title: "Truncate Clock Time",
    desc: "Truncate time to hours only or hours+minutes",
    icon: "⏳",
    category: CATEGORIES.utility,
    seoTitle: "Truncate Clock Time Free — Online Tool | Craftisle",
    seoDesc: "Free truncate clock time online. Truncate time to hours only or hours+minutes. Options for zero-padding and showing zero values. 100% browser-based.",
    seoKeywords: ["truncate time", "truncate clock time", "keep hours only", "remove minutes seconds", "time truncation"],
    description: "Truncate clock time to hours only or hours+minutes. Useful for rounding down time values, simplifying time displays, and data normalization. Options for zero-padding and showing/hiding zero values.",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values in HH:MM:SS format (one per line)." },
      { heading: "Choose options", text: "Enable 'Keep hours only' to remove minutes and seconds. Enable other options as needed." },
      { heading: "Truncate", text: "Click Truncate. Results appear with truncated time." },
    ],
    useCases: [
      { title: "Time rounding", text: "Round down time values to nearest hour or nearest 15 minutes." },
      { title: "Data simplification", text: "Simplify time data by removing seconds or minutes." },
      { title: "Display formatting", text: "Format time values for display by truncating unnecessary precision." },
    ],
    faq: [
      { q: "What does 'truncate' mean?", a: "Truncation removes the smaller time units. For example, 14:35:20 becomes 14:35 (or 14 if hours-only mode)." },
      { q: "Does it round or truncate?", a: "It truncates (rounds down). 14:59:59 becomes 14:59 (or 14), not 15:00." },
    ],
    relatedTools: ["seconds-to-time", "time-to-seconds"],
  },

  "time-to-decimal": {
    title: "Time to Decimal Converter",
    desc: "Convert HH:MM:SS to decimal hours",
    icon: "⏴",
    category: CATEGORIES.utility,
    seoTitle: "Time to Decimal Converter Free — Online Tool | Craftisle",
    seoDesc: "Free time to decimal converter online. Convert HH:MM:SS time format to decimal hours. Adjustable decimal places. 100% browser-based.",
    seoKeywords: ["time to decimal", "hh:mm:ss to decimal", "convert time to decimal", "time format converter", "decimal hours"],
    description: "Convert time in HH:MM:SS format to decimal hours. Supports adjustable decimal places (0-4). Useful for payroll, time tracking, and data analysis where decimal format is required.",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values in HH:MM:SS format (one per line)." },
      { heading: "Set decimal places", text: "Choose decimal accuracy (0-4 decimal places)." },
      { heading: "Convert", text: "Click Convert. Results appear in decimal hours." },
    ],
    useCases: [
      { title: "Payroll", text: "Convert time logs to decimal hours for payroll systems." },
      { title: "Time tracking", text: "Convert tracked time to decimal format for reporting." },
      { title: "Data analysis", text: "Convert time values to decimal for calculations and analysis." },
    ],
    faq: [
      { q: "What is decimal hours?", a: "Decimal hours express time as a decimal fraction of an hour. For example, 1:30 = 1.5 hours, 0:45 = 0.75 hours." },
      { q: "How many decimal places should I use?", a: "Use 2 for most cases (1.50 hours). Use 0 for whole hours only." },
    ],
    relatedTools: ["seconds-to-time", "days-to-hours"],
  },

  // ==================== More List Tools ====================
  "duplicate-lines": {
    title: "Duplicate Lines",
    desc: "Duplicate lines in text N times",
    icon: "📋",
    category: CATEGORIES.text,
    seoTitle: "Duplicate Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free duplicate lines online tool. Duplicate lines in text N times. Concatenate or interleave mode. Reverse option. 100% browser-based.",
    seoKeywords: ["duplicate lines", "repeat lines", "duplicate text lines", "repeat text lines", "line duplication"],
    description: "Duplicate lines in text N times. Supports two modes: concatenate (Original + Copy + Copy) or interleave (Original, Copy, Original, Copy). Option to reverse copies. Useful for creating repeated content, test data, and text patterns.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Set number of copies", text: "Enter how many times to duplicate (2 = original + 1 copy)." },
      { heading: "Choose mode", text: "Select 'Concatenate' to append copies, or 'Interleave' to alternate." },
      { heading: "Duplicate", text: "Click Duplicate. The duplicated text appears in output." },
    ],
    useCases: [
      { title: "Test data generation", text: "Create repeated test data for software testing." },
      { title: "Content creation", text: "Create repeated patterns for text art or formatting." },
      { title: "Data expansion", text: "Expand small datasets by duplicating entries." },
    ],
    faq: [
      { q: "What is 'Concatenate' mode?", a: "Concatenate mode puts all copies together: Original + Copy + Copy + ..." },
      { q: "What is 'Interleave' mode?", a: "Interleave mode alternates: Original, Copy, Original, Copy, ..." },
      { q: "Can I reverse the copies?", a: "Yes. Enable 'Reverse copies' to reverse the order of duplicated lines." },
    ],
    relatedTools: ["shuffle-lines", "repeat-text"],
  },

  "find-popular": {
    title: "Find Most Popular Items",
    desc: "Count and rank items in a list",
    icon: "📊",
    category: CATEGORIES.text,
    seoTitle: "Find Most Popular Items Free — Online Text Tool | Craftisle",
    seoDesc: "Free find most popular items online tool. Count and rank items in a list. Sort by count or alphabetically. Multiple display formats. 100% browser-based.",
    seoKeywords: ["find most popular", "count items", "item frequency", "list statistics", "word frequency counter"],
    description: "Count and rank items in a list. Supports multiple separators (newline, comma, space, semicolon). Sort by count (most popular first) or alphabetically. Display formats: count only, with percentage, or with total. Case-insensitive option available.",
    howToUse: [
      { heading: "Paste your list", text: "Type or paste a list of items (one per line, or separated by comma/space)." },
      { heading: "Choose separator", text: "Select the separator used in your list (newline, comma, space, semicolon)." },
      { heading: "Choose sort and display", text: "Select sort method (by count or alphabetical) and display format (count, percentage, or total)." },
      { heading: "Analyze", text: "Click Analyze. The ranked list appears in output." },
    ],
    useCases: [
      { title: "Survey analysis", text: "Count responses in survey data to find most common answers." },
      { title: "Log analysis", text: "Count error messages or events in log files." },
      { title: "Shopping list analysis", text: "Count items in a shopping list to find most frequently bought items." },
    ],
    faq: [
      { q: "What is 'Display Format'?", a: "Count: 'Alice: 5'. Percentage: 'Alice: 5 (50%)'. Total: 'Alice: 5 (5/10)'." },
      { q: "Does case matter?", a: "By default, case is ignored ('Alice' = 'alice'). Disable 'Ignore case' to treat them as different." },
      { q: "Can I count words in a paragraph?", a: "Yes. Use 'Space' as separator to count individual words." },
    ],
    relatedTools: ["unique-lines", "sort-lines", "shuffle-lines"],
  },

  "reverse-lines": {
    title: "Reverse Lines",
    desc: "Reverse the order of lines in text",
    icon: "🔃",
    category: CATEGORIES.text,
    seoTitle: "Reverse Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free reverse lines online tool. Reverse the order of lines in text. Preserve or remove empty lines. 100% browser-based.",
    seoKeywords: ["reverse lines", "reverse text order", "reverse line order", "invert lines", "reverse list order"],
    description: "Reverse the order of lines in text. Useful for reversing lists, inverting order of items, and processing data in reverse. Optionally preserve or remove empty lines.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose options", text: "Enable 'Preserve empty lines' to keep blank lines in the reversed output." },
      { heading: "Reverse", text: "Click Reverse. The lines are reversed in order." },
      { heading: "Copy result", text: "Copy the reversed text or download as a file." },
    ],
    useCases: [
      { title: "List inversion", text: "Reverse the order of items in a list (e.g., highest to lowest)." },
      { title: "Data processing", text: "Process data in reverse order for analysis." },
      { title: "Text transformation", text: "Reverse paragraphs or stanzas in poetry." },
    ],
    faq: [
      { q: "Does it reverse the text within each line?", a: "No. It reverses the ORDER of lines, not the text within each line. Use 'Reverse Text' tool for that." },
      { q: "Can I reverse part of a list?", a: "Yes. Select the lines you want to reverse and paste them separately." },
    ],
    relatedTools: ["shuffle-lines", "sort-lines", "rotate-lines"],
  },

  "rotate-lines": {
    title: "Rotate Lines",
    desc: "Rotate lines in text (move first N lines to end)",
    icon: "🔄",
    category: CATEGORIES.text,
    seoTitle: "Rotate Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free rotate lines online tool. Rotate lines in text (move first N lines to end). Preserve or remove empty lines. 100% browser-based.",
    seoKeywords: ["rotate lines", "circular shift lines", "move lines to end", "line rotation", "cyclic permutation"],
    description: "Rotate lines in text (cyclic permutation). Move the first N lines to the end of the text. Useful for rotating lists, cycling through items, and creating circular references.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Set rotate positions", text: "Enter how many lines to move from beginning to end." },
      { heading: "Choose options", text: "Enable 'Preserve empty lines' to keep blank lines." },
      { heading: "Rotate", text: "Click Rotate. The lines are rotated." },
    ],
    useCases: [
      { title: "List cycling", text: "Cycle through items in a list (e.g., rotate shift schedule)." },
      { title: "Text transformation", text: "Create circular references in text." },
      { title: "Data rotation", text: "Rotate data rows for analysis or presentation." },
    ],
    faq: [
      { q: "What does 'rotate by 1' mean?", a: "'abc' with rotate=1 becomes 'bca' (first line moves to end)." },
      { q: "Can I rotate by more than 1?", a: "Yes. Rotate by any number up to the total number of lines." },
    ],
    relatedTools: ["reverse-lines", "shuffle-lines", "sort-lines"],
  },

  "wrap-lines": {
    title: "Wrap / Unwrap Lines",
    desc: "Wrap long lines or unwrap short lines",
    icon: "📝",
    category: CATEGORIES.text,
    seoTitle: "Wrap / Unwrap Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free wrap unwrap lines online tool. Wrap long lines at specified width or unwrap short lines. Custom separator support. 100% browser-based.",
    seoKeywords: ["wrap lines", "unwrap lines", "line wrapping", "text wrapping", "join lines"],
    description: "Wrap long lines at specified width or unwrap (join) short lines. Useful for formatting text, preparing email text, and processing data. Custom separator support for unwrapping.",
    howToUse: [
      { heading: "Choose mode", text: "Select 'Wrap' to break long lines, or 'Unwrap' to join lines." },
      { heading: "Set options", text: "For Wrap: set width (characters per line). For Unwrap: set separator (space, comma, etc.)." },
      { heading: "Process", text: "Click Wrap or Unwrap. The processed text appears in output." },
    ],
    useCases: [
      { title: "Email formatting", text: "Wrap text to 72 characters for plain text email." },
      { title: "Code formatting", text: "Wrap long comment lines in code." },
      { title: "Data preparation", text: "Unwrap lines to create comma-separated lists." },
    ],
    faq: [
      { q: "Where does it break long lines?", a: "It tries to break at the separator (space by default). If not found near the wrap width, it breaks at the width." },
      { q: "Can I unwrap with custom separator?", a: "Yes. Choose from space, comma, comma+space, or newline." },
    ],
    relatedTools: ["sort-lines", "shuffle-lines", "reverse-lines"],
  },

  // ==================== XML Tools ====================
  "xml-beautifier": {
    title: "XML Beautifier",
    desc: "Format and validate XML",
    icon: "📄",
    category: CATEGORIES.utility,
    seoTitle: "XML Beautifier Free — Online Tool | Craftisle",
    seoDesc: "Free XML beautifier online. Format and validate XML. Uses fast-xml-parser library. 100% browser-based.",
    seoKeywords: ["xml beautifier", "format xml", "xml formatter", "validate xml", "xml pretty print"],
    description: "Format and validate XML. Uses fast-xml-parser library for reliable parsing and formatting. Supports custom indentation. Essential for API development, configuration file editing, and data interchange.",
    howToUse: [
      { heading: "Paste XML", text: "Type or paste XML data." },
      { heading: "Format", text: "Click Format. The formatted XML appears in output." },
      { heading: "Copy or download", text: "Copy the formatted XML or download as a .xml file." },
    ],
    useCases: [
      { title: "API development", text: "Format XML responses from APIs for debugging." },
      { title: "Configuration files", text: "Format XML config files (pom.xml, web.xml, etc.)." },
      { title: "Data interchange", text: "Format XML data for human-readable display." },
    ],
    faq: [
      { q: "What library is used?", a: "This tool uses fast-xml-parser, a fast and reliable XML parser for JavaScript." },
      { q: "Does it validate XML?", a: "Yes. Invalid XML is detected and error messages show line and column numbers." },
    ],
    relatedTools: ["xml-validator", "json-formatter"],
  },

  "xml-validator": {
    title: "XML Validator",
    desc: "Validate XML format",
    icon: "✓",
    category: CATEGORIES.utility,
    seoTitle: "XML Validator Free — Online Tool | Craftisle",
    seoDesc: "Free XML validator online. Validate XML format and show line/column of errors. Uses fast-xml-parser. 100% browser-based.",
    seoKeywords: ["xml validator", "validate xml", "xml validation", "check xml format", "xml syntax checker"],
    description: "Validate XML format and show line/column of errors. Uses fast-xml-parser library. Essential for API development, configuration file validation, and data interchange.",
    howToUse: [
      { heading: "Paste XML", text: "Type or paste XML data." },
      { heading: "Validate", text: "Click Validate. Valid XML shows success message. Invalid XML shows error with line/column." },
    ],
    useCases: [
      { title: "API development", text: "Validate XML requests and responses." },
      { title: "Configuration files", text: "Validate XML config files before deployment." },
      { title: "Data validation", text: "Validate XML data files for import/export." },
    ],
    faq: [
      { q: "What is validated?", a: "XML syntax: tags, attributes, nesting, special characters, etc." },
      { q: "Does it validate against XSD?", a: "No. This tool validates XML syntax, not schema validation (XSD/DTD)." },
    ],
    relatedTools: ["xml-beautifier", "json-validator"],
  },

  // ==================== More JSON Tools ====================
  "escape-json": {
    title: "Escape JSON",
    desc: "Escape special characters in JSON strings",
    icon: "🔤",
    category: CATEGORIES.dev,
    seoTitle: "Escape JSON Free — Online Tool | Craftisle",
    seoDesc: "Free escape JSON online tool. Escape special characters in JSON strings. Handle backslashes, quotes, newlines. 100% browser-based.",
    seoKeywords: ["escape json", "escape json string", "json escape characters", "escape quotes json", "json string escaping"],
    description: "Escape special characters in JSON strings. Handles backslashes, quotes, newlines, carriage returns, and tabs. Useful for embedding strings in JSON, preparing data for APIs, and string manipulation.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with special characters." },
      { heading: "Escape", text: "Click Escape. The escaped string appears in output." },
      { heading: "Copy", text: "Copy the escaped string for use in JSON." },
    ],
    useCases: [
      { title: "API development", text: "Escape strings before embedding in JSON requests." },
      { title: "Data preparation", text: "Escape special characters in data for JSON export." },
      { title: "String manipulation", text: "Escape strings for use in JavaScript/TypeScript." },
    ],
    faq: [
      { q: "What characters are escaped?", a: "Backslash (\\\\), quotes (\\\"), newline (\\n), carriage return (\\r), tab (\\t)." },
      { q: "When do I need to escape?", a: "When embedding strings in JSON that contain these special characters." },
    ],
    relatedTools: ["json-formatter", "stringify-json"],
  },

  // ==================== More CSV Tools ====================
  "csv-to-xml": {
    title: "CSV to XML Converter",
    desc: "Convert CSV data to XML format",
    icon: "📊",
    category: CATEGORIES.converter,
    seoTitle: "CSV to XML Converter Free — Online Tool | Craftisle",
    seoDesc: "Free CSV to XML converter online. Convert CSV data to XML format. Custom root and item element names. 100% browser-based.",
    seoKeywords: ["csv to xml", "convert csv to xml", "csv to xml online", "csv xml converter", "export csv to xml"],
    description: "Convert CSV (Comma-Separated Values) data to XML format. Supports custom root element name and item element name. Useful for data interchange, API integration, and legacy system support.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data with headers in the first row." },
      { heading: "Set element names", text: "Enter root element name (e.g., 'data') and item element name (e.g., 'item')." },
      { heading: "Convert", text: "Click Convert. The XML output appears." },
      { heading: "Copy or download", text: "Copy the XML or download as a .xml file." },
    ],
    useCases: [
      { title: "API integration", text: "Convert CSV data to XML for APIs that accept XML." },
      { title: "Data interchange", text: "Convert CSV to XML for systems that require XML format." },
      { title: "Legacy system support", text: "Convert modern CSV exports to XML for legacy systems." },
    ],
    faq: [
      { q: "What XML structure is generated?", a: "Root element contains item elements. Each item contains elements named after CSV headers." },
      { q: "Can I customize the XML structure?", a: "You can customize the root and item element names. For more complex structures, post-process the XML." },
    ],
    relatedTools: ["xml-beautifier", "json-to-xml"],
  },

  // ==================== More List Tools ====================
  "truncate-lines": {
    title: "Truncate Lines",
    desc: "Keep or remove first N lines",
    icon: "✂️",
    category: CATEGORIES.text,
    seoTitle: "Truncate Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free truncate lines online tool. Keep or remove first N lines. Preserve or remove empty lines. 100% browser-based.",
    seoKeywords: ["truncate lines", "keep first n lines", "remove first n lines", "line truncation", "text truncation"],
    description: "Truncate lines in text. Keep first N lines or remove first N lines. Useful for extracting headers, removing introductions, and processing text in batches. Optionally preserve or remove empty lines.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose mode", text: "Select 'Keep first N lines' or 'Remove first N lines'." },
      { heading: "Set number of lines", text: "Enter how many lines to keep or remove." },
      { heading: "Truncate", text: "Click Truncate. The truncated text appears in output." },
    ],
    useCases: [
      { title: "Extract headers", text: "Keep first line of CSV/text files as headers." },
      { title: "Remove introductions", text: "Remove first N lines (introduction) from text." },
      { title: "Process in batches", text: "Extract first N lines for batch processing." },
    ],
    faq: [
      { q: "What does 'Keep first N lines' mean?", a: "Only the first N lines are kept. The rest are removed." },
      { q: "What does 'Remove first N lines' mean?", a: "The first N lines are removed. The rest are kept." },
    ],
    relatedTools: ["wrap-lines", "reverse-lines", "sort-lines"],
  },

  "unwrap-lines": {
    title: "Unwrap Lines",
    desc: "Join lines with separator",
    icon: "📝",
    category: CATEGORIES.text,
    seoTitle: "Unwrap Lines Free — Online Text Tool | Craftisle",
    seoDesc: "Free unwrap lines online tool. Join lines with separator (space, comma, etc.). Alias for wrap tool in unwrap mode. 100% browser-based.",
    seoKeywords: ["unwrap lines", "join lines", "concatenate lines", "merge lines", "combine lines"],
    description: "Unwrap (join) lines in text. Supports multiple separators (space, comma, comma+space, newline). Useful for creating comma-separated lists, merging short lines, and preparing data for processing.",
    howToUse: [
      { heading: "Paste your text", text: "Type or paste text with multiple lines." },
      { heading: "Choose separator", text: "Select separator (space, comma, comma+space, newline)." },
      { heading: "Unwrap", text: "Click Unwrap. The joined text appears in output." },
    ],
    useCases: [
      { title: "Create lists", text: "Join lines to create comma-separated lists." },
      { title: "Merge short lines", text: "Merge short lines into paragraphs." },
      { title: "Prepare data", text: "Join lines for processing as a single string." },
    ],
    faq: [
      { q: "What separator should I use?", a: "Use space for sentences, comma for lists, newline for preserving line breaks." },
      { q: "Is this the same as 'Wrap Lines' tool?", a: "No. 'Wrap Lines' breaks long lines. 'Unwrap Lines' joins short lines. They are opposite operations." },
    ],
    relatedTools: ["wrap-lines", "duplicate-lines", "sort-lines"],
  },

  // ==================== More CSV Tools ====================
  "csv-to-yaml": {
    title: "CSV to YAML Converter",
    desc: "Convert CSV data to YAML format",
    icon: "📋",
    category: CATEGORIES.converter,
    seoTitle: "CSV to YAML Converter Free — Online Tool | Craftisle",
    seoDesc: "Free CSV to YAML converter online. Convert CSV data to YAML format. Custom indent size. 100% browser-based.",
    seoKeywords: ["csv to yaml", "convert csv to yaml", "csv to yaml online", "csv yaml converter", "export csv to yaml"],
    description: "Convert CSV (Comma-Separated Values) data to YAML format. Supports custom indent size. Useful for configuration files, data serialization, and Kubernetes manifests.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data with headers in the first row." },
      { heading: "Set indent size", text: "Choose indent size (2 or 4 spaces)." },
      { heading: "Convert", text: "Click Convert. The YAML output appears." },
      { heading: "Copy or download", text: "Copy the YAML or download as a .yaml file." },
    ],
    useCases: [
      { title: "Configuration files", text: "Convert CSV data to YAML for config files (Kubernetes, Docker Compose, etc.)." },
      { title: "Data serialization", text: "Convert CSV data to YAML for data serialization." },
      { title: "API integration", text: "Convert CSV data to YAML for APIs that accept YAML." },
    ],
    faq: [
      { q: "What YAML structure is generated?", a: "Array of objects. Each object represents a row, with keys from CSV headers." },
      { q: "Can I customize the YAML structure?", a: "The generated YAML follows standard YAML array-of-objects format. For custom structures, post-process the YAML." },
    ],
    relatedTools: ["json-to-yaml", "csv-to-json"],
  },

  "tsv-to-json": {
    title: "TSV to JSON Converter",
    desc: "Convert TSV (Tab-Separated Values) to JSON",
    icon: "📌",
    category: CATEGORIES.converter,
    seoTitle: "TSV to JSON Converter Free — Online Tool | Craftisle",
    seoDesc: "Free TSV to JSON converter online. Convert TSV (Tab-Separated Values) to JSON format. 100% browser-based.",
    seoKeywords: ["tsv to json", "convert tsv to json", "tsv to json online", "tab separated to json"],
    description: "Convert TSV (Tab-Separated Values) data to JSON format. TSV is similar to CSV but uses tab as separator. Useful for data exported from spreadsheets as TSV.",
    howToUse: [
      { heading: "Paste TSV data", text: "Type or paste TSV data with headers in the first row." },
      { heading: "Choose format", text: "Select 'Objects' (array of objects) or 'Arrays' (array of arrays)." },
      { heading: "Convert", text: "Click Convert. The JSON output appears." },
      { heading: "Copy or download", text: "Copy the JSON or download as a .json file." },
    ],
    useCases: [
      { title: "Data import", text: "Convert TSV data from spreadsheets to JSON for web applications." },
      { title: "API integration", text: "Convert TSV data to JSON for APIs." },
      { title: "Data transformation", text: "Convert TSV to JSON for modern data processing pipelines." },
    ],
    faq: [
      { q: "What is TSV?", a: "TSV (Tab-Separated Values) is similar to CSV but uses tab character as separator. It's often used when data contains commas." },
      { q: "How is it different from CSV to JSON?", a: "This tool expects tab as separator instead of comma. The conversion logic is otherwise similar." },
    ],
    relatedTools: ["csv-to-json", "json-to-csv"],
  },

  "transpose-csv": {
    title: "Transpose CSV",
    desc: "Swap rows and columns in CSV data",
    icon: "🔄",
    category: CATEGORIES.converter,
    seoTitle: "Transpose CSV Free — Online Tool | Craftisle",
    seoDesc: "Free transpose CSV online tool. Swap rows and columns in CSV data. Supports custom delimiter. 100% browser-based.",
    seoKeywords: ["transpose csv", "swap rows columns csv", "rotate csv", "csv transpose online"],
    description: "Transpose CSV data (swap rows and columns). Useful for reformatting data, pivoting tables, and preparing data for different analysis tools. Supports custom delimiter.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data." },
      { heading: "Set delimiter", text: "Select delimiter (comma, semicolon, tab, pipe)." },
      { heading: "Transpose", text: "Click Transpose. The transposed CSV appears." },
      { heading: "Copy or download", text: "Copy the CSV or download as a .csv file." },
    ],
    useCases: [
      { title: "Data reformatting", text: "Swap rows and columns for better data layout." },
      { title: "Pivoting tables", text: "Transpose data for pivot table analysis." },
      { title: "Data preparation", text: "Reformat data for different analysis tools." },
    ],
    faq: [
      { q: "What does 'transpose' mean?", a: "Transpose swaps rows and columns. Row 1 becomes Column 1, Column 1 becomes Row 1, etc." },
      { q: "Does it handle headers?", a: "Yes. Headers are also transposed. The first column of the transposed data will be the original headers." },
    ],
    relatedTools: ["csv-to-json", "sort-lines"],
  },

  // ==================== More JSON Tools ====================
  "json-to-xml": {
    title: "JSON to XML Converter",
    desc: "Convert JSON data to XML format",
    icon: "📍",
    category: CATEGORIES.converter,
    seoTitle: "JSON to XML Converter Free — Online Tool | Craftisle",
    seoDesc: "Free JSON to XML converter online. Convert JSON data to XML format. Custom root and item element names. 100% browser-based.",
    seoKeywords: ["json to xml", "convert json to xml", "json to xml online", "json xml converter", "export json to xml"],
    description: "Convert JSON data to XML format. Supports custom root element name and item element name. Useful for data interchange, API integration, and legacy system support.",
    howToUse: [
      { heading: "Paste JSON data", text: "Type or paste JSON data (array of objects format works best)." },
      { heading: "Set element names", text: "Enter root element name (e.g., 'data') and item element name (e.g., 'item')." },
      { heading: "Convert", text: "Click Convert. The XML output appears." },
      { heading: "Copy or download", text: "Copy the XML or download as a .xml file." },
    ],
    useCases: [
      { title: "API integration", text: "Convert JSON data to XML for APIs that accept XML." },
      { title: "Data interchange", text: "Convert JSON to XML for systems that require XML format." },
      { title: "Legacy system support", text: "Convert modern JSON data to XML for legacy systems." },
    ],
    faq: [
      { q: "What XML structure is generated?", a: "Root element contains item elements. Each item contains elements named after JSON keys." },
      { q: "Can I convert nested JSON?", a: "Nested objects are converted to nested XML elements. Arrays are converted to repeated elements." },
    ],
    relatedTools: ["xml-beautifier", "csv-to-xml"],
  },

  "sort-json": {
    title: "Sort JSON Keys",
    desc: "Sort keys in JSON objects alphabetically",
    icon: "🔃",
    category: CATEGORIES.dev,
    seoTitle: "Sort JSON Keys Free — Online Tool | Craftisle",
    seoDesc: "Free sort JSON keys online tool. Sort keys in JSON objects alphabetically. Recursive option. 100% browser-based.",
    seoKeywords: ["sort json keys", "alphabetize json keys", "sort json properties", "json key sorter"],
    description: "Sort keys in JSON objects alphabetically. Supports recursive sorting (sort nested objects too). Useful for normalizing JSON, comparing JSON files, and improving readability.",
    howToUse: [
      { heading: "Paste JSON", text: "Type or paste JSON data." },
      { heading: "Choose options", text: "Enable 'Recursive' to sort nested objects too." },
      { heading: "Sort Keys", text: "Click Sort Keys. The sorted JSON appears." },
      { heading: "Copy or download", text: "Copy the JSON or download as a .json file." },
    ],
    useCases: [
      { title: "Normalize JSON", text: "Sort keys to normalize JSON for comparison." },
      { title: "Improve readability", text: "Sort keys alphabetically for easier reading." },
      { title: "Prepare for diff", text: "Sort keys before comparing JSON files with diff tools." },
    ],
    faq: [
      { q: "What does 'Recursive' mean?", a: "Recursive mode sorts keys in nested objects too. Without it, only top-level keys are sorted." },
      { q: "Does it preserve array order?", a: "Yes. Array order is preserved. Only object keys are sorted." },
    ],
    relatedTools: ["json-formatter", "json-validator"],
  },

  "stringify-json": {
    title: "Stringify JSON",
    desc: "Convert JavaScript objects to JSON string",
    icon: "🔤",
    category: CATEGORIES.dev,
    seoTitle: "Stringify JSON Free — Online Tool | Craftisle",
    seoDesc: "Free stringify JSON online tool. Convert JavaScript objects to JSON string. Supports custom indent. 100% browser-based.",
    seoKeywords: ["stringify json", "js object to json", "javascript to json", "json stringify online"],
    description: "Convert JavaScript objects to JSON string. Supports custom indent size. Useful for preparing data for APIs, localStorage, and data export. Handles JavaScript-specific syntax (quotes, functions, etc.) are removed.",
    howToUse: [
      { heading: "Enter JavaScript object", text: "Type or paste a JavaScript object (e.g., {name: 'Alice', age: 25})." },
      { heading: "Set indent", text: "Choose indent size (2 or 4 spaces, or tab)." },
      { heading: "Stringify", text: "Click Stringify. The JSON string appears." },
      { heading: "Copy", text: "Copy the JSON string for use in code." },
    ],
    useCases: [
      { title: "API requests", text: "Convert JS objects to JSON for API requests." },
      { title: "localStorage", text: "Convert data to JSON for storing in localStorage." },
      { title: "Data export", text: "Convert JS data to JSON for export." },
    ],
    faq: [
      { q: "What input format is supported?", a: "Valid JavaScript object syntax. Keys can be unquoted (JS style) or quoted (JSON style)." },
      { q: "Does it handle functions or undefined?", a: "Functions and undefined values are removed (replaced with null). This matches JSON.stringify() behavior." },
    ],
    relatedTools: ["json-formatter", "escape-json"],
  },

  // ==================== CSV Tools (Batch 4) ====================
  "find-incomplete-csv": {
    title: "Find Incomplete CSV Records",
    desc: "Find rows with missing columns or empty values in CSV",
    icon: "🔍",
    category: CATEGORIES.dev,
    seoTitle: "Find Incomplete CSV Records Free — Online Tool | Craftisle",
    seoDesc: "Free find incomplete CSV records online tool. Find rows with missing columns or empty values. Supports custom separator and empty check. 100% browser-based.",
    seoKeywords: ["find incomplete csv", "csv missing columns", "csv empty values", "validate csv integrity"],
    description: "Find rows with missing columns or empty values in CSV data. Useful for data validation, data cleaning, and ensuring CSV integrity before import.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data (with header row)." },
      { heading: "Set options", text: "Choose separator, enable/disable empty value check, set issue limit." },
      { heading: "Find Issues", text: "Click Find Issues. Rows with missing columns or empty values are listed." },
      { heading: "Fix CSV", text: "Review issues and fix the CSV data accordingly." },
    ],
    useCases: [
      { title: "Data validation", text: "Check CSV data for missing columns before import." },
      { title: "Data cleaning", text: "Find and fix incomplete rows in CSV data." },
      { title: "Ensure integrity", text: "Validate CSV structure before processing." },
    ],
    faq: [
      { q: "What does 'missing columns' mean?", a: "Rows that have fewer columns than the maximum number of columns in the CSV." },
      { q: "What does 'empty values' mean?", a: "Cells that are empty (no value between separators)." },
    ],
    relatedTools: ["csv-formatter", "csv-to-json"],
  },

  "insert-csv-column": {
    title: "Insert CSV Column",
    desc: "Insert a new column into CSV data",
    icon: "➕",
    category: CATEGORIES.dev,
    seoTitle: "Insert CSV Column Free — Online Tool | Craftisle",
    seoDesc: "Free insert CSV column online tool. Insert a new column into CSV data. Supports custom separator and column index. 100% browser-based.",
    seoKeywords: ["insert csv column", "add csv column", "csv insert column online", "modify csv structure"],
    description: "Insert a new column into CSV data at a specified index. Header row gets column name, data rows get default value. Useful for adding new fields, data transformation, and CSV restructuring.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data (with header row)." },
      { heading: "Set options", text: "Choose separator, column index (1-based), column name (for header), default value (for data rows)." },
      { heading: "Insert Column", text: "Click Insert Column. New column is inserted at specified index." },
      { heading: "Copy or download", text: "Copy the CSV or download as a .csv file." },
    ],
    useCases: [
      { title: "Add new fields", text: "Insert a new column for data you want to add." },
      { title: "Data transformation", text: "Restructure CSV by inserting columns at specific positions." },
      { title: "Prepare for import", text: "Add required columns before importing to database." },
    ],
    faq: [
      { q: "What is 'Column Index'?", a: "1-based index. Column 1 = first column, Column 2 = second column, etc." },
      { q: "What happens to header row?", a: "Header row gets the column name. Data rows get the default value." },
    ],
    relatedTools: ["csv-formatter", "swap-csv-columns"],
  },

  "swap-csv-columns": {
    title: "Swap CSV Columns",
    desc: "Swap two columns in CSV data",
    icon: "🔄",
    category: CATEGORIES.dev,
    seoTitle: "Swap CSV Columns Free — Online Tool | Craftisle",
    seoDesc: "Free swap CSV columns online tool. Swap two columns in CSV data. Supports custom separator and column indexes. 100% browser-based.",
    seoKeywords: ["swap csv columns", "exchange csv columns", "reorder csv columns", "csv swap columns online"],
    description: "Swap two columns in CSV data by their 1-based indexes. Useful for reordering columns, data transformation, and preparing CSV for export.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data (with header row)." },
      { heading: "Set options", text: "Choose separator, column 1 index, column 2 index (both 1-based)." },
      { heading: "Swap Columns", text: "Click Swap Columns. The two columns are swapped." },
      { heading: "Copy or download", text: "Copy the CSV or download as a .csv file." },
    ],
    useCases: [
      { title: "Reorder columns", text: "Swap columns to change the order of fields." },
      { title: "Data transformation", text: "Rearrange CSV structure by swapping columns." },
      { title: "Prepare for export", text: "Reorder columns to match export requirements." },
    ],
    faq: [
      { q: "What is 'Column Index'?", a: "1-based index. Column 1 = first column, Column 2 = second column, etc." },
      { q: "What if rows have different column counts?", a: "Rows with insufficient columns are skipped (returned unchanged)." },
    ],
    relatedTools: ["csv-formatter", "insert-csv-column"],
  },

  // ==================== CSV Tools (Batch 5) ====================
  "csv-rows-to-columns": {
    title: "CSV Rows to Columns",
    desc: "Convert CSV rows to columns (transpose)",
    icon: "🔃",
    category: CATEGORIES.dev,
    seoTitle: "CSV Rows to Columns Free — Online Tool | Craftisle",
    seoDesc: "Free CSV rows to columns online tool. Convert CSV rows to columns (transpose). Supports custom separator and empty value handling. 100% browser-based.",
    seoKeywords: ["csv rows to columns", "transpose csv", "csv transpose", "convert csv rows to columns"],
    description: "Convert CSV rows to columns (transpose). Supports custom separator, empty value filling, and comment line removal. Useful for data transformation, reshaping CSV data, and preparing for analysis.",
    howToUse: [
      { heading: "Paste CSV data", text: "Type or paste CSV data." },
      { heading: "Set options", text: "Choose separator, enable/disable empty value filling, set custom filler or comment character." },
      { heading: "Convert", text: "Click Convert. Rows are converted to columns." },
      { heading: "Copy or download", text: "Copy the CSV or download as a .csv file." },
    ],
    useCases: [
      { title: "Data transformation", text: "Transpose CSV data for different analysis needs." },
      { title: "Reshape data", text: "Convert horizontal data to vertical (or vice versa)." },
      { title: "Prepare for import", text: "Reshape CSV to match import requirements." },
    ],
    faq: [
      { q: "What does 'Fill With Empty Values' mean?", a: "Add empty fields to incomplete rows to make a well-formed CSV." },
      { q: "What does 'Comment Character' do?", a: "Lines starting with this character are treated as comments and removed." },
    ],
    relatedTools: ["csv-to-json", "transpose-csv"],
  },

  // ==================== List Tools (Batch 5) ====================
  "group-lines": {
    title: "Group Lines",
    desc: "Group list items into chunks",
    icon: "📊",
    category: CATEGORIES.dev,
    seoTitle: "Group Lines Free — Online Tool | Craftisle",
    seoDesc: "Free group lines online tool. Group list items into chunks. Supports custom separators, wrapping, and padding. 100% browser-based.",
    seoKeywords: ["group lines", "chunk list", "group list items", "split list into chunks"],
    description: "Group list items into chunks of specified size. Supports custom item separator, group separator, left/right wrapping, and padding for non-full groups. Useful for formatting data, creating batches, and restructuring lists.",
    howToUse: [
      { heading: "Paste list", text: "Type or paste a list (items separated by a character)." },
      { heading: "Set options", text: "Set item separator, group size, item separator (within group), left/right wrap, group separator." },
      { heading: "Group", text: "Click Group. Items are grouped into chunks." },
      { heading: "Copy or download", text: "Copy the result or download as a .txt file." },
    ],
    useCases: [
      { title: "Format data", text: "Group items into fixed-size chunks for display." },
      { title: "Create batches", text: "Split a list into batches for processing." },
      { title: "Restructure lists", text: "Add wrapping and separators to list items." },
    ],
    faq: [
      { q: "What is 'Item Separator'?", a: "The character that separates items in the input (e.g., comma, semicolon, space)." },
      { q: "What is 'Pad Non-Full Groups'?", a: "If enabled, the last group is padded with a padding character to make it full size." },
    ],
    relatedTools: ["split", "wrap-lines"],
  },

  // ==================== String Tools (Batch 5) ====================
  "text-compare": {
    title: "Text Compare",
    desc: "Compare two texts and show differences",
    icon: "🔍",
    category: CATEGORIES.dev,
    seoTitle: "Text Compare Free — Online Tool | Craftisle",
    seoDesc: "Free text compare online tool. Compare two texts and show differences. Supports word-level and character-level comparison. 100% browser-based.",
    seoKeywords: ["text compare", "compare two texts", "text diff", "compare text online"],
    description: "Compare two texts and show differences. Supports word-level and character-level comparison. Useful for tracking changes, reviewing edits, and identifying modifications.",
    howToUse: [
      { heading: "Paste original text", text: "Type or paste the original text." },
      { heading: "Paste modified text", text: "Type or paste the modified text." },
      { heading: "Choose mode", text: "Select word-level or character-level comparison." },
      { heading: "Compare", text: "Click Compare Texts. Differences are shown (+, -, or unchanged)." },
      { heading: "Review differences", text: "Review the differences and make changes as needed." },
    ],
    useCases: [
      { title: "Track changes", text: "Compare versions of text to see what changed." },
      { title: "Review edits", text: "Compare original and edited text to review modifications." },
      { title: "Identify modifications", text: "Find exactly what was changed between two versions." },
    ],
    faq: [
      { q: "What is 'word-level' comparison?", a: "Compares texts word by word. Good for prose and documents." },
      { q: "What is 'character-level' comparison?", a: "Compares texts character by character. Good for code and short strings." },
    ],
    relatedTools: ["json-comparison", "diff"],
  },

  // ==================== Number Tools (Batch 6) ====================
  "arithmetic-sequence": {
    title: "Arithmetic Sequence Generator",
    desc: "Generate arithmetic sequence",
    icon: "🔢",
    category: CATEGORIES.dev,
    seoTitle: "Arithmetic Sequence Generator Free — Online Tool | Craftisle",
    seoDesc: "Free arithmetic sequence generator online tool. Generate arithmetic sequence with custom start, difference, and count. 100% browser-based.",
    seoKeywords: ["arithmetic sequence", "sequence generator", "math sequence", "generate sequence"],
    description: "Generate arithmetic sequence with custom start value, common difference, and count. Useful for math education, pattern generation, and sequence analysis.",
    howToUse: [
      { heading: "Set parameters", text: "Enter start value, common difference, and count." },
      { heading: "Generate", text: "Click Generate. The sequence is shown." },
      { heading: "Copy", text: "Copy the sequence for use in calculations or documents." },
    ],
    useCases: [
      { title: "Math education", text: "Generate sequences for teaching arithmetic progressions." },
      { title: "Pattern generation", text: "Create number patterns for testing or demonstration." },
      { title: "Sequence analysis", text: "Generate sequences for mathematical analysis." },
    ],
    faq: [
      { q: "What is an arithmetic sequence?", a: "A sequence where the difference between consecutive terms is constant (e.g., 2, 5, 8, 11... where difference = 3)." },
      { q: "Can I generate negative sequences?", a: "Yes. Set a negative start value or negative common difference." },
    ],
    relatedTools: ["random-number-generator", "sum"],
  },

  "random-number-generator": {
    title: "Random Number Generator",
    desc: "Generate random numbers in a range",
    icon: "🎲",
    category: CATEGORIES.dev,
    seoTitle: "Random Number Generator Free — Online Tool | Craftisle",
    seoDesc: "Free random number generator online tool. Generate random integers in a custom range. Supports unique numbers and batch generation. 100% browser-based.",
    seoKeywords: ["random number generator", "generate random numbers", "random integer", "random number online"],
    description: "Generate random numbers in a specified range. Supports batch generation, unique numbers only, and custom count. Useful for games, sampling, testing, and simulations.",
    howToUse: [
      { heading: "Set range", text: "Enter min and max values." },
      { heading: "Set count", text: "Enter how many numbers to generate." },
      { heading: "Enable unique (optional)", text: "Check 'Unique numbers only' to avoid duplicates." },
      { heading: "Generate", text: "Click Generate. Random numbers are shown." },
    ],
    useCases: [
      { title: "Games", text: "Generate random numbers for board games, dice rolls, etc." },
      { title: "Sampling", text: "Generate random samples from a population." },
      { title: "Testing", text: "Generate test data with random values." },
    ],
    faq: [
      { q: "Are the numbers truly random?", a: "They use Math.random(), which is pseudo-random. Good for most purposes but not cryptographic." },
      { q: "What does 'Unique numbers only' do?", a: "Ensures no duplicates in the generated numbers. Requires count <= (max - min + 1)." },
    ],
    relatedTools: ["random-string", "random-port-generator"],
  },

  // ==================== Utilities (Batch 6) ====================
  "password-generator": {
    title: "Password Generator",
    desc: "Generate secure passwords",
    icon: "🔐",
    category: CATEGORIES.dev,
    seoTitle: "Password Generator Free — Online Tool | Craftisle",
    seoDesc: "Free password generator online tool. Generate secure passwords with custom length and character types. Supports batch generation. 100% browser-based.",
    seoKeywords: ["password generator", "secure password", "generate password", "strong password"],
    description: "Generate secure passwords with custom length, character types (uppercase, lowercase, numbers, symbols), and count. Useful for creating strong passwords, API keys, and secure tokens.",
    howToUse: [
      { heading: "Set length", text: "Enter password length (4-128)." },
      { heading: "Set count", text: "Enter how many passwords to generate." },
      { heading: "Choose character types", text: "Check uppercase, lowercase, numbers, symbols." },
      { heading: "Generate", text: "Click Generate Password. Passwords are shown." },
    ],
    useCases: [
      { title: "Create strong passwords", text: "Generate passwords that meet security requirements." },
      { title: "Generate API keys", text: "Create secure tokens for API authentication." },
      { title: "Batch password creation", text: "Generate multiple passwords for team members." },
    ],
    faq: [
      { q: "How long should my password be?", a: "At least 12 characters. 16+ is recommended for critical accounts." },
      { q: "Are the passwords saved?", a: "No. Passwords are generated in your browser and not sent to any server." },
    ],
    relatedTools: ["random-string", "bcrypt"],
  },

  // ==================== String Tools (Batch 6) ====================
  "text-replacer": {
    title: "Text Replacer",
    desc: "Find and replace text",
    icon: "🔍",
    category: CATEGORIES.dev,
    seoTitle: "Text Replacer Free — Online Tool | Craftisle",
    seoDesc: "Free text replacer online tool. Find and replace text in a string. Supports case-sensitive and case-insensitive modes. 100% browser-based.",
    seoKeywords: ["text replacer", "find and replace", "replace text", "text replace online"],
    description: "Find and replace text in a string. Supports case-sensitive and case-insensitive modes. Useful for text editing, data cleaning, and string manipulation.",
    howToUse: [
      { heading: "Paste text", text: "Type or paste text to process." },
      { heading: "Set search and replace", text: "Enter text to find and replacement text." },
      { heading: "Set case sensitivity", text: "Check or uncheck 'Case sensitive'." },
      { heading: "Replace", text: "Click Replace. The text is updated." },
    ],
    useCases: [
      { title: "Text editing", text: "Find and replace words in a document." },
      { title: "Data cleaning", text: "Replace incorrect values in CSV or JSON." },
      { title: "String manipulation", text: "Batch replace multiple occurrences of a substring." },
    ],
    faq: [
      { q: "Does it support regex?", a: "Not yet. Currently only supports literal string search." },
      { q: "What does 'Case sensitive' mean?", a: "If checked, 'Cat' and 'cat' are treated as different. If unchecked, they are treated as the same." },
    ],
    relatedTools: ["text-compare", "extract-substring"],
  },

  "morse-code": {
    title: "Morse Code Converter",
    desc: "Convert text to Morse code or Morse code to text",
    icon: "📡",
    category: CATEGORIES.dev,
    seoTitle: "Morse Code Converter Free — Online Tool | Craftisle",
    seoDesc: "Free Morse code converter online tool. Convert text to Morse code or Morse code to text. Supports letters, numbers, and space. 100% browser-based.",
    seoKeywords: ["morse code converter", "text to morse", "morse to text", "morse code online"],
    description: "Convert text to Morse code or Morse code to text. Supports letters A-Z, numbers 0-9, and space. Useful for learning Morse code, encoding messages, and decoding Morse.",
    howToUse: [
      { heading: "Choose mode", text: "Select 'Text → Morse' or 'Morse → Text'." },
      { heading: "Enter text", text: "Type or paste text (or Morse code)." },
      { heading: "Convert", text: "Click Convert. The result is shown." },
      { heading: "Copy", text: "Copy the result for use in communications." },
    ],
    useCases: [
      { title: "Learn Morse code", text: "Practice encoding and decoding Morse code." },
      { title: "Encode messages", text: "Convert secret messages to Morse code." },
      { title: "Decode Morse", text: "Decode Morse code messages from radio or telegraph." },
    ],
    faq: [
      { q: "What characters are supported?", a: "Letters A-Z, numbers 0-9, and space." },
      { q: "How is Morse code formatted?", a: "Dots (.) and dashes (-). Characters are separated by spaces." },
    ],
    relatedTools: ["to-morse", "unicode"],
  },

  // ==================== String Tools (Batch 7) ====================
  "extract-substring": {
    title: "Extract Substring",
    desc: "Extract a substring from text by index",
    icon: "✂️",
    category: CATEGORIES.dev,
    seoTitle: "Extract Substring Free — Online Tool | Craftisle",
    seoDesc: "Free extract substring online tool. Extract a substring from text by start and end index. Supports partial extraction. 100% browser-based.",
    seoKeywords: ["extract substring", "substring extraction", "extract text by index", "string slice online"],
    description: "Extract a substring from text by specifying start and end index. Index starts at 0. Leave end index empty to extract to the end. Useful for text processing, data extraction, and string manipulation.",
    howToUse: [
      { heading: "Paste text", text: "Type or paste text to extract from." },
      { heading: "Set start index", text: "Enter start index (0-based)." },
      { heading: "Set end index (optional)", text: "Enter end index, or leave empty to extract to end." },
      { heading: "Extract", text: "Click Extract. The substring is shown." },
    ],
    useCases: [
      { title: "Text processing", text: "Extract specific parts from a long text." },
      { title: "Data extraction", text: "Extract substrings based on position." },
      { title: "String manipulation", text: "Get parts of a string for further processing." },
    ],
    faq: [
      { q: "What is 'Index starts at 0'?", a: "The first character is at index 0, second at index 1, etc." },
      { q: "What if I leave 'End Index' empty?", a: "The extraction continues to the end of the text." },
    ],
    relatedTools: ["text-replacer", "text-compare"],
  },

  // ==================== String Tools (Batch 7) ====================
  "hidden-character-detector": {
    title: "Hidden Character Detector",
    desc: "Detect hidden characters in text",
    icon: "🔍",
    category: CATEGORIES.dev,
    seoTitle: "Hidden Character Detector Free — Online Tool | Craftisle",
    seoDesc: "Free hidden character detector online tool. Detect zero-width space, BOM, and other hidden characters in text. 100% browser-based.",
    seoKeywords: ["hidden character detector", "detect hidden characters", "zero-width space", "BOM detector"],
    description: "Detect hidden characters in text, such as zero-width space (U+200B), BOM (U+FEFF), ZWNJ (U+200C), ZWJ (U+200D), WJ (U+2060). Useful for debugging text encoding issues, cleaning data, and ensuring text integrity.",
    howToUse: [
      { heading: "Paste text", text: "Type or paste text to check." },
      { heading: "Detect", text: "Click Detect. Hidden characters are reported." },
      { heading: "Review", text: "Review the report and fix the text accordingly." },
    ],
    useCases: [
      { title: "Debug text encoding", text: "Find hidden characters that cause display issues." },
      { title: "Clean data", text: "Remove hidden characters from imported data." },
      { title: "Ensure integrity", text: "Check text before processing or storage." },
    ],
    faq: [
      { q: "What are hidden characters?", a: "Characters that are invisible or have no width, such as zero-width space, BOM, etc." },
      { q: "Why do hidden characters matter?", a: "They can cause display issues, data corruption, and processing errors." },
    ],
    relatedTools: ["unicode", "text-formatter"],
  },



  // ==================== Time Tools (Batch 9) ====================
  "check-leap-years": {
    title: "Check Leap Years",
    desc: "Check if years are leap years",
    icon: "🗓️",
    category: CATEGORIES.time,
    seoTitle: "Check Leap Years Free — Online Tool | Craftisle",
    seoDesc: "Free leap year checker online tool. Check if a year is a leap year. Supports multiple years (one per line). 100% browser-based.",
    seoKeywords: ["leap year checker", "check leap year", "is leap year", "leap year calculator"],
    description: "Check if one or more years are leap years. A leap year is divisible by 4, but not by 100 (unless also divisible by 400). Useful for date calculations, birthday reminders, and calendar applications.",
    howToUse: [
      { heading: "Enter years", text: "Type or paste years (one per line)." },
      { heading: "Check", text: "Click Check Leap Years. Results show which years are leap years." },
      { heading: "Review", text: "Review the results and use for your calculations." },
    ],
    useCases: [
      { title: "Birthday reminders", text: "Find leap years for birthday reminders (Feb 29)." },
      { title: "Date calculations", text: "Check if a year has 366 days." },
      { title: "Calendar apps", text: "Validate leap years in calendar applications." },
    ],
    faq: [
      { q: "What is a leap year?", a: "A year with 366 days. Occurs every 4 years, except century years not divisible by 400." },
      { q: "Why 2100 is not a leap year?", a: "Century years must be divisible by 400 to be leap years. 2100 ÷ 400 = 5.25, so not a leap year." },
    ],
    relatedTools: ["time-between-dates", "convert-unix-to-date"],
  },

  "convert-days-to-hours": {
    title: "Convert Days to Hours",
    desc: "Convert days to hours",
    icon: "⏱️",
    category: CATEGORIES.time,
    seoTitle: "Convert Days to Hours Free — Online Tool | Craftisle",
    seoDesc: "Free days to hours converter online tool. Convert days to hours instantly. Supports decimal values. 100% browser-based.",
    seoKeywords: ["days to hours", "convert days to hours", "days to hours calculator", "time conversion"],
    description: "Convert days to hours. 1 day = 24 hours. Supports decimal values and batch conversion (one per line). Useful for time calculations, project planning, and duration conversions.",
    howToUse: [
      { heading: "Enter days", text: "Type or paste days (one per line)." },
      { heading: "Convert", text: "Click Convert. Results show hours." },
      { heading: "Copy", text: "Copy the results for use in calculations." },
    ],
    useCases: [
      { title: "Project planning", text: "Convert project duration from days to hours." },
      { title: "Time calculations", text: "Convert time periods for calculations." },
      { title: "Work hours", text: "Calculate work hours from days." },
    ],
    faq: [
      { q: "How many hours in a day?", a: "24 hours in a day." },
      { q: "Can I convert decimal days?", a: "Yes, decimal values are supported (e.g., 2.5 days = 60 hours)." },
    ],
    relatedTools: ["convert-hours-to-days", "convert-seconds-to-time"],
  },

  "convert-hours-to-days": {
    title: "Convert Hours to Days",
    desc: "Convert hours to days",
    icon: "📅",
    category: CATEGORIES.time,
    seoTitle: "Convert Hours to Days Free — Online Tool | Craftisle",
    seoDesc: "Free hours to days converter online tool. Convert hours to days instantly. Supports decimal values. 100% browser-based.",
    seoKeywords: ["hours to days", "convert hours to days", "hours to days calculator", "time conversion"],
    description: "Convert hours to days. 24 hours = 1 day. Supports decimal values and batch conversion (one per line). Useful for time calculations, project planning, and duration conversions.",
    howToUse: [
      { heading: "Enter hours", text: "Type or paste hours (one per line)." },
      { heading: "Convert", text: "Click Convert. Results show days." },
      { heading: "Copy", text: "Copy the results for use in calculations." },
    ],
    useCases: [
      { title: "Project planning", text: "Convert work hours to days." },
      { title: "Time calculations", text: "Convert time periods for calculations." },
      { title: "Work scheduling", text: "Calculate days from work hours." },
    ],
    faq: [
      { q: "How many days in 24 hours?", a: "24 hours = 1 day." },
      { q: "Can I convert decimal hours?", a: "Yes, decimal values are supported (e.g., 36 hours = 1.5 days)." },
    ],
    relatedTools: ["convert-days-to-hours", "convert-time-to-seconds"],
  },

  "convert-seconds-to-time": {
    title: "Convert Seconds to Time",
    desc: "Convert seconds to time format (HH:MM:SS)",
    icon: "⏰",
    category: CATEGORIES.time,
    seoTitle: "Convert Seconds to Time Free — Online Tool | Craftisle",
    seoDesc: "Free seconds to time converter online tool. Convert seconds to HH:MM:SS format. Supports batch conversion. 100% browser-based.",
    seoKeywords: ["seconds to time", "convert seconds to time", "seconds to hh:mm:ss", "time conversion"],
    description: "Convert seconds to time format (HH:MM:SS). Useful for video editing, audio processing, and time calculations. Supports batch conversion (one per line).",
    howToUse: [
      { heading: "Enter seconds", text: "Type or paste seconds (one per line)." },
      { heading: "Convert", text: "Click Convert. Results show time in HH:MM:SS format." },
      { heading: "Copy", text: "Copy the results for use in video/audio editing." },
    ],
    useCases: [
      { title: "Video editing", text: "Convert video duration from seconds to time format." },
      { title: "Audio processing", text: "Convert audio duration to time format." },
      { title: "Time calculations", text: "Convert time periods for display." },
    ],
    faq: [
      { q: "What format is the output?", a: "Output is in HH:MM:SS format (hours:minutes:seconds)." },
      { q: "Can I convert large values?", a: "Yes, any non-negative number is supported." },
    ],
    relatedTools: ["convert-time-to-seconds", "convert-days-to-hours"],
  },

  "convert-time-to-seconds": {
    title: "Convert Time to Seconds",
    desc: "Convert time format (HH:MM:SS) to seconds",
    icon: "⚡",
    category: CATEGORIES.time,
    seoTitle: "Convert Time to Seconds Free — Online Tool | Craftisle",
    seoDesc: "Free time to seconds converter online tool. Convert HH:MM:SS to seconds. Supports multiple formats. 100% browser-based.",
    seoKeywords: ["time to seconds", "convert time to seconds", "hh:mm:ss to seconds", "time conversion"],
    description: "Convert time format (HH:MM:SS or 1h 30m 45s) to seconds. Useful for video editing, audio processing, and time calculations. Supports batch conversion (one per line).",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values (one per line). Use HH:MM:SS or 1h 30m 45s format." },
      { heading: "Convert", text: "Click Convert. Results show seconds." },
      { heading: "Copy", text: "Copy the results for use in calculations." },
    ],
    useCases: [
      { title: "Video editing", text: "Convert video timestamps to seconds for editing." },
      { title: "Audio processing", text: "Convert audio timestamps to seconds." },
      { title: "Time calculations", text: "Convert time periods to seconds for calculations." },
    ],
    faq: [
      { q: "What time formats are supported?", a: "HH:MM:SS (e.g., 01:30:45) and 1h 30m 45s formats." },
      { q: "Can I convert just minutes?", a: "Yes, use 90m or 01:30:00 format." },
    ],
    relatedTools: ["convert-seconds-to-time", "convert-time-to-decimal"],
  },

  "convert-time-to-decimal": {
    title: "Convert Time to Decimal",
    desc: "Convert time format (HH:MM:SS) to decimal hours",
    icon: "🔢",
    category: CATEGORIES.time,
    seoTitle: "Convert Time to Decimal Free — Online Tool | Craftisle",
    seoDesc: "Free time to decimal converter online tool. Convert HH:MM:SS to decimal hours. Useful for payroll and time tracking. 100% browser-based.",
    seoKeywords: ["time to decimal", "convert time to decimal", "hh:mm:ss to decimal", "decimal hours"],
    description: "Convert time format (HH:MM:SS) to decimal hours. Useful for payroll, time tracking, and billing. Supports batch conversion (one per line).",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values in HH:MM:SS format (one per line)." },
      { heading: "Convert", text: "Click Convert. Results show decimal hours." },
      { heading: "Copy", text: "Copy the results for use in payroll or billing." },
    ],
    useCases: [
      { title: "Payroll", text: "Convert work hours to decimal for payroll." },
      { title: "Time tracking", text: "Convert logged time to decimal hours." },
      { title: "Billing", text: "Convert billable hours to decimal for invoicing." },
    ],
    faq: [
      { q: "What is decimal time?", a: "Time expressed as a decimal number (e.g., 1:30 = 1.5 hours)." },
      { q: "Why use decimal time?", a: "Easier for calculations, payroll, and billing." },
    ],
    relatedTools: ["convert-time-to-seconds", "convert-hours-to-days"],
  },

  "convert-unix-to-date": {
    title: "Unix Timestamp Converter",
    desc: "Convert Unix timestamp to date and vice versa",
    icon: "🕐",
    category: CATEGORIES.time,
    seoTitle: "Unix Timestamp Converter Free — Online Tool | Craftisle",
    seoDesc: "Free Unix timestamp converter online tool. Convert Unix timestamp to date and date to Unix timestamp. Supports batch conversion. 100% browser-based.",
    seoKeywords: ["unix timestamp converter", "convert unix to date", "date to unix", "unix timestamp"],
    description: "Convert Unix timestamp to human-readable date and vice versa. Unix timestamp is the number of seconds since January 1, 1970 (UTC). Supports batch conversion, timezone options, and UTC label options.",
    howToUse: [
      { heading: "Choose mode", text: "Select 'Unix → Date' or 'Date → Unix' mode." },
      { heading: "Enter values", text: "Type or paste timestamps or dates (one per line)." },
      { heading: "Configure options", text: "Choose timezone (local/UTC) and UTC label options." },
      { heading: "Convert", text: "Click Convert. Results show converted values." },
    ],
    useCases: [
      { title: "Debug timestamps", text: "Convert Unix timestamps to debug date-related issues." },
      { title: "API development", text: "Convert timestamps for API requests/responses." },
      { title: "Log analysis", text: "Convert timestamps in log files to readable dates." },
    ],
    faq: [
      { q: "What is a Unix timestamp?", a: "Number of seconds since January 1, 1970 (UTC)." },
      { q: "What is the year 2038 problem?", a: "Unix timestamps will overflow in 2038 when using 32-bit integers." },
    ],
    relatedTools: ["check-leap-years", "time-between-dates"],
  },

  "crontab-guru": {
    title: "Crontab Guru",
    desc: "Explain cron expressions in plain English",
    icon: "📋",
    category: CATEGORIES.time,
    seoTitle: "Crontab Guru Free — Online Tool | Craftisle",
    seoDesc: "Free crontab guru online tool. Explain cron expressions in plain English. Understand cron jobs easily. 100% browser-based.",
    seoKeywords: ["crontab guru", "cron expression explainer", "cron job scheduler", "cron syntax"],
    description: "Explain cron expressions in plain English. Cron is a time-based job scheduler in Unix-like operating systems. This tool helps you understand cron expressions by converting them to human-readable descriptions.",
    howToUse: [
      { heading: "Enter cron expression", text: "Type or paste cron expressions (one per line)." },
      { heading: "Explain", text: "Click Explain. The tool converts cron expressions to plain English." },
      { heading: "Review", text: "Review the explanation and use for your cron jobs." },
    ],
    useCases: [
      { title: "Schedule cron jobs", text: "Understand cron expressions before scheduling jobs." },
      { title: "Debug cron issues", text: "Check if a cron expression does what you expect." },
      { title: "Learn cron syntax", text: "Learn cron syntax by seeing examples." },
    ],
    faq: [
      { q: "What is a cron expression?", a: "A string of 5 fields: minute hour day month day-of-week." },
      { q: "What does */5 mean?", a: "Every 5 units (e.g., */5 * * * * = every 5 minutes)." },
    ],
    relatedTools: ["convert-unix-to-date", "time-between-dates"],
  },

  "truncate-clock-time": {
    title: "Truncate Clock Time",
    desc: "Truncate time to hour, minute, or second",
    icon: "✂️",
    category: CATEGORIES.time,
    seoTitle: "Truncate Clock Time Free — Online Tool | Craftisle",
    seoDesc: "Free truncate clock time online tool. Truncate time to hour, minute, or second. Useful for time rounding. 100% browser-based.",
    seoKeywords: ["truncate clock time", "time truncation", "round time", "time rounding"],
    description: "Truncate time to hour, minute, or second. Useful for time rounding, scheduling, and data processing. Supports batch conversion (one per line).",
    howToUse: [
      { heading: "Enter time", text: "Type or paste time values (one per line)." },
      { heading: "Choose truncation", text: "Select truncate to hour, minute, or second." },
      { heading: "Truncate", text: "Click Truncate. Results show truncated time." },
    ],
    useCases: [
      { title: "Time rounding", text: "Round time down to nearest hour or minute." },
      { title: "Scheduling", text: "Truncate time for scheduling purposes." },
      { title: "Data processing", text: "Truncate time values in datasets." },
    ],
    faq: [
      { q: "What does 'truncate to hour' mean?", a: "Sets minutes and seconds to 00 (e.g., 14:35:42 → 14:00:00)." },
      { q: "Can I truncate to minute?", a: "Yes, sets seconds to 00 (e.g., 14:35:42 → 14:35:00)." },
    ],
    relatedTools: ["convert-time-to-decimal", "convert-seconds-to-time"],
  },


  // ==================== List Tools (Batch 10) ====================
  "list-reverse": {
    title: "Reverse Lines",
    desc: "Reverse the order of lines",
    icon: "🔄",
    category: CATEGORIES.text,
    seoTitle: "Reverse Lines Free — Online Tool | Craftisle",
    seoDesc: "Free reverse lines online tool. Reverse the order of lines in text. 100% browser-based.",
    seoKeywords: ["reverse lines", "reverse text order", "flip lines", "line reversal"],
    description: "Reverse the order of lines in text. Useful for reordering lists, flipping data, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Reverse", text: "Click Reverse. The order of lines is reversed." },
      { heading: "Copy", text: "Copy the reversed text for use." },
    ],
    useCases: [
      { title: "Reorder lists", text: "Reverse the order of list items." },
      { title: "Flip data", text: "Reverse lines for data processing." },
      { title: "Text processing", text: "Reverse lines as part of text processing pipeline." },
    ],
    faq: [
      { q: "Does it reverse line content?", a: "No, it reverses the order of lines, not the content within each line." },
      { q: "Can I reverse words within a line?", a: "No, use a different tool for that. This tool only reverses line order." },
    ],
    relatedTools: ["list-shuffle", "list-sort"],
  },

  "list-shuffle": {
    title: "Shuffle Lines",
    desc: "Randomly shuffle lines",
    icon: "🎲",
    category: CATEGORIES.text,
    seoTitle: "Shuffle Lines Free — Online Tool | Craftisle",
    seoDesc: "Free shuffle lines online tool. Randomly shuffle lines in text. 100% browser-based.",
    seoKeywords: ["shuffle lines", "randomize lines", "random order", "shuffle text"],
    description: "Randomly shuffle lines in text. Useful for randomizing lists, creating random orders, and mixing data.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Shuffle", text: "Click Shuffle. The lines are randomly reordered." },
      { heading: "Copy", text: "Copy the shuffled text for use." },
    ],
    useCases: [
      { title: "Randomize lists", text: "Shuffle list items for random order." },
      { title: "Mix data", text: "Randomly mix data for sampling." },
      { title: "Create random order", text: "Shuffle lines to create random order." },
    ],
    faq: [
      { q: "Is the shuffle truly random?", a: "Yes, it uses Fisher-Yates algorithm for uniform randomness." },
      { q: "Can I control the random seed?", a: "No, each shuffle is independent with random seed." },
    ],
    relatedTools: ["list-reverse", "list-sort"],
  },

  "list-sort": {
    title: "Sort Lines",
    desc: "Sort lines alphabetically",
    icon: "📝",
    category: CATEGORIES.text,
    seoTitle: "Sort Lines Free — Online Tool | Craftisle",
    seoDesc: "Free sort lines online tool. Sort lines alphabetically (ascending or descending). 100% browser-based.",
    seoKeywords: ["sort lines", "alphabetical sort", "sort text", "line sorting"],
    description: "Sort lines alphabetically. Supports ascending/descending order, case-sensitive/insensitive sorting, and duplicate removal. Useful for organizing lists, sorting data, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Choose order (asc/desc), case sensitivity, and duplicate removal." },
      { heading: "Sort", text: "Click Sort. The lines are sorted alphabetically." },
    ],
    useCases: [
      { title: "Organize lists", text: "Sort list items alphabetically." },
      { title: "Sort data", text: "Sort data rows for analysis." },
      { title: "Text processing", text: "Sort lines as part of text processing pipeline." },
    ],
    faq: [
      { q: "What is case-insensitive sorting?", a: "Treats 'Apple' and 'apple' as the same for sorting." },
      { q: "Can I sort numerically?", a: "Currently only alphabetical sorting is supported. Numeric sorting may be added in future." },
    ],
    relatedTools: ["list-reverse", "list-shuffle", "list-unique"],
  },

  "list-duplicate": {
    title: "Duplicate Lines",
    desc: "Duplicate lines multiple times",
    icon: "📋",
    category: CATEGORIES.text,
    seoTitle: "Duplicate Lines Free — Online Tool | Craftisle",
    seoDesc: "Free duplicate lines online tool. Duplicate each line N times. Supports custom separator. 100% browser-based.",
    seoKeywords: ["duplicate lines", "repeat lines", "line duplication", "copy lines"],
    description: "Duplicate lines multiple times. Specify the number of copies and separator. Useful for creating repeated entries, testing, and data generation.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Set number of copies and separator." },
      { heading: "Duplicate", text: "Click Duplicate. Each line is duplicated N times." },
    ],
    useCases: [
      { title: "Create repeated entries", text: "Duplicate lines for repeated use." },
      { title: "Testing", text: "Create test data with repeated entries." },
      { title: "Data generation", text: "Generate data by duplicating existing lines." },
    ],
    faq: [
      { q: "What is the separator?", a: "The text between duplicates (default: space)." },
      { q: "Can I duplicate a fraction of times?", a: "Yes, use decimal values (e.g., 1.5 copies duplicates the first half)." },
    ],
    relatedTools: ["list-unique", "list-wrap"],
  },

  "list-unique": {
    title: "Remove Duplicates",
    desc: "Remove duplicate lines",
    icon: "✨",
    category: CATEGORIES.text,
    seoTitle: "Remove Duplicates Free — Online Tool | Craftisle",
    seoDesc: "Free remove duplicates online tool. Remove duplicate lines from text. Supports case-sensitive/insensitive. 100% browser-based.",
    seoKeywords: ["remove duplicates", "unique lines", "deduplicate", "delete duplicate lines"],
    description: "Remove duplicate lines from text. Keeps only the first occurrence of each line. Supports case-sensitive and case-insensitive modes. Useful for cleaning data, removing redundancies, and list processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Toggle case sensitivity." },
      { heading: "Remove", text: "Click Remove Duplicates. Duplicate lines are removed." },
    ],
    useCases: [
      { title: "Clean data", text: "Remove duplicate entries from datasets." },
      { title: "Deduplicate lists", text: "Remove duplicate items from lists." },
      { title: "Process text", text: "Remove redundancies in text processing." },
    ],
    faq: [
      { q: "What is case-insensitive mode?", a: "Treats 'Apple' and 'apple' as duplicates." },
      { q: "Does it preserve order?", a: "Yes, only the first occurrence of each line is kept." },
    ],
    relatedTools: ["list-sort", "list-duplicate"],
  },

  "list-wrap": {
    title: "Wrap Text",
    desc: "Wrap text to specified line length",
    icon: "📄",
    category: CATEGORIES.text,
    seoTitle: "Wrap Text Free — Online Tool | Craftisle",
    seoDesc: "Free wrap text online tool. Wrap text to specified line length (default: 80). Supports word boundary wrapping. 100% browser-based.",
    seoKeywords: ["wrap text", "text wrapping", "line wrapping", "format text"],
    description: "Wrap text to specified line length. Wrapping occurs at word boundaries to avoid breaking words. Useful for formatting text, preparing for display, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to wrap." },
      { heading: "Configure", text: "Set line length (default: 80)." },
      { heading: "Wrap", text: "Click Wrap. Text is wrapped to specified line length." },
    ],
    useCases: [
      { title: "Format text", text: "Wrap text for display or printing." },
      { title: "Prepare for display", text: "Wrap text to fit display width." },
      { title: "Text processing", text: "Wrap text as part of processing pipeline." },
    ],
    faq: [
      { q: "What is word boundary wrapping?", a: "Text is wrapped at spaces to avoid breaking words." },
      { q: "What if a word exceeds line length?", a: "The word is kept as-is on its own line." },
    ],
    relatedTools: ["list-unwrap", "list-truncate"],
  },

  "list-unwrap": {
    title: "Unwrap Text",
    desc: "Join lines into a single line",
    icon: "📎",
    category: CATEGORIES.text,
    seoTitle: "Unwrap Text Free — Online Tool | Craftisle",
    seoDesc: "Free unwrap text online tool. Join multiple lines into a single line. Supports custom separator. 100% browser-based.",
    seoKeywords: ["unwrap text", "join lines", "line joining", "merge lines"],
    description: "Unwrap text by joining multiple lines into a single line. Specify the separator (default: space). Useful for merging lines, creating single-line output, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Set separator (default: space)." },
      { heading: "Unwrap", text: "Click Unwrap. Lines are joined into a single line." },
    ],
    useCases: [
      { title: "Merge lines", text: "Join multiple lines into one." },
      { title: "Create single-line output", text: "Unwrap text for single-line display." },
      { title: "Text processing", text: "Unwrap text as part of processing pipeline." },
    ],
    faq: [
      { q: "What is the separator?", a: "The text between joined lines (default: space)." },
      { q: "Can I join without separator?", a: "Yes, set separator to empty string." },
    ],
    relatedTools: ["list-wrap", "list-duplicate"],
  },

  "list-truncate": {
    title: "Truncate Lines",
    desc: "Keep only first N lines",
    icon: "✂️",
    category: CATEGORIES.text,
    seoTitle: "Truncate Lines Free — Online Tool | Craftisle",
    seoDesc: "Free truncate lines online tool. Keep only first N lines of text. Useful for previewing, limiting output. 100% browser-based.",
    seoKeywords: ["truncate lines", "keep first N lines", "limit lines", "preview text"],
    description: "Truncate text by keeping only the first N lines. Useful for previewing large text, limiting output size, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Set number of lines to keep." },
      { heading: "Truncate", text: "Click Truncate. Only first N lines are kept." },
    ],
    useCases: [
      { title: "Preview text", text: "Keep only first few lines for preview." },
      { title: "Limit output", text: "Truncate text to limit output size." },
      { title: "Text processing", text: "Truncate text as part of processing pipeline." },
    ],
    faq: [
      { q: "What happens to remaining lines?", a: "They are discarded." },
      { q: "Can I keep last N lines instead?", a: "No, this tool only keeps first N lines. Use Reverse + Truncate to keep last N." },
    ],
    relatedTools: ["list-wrap", "list-unique"],
  },

  "list-rotate": {
    title: "Rotate Lines",
    desc: "Rotate lines by N positions",
    icon: "🔃",
    category: CATEGORIES.text,
    seoTitle: "Rotate Lines Free — Online Tool | Craftisle",
    seoDesc: "Free rotate lines online tool. Rotate lines by N positions (move first line to end). 100% browser-based.",
    seoKeywords: ["rotate lines", "cycle lines", "shift lines", "line rotation"],
    description: "Rotate lines by N positions. Moving the first N lines to the end. Useful for cycling through items, creating rotations, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Set number of positions to rotate." },
      { heading: "Rotate", text: "Click Rotate. Lines are rotated by N positions." },
    ],
    useCases: [
      { title: "Cycle items", text: "Rotate list items for cycling display." },
      { title: "Create rotations", text: "Rotate lines to create variations." },
      { title: "Text processing", text: "Rotate lines as part of processing pipeline." },
    ],
    faq: [
      { q: "What does rotate by 1 position mean?", a: "Moves the first line to the end. [1,2,3] → [2,3,1]." },
      { q: "Can I rotate backwards?", a: "Yes, use negative numbers or rotate by (N-lines) positions." },
    ],
    relatedTools: ["list-reverse", "list-shuffle"],
  },


  
  // ==================== String Tools (Batch 11) ====================
  "string-uppercase": {
    title: "Uppercase Text",
    desc: "Convert text to uppercase",
    icon: "🔠",
    category: CATEGORIES.text,
    seoTitle: "Uppercase Text Free — Online Tool | Craftisle",
    seoDesc: "Free uppercase text online tool. Convert text to uppercase instantly. 100% browser-based.",
    seoKeywords: ["uppercase text", "convert to uppercase", "text to uppercase", "uppercase converter"],
    description: "Convert text to uppercase. Useful for formatting text, creating headings, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to convert." },
      { heading: "Convert", text: "Click Convert to Uppercase. The text is converted." },
      { heading: "Copy", text: "Copy the uppercase text for use." },
    ],
    useCases: [
      { title: "Format text", text: "Convert text to uppercase for headings." },
      { title: "Create headings", text: "Use uppercase for section headings." },
      { title: "Text processing", text: "Convert case as part of processing pipeline." },
    ],
    faq: [
      { q: "Does it handle non-ASCII characters?", a: "Yes, Unicode characters are handled correctly." },
      { q: "Is there a lowercase tool?", a: "Currently only uppercase is supported. Lowercase may be added in future." },
    ],
    relatedTools: ["string-lowercase", "randomize-case"],
  },

  "randomize-case": {
    title: "Randomize Case",
    desc: "Randomly change text case",
    icon: "🎲",
    category: CATEGORIES.text,
    seoTitle: "Randomize Case Free — Online Tool | Craftisle",
    seoDesc: "Free randomize case online tool. Randomly change text case for each character. 100% browser-based.",
    seoKeywords: ["randomize case", "random case", "mix case", "text case randomizer"],
    description: "Randomly change text case for each character. Useful for creating visual effects, testing, and fun text transformations.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to randomize." },
      { heading: "Randomize", text: "Click Randomize Case. Each character's case is randomized." },
      { heading: "Copy", text: "Copy the randomized text for use." },
    ],
    useCases: [
      { title: "Create visual effects", text: "Randomize case for artistic text." },
      { title: "Testing", text: "Test text processing with random case." },
      { title: "Fun transformations", text: "Create fun text variations." },
    ],
    faq: [
      { q: "Is the randomization truly random?", a: "Yes, each character has 50% chance of being uppercase." },
      { q: "Can I control the randomness?", a: "No, each click generates a new random pattern." },
    ],
    relatedTools: ["string-reverse", "string-uppercase"],
  },

  "string-remove-duplicates": {
    title: "Remove Duplicate Lines",
    desc: "Remove duplicate lines from text",
    icon: "✨",
    category: CATEGORIES.text,
    seoTitle: "Remove Duplicate Lines Free — Online Tool | Craftisle",
    seoDesc: "Free remove duplicates online tool. Remove duplicate lines from text. Supports case-sensitive/insensitive. 100% browser-based.",
    seoKeywords: ["remove duplicates", "unique lines", "deduplicate", "delete duplicate lines"],
    description: "Remove duplicate lines from text. Keeps only the first occurrence of each line. Supports case-sensitive and case-insensitive modes. Useful for cleaning data, removing redundancies, and list processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text with multiple lines." },
      { heading: "Configure", text: "Toggle case sensitivity." },
      { heading: "Remove", text: "Click Remove Duplicates. Duplicate lines are removed." },
    ],
    useCases: [
      { title: "Clean data", text: "Remove duplicate entries from datasets." },
      { title: "Deduplicate lists", text: "Remove duplicate items from lists." },
      { title: "Process text", text: "Remove redundancies in text processing." },
    ],
    faq: [
      { q: "What is case-insensitive mode?", a: "Treats 'Apple' and 'apple' as duplicates." },
      { q: "Does it preserve order?", a: "Yes, only the first occurrence of each line is kept." },
    ],
    relatedTools: ["list-sort", "list-duplicate"],
  },

  "string-truncate": {
    title: "Truncate Text",
    desc: "Truncate text to specified length",
    icon: "✂️",
    category: CATEGORIES.text,
    seoTitle: "Truncate Text Free — Online Tool | Craftisle",
    seoDesc: "Free truncate text online tool. Truncate text to specified length. Adds '...' if truncated. 100% browser-based.",
    seoKeywords: ["truncate text", "limit text length", "shorten text", "text truncation"],
    description: "Truncate text to specified length. Adds '...' if text exceeds the length. Useful for previewing, limiting display length, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to truncate." },
      { heading: "Configure", text: "Set maximum length." },
      { heading: "Truncate", text: "Click Truncate. Text is truncated to specified length." },
    ],
    useCases: [
      { title: "Preview text", text: "Truncate text for preview display." },
      { title: "Limit display", text: "Truncate text to fit display width." },
      { title: "Text processing", text: "Truncate text as part of processing pipeline." },
    ],
    faq: [
      { q: "What happens to truncated text?", a: "Adds '...' to indicate truncation." },
      { q: "Can I truncate without '...'?", a: "Currently always adds '...'. May add option in future." },
    ],
    relatedTools: ["string-reverse", "randomize-case"],
  },

  "string-quote": {
    title: "Quote Text",
    desc: "Add quotes to text",
    icon: "💬",
    category: CATEGORIES.text,
    seoTitle: "Quote Text Free — Online Tool | Craftisle",
    seoDesc: "Free quote text online tool. Add double, single, or backtick quotes to text. 100% browser-based.",
    seoKeywords: ["quote text", "add quotes", "wrap in quotes", "text quoting"],
    description: "Add quotes to text. Supports double quotes, single quotes, and backtick quotes. Useful for formatting text, preparing code, and text processing.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to quote." },
      { heading: "Configure", text: "Choose quote type (double/single/backtick)." },
      { heading: "Quote", text: "Click Quote. Quotes are added to text." },
    ],
    useCases: [
      { title: "Format text", text: "Add quotes to text for formatting." },
      { title: "Prepare code", text: "Add backtick quotes for code snippets." },
      { title: "Text processing", text: "Add quotes as part of processing pipeline." },
    ],
    faq: [
      { q: "What quote types are supported?", a: "Double quotes, single quotes, and backtick quotes." },
      { q: "Can I quote multiple lines?", a: "Yes, each line is quoted separately." },
    ],
    relatedTools: ["string-reverse", "string-uppercase"],
  },

  "string-palindrome": {
    title: "Check Palindrome",
    desc: "Check if text is a palindrome",
    icon: "🔤",
    category: CATEGORIES.text,
    seoTitle: "Check Palindrome Free — Online Tool | Craftisle",
    seoDesc: "Free check palindrome online tool. Check if text is a palindrome (reads same forwards and backwards). 100% browser-based.",
    seoKeywords: ["check palindrome", "is palindrome", "palindrome checker", "mirror text"],
    description: "Check if text is a palindrome (reads same forwards and backwards). Case-insensitive, ignores non-alphanumeric characters. Useful for word games, text analysis, and fun challenges.",
    howToUse: [
      { heading: "Enter text", text: "Type or paste text to check (one per line)." },
      { heading: "Check", text: "Click Check. Results show if each line is a palindrome." },
      { heading: "Review", text: "Review the results and use for word games." },
    ],
    useCases: [
      { title: "Word games", text: "Check if words are palindromes for games." },
      { title: "Text analysis", text: "Analyze text for palindromic patterns." },
      { title: "Fun challenges", text: "Challenge friends to find palindromes." },
    ],
    faq: [
      { q: "What is a palindrome?", a: "Text that reads the same forwards and backwards (e.g., 'racecar')." },
      { q: "Is case important?", a: "No, case-insensitive check ('Racecar' is a palindrome)." },
    ],
    relatedTools: ["string-reverse", "randomize-case"],
  },

  // ==================== PDF Tools (external) ====================
  "pdf-tools": {
    title: "PDF Tools",
    desc: "Merge, split, compress, convert PDF files online",
    icon: "📄",
    badge: "New",
    category: CATEGORIES.converter,
    seoTitle: "PDF Tools Free — Online Tool | Craftisle",
    seoDesc: "Free pdf tools online tool. Merge, split, compress, convert PDF files online 100% browser-based, no signup required.",
    seoKeywords: ['pdf tools online free', 'free pdf tools tool', 'pdf tools no signup', 'online pdf tools browser', 'Craftisle pdf tools'],
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
