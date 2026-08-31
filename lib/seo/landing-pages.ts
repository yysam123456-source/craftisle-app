/**
 * T1 落地页数据（主题权威缺口报告 v3.6 的 18 个零曝光种子）
 * ───────────────────────────────────────────────
 * 来自 SEO_TOPICAL_GAP_REPORT_2026-08-20.md 的 T1 层：
 *   craftisle 9 + pdf 9 = 18 个真实流量机会（GSC 已有曝光，主题扩张性价比最高）。
 *
 * 路由：app/l/[slug]/page.tsx 渲染，slug 与 optimizer.ts 的 build_page 路由
 *       `/l/${slugify(seed)}` 对齐（如 merge pdf → merge-pdf）。
 *
 * 约定（与全站双后缀修复一致）：title / h1 均不含品牌后缀，根 layout 的
 * title.template "%s | Craftisle" 在渲染时统一追加。描述 ≤155 字符。
 *
 * 内容要求（报告规格）：H1=种子词、正文首段直含意图、H2 分段、FAQ 带 JSON-LD、
 * 每页 ≥3 条指向真实存在的工具/目录页内链，避免薄页。
 */

import { buildAlternativeLinks } from "./alternative-links";

export interface LandingSection {
  heading: string;
  paragraphs: string[];
}

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingLink {
  label: string;
  href: string;
}

export interface LandingPage {
  slug: string;
  site: "craftisle" | "pdf";
  title: string; // 无品牌后缀
  description: string; // ≤155 字符
  keywords: string[];
  h1: string;
  intro: string[];
  sections: LandingSection[];
  faq: LandingFaq[];
  internalLinks: LandingLink[];
}

// 安全内链池（均已验证真实存在的路由，避免 404 内链）
const L = {
  tools: { label: "All free tools", href: "/tools" },
  directory: { label: "Tool directory", href: "/directory" },
  pdfTools: { label: "PDF tools", href: "/tools/pdf-tools" },
  jsonFormatter: { label: "JSON Formatter", href: "/tools/json-formatter" },
  svgEditor: { label: "SVG Editor", href: "/tools/svg-editor" },
  jsonToCsv: { label: "JSON to CSV", href: "/tools/json-to-csv" },
  passwordGen: { label: "Password Generator", href: "/tools/password-generator" },
} as const;

