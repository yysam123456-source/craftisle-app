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
export type InputFormat = "jpeg" | "png" | "webp" | "gif" | "bmp" | "svg" | "avif";

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
  jpeg: { label: "JPG", mime: "image/jpeg", note: "有损压缩，适合照片类内容" },
  png: { label: "PNG", mime: "image/png", note: "无损压缩，支持透明通道" },
  webp: { label: "WebP", mime: "image/webp", note: "Google 主推格式，体积比 JPG 小约 30%" },
  gif: { label: "GIF", mime: "image/gif", note: "动画格式，本工具取第一帧静态输出" },
  bmp: { label: "BMP", mime: "image/bmp", note: "Windows 位图，体积大但兼容性最好" },
  svg: { label: "SVG", mime: "image/svg+xml", note: "矢量图，输出为位图时会按原始尺寸栅格化" },
  avif: { label: "AVIF", mime: "image/avif", note: "较新的压缩格式，需浏览器支持才能解码" },
};

export const OUTPUT_META: Record<OutputFormat, { label: string; mime: string; quality: string; note: string }> = {
  jpg: { label: "JPG", mime: "image/jpeg", quality: "0.92", note: "有损压缩，不支持透明，文件最小" },
  png: { label: "PNG", mime: "image/png", quality: "-", note: "无损压缩，保留透明，文件较大" },
  webp: { label: "WebP", mime: "image/webp", quality: "0.92", note: "有损压缩，体积最省，支持透明" },
};

/**
 * 5 个先行的对转对。
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
];

export function getPairBySlug(slug: string): ConvertPair | undefined {
  return CONVERT_PAIRS.find((p) => p.slug === slug);
}

export function getPairSlugs(): string[] {
  return CONVERT_PAIRS.map((p) => p.slug);
}