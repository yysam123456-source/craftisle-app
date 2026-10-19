/**
 * 格式对转页面数据层
 *
 * 背景（2026-10-08 实测）：站内 194 个工具页主词在 GSC 里曝光全部为 0，
 * 因为「工具名」类词首页被十几年老站工具页占据，零外链的新站打不进去。
 * 真正的战场是「png to jpg」这类 4 词长尾 —— 竞争度低、需求真实、且天然可纯前端实现。
 *
 * 🔴 格式能力边界（浏览器实测，不要随意扩充）：
 *   - Canvas `toBlob` 可输出：jpeg / png / webp
 *   - **HEIC**：Chrome/Firefox/Safari 均无法原生解码，需引入 wasm 解码库（体积大）⇒ 本模块不收录
 *   - **GIF 输出**：Canvas 不支持，toBlob 会回退成 png ⇒ 不提供 gif 作为目标格式
 *   - **BMP / ICO 输出**：同样不支持 ⇒ 不收录
 *   - 可解码的输入：jpeg / png / webp / gif（取首帧）/ bmp / svg / avif（现代浏览器）
 *   - **PDF**：走 pdf.js 解析、pdf-lib 生成（2026-10-10 引入，依赖见 components/convert/PdfConvertTool.tsx）。
 *     它不在 Canvas 能力矩阵里，是独立的一条通路，但同样满足「纯浏览器内、不上传」。
 *
 * 因此 target 为 jpg / png / webp / pdf。
 * 任何新增对子都必须先确认「输入能解码」且「输出格式在上述列表内」。
 */

export type OutputFormat = "jpg" | "png" | "webp" | "pdf";
export type InputFormat = "jpeg" | "png" | "webp" | "gif" | "bmp" | "svg" | "avif" | "heic" | "pdf";

export interface ConvertPair {
  /** URL 用 slug，如 png-to-jpg */
  slug: string;
  from: InputFormat;
  to: OutputFormat;
  /** 完整词，如 "PNG to JPG" —— 用于 title/H1，长尾短语必须显式出现 */
  phrase: string;
  title: string;
  description: string;
  /** 正文段落（≥2 段，手写，禁批量生成） */
  intro: string[];
  /** 什么时候该用它 / 不该用它 */
  whenToUse: { do: string[]; avoid: string[] };
  faqs: { question: string; answer: string }[];
  /** 内链到站内工具页（孤儿页铁律：必须有） */
  relatedTools: { id: string; label: string }[];
  /** 同类对转页内链（最多 4 个） */
  relatedPairs: string[];
  /** 该转换的技术说明，展示在页面上 */
  technicalNote: string;
}

/** 输入格式的展示名与说明 */
export const INPUT_META: Record<InputFormat, { label: string; mime: string; note: string }> = {
  jpeg: { label: "JPG", mime: "image/jpeg", note: "Lossy compression, best for photographs" },
  png: { label: "PNG", mime: "image/png", note: "Lossless with full transparency support" },
  webp: { label: "WebP", mime: "image/webp", note: "Google's format, roughly 30% smaller than JPG" },
  gif: { label: "GIF", mime: "image/gif", note: "Animated format — this tool outputs the first frame" },
  bmp: { label: "BMP", mime: "image/bmp", note: "Windows bitmap, large files but maximum compatibility" },
  svg: { label: "SVG", mime: "image/svg+xml", note: "Vector format, rasterised at its natural size on export" },
  avif: { label: "AVIF", mime: "image/avif", note: "Newer compression format, needs a browser that can decode it" },
  heic: {
    label: "HEIC",
    mime: "image/heic",
    note: "iPhone format — decoded on-device by a bundled decoder, never uploaded",
  },
  pdf: {
    label: "PDF",
    mime: "application/pdf",
    note: "Parsed on-device with pdf.js — nothing is uploaded",
  },
};

export const OUTPUT_META: Record<OutputFormat, { label: string; mime: string; quality: string; note: string }> = {
  jpg: { label: "JPG", mime: "image/jpeg", quality: "0.92", note: "Lossy, no transparency, smallest file" },
  png: { label: "PNG", mime: "image/png", quality: "-", note: "Lossless, keeps transparency, larger file" },
  webp: { label: "WebP", mime: "image/webp", quality: "0.92", note: "Lossy, smallest with transparency support" },
  pdf: {
    label: "PDF",
    mime: "image/jpeg",
    quality: "0.92",
    note: "Portable Document Format — one image per page",
  },
};

/**
 * 9 个对转对（2026-10-09 新增 svg-to-png / avif-to-jpg / heic-to-jpg / heic-to-png）。
 *
 * 选取依据（真实长尾，Bing Suggest 2026-10-08 采集 1734 条）：
 *   png-to-jpg / heic-to-jpg / png-to-ico 出现在「online image converter」建议链中，
 *   其中 heic 因解码限制排除、ico 因输出不支持排除 ⇒ png-to-jpg 是需求最实的一个。
 *   其余 4 个围绕最高频的图片格式互转补齐，覆盖 4→5 词长尾变体
 *   （png to jpg online / convert png to jpg / jpg to png 等同一意图的多种问法）。
 *
 * 2026-10-15 新增 bmp-to-png（13 个对子）：真实需求词 bmp to png / bmp to png converter /
 * bmp to png converter free。BMP 浏览器可原生解码，PNG 在 toBlob 能力矩阵内
 * ⇒ 纯前端可行，且方向正确（BMP 是输入不是输出，避开了 png-to-bmp 的输出限制）。
 */
