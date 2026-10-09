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
 *
 * 因此 target 仅三种：jpg / png / webp。
 * 任何新增对子都必须先确认「输入能解码」且「输出格式在上述列表内」。
 */

export type OutputFormat = "jpg" | "png" | "webp";
export type InputFormat = "jpeg" | "png" | "webp" | "gif" | "bmp" | "svg" | "avif" | "heic";

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
};

export const OUTPUT_META: Record<OutputFormat, { label: string; mime: string; quality: string; note: string }> = {
  jpg: { label: "JPG", mime: "image/jpeg", quality: "0.92", note: "Lossy, no transparency, smallest file" },
  png: { label: "PNG", mime: "image/png", quality: "-", note: "Lossless, keeps transparency, larger file" },
  webp: { label: "WebP", mime: "image/webp", quality: "0.92", note: "Lossy, smallest with transparency support" },
};

/**
 * 9 个对转对（2026-10-09 新增 svg-to-png / avif-to-jpg / heic-to-jpg / heic-to-png）。
 *
 * 选取依据（真实长尾，Bing Suggest 2026-10-08 采集 1734 条）：
 *   png-to-jpg / heic-to-jpg / png-to-ico 出现在「online image converter」建议链中，
 *   其中 heic 因解码限制排除、ico 因输出不支持排除 ⇒ png-to-jpg 是需求最实的一个。
 *   其余 4 个围绕最高频的图片格式互转补齐，覆盖 4→5 词长尾变体
 *   （png to jpg online / convert png to jpg / jpg to png 等同一意图的多种问法）。
 */
export const CONVERT_PAIRS: ConvertPair[] = [
  // ─────────────────────────────────────────────────────────────
  {
    slug: "png-to-jpg",
    from: "png",
    to: "jpg",
    phrase: "PNG to JPG",
    title: "PNG to JPG Converter — Convert PNG to JPG Online Free",
    description:
      "Convert PNG to JPG in your browser. Free, no signup, no upload — the file never leaves your device. Keeps quality high while cutting file size.",
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
    title: "JPG to PNG Converter — Convert JPG to PNG Online Free",
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
    title: "WebP to JPG Converter — Convert WebP to JPG Online Free",
    description:
      "Convert WebP to JPG in your browser — no upload, no signup. Makes WebP images compatible with apps and platforms that still reject WebP files.",
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
      "The WebP is decoded via the browser's image decoder and re-encoded with canvas.toBlob('image/png'). Because PNG is lossless the output is larger than the source, but the alpha channel is preserved exactly.",
  },
  // ─────────────────────────────────────────────────────────────
  {
    slug: "svg-to-png",
    from: "svg",
    to: "png",
    phrase: "SVG to PNG",
    title: "SVG to PNG Converter — Convert SVG to PNG Online Free",
    description:
      "Rasterise SVG to PNG at 1x, 2x or 4x in your browser. Free, no upload, no signup — the vector file never leaves your device.",
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
    title: "AVIF to JPG Converter — Convert AVIF to JPG Online Free",
    description:
      "Convert AVIF images to JPG in your browser. Free and private — the file is never uploaded. Supports batch conversion.",
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
    title: "HEIC to JPG Converter — Convert HEIC to JPG Online Free",
    description:
      "Convert HEIC to JPG in your browser, privately. Free, no signup, no upload — iPhone photos are decoded on your own device and never leave it.",
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