export const LANDING_PAGES: Record<string, LandingPage> = {
  // ===================== craftisle（主站）9 =====================
  "free-online-tools": {
    slug: "free-online-tools",
    site: "craftisle",
    title: "Free Online Tools — 200+ Browser Tools, No Signup",
    description:
      "A growing collection of free online tools that run entirely in your browser. No signup, no install, no ads — just open and use.",
    keywords: ["free online tools", "browser tools", "no signup tools", "online utilities"],
    h1: "Free Online Tools",
    intro: [
      "Free online tools are small, focused web apps that help you format text, convert files, generate codes, edit images, and handle dozens of everyday tasks without installing anything. Everything runs in your browser tab, so you can use them on any device — laptop, tablet, or phone — and switch between tasks without cluttering your machine with software.",
      "Craftisle hosts 200+ free online tools with a single promise: no account required, no watermarks, and no hidden paywalls. Whether you need to format JSON, compress an image, or build a QR code, the tool opens instantly and gets out of your way.",
    ],
    sections: [
      {
        heading: "Why use browser-based tools",
        paragraphs: [
          "Installing a dedicated app for every small job is wasteful. A browser tool needs nothing but a link: open it, do the work, close the tab. There is no update cycle, no disk footprint, and no risk of bundled adware that often ships with free desktop utilities.",
          "Because the tools are web-based, your workspace travels with you. The same tool works identically on Windows, macOS, Linux, ChromeOS, or a mobile browser, which makes them ideal for shared computers, loaner devices, or quick fixes on the go.",
        ],
      },
      {
        heading: "What you can do",
        paragraphs: [
          "The catalog spans developers (JSON, CSV, regex, Base64), designers (SVG, image resize, background removal), and everyday users (passwords, QR codes, unit conversion). Each tool is built to do one thing well rather than burying the feature under menus.",
        ],
      },
      {
        heading: "How to get started",
        paragraphs: [
          "Browse the directory, pick the tool you need, and start. Most tools show results live as you type or drop a file. When you are done, simply leave the page — nothing is saved on our servers unless the tool explicitly says so.",
        ],
      },
    ],
    faq: [
      { q: "Do I need to create an account?", a: "No. Every tool on Craftisle works without signup. You open the page and use it immediately." },
      { q: "Are the tools really free?", a: "Yes. There are no premium tiers hidden behind core features, and no watermarks are added to your output." },
      { q: "Will they work on my phone?", a: "Yes. Because they run in the browser, they work on any modern mobile browser as well as desktop." },
      { q: "Is my data uploaded to a server?", a: "Most tools process your input client-side in your browser. Tools that must upload clearly state it before you proceed." },
    ],
    internalLinks: [L.tools, L.directory, L.jsonFormatter, L.passwordGen],
  },

  "all-in-one-tools": {
    slug: "all-in-one-tools",
    site: "craftisle",
    title: "All-in-One Tools — Do More in One Tab, Free",
    description:
      "Stop juggling a dozen websites. Craftisle puts formatters, converters, generators and editors together so you can finish the job without leaving the tab.",
    keywords: ["all in one tools", "multi tool", "online toolbox", "productivity tools"],
    h1: "All-in-One Tools",
    intro: [
      "An all-in-one toolset is a single place that covers many small jobs, so you are not constantly searching for 'that one website' every time a task comes up. Instead of bookmarking ten converter sites, you keep one toolbox open and switch tools as needed.",
      "Craftisle is built as exactly that: a free, ad-light toolbox where formatters, converters, code utilities, and creative editors live side by side. The result is less tab-hopping, fewer distractions, and a faster path from problem to done.",
    ],
    sections: [
      {
        heading: "One workspace, many jobs",
        paragraphs: [
          "When tools share a design language and a home, the mental cost of switching drops to near zero. You already know where everything is, so a 'quick convert' no longer turns into a five-minute scavenger hunt across the web.",
        ],
      },
      {
        heading: "Less clutter, more focus",
        paragraphs: [
          "A consolidated toolbox means fewer accounts, fewer cookies, and fewer 'sign up to continue' walls. You get in, do the work, and get out — which is the whole point of a utility.",
        ],
      },
      {
        heading: "When an all-in-one makes sense",
        paragraphs: [
          "For everyday utilities (formatting, converting, generating), consolidation wins. For highly specialized workflows you may still prefer a dedicated app, but the 80% of small tasks are covered here for free.",
        ],
      },
    ],
    faq: [
      { q: "Is an all-in-one toolbox slower than dedicated sites?", a: "No. Each tool is a focused module; opening one is as fast as any single-purpose site, with the added benefit of zero navigation between tasks." },
      { q: "Do I lose features by using a toolbox?", a: "Core features are preserved. The trade-off is fewer niche options, which most users never need for everyday jobs." },
      { q: "Can I use it for work?", a: "Yes. Client-side processing keeps sensitive input on your device, which suits many workplace tasks." },
    ],
    internalLinks: [L.tools, L.directory, L.jsonToCsv, L.svgEditor],
  },

  "intellij-alternative": {
    slug: "intellij-alternative",
    site: "craftisle",
    title: "IntelliJ Alternative — Free Online Dev Tools",
    description:
      "Looking for a free IntelliJ alternative? Use Craftisle's browser-based developer tools — formatters, converters and testers — no install required.",
    keywords: ["intellij alternative", "free ide alternative", "online dev tools", "code formatter"],
    h1: "IntelliJ Alternative",
    intro: [
      "IntelliJ IDEA is a powerful desktop IDE, but for many day-to-day tasks — reformatting a JSON blob, testing a regex, or converting CSV — you do not need to launch a heavy IDE. A lightweight, free IntelliJ alternative that lives in the browser gets those jobs done faster.",
      "Craftisle offers a set of free online developer tools that cover the quick edits and inspections you would otherwise open an IDE for. They run entirely in your browser, need no license, and work on any machine without setup.",
    ],
    sections: [
      {
        heading: "What a browser alternative covers",
        paragraphs: [
          "Formatters for JSON, SQL, and YAML, a regex tester with live matching, Base64 and hash utilities, and data converters (JSON to CSV and back). These are the 'small but frequent' operations that interrupt flow when you have to switch to a full IDE.",
        ],
      },
      {
        heading: "When to keep the IDE",
        paragraphs: [
          "For project navigation, debugging, and refactoring across a large codebase, a real IDE remains the right tool. Use the online utilities for the quick, isolated transformations that do not deserve a context switch.",
        ],
      },
      {
        heading: "Zero-setup workflow",
        paragraphs: [
          "Paste, transform, copy. There is nothing to install and no project to open, which makes these tools perfect for shared machines, interviews, or helping a teammate without handing them your environment.",
        ],
      },
    ],
    faq: [
      { q: "Is this a replacement for IntelliJ?", a: "No — it complements it. It replaces the trivial, repetitive edits that interrupt deep IDE work, not the IDE itself." },
      { q: "Are the dev tools free?", a: "Yes, all of them. No license, no account, no usage caps on core features." },
      { q: "Does my code leave the browser?", a: "Formatting and conversion run client-side; your code is not sent to a server for these operations." },
    ],
    internalLinks: [L.jsonFormatter, L.tools, L.directory, L.jsonToCsv],
  },

  "figma-alternative": {
    slug: "figma-alternative",
    site: "craftisle",
    title: "Figma Alternative — Free Online Design & SVG Tools",
    description:
      "Need a free Figma alternative for quick edits? Craftisle's browser SVG editor and image tools let you tweak vectors without installing design software.",
    keywords: ["figma alternative", "free design tools", "online svg editor", "vector editor"],
    h1: "Figma Alternative",
    intro: [
      "Figma is the standard for collaborative interface design, but not every task needs a full design suite. When you just need to open a vector, recolor an SVG, or export an asset, a free, lightweight Figma alternative in the browser is faster and lighter.",
      "Craftisle provides free online design utilities — an SVG editor, image resizer, converter, and background remover — that handle the quick visual edits designers and developers face daily, with no install and no monthly fee.",
    ],
    sections: [
      {
        heading: "Quick edits without the suite",
        paragraphs: [
          "Open an SVG, adjust paths or colors, and export. Resize or convert images for the web. These are the 'five-minute fixes' that shouldn't require launching (and waiting on) a heavy design app.",
        ],
      },
      {
        heading: "Built for developers too",
        paragraphs: [
          "Handoff often means tweaking an asset's size or format. Doing it in-browser keeps the designer's toolkit and the developer's workflow in the same place, with no file round-trips.",
        ],
      },
      {
        heading: "When to stay in Figma",
        paragraphs: [
          "For multi-page prototypes, design systems, and real-time collaboration, Figma is unmatched. Use the online tools for isolated asset edits and conversions.",
        ],
      },
    ],
    faq: [
      { q: "Can I edit SVGs online for free?", a: "Yes. The SVG editor opens, edits, and exports vector files directly in your browser." },
      { q: "Do I need to install anything?", a: "No. Everything runs in the browser; there is nothing to download." },
      { q: "Is it a full Figma replacement?", a: "No. It covers quick asset edits and conversions, not full prototype or collaboration workflows." },
    ],
    internalLinks: [L.svgEditor, L.tools, L.directory, L.jsonFormatter],
  },

  "free-software-alternatives": {
    slug: "free-software-alternatives",
    site: "craftisle",
    title: "Free Software Alternatives — Open & Free, Every Day",
    description:
      "Find free software alternatives to paid apps. Craftisle's browser tools replace desktop utilities with no-cost, no-signup equivalents you can use anywhere.",
    keywords: ["free software alternatives", "free alternatives", "open source alternative", "no cost tools"],
    h1: "Free Software Alternatives",
    intro: [
      "Free software alternatives are no-cost replacements for paid desktop programs. For many utilities — converters, formatters, generators — a free, browser-based alternative does the same job without a license fee or a download.",
      "Craftisle is a library of free software alternatives that you use through a link instead of an installer. No trial expirations, no upsells, and no 'pro version' gates on the features you actually use.",
    ],
    sections: [
      {
        heading: "Save money on utilities",
        paragraphs: [
          "Most people pay for (or pirate) heavy software just to perform a task they do a few times a year. A free alternative that lives in the browser removes both the cost and the guilt.",
        ],
      },
      {
        heading: "No lock-in",
        paragraphs: [
          "Browser tools do not tie you to a vendor's file format or subscription. Your input and output stay standard (text, JSON, PNG, PDF), so you can move on whenever you like.",
        ],
      },
      {
        heading: "Try before you commit",
        paragraphs: [
          "Not sure a task is worth a paid app? Do it free here first. If it becomes daily work, then evaluate dedicated software with real evidence of need.",
        ],
      },
    ],
    faq: [
      { q: "Are these alternatives really free?", a: "Yes. Core features are free with no account and no hidden paywalls." },
      { q: "How are they different from open source?", a: "Many are open in spirit (client-side, standard formats), though the term here simply means 'free to use, no install'." },
      { q: "Is the quality lower?", a: "For focused utilities, a dedicated tool often beats a bloated paid suite on speed and clarity." },
    ],
    internalLinks: [L.tools, L.directory, L.passwordGen, L.jsonFormatter],
  },

  "open-source-tools": {
    slug: "open-source-tools",
    site: "craftisle",
    title: "Open Source Tools — Transparent, Private, Free",
    description:
      "Discover open, transparent tools that respect your privacy. Craftisle's client-side utilities process data in your browser — no server, no tracking.",
    keywords: ["open source tools", "privacy tools", "client side tools", "transparent utilities"],
    h1: "Open Source Tools",
    intro: [
      "Open source tools are built in the open, so their behavior can be inspected rather than trusted. The privacy promise goes further when the tool also runs entirely on your device: nothing is sent to a server, so there is simply nothing to leak.",
      "Craftisle emphasizes client-side, transparent utilities. Formatting, conversion, and generation happen in your browser tab. For users who care about data handling, that means the safest possible default — your files never leave the machine.",
    ],
    sections: [
      {
        heading: "Privacy by architecture",
        paragraphs: [
          "When processing is client-side, the server never sees your input. There is no database of your documents to breach and no logs of what you processed. Privacy becomes a property of how the tool works, not a policy you have to read.",
        ],
      },
      {
        heading: "Transparency you can verify",
        paragraphs: [
          "Open approaches let the curious inspect logic. Even where the full codebase is not published, client-side execution lets your browser — and you — see that no network call ships your data.",
        ],
      },
      {
        heading: "Who should care",
        paragraphs: [
          "Developers handling secrets, writers with drafts, and anyone processing personal documents benefit most. The free, no-signup model removes the usual 'just log in' pressure that compromises privacy.",
        ],
      },
    ],
    faq: [
      { q: "Are these tools open source?", a: "They are built on transparent, client-side principles; the key privacy guarantee is that processing stays in your browser." },
      { q: "Does my data leave my device?", a: "For client-side tools, no. The page performs the work locally and does not upload your input." },
      { q: "Why does that matter?", a: "It removes server-side logging and storage, the two biggest sources of data exposure." },
    ],
    internalLinks: [L.tools, L.directory, L.passwordGen, L.jsonFormatter],
  },

  "best-free-tools": {
    slug: "best-free-tools",
    site: "craftisle",
    title: "Best Free Tools — Hand-Picked, Ad-Free, No Signup",
    description:
      "A curated set of the best free tools on the web: hand-picked utilities that are fast, ad-free, and free to use with no account required.",
    keywords: ["best free tools", "top free tools", "ad free tools", "curated utilities"],
    h1: "Best Free Tools",
    intro: [
      "The best free tools share a few traits: they do one job well, they load instantly, and they respect you — no signup walls, no ad bombardment, no 'upgrade to continue' traps. Curation matters because the difference between a good utility and a frustrating one is often just focus.",
      "Craftisle collects hand-picked free tools across development, design, and everyday use. Each is chosen to be genuinely useful on its own, not as a doorway to a paid product.",
    ],
    sections: [
      {
        heading: "What 'best' means here",
        paragraphs: [
          "Fast first paint, a clear single purpose, and zero friction. A tool that opens in a second and solves the problem beats a feature-rich app that makes you hunt for the button.",
        ],
      },
      {
        heading: "Ad-free by design",
        paragraphs: [
          "Ads slow pages and clutter interfaces. Keeping the tools ad-light protects the speed and clarity that make them worth using in the first place.",
        ],
      },
      {
        heading: "No account, ever",
        paragraphs: [
          "Requiring signup to use a utility is a red flag. Every tool here works the moment you open it, which is the only acceptable bar for a simple utility.",
        ],
      },
    ],
    faq: [
      { q: "How are tools selected?", a: "By usefulness, speed, and lack of friction — each must stand on its own without pushing a paid upgrade." },
      { q: "Are they really ad-free?", a: "The catalog is kept ad-light so pages stay fast and uncluttered." },
      { q: "Do I need an account?", a: "Never. Open and use any tool immediately." },
    ],
    internalLinks: [L.tools, L.directory, L.svgEditor, L.jsonToCsv],
  },

  "browser-based-tools": {
    slug: "browser-based-tools",
    site: "craftisle",
    title: "Browser Based Tools — No Install, Works Anywhere",
    description:
      "Browser based tools run in any modern browser — no installs, no updates, no OS lock-in. Use them on any device with a link.",
    keywords: ["browser based tools", "no install tools", "web tools", "cross platform utilities"],
    h1: "Browser Based Tools",
    intro: [
      "Browser based tools are applications that live on the web instead of your hard drive. The practical upside is enormous: nothing to install, nothing to update, and no operating-system lock-in. A link is the entire footprint.",
      "Craftisle's tools are browser based by default, which means the same utility behaves identically on Windows, macOS, Linux, ChromeOS, or a phone. You are never blocked by 'this app isn't on this machine'.",
    ],
    sections: [
      {
        heading: "Zero install, zero updates",
        paragraphs: [
          "Desktop utilities age badly — they need patches, break on OS upgrades, and leave leftover files. A browser tool is always current because the code ships with the page you open.",
        ],
      },
      {
        heading: "Portable by default",
        paragraphs: [
          "Your toolbox travels in your bookmarks. Open it on a friend's laptop, a library computer, or a borrowed tablet and it works exactly as you expect.",
        ],
      },
      {
        heading: "Safer for shared machines",
        paragraphs: [
          "No install means no system changes and no trace left in a programs folder. For public or loaner devices, that is a meaningful safety and hygiene win.",
        ],
      },
    ],
    faq: [
      { q: "Do browser tools need internet?", a: "They load from the web, but many process data locally once open, so your input stays on the device." },
      { q: "Will they work offline?", a: "Once loaded, client-side tools can often keep working without a connection." },
      { q: "Are they slower than native apps?", a: "For focused utilities, the difference is negligible, and you save the install and update time entirely." },
    ],
    internalLinks: [L.tools, L.directory, L.jsonFormatter, L.passwordGen],
  },

  "client-side-tools": {
    slug: "client-side-tools",
    site: "craftisle",
    title: "Client-Side Tools — Your Files Never Leave the Browser",
    description:
      "Client-side tools process your data in your own browser. Nothing is uploaded to a server — the safest way to handle sensitive files for free.",
    keywords: ["client side tools", "privacy tools", "local processing", "secure online tools"],
    h1: "Client-Side Tools",
    intro: [
      "Client-side tools perform their work in your browser rather than on a remote server. For anything private — a draft, a password, a personal document — this is the safest possible model, because the data simply never travels to a server that could log or leak it.",
      "Craftisle prioritizes client-side processing across its utilities. Formatting, conversion, and generation happen on your device. When a task genuinely requires a server, the tool tells you before you proceed — never silently.",
    ],
    sections: [
      {
        heading: "Why client-side is safer",
        paragraphs: [
          "A server-based tool must receive your input to process it, creating a copy it then has to secure and eventually delete. A client-side tool avoids creating that copy at all. Less data in motion means less to protect.",
        ],
      },
      {
        heading: "Transparency you can feel",
        paragraphs: [
          "Because the work happens locally, you are not asked to 'trust' a privacy policy — you can see that no network request carries your content. That is a stronger guarantee than any written assurance.",
        ],
      },
      {
        heading: "Good for sensitive work",
        paragraphs: [
          "Generating a password, formatting a confidential JSON, or converting a personal document are all safer when they never leave the tab. Free and no-signup removes the usual pressure to upload.",
        ],
      },
    ],
    faq: [
      { q: "What does client-side mean?", a: "The tool runs in your browser and processes your input locally instead of sending it to a server." },
      { q: "Is my file uploaded?", a: "For client-side tools, no. The page performs the work on your device." },
      { q: "Can I verify it?", a: "Yes — your browser's network inspector will show no data upload for these operations." },
    ],
    internalLinks: [L.tools, L.directory, L.passwordGen, L.jsonFormatter],
  },

  // ===================== pdf（主站 PDF 簇）9 =====================
  "merge-pdf": {
    slug: "merge-pdf",
    site: "pdf",
    title: "Merge PDF — Free Online PDF Merger, No Signup",
    description:
      "Merge PDF files free in your browser. Combine multiple PDFs into one in seconds — no signup, no upload to servers, fully private.",
    keywords: ["merge pdf", "combine pdf", "pdf merger", "join pdf files"],
    h1: "Merge PDF",
    intro: [
      "Merging PDFs means combining several PDF documents into a single file, in the order you choose. It is the fastest way to assemble a report from separate chapters, bundle invoices, or turn a scatter of exports into one tidy document.",
      "Craftisle's free merge PDF tool runs in your browser, so your files are combined on your device without being uploaded to a server. No account, no watermarks, and no file-size surprises.",
    ],
    sections: [
      {
        heading: "How to merge PDFs",
        paragraphs: [
          "Add the PDFs you want to combine, drag them into the order you need, and start. The tool stitches the pages together and gives you one downloadable PDF. Reorder any time before you merge.",
        ],
      },
      {
        heading: "Private by default",
        paragraphs: [
          "Because merging happens client-side, your documents are not sent to a remote server. That matters for contracts, financial statements, or anything personal you would never email to a random website.",
        ],
      },
      {
        heading: "When merging helps",
        paragraphs: [
          "Submitting a job application (cover letter + CV + portfolio), packing a month of statements into one file, or unifying scanned pages — all are easier as a single PDF than as an email attachment stack.",
        ],
      },
    ],
    faq: [
      { q: "Is merging PDFs free?", a: "Yes. The merge tool is free with no account and no watermarks on the output." },
      { q: "Are my files uploaded?", a: "No. Merging runs in your browser; the documents are not sent to a server." },
      { q: "Can I reorder pages?", a: "Yes. Arrange the files in any order before merging to control the final sequence." },
      { q: "Is there a file-size limit?", a: "Browser-based merging handles typical documents comfortably; extremely large scans depend on your device memory." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "split-pdf": {
    slug: "split-pdf",
    site: "pdf",
    title: "Split PDF — Free Online PDF Splitter, No Signup",
    description:
      "Split a PDF into separate files or extract specific pages free in your browser. No signup, no server upload, fully private.",
    keywords: ["split pdf", "extract pdf pages", "pdf splitter", "separate pdf pages"],
    h1: "Split PDF",
    intro: [
      "Splitting a PDF lets you break one large document into smaller files or pull out just the pages you need. It is the inverse of merging and just as common — a 200-page manual becomes the three chapters you actually care about.",
      "Craftisle's free split PDF tool works in your browser. Select the page ranges you want, and the tool extracts them locally into new files. Nothing is uploaded, and no account is required.",
    ],
    sections: [
      {
        heading: "How to split a PDF",
        paragraphs: [
          "Open your PDF, choose the pages or ranges to extract (for example pages 1-5, or just page 12), and start. Each selection becomes its own PDF you can download separately.",
        ],
      },
      {
        heading: "Keep only what you need",
        paragraphs: [
          "Sharing a single relevant section instead of a whole deck respects the recipient's time and avoids leaking unrelated content from the same file.",
        ],
      },
      {
        heading: "Private extraction",
        paragraphs: [
          "Extraction runs on your device, so the pages you pull never touch a server. Sensitive documents stay with you.",
        ],
      },
    ],
    faq: [
      { q: "Is splitting PDFs free?", a: "Yes, with no signup and no watermarks." },
      { q: "Can I extract non-consecutive pages?", a: "Yes. Specify individual pages or ranges; each becomes its own file." },
      { q: "Are files uploaded to a server?", a: "No. Splitting happens client-side in your browser." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "compress-pdf": {
    slug: "compress-pdf",
    site: "pdf",
    title: "Compress PDF — Free Online PDF Compressor, No Signup",
    description:
      "Compress PDF files free to shrink size for email and upload. Runs in your browser — no signup, no server upload, private.",
    keywords: ["compress pdf", "reduce pdf size", "pdf compressor", "shrink pdf"],
    h1: "Compress PDF",
    intro: [
      "Compressing a PDF reduces its file size so it fits email attachments, uploads, and storage limits without (usually) hurting readability. Scanned documents and image-heavy reports are the usual culprits behind bloated files.",
      "Craftisle's free compress PDF tool shrinks files in your browser. No account, no watermarks, and your document is not uploaded to a server — the compression happens on your device.",
    ],
    sections: [
      {
        heading: "How compression works",
        paragraphs: [
          "The tool re-encodes images and streamlines the file structure to cut bytes while keeping text sharp. You trade a little weight for a much smaller file that is easier to send.",
        ],
      },
      {
        heading: "Why shrink PDFs",
        paragraphs: [
          "Many portals cap uploads at 10 or 25 MB. A compressed PDF clears those gates, and smaller files are faster to open on phones and cheaper to store.",
        ],
      },
      {
        heading: "Private and free",
        paragraphs: [
          "Compression runs locally, so confidential PDFs are not sent anywhere. It is free with no signup and no output watermarks.",
        ],
      },
    ],
    faq: [
      { q: "Will compression ruin quality?", a: "Text stays crisp; image-heavy pages may soften slightly in exchange for a much smaller file." },
      { q: "Is it free?", a: "Yes, no account required and no watermarks added." },
      { q: "Are files uploaded?", a: "No. Compression is performed client-side in your browser." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "pdf-converter": {
    slug: "pdf-converter",
    site: "pdf",
    title: "PDF Converter — Free Online File Converter, No Signup",
    description:
      "Convert PDF to Word, Excel, JPG and more — free in your browser. No signup, no server upload, private file conversion.",
    keywords: ["pdf converter", "pdf to word", "pdf to excel", "pdf to jpg"],
    h1: "PDF Converter",
    intro: [
      "A PDF converter changes a PDF into an editable or image format — Word for editing, Excel for tables, JPG for sharing a page as a picture. Conversion is the bridge between a fixed layout and the format your next step actually needs.",
      "Craftisle's free PDF converter runs in your browser. Pick the target format, convert, and download — no account, no watermarks, and your file is not uploaded to a server.",
    ],
    sections: [
      {
        heading: "Common conversions",
        paragraphs: [
          "PDF to Word when you must edit text, PDF to Excel when a table needs recalculating, and PDF to JPG when a single page becomes an image for a slide or message. Each targets a concrete next action.",
        ],
      },
      {
        heading: "Editable where it counts",
        paragraphs: [
          "Converting to a document format turns a locked layout back into something you can change, which beats retyping a whole page by hand.",
        ],
      },
      {
        heading: "Private conversion",
        paragraphs: [
          "Conversion happens on your device, so the content of confidential PDFs is never sent to a remote service.",
        ],
      },
    ],
    faq: [
      { q: "Which formats are supported?", a: "Common targets include Word, Excel, and JPG; availability depends on the specific converter you open." },
      { q: "Is conversion free?", a: "Yes, with no signup and no watermarks." },
      { q: "Are files uploaded?", a: "No. Conversion runs client-side in your browser." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "rotate-pdf": {
    slug: "rotate-pdf",
    site: "pdf",
    title: "Rotate PDF — Free Online PDF Rotator, No Signup",
    description:
      "Rotate PDF pages free in your browser. Fix sideways or upside-down pages, no signup, no server upload, private.",
    keywords: ["rotate pdf", "rotate pdf pages", "pdf rotator", "fix pdf orientation"],
    h1: "Rotate PDF",
    intro: [
      "Rotating a PDF fixes pages that were scanned or saved sideways or upside-down. It is a small fix with a big quality payoff — a correctly oriented document reads as professional instead of careless.",
      "Craftisle's free rotate PDF tool works in your browser. Choose the pages to rotate, set the angle, and save. No account, no watermarks, and your file is not uploaded to a server.",
    ],
    sections: [
      {
        heading: "How to rotate pages",
        paragraphs: [
          "Open the PDF, select the pages (or all of them), pick 90° or 180°, and apply. You can rotate only the problem pages while leaving the rest alone.",
        ],
      },
      {
        heading: "Fix scans fast",
        paragraphs: [
          "Phone-scanned documents often come in mixed orientations. Rotating the outliers takes seconds and spares the reader from craning their neck.",
        ],
      },
      {
        heading: "Private rotation",
        paragraphs: [
          "Rotation runs locally, so the document's contents are never sent to a server — useful for anything confidential.",
        ],
      },
    ],
    faq: [
      { q: "Can I rotate just some pages?", a: "Yes. Select individual pages or ranges rather than the whole file." },
      { q: "Is it free?", a: "Yes, no signup and no watermarks." },
      { q: "Are files uploaded?", a: "No. Rotation happens client-side in your browser." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "pdf-watermark": {
    slug: "pdf-watermark",
    site: "pdf",
    title: "PDF Watermark — Free Online Watermark Adder, No Signup",
    description:
      "Add a watermark to a PDF free in your browser. Mark drafts or protect documents — no signup, no server upload, private.",
    keywords: ["pdf watermark", "add watermark to pdf", "pdf watermark tool", "mark pdf"],
    h1: "PDF Watermark",
    intro: [
      "Adding a watermark to a PDF stamps each page with text or a mark — 'DRAFT', a company name, or 'CONFIDENTIAL'. It signals status and discourages casual reuse without changing your content.",
      "Craftisle's free PDF watermark tool runs in your browser. Enter the text, adjust placement, and apply across pages. No account, no watermarks added by us, and your file stays on your device.",
    ],
    sections: [
      {
        heading: "How to add a watermark",
        paragraphs: [
          "Open the PDF, type the watermark text, choose where it appears (diagonal, top, or bottom), and apply to all pages or a selection. Preview before saving.",
        ],
      },
      {
        heading: "Mark status, not just branding",
        paragraphs: [
          "A 'DRAFT' mark prevents someone from treating a work-in-progress as final; a 'CONFIDENTIAL' mark sets expectation. Watermarks are cheap insurance for shared documents.",
        ],
      },
      {
        heading: "Private marking",
        paragraphs: [
          "Watermarking runs locally, so the document content is not uploaded — important when the file itself is sensitive.",
        ],
      },
    ],
    faq: [
      { q: "Can I choose the watermark text?", a: "Yes. Type any text and position it as you like." },
      { q: "Is it free?", a: "Yes, no signup and no added branding from us." },
      { q: "Are files uploaded?", a: "No. Watermarking happens client-side in your browser." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "pdf-editor-online": {
    slug: "pdf-editor-online",
    site: "pdf",
    title: "PDF Editor Online — Free Edit PDF in Browser",
    description:
      "Edit PDF online free in your browser. Annotate, fill, and adjust PDFs without installing software — no signup, private.",
    keywords: ["pdf editor online", "edit pdf", "online pdf editor", "fill pdf form"],
    h1: "PDF Editor Online",
    intro: [
      "An online PDF editor lets you make changes to a PDF without buying or installing desktop software — fill forms, add notes, or tweak layout right in the browser. For the edits people actually need, a lightweight editor beats a heavy suite.",
      "Craftisle's free PDF editor online runs in your browser. Open a file, make your edits, and save. No account, no watermarks, and your document is processed on your device rather than uploaded.",
    ],
    sections: [
      {
        heading: "Edits people need most",
        paragraphs: [
          "Filling forms, adding text and highlights, and minor layout tweaks cover the vast majority of 'I just need to edit this PDF' moments — no full Acrobat license required.",
        ],
      },
      {
        heading: "No install, anywhere",
        paragraphs: [
          "Because it is browser-based, the editor works on any machine with a link. Help a colleague or fix a form on a borrowed laptop without installing anything.",
        ],
      },
      {
        heading: "Private editing",
        paragraphs: [
          "Editing runs client-side, so the content of personal or business PDFs is not sent to a server.",
        ],
      },
    ],
    faq: [
      { q: "Can I fill PDF forms online?", a: "Yes. Open the form, fill the fields, and save the completed file." },
      { q: "Is the editor free?", a: "Yes, no signup and no watermarks on output." },
      { q: "Are files uploaded?", a: "No. Editing happens in your browser on your device." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "free-pdf-tools": {
    slug: "free-pdf-tools",
    site: "pdf",
    title: "Free PDF Tools — Merge, Split, Compress & More",
    description:
      "A free hub of PDF tools: merge, split, compress, convert, rotate and edit PDFs in your browser. No signup, no server upload, private.",
    keywords: ["free pdf tools", "pdf toolkit", "online pdf tools", "pdf utilities"],
    h1: "Free PDF Tools",
    intro: [
      "Free PDF tools are the everyday utilities for working with PDFs — merging, splitting, compressing, converting, rotating, and editing — gathered in one place so you are never hunting for a separate site per task.",
      "Craftisle's free PDF tools run in your browser. Pick the operation you need, finish it, and move on. No account, no watermarks, and your files are processed on your device rather than uploaded.",
    ],
    sections: [
      {
        heading: "One place for PDF work",
        paragraphs: [
          "Instead of bookmarking a merger site, a compressor site, and a converter site, keep one toolbox open. The operations share a design, so switching between them is instant.",
        ],
      },
      {
        heading: "Private by default",
        paragraphs: [
          "Every operation is client-side, so confidential PDFs are not sent to a server. That is the right default for contracts, statements, and personal documents.",
        ],
      },
      {
        heading: "Free, no catches",
        paragraphs: [
          "No signup walls and no watermarks on your output. The tools exist to be used, not to funnel you into a paid plan.",
        ],
      },
    ],
    faq: [
      { q: "Which PDF tools are free?", a: "Merging, splitting, compressing, converting, rotating, watermarking, and editing are all free with no account." },
      { q: "Are files uploaded?", a: "No. Processing happens in your browser on your device." },
      { q: "Is there a watermark?", a: "No watermarks are added by Craftisle to your output." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  "unlock-pdf": {
    slug: "unlock-pdf",
    site: "pdf",
    title: "Unlock PDF — Free Remove PDF Password Online",
    description:
      "Unlock a PDF free in your browser to remove a permissions password. No signup, no server upload, private handling.",
    keywords: ["unlock pdf", "remove pdf password", "pdf unlocker", "decrypt pdf"],
    h1: "Unlock PDF",
    intro: [
      "Unlocking a PDF removes a permissions password that restricts printing, editing, or copying. It is useful when you legitimately own a file but its restrictions get in your way — for example, printing a document you paid for.",
      "Craftisle's free unlock PDF tool runs in your browser. Provide the password you have, and the tool lifts the restrictions on your device. No account, and your file is not uploaded to a server.",
    ],
    sections: [
      {
        heading: "When unlocking helps",
        paragraphs: [
          "You may need to edit or print a PDF whose restrictions were set by default. Removing them (when you are authorized) turns a read-only file back into a usable one.",
        ],
      },
      {
        heading: "Use it responsibly",
        paragraphs: [
          "This tool is for files you own or are permitted to modify. It is not a way around someone else's legitimate protection, and it cannot defeat strong encryption you do not have the password for.",
        ],
      },
      {
        heading: "Private unlocking",
        paragraphs: [
          "Unlocking runs locally, so the document content is not sent anywhere — appropriate for personal or business files.",
        ],
      },
    ],
    faq: [
      { q: "Can it remove a password I know?", a: "Yes. If you have the permissions password, the tool lifts the restrictions on your device." },
      { q: "Is it free?", a: "Yes, no signup required." },
      { q: "Are files uploaded?", a: "No. Unlocking happens client-side in your browser." },
      { q: "Can it crack unknown passwords?", a: "No. It only removes restrictions when you supply the correct password." },
    ],
    internalLinks: [L.pdfTools, L.tools, L.directory],
  },

  // ===================== P1-B1 分类聚合页（手写）=====================
  "text-tools": {
    slug: "text-tools",
    site: "craftisle",
    title: "Text Tools — 43 Free Browser Utilities, No Signup",
    description:
      "Free online text tools: case converter, text diff, word counter, slug generator, ROT13, Unicode lookup. Runs in your browser — no upload, no signup.",
    keywords: ["text tools", "online text tools", "text utilities", "free text tools"],
    h1: "Text Tools",
    intro: [
      "Text tools handle the string manipulations that come up constantly but never justify installing anything: reformatting a block of pasted text, comparing two versions of a paragraph, counting characters against a limit, or turning a headline into a URL slug. They are small jobs, but frequent enough that opening a tab beats writing a throwaway script.",
      "Craftisle collects 43 text tools in this category. Each one runs client-side in your browser, so the text you paste is processed on your device rather than sent to a server — which matters when that text is a contract clause, a credential, or a draft you have not published yet.",
    ],
    sections: [
      {
        heading: "What the text tools cover",
        paragraphs: [
          "Case Converter switches between camelCase, snake_case, kebab-case, and title case in one pass, which is the fastest fix when code and copy disagree on naming. Text Diff lines up two versions and marks exactly what changed — faster than reading both side by side and guessing. Text Statistics gives character, word, line, and sentence counts when you are writing to a limit imposed by a form, a meta description, or an ad slot.",
          "Slug Generator turns a headline into a URL-safe string. Reverse Text flips a string or each line independently. ROT13 applies the classic substitution cipher, and Unicode Tool inspects individual characters — genuinely useful when a pasted string carries an invisible character that is silently breaking your parser.",
          "Text Translator covers 30+ languages, and Text Formatter handles the general cleaning and reshaping that does not fit neatly into the others.",
        ],
      },
      {
        heading: "Processed on your device",
        paragraphs: [
          "Every tool here executes in the browser. Nothing you type is transmitted, stored, or logged, and there is no queue to wait in — the result appears as soon as the computation finishes.",
          "One consequence worth knowing in advance: because there is no account holding a history, your text is not retrievable later from another device. Copy what you need before closing the tab.",
        ],
      },
      {
        heading: "Choosing the right one",
        paragraphs: [
          "Start from the job, not the tool list. Reformatting wording means Case Converter or Text Formatter; investigating a change means Text Diff; writing to a constraint means Text Statistics. Anything involving encoding rather than wording belongs with the converter tools instead.",
          "Each tool page states what it expects as input and what it returns, so you can tell within a few seconds whether it matches your task.",
        ],
      },
    ],
    faq: [
      { q: "Are these text tools free?", a: "Yes. All 43 tools are free with no account, no trial, and no cap on how much text you process." },
      { q: "Is my text uploaded anywhere?", a: "No. Processing happens in your browser, so the text you paste is not sent to a server." },
      { q: "Is there a character limit?", a: "There is no artificial limit. Practical limits come from your own device memory on very large inputs." },
      { q: "Do these work on a phone?", a: "Yes. The tools are responsive and work in mobile browsers." },
    ],
    internalLinks: [
      { label: "Case Converter", href: "/tools/case-converter" },
      { label: "Text Diff", href: "/tools/diff" },
      { label: "Text Statistics", href: "/tools/string-statistic" },
      { label: "Slug Generator", href: "/tools/slug-generator" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("text"),
    ],
  },

  "image-tools": {
    slug: "image-tools",
    site: "craftisle",
    title: "Image Tools — 24 Free Browser Editors, No Upload",
    description:
      "Free online image tools: resize, crop, compress, convert, split, adjust opacity, remove watermarks. Runs in your browser — no upload, no signup.",
    keywords: ["image tools", "online image tools", "free image editor", "browser image tools"],
    h1: "Image Tools",
    intro: [
      "Most image work is not design work. It is resizing a screenshot to fit a form, cropping to exact pixel dimensions, compressing a photo until an upload stops rejecting it, or converting a WebP into something an older pipeline accepts. These are one-off jobs, and they are the reason image tools exist as single-purpose pages rather than as one large application.",
      "Craftisle has 24 image tools that run entirely in your browser. Your files are not uploaded, which is the difference between editing a personal photo on a random website and editing it locally.",
    ],
    sections: [
      {
        heading: "Resizing, cropping, and compression",
        paragraphs: [
          "Image Resizer scales by width, height, or fit mode, so you can hit an exact dimension instead of guessing. Image Cropper takes precise pixel coordinates when a layout demands them. Image Compressor gives you a quality control to trade file size against visible artifacts, which is usually the last step before an upload limit stops rejecting you.",
          "Image Converter handles the format churn between JPEG, PNG, WebP, AVIF, and TIFF — the practical fix when a service accepts one type and you have another.",
        ],
      },
      {
        heading: "Transparency, tiling, and watermarks",
        paragraphs: [
          "Change Image Opacity adjusts transparency in solid or gradient mode, and Create Transparent PNG makes a specific colour transparent — the usual requirement when you need a logo on a coloured background without a white box around it.",
          "Image Split cuts one image into tiles, useful for slicing a large graphic for grids or print. AI Watermark Remover strips Gemini AI image watermarks in the browser, and Media Downloader pulls video from Bilibili, Douyin, TikTok, and Instagram.",
        ],
      },
      {
        heading: "Why editing in the browser matters here",
        paragraphs: [
          "Images are often more personal than text — photos of people, documents, receipts. Running the edit client-side means the file never leaves your device, so there is no server-side copy to worry about.",
          "It is also faster: no upload progress bar, no processing queue, no download link that expires. The output is ready as soon as the operation completes.",
        ],
      },
    ],
    faq: [
      { q: "Do I need to upload my images?", a: "No. Editing happens in your browser, so the files stay on your device." },
      { q: "Are the image tools free?", a: "Yes. All 24 tools are free with no account and no watermark added to the output." },
      { q: "Is there a file size limit?", a: "There is no artificial cap. Very large files depend on your device's available memory." },
      { q: "Which formats are supported?", a: "The converter handles JPEG, PNG, WebP, AVIF, and TIFF. Individual tools state their supported inputs." },
    ],
    internalLinks: [
      { label: "Image Resizer", href: "/tools/image-resize" },
      { label: "Image Compressor", href: "/tools/image-compress" },
      { label: "Image Converter", href: "/tools/image-convert" },
      { label: "Create Transparent PNG", href: "/tools/image-create-transparent" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("image"),
    ],
  },

  "converter-tools": {
    slug: "converter-tools",
    site: "craftisle",
    title: "Online Converters — 18 Free Format Tools, No Signup",
    description:
      "Free online converters: Base64, Base32, Base58, radix, CSV to JSON, URL encode, image to Base64, byte units. Browser-based, no signup.",
    keywords: ["online converters", "free converters", "format converter", "base64 converter"],
    h1: "Online Converters",
    intro: [
      "Conversion tasks are the plumbing of technical work: a value arrives in one representation and has to leave in another. Base64 for a payload, a hexadecimal number as decimal, a CSV export as JSON, a URL with characters that need escaping. Each takes seconds to do and minutes to do badly by hand.",
      "This category holds 18 converters on Craftisle. They run in the browser, so credentials, tokens, and payloads you paste are never transmitted to a server.",
    ],
    sections: [
      {
        heading: "Encodings and number bases",
        paragraphs: [
          "Base64 Encode/Decode is the workhorse for payloads, data URIs, and basic auth headers. Base32 and Base58 cover the encodings you meet in crypto and shortened identifiers. Radix Converter moves numbers between binary, octal, decimal, and hexadecimal in either direction.",
          "URL Encode/Decode escapes the characters that break query strings, and Image to Base64 turns an image into a data URI — or back into a file, which is the quick way to inspect an embedded asset.",
        ],
      },
      {
        heading: "Data and units",
        paragraphs: [
          "CSV/JSON Converter translates between the two formats that refuse to agree, which is most of the friction in moving data between a spreadsheet and an API.",
          "Byte Converter moves between bytes, KB, MB, GB, TB, and PB. It settles the recurring argument about whether a vendor means 1,000 or 1,024, because you can see both readings side by side. PNG to SVG handles the vector conversion case.",
        ],
      },
      {
        heading: "Accuracy over speed",
        paragraphs: [
          "Conversions are easy to get subtly wrong — an off-by-one in a base conversion, a padding character dropped from a Base64 string, a URL escaped twice. Doing them with a tool removes a class of bug that is genuinely tedious to debug after the fact.",
          "Because these run locally, you can paste production tokens and real payloads without wondering who else can read them.",
        ],
      },
    ],
    faq: [
      { q: "Are these converters free?", a: "Yes. All 18 converters are free with no account and no limit on how many values you convert." },
      { q: "Is anything I paste uploaded?", a: "No. Conversion runs in your browser; the values are not sent to a server." },
      { q: "Can I convert in both directions?", a: "Most converters are bidirectional — encode and decode, or convert either way between units. Each tool page states its directions." },
      { q: "Do they handle large inputs?", a: "Yes, within the limits of your device memory. There is no artificial size cap." },
    ],
    internalLinks: [
      { label: "Base64 Encode/Decode", href: "/tools/base64" },
      { label: "Radix Converter", href: "/tools/radix-converter" },
      { label: "CSV/JSON Converter", href: "/tools/csv-json" },
      { label: "URL Encode/Decode", href: "/tools/url-encode" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("converter"),
    ],
  },

  "dev-tools": {
    slug: "dev-tools",
    site: "craftisle",
    title: "Developer Tools — 25 Free Online Utilities",
    description:
      "Free developer tools: regex tester and visualizer, cron builder, SVG editor, Mermaid diagrams, file viewer, HTML editor. No signup, runs in browser.",
    keywords: ["developer tools", "online developer tools", "free dev tools", "web developer utilities"],
    h1: "Developer Tools",
    intro: [
      "Developers reach for a browser tool when the alternative is spinning up a project or searching their shell history. Testing a regular expression, decoding a cron schedule someone else wrote, previewing a file without installing a viewer — these are interruptions, and the cost of context-switching to a heavyweight tool is higher than the task itself.",
      "There are 25 developer tools here, all running client-side. You can paste real configuration, real tokens, and real files without sending them anywhere.",
    ],
    sections: [
      {
        heading: "Regular expressions",
        paragraphs: [
          "Regex Tester matches patterns against sample input with live highlighting, which turns guesswork into something you can watch. Regex Visualizer goes further and renders the pattern as a syntax tree — the fastest way to understand an expression someone else wrote, or to find the branch that is silently matching too much.",
        ],
      },
      {
        heading: "Schedules, diagrams, and markup",
        paragraphs: [
          "Cron Expression builds schedules from fields, and Cron Expression Parser does the reverse: paste a cron string and read what it actually means in plain language. Crontab Guru explains expressions the same way, which is worth doing before trusting a schedule you inherited.",
          "Mermaid Chart renders flowcharts from text definitions. SVG Editor edits vector markup directly with a preview. HTML Visual Editor lets you paste or upload HTML and edit it visually — a fast way to mock up a change without a build step.",
        ],
      },
      {
        heading: "Inspecting files and input",
        paragraphs: [
          "File Viewer previews 135+ formats — PDF, Word, Excel, CAD, 3D models, and images — so you can look at an attachment instead of trusting the filename. Keyboard Test confirms that key events fire, which matters for shortcuts and accessibility work.",
          "Everything here runs in the tab, which is what makes it safe to point at production artifacts.",
        ],
      },
    ],
    faq: [
      { q: "Are the developer tools free?", a: "Yes. All 25 tools are free with no account and no usage cap." },
      { q: "Is my code or config uploaded?", a: "No. Processing happens in your browser; pasted content is not transmitted to a server." },
      { q: "Can I test production regexes safely?", a: "Yes. Because matching runs locally, you can use real patterns and real sample data privately." },
      { q: "Which file formats can I preview?", a: "File Viewer handles 135+ formats including PDF, Word, Excel, CAD, 3D, and common image types." },
    ],
    internalLinks: [
      { label: "Regex Tester", href: "/tools/regex" },
      { label: "Regex Visualizer", href: "/tools/regex-vis" },
      { label: "Cron Expression", href: "/tools/cron" },
      { label: "File Viewer", href: "/tools/file-viewer" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("dev"),
    ],
  },

  "utility-tools": {
    slug: "utility-tools",
    site: "craftisle",
    title: "Utility Tools — 19 Free Everyday Helpers, No Signup",
    description:
      "Free utility tools: countdown, stopwatch, Pomodoro, spin wheel, counter, scoreboard, Unix timestamp converter. No signup, no install.",
    keywords: ["utility tools", "online utilities", "free online tools", "everyday helper tools"],
    h1: "Utility Tools",
    intro: [
      "Utility tools are the ones you open once and forget about until the next time: a countdown for a meeting that started late, a stopwatch for something you are timing by hand, a wheel to settle a decision nobody wants to make, a counter for the tally you keep losing track of.",
      "Craftisle has 19 of them. They run in the browser with no account, so you can open one on a shared screen or a borrowed machine without signing into anything.",
    ],
    sections: [
      {
        heading: "Timers and focus",
        paragraphs: [
          "Countdown runs a timer to a target moment, Stopwatch measures elapsed time with lap splits, and Pomodoro Timer structures work into the usual focus and break intervals. They cover the three different questions people actually have: how much is left, how long did that take, and when should I stop.",
          "Unix Timestamp Converter translates between epoch seconds and readable dates — the tool you need whenever logs and humans disagree about time.",
        ],
      },
      {
        heading: "Randomness and tallying",
        paragraphs: [
          "Spin Wheel picks between options you supply, Coin Flip settles the binary case, Counter keeps a running tally, and Scoreboard tracks points in real time. These replace the improvised alternatives — arguing, or counting on fingers.",
          "Discord Timestamp Generator produces the formatted timestamp strings Discord renders per-viewer, which is otherwise a fiddly manual lookup.",
        ],
      },
      {
        heading: "Nothing to install, nothing to sign into",
        paragraphs: [
          "These are the tools most likely to be opened on a machine that is not yours — a classroom display, a meeting room screen, a shared laptop. No account means no cleanup afterwards.",
          "They are also lightweight enough to keep open in a tab for a whole session without slowing anything down.",
        ],
      },
    ],
    faq: [
      { q: "Are these utility tools free?", a: "Yes. All 19 tools are free with no account and no usage limit." },
      { q: "Do timers keep running in a background tab?", a: "They continue while the tab is open. Browsers throttle background tabs, so keep the tab visible for accurate timing." },
      { q: "Is any data stored?", a: "No. These tools run client-side and do not store your input or results." },
      { q: "Can I use them on a shared screen?", a: "Yes. There is no account to sign into, so nothing is left behind on a shared machine." },
    ],
    internalLinks: [
      { label: "Countdown", href: "/tools/countdown" },
      { label: "Stopwatch", href: "/tools/stopwatch" },
      { label: "Pomodoro Timer", href: "/tools/pomodoro" },
      { label: "Unix Timestamp Converter", href: "/tools/unix-to-date" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("utility"),
    ],
  },

  "json-tools": {
    slug: "json-tools",
    site: "craftisle",
    title: "JSON Tools — Minify, Compare, Sort, Escape Online",
    description:
      "Free JSON tools: minify, compare two objects, sort keys alphabetically, escape strings, stringify objects. Runs client-side, no signup.",
    keywords: ["json tools", "online json tools", "json minify", "json compare"],
    h1: "JSON Tools",
    intro: [
      "JSON is the format developers touch most and trust least by eye. Minifying a payload before shipping it, comparing two responses to find what actually changed, sorting keys so a diff is readable, escaping a string that has to survive being embedded — all of it is mechanical, and all of it is error-prone when done by hand.",
      "This category holds five JSON tools that each do one of those jobs. They run in your browser, so you can paste API responses and production payloads without sending them to a third party.",
    ],
    sections: [
      {
        heading: "Minify, sort, and escape",
        paragraphs: [
          "Minify JSON strips whitespace when payload size matters. Sort JSON orders keys alphabetically, which is the step that turns an unreadable diff into a readable one — two objects with the same keys in different orders stop looking different.",
          "Escape JSON handles the case where a JSON string has to live inside another string, adding or removing the escaping as needed. Stringify JSON converts JavaScript objects into JSON text.",
        ],
      },
      {
        heading: "Comparing two objects",
        paragraphs: [
          "JSON Compare takes two documents and reports the differences, including nested ones. It is the fastest way to answer \"what changed between these two API responses\" without reading both carefully.",
          "That is a genuinely common debugging situation: an endpoint behaves differently between environments, and the payload is too large to eyeball.",
        ],
      },
      {
        heading: "Safe for real payloads",
        paragraphs: [
          "Because these run client-side, it is safe to paste responses containing tokens, user identifiers, or commercially sensitive fields. Nothing is uploaded.",
          "If you are also formatting rather than transforming, the code formatters cover pretty-printing JSON alongside HTML, SQL, and YAML.",
        ],
      },
    ],
    faq: [
      { q: "Are the JSON tools free?", a: "Yes. All five are free with no account and no size cap beyond your device memory." },
      { q: "Is my JSON uploaded?", a: "No. Processing happens in your browser, so pasted payloads are not sent to a server." },
      { q: "Is there a payload size limit?", a: "There is no artificial limit. Very large documents depend on your device's available memory." },
      { q: "Can I pretty-print as well as minify?", a: "Yes. The JSON Formatter handles beautify and minify; see the code formatters category." },
    ],
    internalLinks: [
      { label: "Minify JSON", href: "/tools/json-minify" },
      { label: "JSON Compare", href: "/tools/json-comparison" },
      { label: "Sort JSON", href: "/tools/json-sort" },
      { label: "JSON Formatter", href: "/tools/json-formatter" },
      L.tools,
      L.directory,
    ],
  },

  "time-tools": {
    slug: "time-tools",
    site: "craftisle",
    title: "Time Tools — Convert and Calculate Time Online",
    description:
      "Free time tools: seconds to hours, days to hours, Unix timestamps, decimal hours, leap year checks, cron explained. No signup, browser-based.",
    keywords: ["time tools", "time converter", "seconds to hours", "unix timestamp converter"],
    h1: "Time Tools",
    intro: [
      "Time conversions appear in places where getting them wrong is expensive: timesheets, billing calculations, log correlation, and schedules. Turning 7,200 seconds into 02:00:00, converting decimal hours back into hours and minutes, or translating an epoch timestamp in a log into a date you can reason about.",
      "Craftisle has nine time tools covering those conversions. They run in the browser with no account, so you can paste timestamps from production logs without hesitation.",
    ],
    sections: [
      {
        heading: "Duration conversions",
        paragraphs: [
          "Convert Seconds to Time turns a raw second count into HH:MM:SS, and Convert Time to Seconds does the reverse — the pair you need whenever one system stores durations and another displays them.",
          "Convert Days to Hours and Convert Hours to Days handle the coarse cases that show up in planning. Convert Time to Decimal produces decimal hours, which is the format timesheet and invoicing systems usually want, and is the one most often miscalculated by hand.",
        ],
      },
      {
        heading: "Timestamps, calendars, and schedules",
        paragraphs: [
          "Unix Timestamp Converter moves between epoch values and human-readable dates in both directions. It is the standard first step when a log line does not line up with what a user reported.",
          "Check Leap Years settles the question that quietly breaks date arithmetic. Truncate Clock Time rounds a time down to the hour, minute, or second, and Crontab Guru explains cron expressions in plain English before you rely on one.",
        ],
      },
      {
        heading: "Why use a tool for this",
        paragraphs: [
          "Time arithmetic is where off-by-one errors hide: a day boundary, a leap year, a timezone offset. Doing the conversion mechanically removes the class of mistake that survives review because the result looks plausible.",
          "These tools are also fast enough to use mid-conversation, which is when the question usually comes up.",
        ],
      },
    ],
    faq: [
      { q: "Are the time tools free?", a: "Yes. All nine tools are free with no account and no usage limit." },
      { q: "Do they handle timezones?", a: "The timestamp converter works with Unix timestamps, which are UTC-based. Each tool page states how it handles zones." },
      { q: "Is my data uploaded?", a: "No. Conversion runs in your browser; pasted timestamps are not sent to a server." },
      { q: "Can I convert decimal hours back to hours and minutes?", a: "Yes. Convert Time to Seconds accepts HH:MM:SS, and the decimal converter handles the reverse direction." },
    ],
    internalLinks: [
      { label: "Convert Seconds to Time", href: "/tools/convert-seconds-to-time" },
      { label: "Convert Time to Decimal", href: "/tools/convert-time-to-decimal" },
      { label: "Unix Timestamp Converter", href: "/tools/convert-unix-to-date" },
      { label: "Crontab Guru", href: "/tools/crontab-guru" },
      L.tools,
      L.directory,
    ],
  },

  "generator-tools": {
    slug: "generator-tools",
    site: "craftisle",
    title: "Generator Tools — QR Codes, UUIDs, Random Values",
    description:
      "Free generator tools: QR codes, UUIDs, random strings, lorem ipsum, random groups, pixel art, text to speech. No signup, browser-based.",
    keywords: ["generator tools", "qr code generator", "uuid generator", "random string generator"],
    h1: "Generator Tools",
    intro: [
      "Generators produce the values you would otherwise invent, copy from somewhere, or write a loop to create. A QR code for a URL, a UUID for a new record, a throwaway string for a test fixture, placeholder text for a layout, a random grouping for a workshop exercise.",
      "There are eight generator tools here, all running client-side. Generated values are not stored or logged, which matters for identifiers you intend to use for real.",
    ],
    sections: [
      {
        heading: "Identifiers and codes",
        paragraphs: [
          "UUID Generator produces UUID/GUID values when you need an identifier that will not collide. Random String creates strings with the length and character set you specify, which is the usual requirement for test data or temporary tokens.",
          "QR Code Generator builds styled codes from a URL or text — the fastest path from a link to something scannable on a poster or screen.",
        ],
      },
      {
        heading: "Placeholder text and creative output",
        paragraphs: [
          "Lorem Ipsum fills a layout with placeholder copy so you can judge spacing rather than content. Random Group splits a list into random teams, which is the tool that ends the arguments about who goes first.",
          "Pixel Art Generator converts images into pixel style. Text to Speech reads text aloud, useful for checking how copy sounds. Handwriting Animation turns text into a handwriting animation, which is a common requirement for explainer and teaching videos.",
        ],
      },
      {
        heading: "Generated on your device",
        paragraphs: [
          "Randomness is only useful if it is not predictable. Generating client-side means values are produced locally rather than fetched from a service that might log them.",
          "Nothing generated is retained, so identifiers you produce here are yours alone.",
        ],
      },
    ],
    faq: [
      { q: "Are the generator tools free?", a: "Yes. All eight are free with no account and no cap on how many values you generate." },
      { q: "Are generated values stored or logged?", a: "No. Generation happens in your browser and nothing is retained." },
      { q: "Can I customise the output?", a: "Yes. Most generators let you set length, character set, or styling — for example QR code appearance and random string composition." },
      { q: "Are the UUIDs cryptographically random?", a: "They are generated using browser randomness suitable for identifiers. Do not use them as secrets or password material." },
    ],
    internalLinks: [
      { label: "QR Code Generator", href: "/tools/qrcode" },
      { label: "UUID Generator", href: "/tools/uuid" },
      { label: "Random String", href: "/tools/random-string" },
      { label: "Pixel Art Generator", href: "/tools/image-to-pixel" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("generator"),
    ],
  },

  "formatter-tools": {
    slug: "formatter-tools",
    site: "craftisle",
    title: "Code Formatters — JSON, HTML, SQL, YAML Online",
    description:
      "Free code formatters: beautify and minify JSON, HTML, SQL, and YAML, plus HTML character escaping. Browser-based, no signup, no upload.",
    keywords: ["code formatter", "json formatter", "html formatter", "sql formatter"],
    h1: "Code Formatters",
    intro: [
      "Formatters do two jobs that sound contradictory and are both necessary: making code readable when you are trying to understand it, and making it compact when you are shipping it. Minified output is hostile to read; unformatted output is hostile to diff. You need both directions.",
      "Craftisle has five formatters covering JSON, HTML, SQL, YAML, and HTML escaping. They run in the browser, so pasting configuration or queries containing real values is safe.",
    ],
    sections: [
      {
        heading: "Beautify and minify",
        paragraphs: [
          "JSON Formatter pretty-prints or compacts JSON, which is the first move when a single-line payload needs reading. HTML Formatter does the same for markup, SQL Formatter reindents statements that arrive as one line, and YAML Formatter tidies configuration where indentation is syntactically significant.",
          "The minify direction is what you want before embedding a payload in a file or sending it somewhere with a size constraint.",
        ],
      },
      {
        heading: "Escaping",
        paragraphs: [
          "HTML Escape converts special characters into entities so that text renders literally instead of being interpreted as markup. It is the step people skip and then debug for twenty minutes when a snippet of code disappears from a page.",
        ],
      },
      {
        heading: "Safe for real configuration",
        paragraphs: [
          "Configuration is where credentials live. Because formatting runs client-side, you can paste a real config file or a production query without sending it to a third-party service.",
          "If you need to inspect structure rather than reformat it, the JSON tools category covers comparison and sorting.",
        ],
      },
    ],
    faq: [
      { q: "Are the formatters free?", a: "Yes. All five are free with no account and no size cap beyond your device memory." },
      { q: "Is my code uploaded?", a: "No. Formatting happens in your browser; pasted content is not transmitted." },
      { q: "Can I minify as well as beautify?", a: "Yes. The JSON and HTML formatters both support beautify and minify." },
      { q: "Does the SQL formatter validate my query?", a: "It reindents and tidies statements. It does not validate syntax against a database engine." },
    ],
    internalLinks: [
      { label: "JSON Formatter", href: "/tools/json-formatter" },
      { label: "HTML Formatter", href: "/tools/html-formatter" },
      { label: "SQL Formatter", href: "/tools/sql-formatter" },
      { label: "YAML Formatter", href: "/tools/yaml-formatter" },
      L.tools,
      L.directory,
    ],
  },

  "encryption-tools": {
    slug: "encryption-tools",
    site: "craftisle",
    title: "Encryption & Hashing Tools — Client-Side, No Upload",
    description:
      "Free encryption tools: AES/DES encrypt and decrypt, bcrypt hashing, multiple hash algorithms, JWT decoder. Runs in your browser, nothing uploaded.",
    keywords: ["encryption tools", "online hashing", "jwt decoder", "bcrypt generator"],
    h1: "Encryption & Hashing Tools",
    intro: [
      "Encryption and hashing are the tasks where using an online tool feels most uncomfortable — because the input is usually a secret. That discomfort is correct for most websites, which is why every tool in this category runs entirely in your browser and transmits nothing.",
      "This category covers four jobs: symmetric encryption, password hashing, general-purpose hashing, and decoding JWTs. All four are client-side, so keys and tokens you paste never leave your device.",
    ],
    sections: [
      {
        heading: "Symmetric encryption and hashing",
        paragraphs: [
          "AES/DES Encrypt performs symmetric encryption and decryption with configurable key sizes and modes, which is what you want for encrypting a value you will decrypt later with the same key.",
          "Hash Tool computes multiple hash algorithms for checksums and integrity checks, and Bcrypt Hash produces bcrypt hashes for password storage — the algorithm you should be using for passwords rather than a fast hash.",
        ],
      },
      {
        heading: "Decoding tokens",
        paragraphs: [
          "JWT Decoder splits a JSON Web Token into its header, payload, and signature so you can read the claims. This is a decode, not a verification: it shows you what the token says, not whether it is trustworthy.",
          "That distinction matters. Never paste a production token into a service that verifies signatures server-side; here, decoding happens locally and nothing is stored.",
        ],
      },
      {
        heading: "What runs where",
        paragraphs: [
          "All cryptographic operations execute in your browser using standard libraries. Keys, plaintext, and tokens are not uploaded, logged, or retained.",
          "The practical limit is your own device: very large inputs depend on available memory, and nothing is recoverable after you close the tab.",
        ],
      },
    ],
    faq: [
      { q: "Is anything I encrypt uploaded?", a: "No. All operations run in your browser; keys, plaintext, and tokens are never transmitted." },
      { q: "Can this verify whether a JWT signature is valid?", a: "The decoder shows the header, payload, and signature. It reads claims locally and does not verify trust." },
      { q: "Should I use these for production secrets?", a: "Use them for inspection, testing, and development. For production key management, use your platform's secret store." },
      { q: "Are these tools free?", a: "Yes. All four are free with no account and no usage limit." },
    ],
    internalLinks: [
      { label: "AES/DES Encrypt", href: "/tools/aes-des" },
      { label: "Bcrypt Hash", href: "/tools/bcrypt" },
      { label: "Hash Tool", href: "/tools/hash" },
      { label: "JWT Decoder", href: "/tools/jwt" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("encryption"),
    ],
  },

  "network-tools": {
    slug: "network-tools",
    site: "craftisle",
    title: "Network Tools — IP Calculator, Port & UA Parser",
    description:
      "Free network tools: IP radix conversion, IP address calculator, random port generator, user-agent parser. No signup, runs in browser.",
    keywords: ["network tools", "ip calculator", "user agent parser", "port generator"],
    h1: "Network Tools",
    intro: [
      "Network questions tend to arrive as small, specific puzzles: what range does this CIDR block actually cover, what is this IP in decimal, which port should a local service use, and what browser is really behind this user-agent string. Each has a definite answer and none of them justify a heavyweight toolkit.",
      "Craftisle has four network tools answering those. They run in the browser, so you can inspect addresses and agent strings from your own traffic without uploading them.",
    ],
    sections: [
      {
        heading: "Addresses and ranges",
        paragraphs: [
          "IP Calculator takes an address and works out the network details around it — the calculation behind subnetting questions that are easy to get wrong in your head.",
          "IP Radix Converter moves an address between representations, which is what you need when one system logs dotted decimal and another stores integers.",
        ],
      },
      {
        heading: "Ports and agent strings",
        paragraphs: [
          "Random Port Generator picks a port number, useful when you are standing up a local service and want to avoid the well-known ranges.",
          "User-Agent Parser breaks a UA string into browser, version, and platform. This is more useful than it sounds: UA strings are deliberately misleading, and reading one by eye reliably produces the wrong answer.",
        ],
      },
      {
        heading: "Working locally",
        paragraphs: [
          "All four tools run client-side. Addresses, subnets, and agent strings you paste are not sent anywhere, which matters when they come from your own infrastructure or access logs.",
          "Nothing is stored, so there is no history to clear afterwards.",
        ],
      },
    ],
    faq: [
      { q: "Are the network tools free?", a: "Yes. All four are free with no account and no usage limit." },
      { q: "Is the IP or user-agent data uploaded?", a: "No. Processing runs in your browser and nothing is transmitted." },
      { q: "Can I parse a subnet range?", a: "Yes. IP Calculator handles the subnet arithmetic for a given address." },
      { q: "Does the UA parser detect bots?", a: "It identifies the browser, version, and platform declared in the string. Well-disguised clients can still misreport." },
    ],
    internalLinks: [
      { label: "IP Calculator", href: "/tools/ip-calc" },
      { label: "IP Radix Converter", href: "/tools/ip-radix" },
      { label: "User-Agent Parser", href: "/tools/user-agent" },
      { label: "Random Port Generator", href: "/tools/random-port-generator" },
      L.tools,
      L.directory,
      ...buildAlternativeLinks("network"),
    ],
  },
};

export const LANDING_PAGE_SLUGS = Object.keys(LANDING_PAGES);