export const CONVERT_PAIRS: ConvertPair[] = [
  // ─────────────────────────────────────────────────────────────
  {
    slug: "bmp-to-png",
    from: "bmp",
    to: "png",
    phrase: "BMP to PNG",
    title: "BMP to PNG Converter — Convert BMP to PNG Online Free",
    description:
      "Convert BMP to PNG in your browser. Free, no signup, no upload — the bitmap is decoded and re-encoded on your own device.",
    intro: [
      "BMP is the format Windows reached for by default for two decades, which means a folder of screenshots, scanned documents and pasted images on any Windows machine is full of it. It is also the least efficient image format in common use: an uncompressed 24-bit bitmap costs roughly three bytes per pixel, so a 1920×1080 screenshot saved as BMP lands near 6 MB where the same picture as PNG is usually a fraction of that.",
      "Converting BMP to PNG is worth doing for two different reasons at once. The file shrinks dramatically because PNG compresses what the bitmap stored raw, and the result becomes something every browser, design tool and modern phone opens without complaint — while the BMP still trips up web uploads, email servers and anything expecting a web format. The conversion runs entirely in this tab: your BMP is decoded, drawn to an in-memory canvas, and re-encoded as PNG without an upload step.",
    ],
    whenToUse: {
      do: [
        "A web form or CMS rejects a .bmp upload and only accepts PNG, JPG or WebP.",
        "A BMP is too large to email, upload or attach — PNG typically cuts it by 80–95%.",
        "You need a format that opens in a browser, a design tool or a phone without a converter installed.",
      ],
      avoid: [
        "You need to go the other way. Canvas cannot write BMP output, so PNG-to-BMP is not something this page does — the reverse direction is a real format limitation, not an oversight.",
        "The image has to stay bit-for-bit identical to the original bitmap. Re-encoding produces a PNG whose pixels match what was drawn, not a byte-level copy of the source file.",
      ],
    },
    faqs: [
      {
        question: "Is my BMP uploaded to a server?",
        answer:
          "No. The file is read from your disk, decoded by the browser's own image decoder, drawn onto an internal canvas, and written out as a PNG in the same tab. Nothing is transmitted, so a BMP containing confidential material never leaves your device.",
      },
      {
        question: "How much smaller will the PNG be compared to the BMP?",
        answer:
          "Substantially. A BMP stores pixels uncompressed at around three bytes each; PNG applies compression, so screenshots and flat graphics typically land 80–95% smaller, and photographs land roughly 60–75% smaller. A photographic BMP can drop from about 6 MB to well under 1 MB. The exact figure depends entirely on how much detail the image carries.",
      },
      {
        question: "Does converting BMP to PNG lose quality?",
        answer:
          "No visible loss. PNG is lossless, so every pixel the BMP contains is reproduced exactly in the PNG. What changes is the file size, not the image — open the two side by side and they are indistinguishable at any zoom level.",
      },
      {
        question: "Does a BMP have a transparent background, and will the PNG keep it?",
        answer:
          "Standard BMP has no alpha channel, so it has no transparency to lose. The PNG comes out with whatever the bitmap actually contains — usually an opaque background. If you need a transparent result, remove the background first with the background remover, then convert.",
      },
      {
        question: "Can I convert several BMP files at once?",
        answer:
          "Yes. Select or drop as many BMPs as you like and each one is decoded, converted and offered as a separate PNG download in the same pass. Because nothing is uploaded there is no server-side size limit — only your device's available memory.",
      },
      {
        question: "Can I convert BMP to PNG and resize it in the same step?",
        answer:
          "Not in one pass — this page changes the format and preserves the pixel dimensions. Convert here first, then set the width and height you need with the image resizer, then use the image compressor if a form also states a byte ceiling such as 100KB. Converting before resizing means each step works on the file the next one receives.",
      },
      {
        question: "Can I convert a BMP back to JPG or WebP as well?",
        answer:
          "Yes, and it is often the better destination. JPEG produces the smallest file for photographs, WebP keeps a smaller file while supporting transparency. If the receiving system lists either format, use the WebP to JPG or WebP to PNG pages after this conversion, or use the general image converter to pick the output format directly.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["png-to-jpg", "jpg-to-png", "webp-to-png"],
    technicalNote:
      "The BMP is decoded by the browser's native image decoder (createImageBitmap, falling back to an Image element), drawn to a canvas at its natural dimensions, then exported with canvas.toBlob('image/png'). No quality argument is passed because PNG is lossless and ignores one. Because the source is decoded before re-encoding, the result is a fresh PNG rather than a repackaged BMP.",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "png-to-jpg",
    from: "png",
    to: "jpg",
    phrase: "PNG to JPG",
    title: "PNG to JPG Converter — Convert PNG to JPEG Online Free",
    description:
      "Convert PNG to JPG (JPEG) in your browser. Free, no signup, no upload — the file never leaves your device. Keeps quality high while cutting file size.",
    intro: [
      "PNG is the right format for screenshots, logos and anything with transparency, but it is the wrong one for photographs. A phone photo saved as PNG can be three to ten times larger than the same image as JPG, and on a slow connection that difference is the gap between a page that loads and one that does not.",
      "This converter re-encodes your PNG as JPG entirely inside the browser tab. The file is read from your disk, drawn onto an internal canvas, and written out as a JPG — there is no upload step, no server-side processing, and no queue. You can convert a batch of files without waiting for anything.",
    ],
    whenToUse: {
      do: [
        "You need to upload a screenshot or graphic to a form that rejects PNG.",
        "You want to shrink an image for email, a chat message, or a website upload limit.",
        "The image is a photo or illustration where transparency is not required.",
      ],
      avoid: [
        "The image has a transparent background — JPG has no alpha channel, so transparent areas turn black.",
        "You need to preserve pixel-perfect edges for a logo or line art — PNG is lossless and JPG is not.",
      ],
    },
    faqs: [
      {
        question: "Is my PNG uploaded to a server?",
        answer:
          "No. The file is read locally, drawn to an in-memory canvas, and re-encoded as JPG in the same browser tab. Nothing is transmitted, so images containing private or sensitive content never leave your device.",
      },
      {
        question: "Why is my transparent background turning black?",
        answer:
          "JPG does not support transparency. Areas that were transparent in the PNG have no colour data, so they render as black after conversion. If you need transparency preserved, convert to WebP instead — it supports an alpha channel at a smaller file size than PNG.",
      },
      {
        question: "How much smaller will the JPG be?",
        answer:
          "For photographs, usually 70–90% smaller. For flat graphics with large solid areas the gap is smaller, because JPG spends bits describing sharp edges that PNG stores losslessly. If file size barely changes, the source was likely already heavily compressed.",
      },
      {
        question: "Can I convert several PNG files at once?",
        answer:
          "Yes. Select multiple files and each is converted and offered as a separate download. Converting in your browser means you are limited by your own device's memory rather than an upload size limit.",
      },
      {
        question: "What is the difference between JPG and JPEG? Is PNG to JPEG the same as PNG to JPG?",
        answer:
          "They are the same format under two names — JPG is simply the three-letter extension, JPEG is the full name of the standard. Every .jpg file is a JPEG file. That is why searches for \"PNG to JPEG\" and \"PNG to JPG\" want the same tool, and why this page handles both: pick whichever spelling you searched for, the output is identical.",
      },
      {
        question: "I need to convert to JPEG and resize it to a specific pixel size — can I do both?",
        answer:
          "Do them as two steps. This page converts the format; the image resizer sets pixel dimensions, and the image compressor reduces the file to a byte ceiling such as 100KB. Convert first, then resize, then compress — running compression before resizing means compressing pixels that are about to be thrown away.",
      },
      {
        question: "How do I convert PNG to JPEG in bulk without waiting for each file?",
        answer:
          "Drop the whole batch into the upload area at once. Every file is decoded, re-encoded and queued for download in the same pass, so a hundred PNGs take one round trip rather than a hundred. There is no per-file upload, so the only real limit is how much memory your device has free.",
      },
    {
        question: "How do I get the PNG under 100KB, or convert PNG to JPG 100KB?",
        answer:
          "This page converts format, not size — it re-encodes at a fixed quality and does not walk that quality down to hit a number. For a ceiling like 100KB, 200KB or 1MB, run the PNG through the image compressor's target-size mode first, then bring the smaller file here if you also need it as JPG. That is also the right order for a form that caps uploads: compress to the limit, then change format.",
      },
      {
        question: "Why did my PNG get bigger instead of smaller?",
        answer:
          "PNG is lossless, so a PNG converted to PNG stays large by definition. Converting to JPG is what actually shrinks a file — a photo saved as PNG can be three to ten times the size of the same image as JPG. If you converted to WebP instead, expect roughly 30% off JPG but with transparency kept. The size you get depends on the source: flat line art and screenshots shrink less than photographs.",
      },
    ],
    relatedTools: [
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-convert", label: "Image Converter" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["jpg-to-png", "png-to-webp", "webp-to-jpg"],
    technicalNote:
      "The PNG is decoded via createImageBitmap (or an Image element as a fallback), drawn to a canvas at its natural dimensions, then exported with canvas.toBlob at quality 0.92. Because the conversion happens after decoding, the output is re-encoded rather than losslessly repackaged — which is what allows the size reduction.",
  },
  {
    slug: "jpg-to-png",
    from: "jpeg",
    to: "png",
    phrase: "JPG to PNG",
    title: "JPG to PNG Converter — Convert JPEG to PNG Online Free",
    description:
      "Convert JPG to PNG in your browser with full privacy — no upload, no signup. Useful when you need a transparent-capable format or a lossless copy of an image.",
    intro: [
      "JPG is compact but lossy, and it cannot store transparency. When a workflow rejects a JPG — an upload form that wants PNG, or a design tool that needs an alpha channel — converting format is the first step, and it is worth doing in a way that does not hand your image to a third party.",
      "This converter re-encodes your JPG as PNG inside the browser. The practical difference to understand is what changes and what does not: PNG stops further quality loss, and it can represent transparency if the source has any — but converting a JPG to PNG does not restore detail that JPG compression already threw away.",
    ],
    whenToUse: {
      do: [
        "A platform rejects JPG uploads and only accepts PNG.",
        "You need to composite the image over another background, which requires an alpha channel.",
        "You want to keep the current pixels from degrading further across repeated edits.",
      ],
      avoid: [
        "You need to make the file smaller — PNG is lossless, so converting usually makes it larger, not smaller.",
        "You are trying to remove artefacts from JPG compression — a PNG conversion preserves those artefacts exactly.",
      ],
    },
    faqs: [
      {
        question: "Does converting JPG to PNG restore lost quality?",
        answer:
          "No. JPG is lossy: compression artefacts are already baked into the pixels. Converting to PNG preserves those pixels faithfully but cannot recover information that was discarded. The PNG will look identical to the JPG and will usually be a larger file.",
      },
      {
        question: "When would a JPG to PNG conversion add transparency?",
        answer:
          "It does not add transparency that was not there. If the JPG came from a source with an alpha channel, the conversion preserves it; a JPG produced by a camera or a typical JPG encoder has no transparency, so the PNG will have a white or opaque background instead.",
      },
      {
        question: "Will converting JPG to PNG make the file bigger?",
        answer:
          "Usually yes — PNG is lossless, so it stores every pixel exactly. For a photograph the PNG can be several times larger than the JPG. If your goal is a smaller file, convert to WebP rather than PNG.",
      },
      {
        question: "Is this a server-side conversion?",
        answer:
          "No. Decoding and re-encoding both happen in your browser via the canvas API. The image is never uploaded, which also means there is no file size ceiling beyond your own device's memory.",
      },
      {
        question: "Is JPEG to PNG the same request as JPG to PNG?",
        answer:
          "Yes — JPG and JPEG are two names for one format, the three-letter extension and the full standard name. A .jpg file is a JPEG file, so \"JPEG to PNG\" and \"JPG to PNG\" describe the same conversion and this page handles both spellings identically.",
      },
      {
        question: "Can I convert a batch of JPEG files to PNG at once?",
        answer:
          "Yes. Select or drop as many JPG/JPEG files as you like and each one is converted and offered as its own download. Nothing is uploaded, so a large batch is limited by your device's free memory rather than by a server upload cap.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-create-transparent", label: "Make Image Transparent" },
      { id: "image-compress", label: "Image Compressor" },
    ],
    relatedPairs: ["png-to-jpg", "png-to-webp", "webp-to-png"],
    technicalNote:
      "The JPG is decoded, drawn to a canvas, and exported with canvas.toBlob('image/png'). PNG is lossless, so the encoded result is considerably larger than the source for photographic content. For transparency to be preserved the source must already carry an alpha channel.",
  },
  {
    slug: "pdf-to-jpg",
    from: "pdf",
    to: "jpg",
    phrase: "PDF to JPG",
    title: "PDF to JPG Converter — Turn PDF Pages into JPG Online Free",
    description:
      "Convert PDF pages to JPG images in your browser, one file per page. Free, private, nothing uploaded. Password-protected PDFs are not supported.",
    intro: [
      "A PDF is a page description, not a picture. That is why you cannot drag one into an image editor and get a usable result: there are no pixels to work with until the page is rendered. PDF to JPG is that rendering step — every page is drawn exactly as it appears on screen, then exported as an ordinary JPG you can open anywhere.",
      "The conversion happens entirely inside this page. The PDF is parsed by a local copy of pdf.js, each page is drawn to a canvas, and the canvas is exported as a JPG. Nothing is uploaded, which matters more here than for most file types: PDFs are the format people reach for when a document has to stay fixed, and that is exactly the kind of file you would rather not hand to a third-party server.",
      "Each page becomes its own image, named in page order. A twelve-page document produces twelve JPGs. If you only need one page, convert the whole file and take the one you want — nothing is uploaded, so there is no batch of personal documents sitting on someone else's disk.",
    ],
    whenToUse: {
      do: [
        "You need to put a page of a document into a slide, email or chat message as an image.",
        "An upload form accepts images but not PDFs, and you are filling it with a form, invoice or contract.",
        "You want a visual copy of a document for your own records, without asking anyone to convert it.",
        "You need a predictable JPG of each page for a review or proofing workflow.",
      ],
      avoid: [
        "You need selectable text afterwards — a JPG is pixels, so the text cannot be copied or searched.",
        "The PDF is password-protected — remove the password first, this page cannot open encrypted files.",
        "You need editable page structure preserved — that requires a PDF editor, not a converter.",
      ],
    },
    faqs: [
      {
        question: "Does converting a PDF to JPG reduce the quality?",
        answer:
          "Pages are rendered at roughly twice the PDF's own resolution, which is about 144 DPI — enough for screen reading, email, and most print needs. The text stays sharp because it is rendered from vector data rather than downscaled from a scan. Raising quality further would only matter for large-format printing.",
      },
      {
        question: "Will the text in my JPG be selectable or searchable?",
        answer:
          "No. The moment a page becomes a JPG it is a photograph of that page, so the text turns into pixels. If you need text you can copy or search, extract it with a PDF text extractor instead. If the source PDF is a scan rather than a typed document, the JPG will be an image of a scan and there is no text layer to begin with.",
      },
      {
        question: "Why can't this open my password-protected PDF?",
        answer:
          "An encrypted PDF's contents are deliberately unreadable without the password, and this page has no way to ask you for one or handle it safely. Remove the password with a PDF tool first, save an unprotected copy, then convert that. If you need to keep the protection, do not convert it at all.",
      },
      {
        question: "What happens to the page background?",
        answer:
          "JPG has no transparency channel, so any transparent area would come out black. Every page is therefore laid down on a white background before export, which is why a PDF page with a transparent-looking background still produces a normal white JPG rather than a black rectangle.",
      },
      {
        question: "Are my PDFs uploaded anywhere?",
        answer:
          "No. The parsing library runs in this tab, the pages are drawn to a canvas inside this tab, and the files you get back are created in your browser's memory. There is no upload endpoint on this page — the privacy note above is describing the code, not a policy.",
      },
      {
        question: "Can I convert PDF to JPG and compress the pages to a size limit in one step?",
        answer:
          "Not in one pass — this page renders pages, it does not size them. Convert first, then run the JPGs through the image compressor, which has a target-size mode for ceilings like 100KB or 200KB per page. Compressing before rendering would mean re-rendering the PDF for every quality step, which is the slow way round.",
      },
      {
        question: "Is PDF to JPEG the same conversion as PDF to JPG?",
        answer:
          "Yes — JPG is the file extension and JPEG is the format's full name, so they are one format with two spellings and identical output. \"PDF to JPEG converter free\" and \"PDF to JPG\" are the same request; this page produces standard JPEG images either way.",
      },
    ],
    relatedTools: [
      { id: "pdf-tools", label: "All PDF tools" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-convert", label: "Image Converter" },
    ],
    relatedPairs: ["jpg-to-pdf", "png-to-jpg", "jpg-to-png", "png-to-webp"],
    technicalNote:
      "pdf.js parses the document locally, then each page is rendered to a canvas at 2x scale and exported with canvas.toBlob('image/jpeg', 0.92). A white background is laid down first because JPG cannot store transparency. Encrypted PDFs are rejected with an explicit message rather than producing empty files.",
  },
  {
    // 🔴 2026-10-19 补：能力早就有，页面却一直缺席。
    // PdfConvertTool.tsx:189 有 `isPng ? doc.embedPng(bytes) : doc.embedJpg(bytes)`，
    // :244 的 accept 早已是 "image/jpeg,image/png,.jpg,.jpeg,.png"，
    // 且 isPdfOutput 只判 `pair.to === "pdf"`（:101）⇒ 这条pair 只差数据，
    // 不需要动组件。且 png-to-pdf 出现在真实 GSC 的 gscUncovered 里（不是 Suggest 猜测）。
    slug: "png-to-pdf",
    from: "png",
    to: "pdf",
    phrase: "PNG to PDF",
    title: "PNG to PDF Converter — Combine PNG Images into a PDF Online Free",
    description:
      "Turn PNG images into one PDF in your browser, one image per page. Free, private, nothing uploaded. No account, no watermark.",
    intro: [
      "A PNG will not open in most PDF readers, so anything that has to arrive as a PDF — a form attachment, an invoice bundle, a folder of receipts — usually ends up needing a detour through another format first. That detour is where quality quietly drops: converting PNG to JPG and then to PDF throws away the transparency and sharp edges that made you pick PNG in the first place.",
      "This converter skips that step. Each PNG is embedded into the PDF as-is with pdf-lib and placed on a page sized to its own pixel dimensions, so the aspect ratio is preserved exactly and nothing is cropped or stretched. Select several images at once and they become pages 1, 2, 3 in the order your file picker returns them. Everything happens in this tab: there is no upload, no account and no watermark.",
      "The result is a container of images rather than an editable document — there is no text layer, because each page is the picture you supplied. If you need selectable text, that is OCR followed by a different kind of PDF tool, and this page will not do it for you.",
    ],
    whenToUse: {
      do: [
        "A portal or email thread will only accept PDF and your material exists as PNG screenshots.",
        "You are bundling receipts, tickets or handwritten notes into one file to hand over as a whole.",
        "You need to keep transparency and crisp edges that converting to JPG first would destroy.",
        "You want a predictable page order with one image per page and no account in the way.",
      ],
      avoid: [
        "You need selectable or editable text — this produces image pages with no text layer.",
        "You want to shrink each page below a byte ceiling — embed the PNG first, then compress.",
        "You need to merge, split or reorder pages of an existing PDF — that is a PDF editor's job.",
      ],
    },
    faqs: [
      {
        question: "Will converting PNG to PDF lose transparency or quality?",
        answer:
          "No. The PNG is embedded with embedPng rather than re-encoded through JPG, so the page matches your source pixel for pixel and any transparency is preserved. This is the main reason to use this page instead of converting to JPG first — the JPG step is lossy and drops the alpha channel entirely.",
      },
      {
        question: "Can I combine several PNGs into one PDF?",
        answer:
          "Yes — select multiple files at once and each becomes its own page, in the order your file picker returns them. On most systems that is click order, otherwise alphabetical by filename. If the order comes out wrong, reselect them in the right order; rearranging pages afterwards is a PDF editor's job, not this tool's.",
      },
      {
        question: "How large a PDF can this produce?",
        answer:
          "Whatever your device's memory allows, because nothing is uploaded there is no server-side size cap. PNG is lossless, so expect the PDF to land close to the sum of your originals — comfortably larger than the same images converted to JPG. If an upload limit is the problem, convert to JPG or compress the PNGs first.",
      },
      {
        question: "Are my images uploaded anywhere?",
        answer:
          "No. The document is assembled by a library running inside this tab and handed straight back to you. There is no upload endpoint on this page and no copy is retained, which is also why it works with a batch of large images without a queue.",
      },
      {
        question: "Can I make the PDF smaller while I convert?",
        answer:
          "Not in one pass — this page embeds each PNG untouched, which is exactly why the output matches your source and why it stays lossless. To hit a byte ceiling, convert to JPG first or run the PNGs through the image compressor's target-size mode, then build the PDF from the smaller files. Compressing after the PDF exists would mean editing the PDF, which is a different tool.",
      },
      {
        question: "How do I compress PNG to 200KB or make the file 100KB?",
        answer:
          "This page embeds each PNG untouched, which is exactly why the PDF matches your source pixel for pixel and stays lossless — and also why the result can sit well over an upload limit. To hit a byte ceiling, run the PNGs through the image compressor's target-size mode (20KB / 100KB / 200KB / 1MB) first, then build the PDF from the smaller files. Compressing once the PDF exists would mean editing the PDF, which is a different tool.",
      },
      {
        question: "Does this accept JPG files as well?",
        answer:
          "Yes. The picker takes JPEG and PNG alike, and each file is routed to the right embedder automatically, so you can mix screenshots and photos in one document without converting anything first. PNG pages keep transparency; JPG pages are embedded as they are.",
      },
    ],
    relatedTools: [
      { id: "pdf-tools", label: "All PDF tools" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["jpg-to-pdf", "png-to-jpg", "png-to-webp", "pdf-to-jpg"],
    technicalNote:
      "pdf-lib assembles the document in memory: each PNG goes through embedPng and is drawn onto a page whose size comes from the image's own pixel dimensions, so the aspect ratio is preserved exactly. PNG is embedded rather than re-encoded, so there is no quality loss and the alpha channel survives. JPEG inputs take the embedJpg branch of the same function.",
  },
  {
    slug: "jpg-to-pdf",
    from: "jpeg",
    to: "pdf",
    phrase: "JPG to PDF",
    title: "JPG to PDF Converter — Combine JPG Images into a PDF Online Free",
    description:
      "Turn JPG images into a single PDF in your browser, one image per page. Free, private, nothing uploaded. No account, no watermark.",
    intro: [
      "Almost every device that can take a photo can make a PDF already — but the result is often a single enormous page, scanned at photo resolution, when what you actually wanted was one clean page per image. Putting JPGs into a PDF yourself gives you control over that: the order you select is the page order, and each page keeps the image's own proportions.",
      "This converter builds the PDF locally with pdf-lib. Each JPG is embedded into the document and placed on a page sized to match it, so nothing is cropped or stretched. You can select several images at once and they become pages 1, 2, 3 in the order shown. There is no account, no watermark and no upload — the document is assembled in your browser's memory and handed straight back to you.",
      "One thing worth knowing: a PDF here is a container of images, not an editable document. The text cannot be edited afterwards because there is no text layer — each page is the picture you supplied. If you need an editable PDF with real text, that is a different job and a different tool.",
    ],
    whenToUse: {
      do: [
        "You need a single file to email or upload, instead of a folder of loose JPGs.",
        "A form asks for a PDF but your material exists as photos or screenshots.",
        "You want a predictable page order and one image per page.",
        "You are assembling scanned pages, receipts or handwritten notes into a single document.",
      ],
      avoid: [
        "You need selectable or editable text — this produces image pages with no text layer.",
        "You need OCR — a JPG that already is a picture cannot gain a text layer here.",
        "You want to merge or reorder pages of an existing PDF — that needs a PDF editor, not a converter.",
      ],
    },
    faqs: [
      {
        question: "Will the image quality drop when it goes into the PDF?",
        answer:
          "No. The original JPG is embedded as-is rather than re-encoded, so the page is pixel-identical to the file you selected. The PDF only adds a container around it. Compression happens when you choose it, which is why you should compress the JPG before converting if size matters.",
      },
      {
        question: "Can I choose the page order?",
        answer:
          "The pages follow the order the files come back from your file picker, which for most systems is the order you clicked them or their filename order. If the result is wrong, select them again in the right order — reordering after the fact is a job for a PDF editor.",
      },
      {
        question: "Can I add text, margins or page numbers afterwards?",
        answer:
          "Not in this tool — it produces one image per page and nothing else. Use a PDF editor to add annotations, margins or headers once the document exists. Keeping this step to a single job is why it works without an account and without a file size limit.",
      },
      {
        question: "How large a PDF can this produce?",
        answer:
          "Whatever your device's memory allows, since nothing is uploaded there is no server-side limit. In practice a few dozen JPGs is comfortable on a normal laptop. If you are handling hundreds, compress them first — file size is what limits you, not the tool.",
      },
      {
        question: "Are my images uploaded to a server?",
        answer:
          "No. The PDF is assembled by a library running in this tab and handed back to you without leaving your device. There is no upload endpoint on this page.",
      },
      {
        question: "Can I make the PDF smaller while I convert?",
        answer:
          "This tool embeds each JPG untouched, which is exactly why the output matches your source pixel for pixel — and also why a PDF built from phone photos can be far over an upload limit. Compress the JPGs first with the image compressor, then convert the compressed files here. Compressing after the PDF exists would mean editing the PDF, which is a different tool.",
      },
      {
        question: "How do I compress the images so the PDF comes in under 100KB or 200KB?",
        answer:
          "Compress the JPGs first, not the PDF. This page embeds each image untouched, so it cannot walk quality down to hit a byte number — that is the same reason the output matches your source. Run the files through the image compressor's target-size mode (20KB / 100KB / 200KB / 400KB / 1MB / 2MB), then build the PDF here from the compressed copies. A form asking for 'PDF under 200KB' is almost always really asking for each image under 200KB, since a PDF is just a container and its size is the sum of its pages.",
      },
      {
        question: "Does JPG to PDF accept JPEG files too, and PNG?",
        answer:
          "JPEG is the same format as JPG — one format, the three-letter extension and the full name — so both are accepted and identical. PNG inputs are accepted as well and keep their transparency and sharp edges, which is usually the better choice for screenshots, receipts and line art.",
      },
    ],
    relatedTools: [
      { id: "pdf-tools", label: "All PDF tools" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["pdf-to-jpg", "jpg-to-png", "png-to-jpg", "png-to-webp"],
    technicalNote:
      "pdf-lib assembles the document in memory: each JPG is embedded with embedJpg and drawn onto a page whose size is taken from the image's own pixel dimensions, so the aspect ratio is preserved exactly. The source image is embedded rather than re-encoded, so there is no quality loss. PNG inputs use embedPng to keep transparency and sharp edges.",
  },
  {
    slug: "gif-to-webp",
    from: "gif",
    to: "webp",
    phrase: "GIF to WebP",
    title: "GIF to WebP Converter — Shrink GIF to WebP Online Free",
    description:
      "Convert GIF to WebP in your browser and cut the file size substantially. Free, private, nothing uploaded. First frame only — animation is not preserved.",
    intro: [
      "GIF is a 1987 format that never got retired, which is why it is still everywhere: browsers render it without asking, every messaging app accepts it, and it is the only common format that stores animation. It is also very heavy. A GIF holds a fixed 256-colour palette, so a single frame of photographic content can be larger than an equivalent JPG, and every frame is stored in full even when most of it did not change.",
      "Converting a GIF to WebP attacks that weight directly. WebP was designed as a replacement for both JPG and PNG, and modern encoders reach roughly a quarter to a third of the GIF's size for the same visual result — while keeping the transparency that GIF uses for its transparent background. The result is a file that loads far faster on the same visual content.",
      "One thing to be clear about before you start: this converter produces a still image. Browsers decode animated GIFs and hand you the frames, but a canvas only ever receives one of them, so the output here is the first frame. If you need the animation to survive, you need an animated WebP encoder, which is a different piece of software — see the FAQ below.",
    ],
    whenToUse: {
      do: [
        "A GIF's animation is incidental — it is a static image someone exported badly, and you want the small still.",
        "You are replacing a decorative GIF placeholder or loading spinner image with a lighter asset.",
        "You want to shrink a GIF for use as a favicon, thumbnail, or social preview image.",
        "You need a WebP asset but only have a GIF, and transparency must be preserved.",
      ],
      avoid: [
        "The animation is the point — the output here is a single frame and the motion will be gone.",
        "You need a format every email client and older desktop application can render.",
      ],
    },
    faqs: [
      {
        question: "Will my GIF animation be preserved?",
        answer:
          "No. This converter outputs the first frame as a still image. Browsers can decode animated GIFs, but the canvas you draw onto receives a single frame, and there is no way to recover the sequence from the page. Converting a GIF whose animation matters requires an animated WebP encoder, which this tool does not do — converting to a still is the honest result rather than a silently flattened animation.",
      },
      {
        question: "How much smaller is the WebP compared to the GIF?",
        answer:
          "For the typical GIF — flat colours, limited palette, moderate dimensions — the WebP usually lands between 25% and 40% of the original size, so a 60–75% reduction. The saving is largest exactly where GIFs are weakest: large flat areas and photographic gradients, both of which GIF handles poorly.",
      },
      {
        question: "Does GIF to WebP keep transparency?",
        answer:
          "Yes, if the GIF has a transparent background. WebP supports an alpha channel, so the transparent area stays transparent instead of being flattened to a solid colour. GIFs that use a single-colour matte rather than real transparency will come through as that colour.",
      },
      {
        question: "Is WebP safe to use on my website?",
        answer:
          "For any site visited with a browser from roughly 2020 onward, yes — Chrome, Firefox, Edge and Safari all support it. It is not safe for email attachments, or for software that expects a traditional image format. Keep the GIF as a fallback if the destination is uncertain.",
      },
      {
        question: "Why is my GIF so much larger than it looks?",
        answer:
          "Because GIF is a poor fit for what it is usually asked to hold. It stores every frame in full rather than only what changed, and its palette is capped at 256 colours, so photographic content and smooth gradients band and blow up in size. That is why a GIF of a simple animation can outweigh a photograph of the same subject.",
      },
    ],
    relatedTools: [
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-convert", label: "Image Converter" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["png-to-webp", "webp-to-png", "png-to-jpg", "jpg-to-png"],
    technicalNote:
      "The GIF is decoded by the browser, drawn to a canvas at its natural size, and exported with canvas.toBlob('image/webp', 0.92). Only the first frame reaches the canvas, so the output is a still image — the file size reduction is real, the animation is not preserved.",
  },
  {
    slug: "png-to-webp",
    from: "png",
    to: "webp",
    phrase: "PNG to WebP",
    title: "PNG to WebP Converter — Shrink PNG to WebP Online Free",
    description:
      "Convert PNG to WebP in your browser and cut file size by about 30% while keeping transparency. Free, private, and nothing is uploaded.",
    intro: [
      "WebP is Google's replacement for both JPG and PNG: it beats JPG on photographic content by roughly 30% at the same perceived quality, and unlike JPG it supports transparency, which means it can take over from PNG without losing the background.",
      "That combination makes PNG to WebP the single most useful conversion for web work. A screenshot saved as PNG often drops to a third of its size as WebP, still with the sharp text edges and transparency intact. The catch is that older browsers and some email clients do not render WebP, so it is a web-first format rather than a universal one.",
    ],
    whenToUse: {
      do: [
        "You are preparing images for a website and want smaller files without visible quality loss.",
        "You need transparency and a smaller file than PNG — WebP is the only way to get both.",
        "You want to modernise a set of PNG assets before a performance audit.",
      ],
      avoid: [
        "The image will be emailed or opened in software older than roughly 2020 — WebP may not render.",
        "You need a universally safe format for print shops or office documents — use JPG.",
      ],
    },
    faqs: [
      {
        question: "How much smaller is WebP compared to PNG?",
        answer:
          "For typical screenshots and UI graphics, WebP lands around 70% of the PNG size — so roughly 30% saved. For photographic PNGs the saving is smaller because the source is already large. Flat colour graphics with large solid areas sometimes convert to a similar size.",
      },
      {
        question: "Does PNG to WebP keep transparency?",
        answer:
          "Yes. WebP supports an alpha channel, so transparent backgrounds survive the conversion. This is the main practical reason to choose WebP over JPG when your source is a PNG.",
      },
      {
        question: "Is WebP supported everywhere yet?",
        answer:
          "In all current versions of Chrome, Firefox, Edge and Safari, yes. It is not safe for email attachments or for software older than about 2020. Keep a PNG copy if the destination is uncertain.",
      },
      {
        question: "Does converting to WebP reduce quality?",
        answer:
          "It is a lossy format, so some detail is traded for size — at the quality setting used here the difference is hard to see on most images. If you need lossless, PNG stays the only option; WebP also has a lossless mode that this tool does not use.",
      },
    ],
    relatedTools: [
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-convert", label: "Image Converter" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["webp-to-png", "png-to-jpg", "jpg-to-png"],
    technicalNote:
      "The PNG is drawn to a canvas and exported with canvas.toBlob('image/webp', 0.92). Because the alpha channel is preserved, a PNG with transparency converts without a black background — which is the failure mode to expect from a JPG conversion instead.",
  },
  {
    slug: "webp-to-jpg",
    from: "webp",
    to: "jpg",
    phrase: "WebP to JPG",
    title: "WebP to JPG Converter — Convert WebP to JPEG Online Free",
    description:
      "Convert WebP to JPG (JPEG) in your browser — no upload, no signup. Makes WebP images compatible with apps and platforms that still reject WebP files.",
    intro: [
      "WebP is now the default image format on the web, which creates a predictable problem: send a WebP to an older CMS, an email client, a design tool, or a phone that predates 2020 and it simply will not display. The file is not broken; the reader just does not understand it.",
      "Converting WebP to JPG solves that compatibility gap. The result is a universally readable JPG that any application from the last two decades will open. The trade-off is that JPG is lossy and has no transparency, so a WebP with a transparent background will lose it — for those cases WebP to PNG is the better route.",
    ],
    whenToUse: {
      do: [
        "An upload form or CMS rejects the WebP file outright.",
        "You need a format that opens in every desktop and mobile application.",
        "A graphic design or print workflow does not accept WebP input.",
      ],
      avoid: [
        "Your WebP has transparency and you need to keep it — use WebP to PNG instead.",
        "You want to reduce file size — JPG of a WebP is normally larger, not smaller.",
      ],
    },
    faqs: [
      {
        question: "Why can't I open my WebP in some apps?",
        answer:
          "WebP support only became standard in browsers around 2020. Software released before that, including some print drivers, older Office versions and a number of CMS upload handlers, has no decoder for it. Converting to JPG produces a file those applications will open.",
      },
      {
        question: "What happens to transparency when converting WebP to JPG?",
        answer:
          "JPG has no alpha channel, so transparency is discarded and typically renders as black. If your WebP uses transparency, convert to PNG instead — it keeps the alpha channel and is just as widely supported.",
      },
      {
        question: "Will the JPG be larger than the WebP?",
        answer:
          "Often slightly, for the same content at similar perceived quality — WebP's compression is more efficient. The point of this conversion is compatibility rather than size, so use image compression afterwards if the file needs to be smaller.",
      },
      {
        question: "Do you upload my file anywhere?",
        answer:
          "No. Your WebP is decoded and re-encoded entirely inside this browser tab. There is no server, no upload progress bar, and no retention policy, because the file never leaves your device.",
      },
      {
        question: "Is WebP to JPEG the same conversion as WebP to JPG?",
        answer:
          "Yes. JPG is the file extension and JPEG is the format's full name — one format with two spellings, identical output. Searches for \"WebP to JPEG\" and \"WebP to JPG\" are asking for the same thing, and this page produces it either way.",
      },
      {
        question: "Can I convert WebP to JPEG and resize it in the same step?",
        answer:
          "Not in a single pass — this page changes the format only. For the combined job, convert here first, set the pixel dimensions with the image resizer, then use the image compressor if the form also states a byte ceiling such as 100KB. Doing the steps in that order means each one works on the file the next one receives.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-info", label: "Image Info" },
    ],
    relatedPairs: ["webp-to-png", "png-to-jpg", "jpg-to-png"],
    technicalNote:
      "The WebP is decoded by the browser's own image decoder, drawn to a canvas, then exported as image/jpeg at quality 0.92. Browsers that cannot decode WebP will fail before this code runs, which is why the format needs converting in the first place.",
  },
  {
    slug: "webp-to-png",
    from: "webp",
    to: "png",
    phrase: "WebP to PNG",
    title: "WebP to PNG Converter — Convert WebP to PNG Online Free",
    description:
      "Convert WebP to PNG in your browser with transparency intact. Free, private and entirely local — your images are never uploaded.",
    intro: [
      "WebP and PNG both support transparency, so WebP to PNG is the conversion to reach for when you need a lossless, universally supported file without losing your background. It is the format-safe choice whenever a WebP has to travel somewhere that is not a modern browser.",
      "The cost is file size. PNG is lossless and WebP is not, so converting a photographic WebP to PNG will usually make it substantially larger. That is the trade you are making: compatibility and losslessness in exchange for bytes. If size is the constraint rather than compatibility, keep the WebP.",
    ],
    whenToUse: {
      do: [
        "A design tool, email client or CMS requires PNG input.",
        "You need a lossless copy of a WebP before further editing.",
        "You want transparency preserved and need a format every tool accepts.",
      ],
      avoid: [
        "You are optimising for file size — PNG will be larger than the WebP you started with.",
        "The image is a photograph with many tones; JPEG is usually a better size-to-quality trade.",
      ],
    },
    faqs: [
      {
        question: "Does WebP to PNG keep transparency?",
        answer:
          "Yes. Both formats support an alpha channel, so transparency survives the conversion unchanged. This is the main reason to choose PNG over JPG as the output for a transparent WebP.",
      },
      {
        question: "Why is my PNG much bigger than the WebP?",
        answer:
          "PNG is lossless: it stores every pixel exactly, while WebP discards information it judges imperceptible. That efficiency is why WebP is smaller. The conversion trades file size for the guarantee that no further quality is lost.",
      },
      {
        question: "Is the conversion lossless?",
        answer:
          "Yes — lossless with respect to the WebP. Decoding a WebP already discards data by design, and the PNG then stores exactly what was decoded, with no additional quality loss from this tool.",
      },
      {
        question: "Can I convert several WebP files at once?",
        answer:
          "Yes. Add multiple files and each is converted and offered as a separate download. Everything runs in your browser, so the practical limit is your device's memory rather than an upload cap.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-create-transparent", label: "Make Image Transparent" },
      { id: "image-info", label: "Image Info" },
    ],
    relatedPairs: ["webp-to-jpg", "png-to-jpg", "png-to-webp"],
    technicalNote:
      "The WebP is decoded via the browser's image decoder, drawn to a canvas, and exported with canvas.toBlob('image/jpeg') at quality 0.92. Because JPEG is lossy and has no alpha channel, the result is re-encoded from scratch and any transparency in the source is discarded.",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "svg-to-png",
    from: "svg",
    to: "png",
    phrase: "SVG to PNG",
    title: "SVG to PNG Converter — Transparent, High Quality, Online Free",
    description:
      "Rasterise SVG to PNG at 1x, 2x or 4x in your browser — transparent background, high quality output. Free, no upload, no signup.",
    intro: [
      "SVG is resolution-independent, which is exactly why it causes problems: plenty of forms simply do not accept vector uploads. A CMS media field, an avatar uploader, a wiki attachment box or a print vendor's intake form will usually state PNG or JPG, and an SVG gets rejected with no conversion offered. Converting to PNG is the bridge between the file you have and the file they accept.",
      "This rasteriser runs entirely in the browser. The SVG is parsed by the browser's own renderer, drawn to a canvas at a scale factor you choose, and written out as PNG. Scale factor is the part most converters get wrong: an icon drawn at 1x looks fine on screen and blurry in print, so pick 2x or 4x when the result is going to be printed or displayed large.",
    ],
    whenToUse: {
      do: [
        "A CMS, wiki or social platform rejects SVG uploads and only takes raster images.",
        "You need a fixed-size preview or thumbnail from a logo or icon.",
        "You want to email or message the artwork to someone whose client cannot render SVG.",
      ],
      avoid: [
        "You still need to scale the artwork later — PNG is fixed-resolution, so converting now caps the size you can ever use.",
        "The SVG uses advanced SVG features (filters, CSS animations, `<foreignObject>`) that the browser rasteriser may render differently than a design tool would.",
      ],
    },
    faqs: [
      {
        question: "How do I make my PNG export high resolution?",
        answer:
          "Choose a scale factor of 2x or 4x. At 1x the PNG has the same pixel dimensions as the SVG's declared size, which is fine for web use but visibly soft when printed. At 4x the same artwork exports at four times the width and height in pixels, so it stays sharp when scaled down.",
      },
      {
        question: "Will my SVG look exactly the same after conversion?",
        answer:
          "Almost always. The conversion uses your browser's own SVG renderer, so what you see on screen is what gets drawn. Two caveats: very complex filters or animations are rasterised as a single static frame, and text stays as text, so the PNG depends on the fonts available to your browser rather than the ones the designer used.",
      },
      {
        question: "Does converting SVG to PNG make the background white?",
        answer:
          "It preserves whatever the SVG itself defines. If the SVG has no background rectangle, the PNG comes out with a transparent background — which is usually what you want. Add a background rectangle in the SVG first if you need an opaque result.",
      },
      {
        question: "Is my SVG uploaded anywhere?",
        answer:
          "No. The file is read locally and rasterised in the same browser tab. Nothing is transmitted, which also means there is no file size ceiling beyond your device's memory.",
      },
      {
        question: "How do I get an SVG to PNG with a transparent background?",
        answer:
          "It happens automatically — this converter does not paint a background, so any area the SVG leaves empty stays transparent in the PNG. You get a transparent SVG to PNG simply by not adding a background rectangle. If you need the opposite, an opaque result, add a full-canvas rect with a fill colour inside the SVG before converting.",
      },
      {
        question: "How do I get a high quality PNG from an SVG?",
        answer:
          "Export at a scale factor of 2x or 4x instead of 1x. Quality here is a function of how many pixels the artwork is drawn into: at 1x the PNG matches the SVG's declared size and looks correct on screen but soft when printed or enlarged. At 4x the same vector is rasterised into four times the width and height, so it stays sharp when scaled down later.",
      },
      {
        question: "Can I convert SVG to PNG and resize it in the same step?",
        answer:
          "The scale factor is the resize control here — 1x, 2x and 4x set the output pixel dimensions relative to the SVG's declared size. That covers most \"SVG to PNG and resize\" cases. If you need an exact pixel figure such as 512×512 that the scale factor cannot produce, convert first and then set the exact dimensions with the image resizer.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-resize", label: "Image Resizer" },
      { id: "png-to-svg", label: "PNG to SVG" },
    ],
    relatedPairs: ["png-to-jpg", "webp-to-png", "png-to-webp"],
    technicalNote:
      "SVGs without explicit width and height attributes have no intrinsic pixel size; the renderer falls back to the document's default viewport, so those files are exported at that size. If output dimensions look wrong, open the SVG in a text editor and add width and height attributes matching your intended pixel size.",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "avif-to-jpg",
    from: "avif",
    to: "jpg",
    phrase: "AVIF to JPG",
    title: "AVIF to JPG Converter — Convert AVIF to JPEG Online Free",
    description:
      "Convert AVIF images to JPG (JPEG) in your browser. Free and private — the file is never uploaded. Supports batch conversion.",
    intro: [
      "AVIF is the newest mainstream image format and it is very good at what it does: an AVIF is typically 30-50% smaller than the equivalent JPEG at the same perceived quality. The problem is compatibility. AVIF decoding only landed in Chrome 85, Firefox 93 and Safari 16.4, so an AVIF sent to a colleague on an older machine, an email client, or a print shop's software can simply fail to open.",
      "This converter takes AVIF files and writes them out as JPG, which essentially every application since 1992 understands. Decoding happens in your browser using its native AVIF support, so there is no upload, no account and no waiting on a queue. Batch conversion is supported if you have a whole folder to move across.",
    ],
    whenToUse: {
      do: [
        "You need a JPG for email, a print shop, an office document or an older application.",
        "A platform you upload to does not accept AVIF yet.",
        "You want one universal copy of an AVIF image to send to people with mixed devices.",
      ],
      avoid: [
        "You want to keep the smallest possible file — AVIF is already smaller than the JPG you would get back.",
        "You need transparency — JPG has no alpha channel, so transparent regions will be filled in.",
      ],
    },
    faqs: [
      {
        question: "This says AVIF is not supported. Why?",
        answer:
          "AVIF decoding is a browser feature, and this page relies on the browser doing the decoding rather than shipping a decoder. If decoding fails, your browser is older than Chrome 85, Firefox 93 or Safari 16.4, or the file is not actually AVIF despite its extension. Updating the browser, or re-saving the file from the app that produced it, resolves it.",
      },
      {
        question: "Why is my JPG larger than the AVIF I started with?",
        answer:
          "That is expected. AVIF spends far fewer bits on the same image by discarding detail the eye is unlikely to miss. JPG has to store much more of that detail to reach the same visual quality, so the file grows. The JPG is a compatibility copy, not an improvement — keep the AVIF as your master if the recipients can handle it.",
      },
      {
        question: "What happens to transparency?",
        answer:
          "JPG has no alpha channel, so transparent areas are filled with white. If the transparency matters, convert to PNG instead — that preserves the alpha channel exactly, at the cost of a larger file.",
      },
      {
        question: "Can I convert a batch of AVIF files?",
        answer:
          "Yes. Add multiple files and each is converted and offered as a separate download. Because everything runs locally, the practical limit is your device's memory rather than an upload size cap.",
      },
      {
        question: "Is AVIF to JPEG the same conversion as AVIF to JPG?",
        answer:
          "Yes — JPG is the three-letter extension and JPEG is the full name of the format, so they are one format with two spellings. \"AVIF to JPEG\" and \"AVIF to JPG\" both mean the same output, and this page produces it either way.",
      },
      {
        question: "I need AVIF to JPEG and a smaller file — which do I use?",
        answer:
          "Both, in that order. AVIF is already a heavily compressed format, so the JPG that comes out is usually larger than the source; convert here for compatibility, then run the result through the image compressor to bring it back down. If the destination also caps pixel dimensions, set those with the image resizer between the two steps.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-info", label: "Image Info" },
    ],
    relatedPairs: ["png-to-jpg", "webp-to-jpg", "jpg-to-png"],
    technicalNote:
      "AVIF is decoded via createImageBitmap, falling back to an Image element. Decoding support depends entirely on the browser: Chrome 85+, Firefox 93+, Safari 16.4+. The frame is drawn to a canvas and exported with canvas.toBlob('image/jpeg', 0.92), with a white fill applied first because JPG cannot store transparency.",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "heic-to-jpg",
    from: "heic",
    to: "jpg",
    phrase: "HEIC to JPG",
    title: "HEIC to JPG Converter — Convert HEIC to JPEG Online Free",
    description:
      "Convert HEIC to JPG (JPEG) in your browser, privately. Free, no signup, no upload — iPhone photos are decoded on your own device and never leave it.",
    intro: [
      "HEIC is what your iPhone has been saving photos as since iOS 11, and it is a genuinely good format — roughly half the file size of JPG at the same perceived quality. The friction arrives the moment you leave the Apple ecosystem: Windows Explorer does not open it, most Windows software ignores it, Adobe Acrobat's file picker filters it out, and every government or bank upload portal that asks for a JPG will simply reject it.",
      "That gap is why 'heic to jpg' is one of the most searched file conversions there is, and why so many of the tools that answer it are upload sites: you hand a photo of your ID, your passport or your child to a stranger's server because the alternative seemed to be installing software. This converter takes the other route. A HEIC decoder is bundled into this page and runs locally, so the conversion happens on your own machine — the photo never travels.",
    ],
    whenToUse: {
      do: [
        "A website, government form or banking portal accepts only JPG or PNG and rejects the HEIC from your phone.",
        "You need to email a photo taken on an iPhone to someone on Windows or Android.",
        "You are preparing ID, passport or visa photos, which almost universally must be JPG.",
        "A design or print tool cannot open the HEIC and shows the file as unreadable.",
      ],
      avoid: [
        "You want to keep the smallest possible file — HEIC is already smaller than the JPG you will get back, so keep the HEIC as your master and convert a copy.",
        "You need to batch hundreds of photos on a phone with limited storage — decoded images are held in memory while converting.",
      ],
    },
    faqs: [
      {
        question: "Are my HEIC photos uploaded anywhere?",
        answer:
          "No. The decoder that reads HEIC is bundled into this page and runs in your browser tab. The file is read from your disk, decoded locally, drawn to a canvas and written out as a JPG on the same machine. There is no upload endpoint, no queue and no copy held on any server — which matters when the photo is a passport or an ID document.",
      },
      {
        question: "Why will my JPG be bigger than the HEIC?",
        answer:
          "That is expected and unavoidable. HEIC spends far fewer bits on the same picture by discarding detail the eye is unlikely to miss; JPG has to store much more of that detail to reach the same apparent quality, so the file grows — often by a factor of two. The JPG is a compatibility copy, not an upgrade, so keep the original HEIC if you possibly can.",
      },
      {
        question: "Will converting HEIC to JPG lose the quality difference between shots?",
        answer:
          "No visible change. HEIC's advantage over JPG is compression efficiency, not a different colour rendition — converting at high quality gives a JPG that looks the same as what the HEIC renders on your phone. What you lose is the option to keep re-compressing more efficiently later, because JPG starts from a fatter file.",
      },
      {
        question: "What happens to transparency if my HEIC has any?",
        answer:
          "It is filled with white, because JPG has no alpha channel. iPhone photos rarely rely on transparency, so this rarely matters in practice. If you need the alpha channel preserved, convert to PNG instead, which keeps it exactly.",
      },
      {
        question: "It says my HEIC could not be decoded. What now?",
        answer:
          "Usually one of three things: the file arrived via a messaging app that recompressed it into something else; the extension says .heic but the content is actually a JPG or PNG — just rename it to .jpg and it will convert normally; or it is an HEIF variant this decoder build does not recognise. Opening the original again and re-exporting as JPEG from your phone's share sheet also works.",
      },
      {
        question: "Can I convert several HEIC files at once?",
        answer:
          "Yes. Add multiple files and each is converted and offered as a separate download. Because the decoding happens locally, there is no upload size limit — the practical constraint is your device's memory.",
      },
      {
        question: "Is HEIC to JPEG the same as HEIC to JPG?",
        answer:
          "Yes. JPG is the file extension, JPEG is the format's full name — one format, two spellings, identical output. Searches for \"HEIC to JPEG\" and \"HEIC to JPG\" are asking for the same thing and this page handles both.",
      },
      {
        question: "Can I convert HEIC to JPEG and resize it at the same time?",
        answer:
          "As two steps rather than one. This page turns the HEIC into a JPEG so it will open anywhere; the image resizer then sets the pixel dimensions a portal asks for. Do the conversion first — resizing a HEIC directly would mean decoding the same file twice for no benefit.",
      },
    ],
    relatedTools: [
      { id: "image-compress", label: "Image Compressor" },
      { id: "image-convert", label: "Image Converter" },
      { id: "image-resize", label: "Image Resizer" },
    ],
    relatedPairs: ["png-to-jpg", "jpg-to-png", "svg-to-png"],
    technicalNote:
      "HEIC cannot be decoded by any browser's native image pipeline, so this page bundles libheif compiled to WebAssembly (about 1.3 MB, embedded inside the JavaScript — there is no CDN request and no network call of any kind). The decoder is loaded lazily: it is only downloaded if you actually pick a HEIC file. The decoded bitmap is drawn to a canvas, pre-filled with white because JPG has no alpha channel, and exported with canvas.toBlob('image/jpeg', 0.92).",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "heic-to-png",
    from: "heic",
    to: "png",
    phrase: "HEIC to PNG",
    title: "HEIC to PNG Converter — Convert HEIC to PNG Online Free",
    description:
      "Convert HEIC to PNG in your browser with full privacy. Free, no upload, no signup — the iPhone photo is decoded on your device and never sent anywhere.",
    intro: [
      "Most people asking for HEIC to PNG are not doing it for size — they are doing it because a specific system insists on PNG. Print shops, some marketplace uploaders, diagram and design tools, and a number of government portals list PNG as an accepted format and treat JPG and HEIC as interchangeable, when in fact only one of them is.",
      "The conversion itself is a decode and a re-encode: the HEIC's compressed image data is expanded back into a pixel grid, then written as PNG, which stores those pixels without further loss. Choose PNG over JPG when transparency matters or when the destination rejects lossy compression; choose JPG when you care about file size.",
    ],
    whenToUse: {
      do: [
        "A print shop, marketplace or upload form lists PNG as one of the accepted formats.",
        "You need a lossless copy of a photo for editing, so quality is not lost again on the way in.",
        "A tool that reads PNG refuses to open the HEIC, and re-saving from your phone is inconvenient.",
      ],
      avoid: [
        "You want a smaller file — PNG is lossless, so the output will be considerably larger than either the HEIC or a JPG conversion.",
        "Nobody asked for PNG specifically. Converting to JPG instead gives a far smaller file at visually identical quality.",
      ],
    },
    faqs: [
      {
        question: "Is my HEIC uploaded to convert it?",
        answer:
          "No. The HEIC decoder is bundled into this page and executes locally. Your file is read, decoded, redrawn and re-encoded entirely on your own device, so nothing is transmitted or retained — the property that matters when the photo is a document.",
      },
      {
        question: "Why is my PNG so much larger than the HEIC?",
        answer:
          "HEIC discards image detail it judges imperceptible; PNG stores every pixel of the decoded image exactly. When you expand a compressed file into a lossless one, the size rises by roughly the compression ratio — commonly three to six times. That is the trade you are making: exact pixels in exchange for file size.",
      },
      {
        question: "Does HEIC to PNG lose any quality?",
        answer:
          "The PNG is a faithful copy of what the HEIC actually stores. No further loss happens during the conversion, because PNG is lossless. The original HEIC had already discarded some detail before this page ever saw it — that loss is upstream of us and cannot be recovered by any converter.",
      },
      {
        question: "Should I use HEIC to PNG or HEIC to JPG?",
        answer:
          "PNG if transparency matters, if you are about to edit the file and want to avoid stacking lossy compression, or if the destination's spec says PNG. JPG in every other case — it will be several times smaller and indistinguishable to the eye at normal viewing sizes.",
      },
      {
        question: "Can I convert multiple HEIC files at once?",
        answer:
          "Yes. Add several files and each is converted and offered as a separate download. Everything is local, so there is no upload cap — only your device's available memory.",
      },
      {
        question: "Can I convert HEIC to PNG and resize or compress it in one go?",
        answer:
          "Not in a single pass — this page changes the format only, and the PNG it produces is deliberately uncompressed in size terms. For the full job: convert here, set the pixel dimensions a form demands with the image resizer, then bring the weight down with the image compressor. Doing it in that order means each step works on the file the next one receives.",
      },
    ],
    relatedTools: [
      { id: "image-convert", label: "Image Converter" },
      { id: "image-create-transparent", label: "Make Image Transparent" },
      { id: "image-compress", label: "Image Compressor" },
    ],
    relatedPairs: ["jpg-to-png", "svg-to-png", "png-to-jpg"],
    technicalNote:
      "Decoding uses libheif compiled to WebAssembly, bundled inside the page's JavaScript (no CDN, no network request), loaded on demand only when a HEIC file is selected. The decoded bitmap is drawn to a canvas and exported with canvas.toBlob('image/png') — no quality argument is passed because PNG ignores it. The alpha channel, if any, is preserved.",
  },
];

export function getPairBySlug(slug: string): ConvertPair | undefined {
  return CONVERT_PAIRS.find((p) => p.slug === slug);
}

export function getPairSlugs(): string[] {
  return CONVERT_PAIRS.map((p) => p.slug);
}