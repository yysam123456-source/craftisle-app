/**
 * longtail-gap —— 以 **Google 真实搜索数据**为主的长尾缺口分析
 *
 * ============================ 为什么是这个结构 ============================
 * 2026-10-15 实测踩出的关键事实：
 *
 *   1. **Google Suggest 会按IP 限流，且封禁是长时的**。
 *      本机连打 100 个种子后，`suggestqueries.google.com` 与 `www.google.com`
 *      的全部 client 参数（firefox / chrome / gws-wiz / toolbar / opera）一律
 *      `fetch failed`，5 分钟内不恢复。表现为网络层失败而非 429，
 *      所以旧实现「失败就回退 Bing」= 当天依据静默从 Google 换成 Bing，
 *      而报告看起来一切正常。这是**最危险的一类故障**。
 *
 *   2. **但 GSC（Search Console）走 Vercel 侧**，不受本机 IP 封禁影响，
 *      而且它本来就是 Google 的**真实曝光/点击数据** —— 权威度高于 Suggest
 *      （Suggest 只说"有人这么打"，GSC 说"Google 认为你的页对这个词有曝光"）。
 *
 * 所以主源定为 GSC：
 *   · **GSC = 已经发生在你身上的真实 Google 数据**（哪些词有曝光、位次多少）
 *   · **Google Suggest = 还没发生在你身上的潜在长尾**（Google 认可这些查询）
 *   · Bing 只在前两者都挂时兜底，且必须标注
 *
 * 语料用**页面真实文本全量**（454K 字符）而非标题 —— 只看标题会把
 * "作者已经写了" 误判成 "未命中"，于是清单反复出现已做过的事。
 *
 * 运行：
 *   npx tsx scripts/longtail-gap.ts--limit 60   # 完整分析
 *   npx tsx scripts/longtail-gap.ts --src-only   # 只探测各源可用性
 *
 * 输出：.workbuddy/trends/gap-<YYYY-MM-DD>.json
 * ========================================================================
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join, resolve } from "path";
// 🔴 原子写：裸 writeFileSync 写 150KB+ 分片缓存，被超时打断会留半截 JSON，
// 下次 JSON.parse 在 try 里只记一条 warn ⇒ 静默少一个分片（DEBT-24）
import { writeTextAtomic } from "./lib/data-io.mjs";
import {
  fetchSuggestionsDetailed,
  fetchSuggestionsForSeeds,
  type SuggestSource,
} from "../lib/seo/trends-client";
import { CONVERT_PAIRS } from "../lib/convert/pairs";
import { toolMeta } from "../lib/tools";

const OUT_DIR =
  process.env.TREND_OUT_DIR || resolve(process.cwd(), "..", ".workbuddy", "trends");

const argv = process.argv.slice(2);
const SRC_ONLY = argv.includes("--src-only");
const limitArg = argv.indexOf("--limit");
const SEED_LIMIT = limitArg >= 0 ? Number(argv[limitArg + 1]) || 60 : 60;

const API_BASE = process.env.GROWTH_API_BASE || "https://craftisle.com";

// ─────────────────────────────────────────────────────────────
// 主源：GSC 真实查询数据
// ─────────────────────────────────────────────────────────────

export interface GscQuery {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
  page?: string;
}

/**
 * 拉 GSC 查询数据。走Vercel 侧，因此本机 Google Suggest 被封时它照常可用。
 *
 * 🔴 必须分片拉：端点响应超过 ~10KB 时 WebFetch 会取空，而 limit=250 的
 * 单次响应必然超。所以按 type × sort 两维切片，逐片拼。
 */
async function fetchGscQueries(days = 28): Promise<{
  rows: GscQuery[];
  reachable: boolean;
  note: string;
}> {
  const cacheDir = resolve(process.cwd(), "..", ".workbuddy", "tmp", "gcache-lt");
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

  // 🔴 2026-10-16（DEBT-16）：分片清单必须与 classifyQueryType 的枚举**完全一致**。
  //   上一版凭想象写了 {type:"landing"}{type:"pair"}，而
  //   lib/seo/gsc-client.ts:180 的 classifyQueryType 只返回
  //   tools | directory | blog | other —— 那两个type 恒返回 total:0，
  //   但因旧逻辑「HTTP 200 就ok++」，空分片反而被计入成功分母，
  //   于是 note 里的「8/8 分片全部成功」是**假绿灯**；
  //   同时真正的directory 类（替代页，唯一有真实曝光的方向）**从未被请求**。
  //
  //   教训：**凭空假设 API 枚举值 = 制造假绿灯**。改枚举时必须同步改这里。
  const VALID_TYPES = ["tools", "directory", "blog", "other"] as const;
  const slices: Array<{ type?: string; sort: string }> = [
    { type: "tools", sort: "impressions" },
    { type: "directory", sort: "impressions" },
    { type: "blog", sort: "impressions" },
    { type: "other", sort: "impressions" },
    { type: "tools", sort: "position" },
    { type: "directory", sort: "position" },
    { type: "blog", sort: "position" },
    { type: "other", sort: "position" },
    { sort: "impressions" },
    { sort: "position" },
  ];
  for (const s of slices) {
    if (s.type && !VALID_TYPES.includes(s.type as (typeof VALID_TYPES)[number])) {
      throw new Error(
        `[gsc] 分片 type "${s.type}" 不在 classifyQueryType 的枚举里：` +
          `${VALID_TYPES.join("/")}。枚举改了必须同步这里，否则空分片会被计成成功。`
      );
    }
  }

  const seen = new Map<string, GscQuery>();
  let ok = 0;
  let emptySlices: string[] = [];

  for (const s of slices) {
    const name = `_api_analytics_top-queries_days${days}_limit200_sort${s.sort}${
      s.type ? "_type_" + s.type : "_type_all"
    }.json`;
    const file = join(cacheDir, name.replace(/[^a-z0-9_\-.]/gi, "_"));
    const url =
      `${API_BASE}/api/analytics/top-queries?days=${days}&limit=200&sort=${s.sort}` +
      (s.type ? `&type=${s.type}` : "");

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CraftisleGrowthReview/1.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      const text = await res.text();
      // 🔴 非原子写：150KB+ 的分片缓存被超时打断会留半截 JSON，
      // 下次 JSON.parse 在 try 里只记一条 warn ⇒ 静默少一个分片。走原子写。
      writeTextAtomic(file, text);
      const data = JSON.parse(text);
      const list: unknown[] = Array.isArray(data?.queries) ? data.queries : [];
      for (const q of list as GscQuery[]) {
        if (!q?.query) continue;
        const key = q.query.toLowerCase();
        const prev = seen.get(key);
        // GSC 铁律：按 query 去重，impressions 取最大（数据含国家分群原始行）
        if (!prev || q.impressions > prev.impressions) seen.set(key, q);
      }
      // 🔴 DEBT-16 的核心：ok 的判据是「拿到数据」，不是「HTTP 200」。
      //   200 但 queries 为空 = 这个分片对本轮分析毫无贡献，必须暴露出来。
      if (list.length === 0) {
        emptySlices.push(`${s.type ?? "all"}/${s.sort}`);
        console.warn(
          `[gsc] ⚠️ 分片 ${s.type ?? "all"}/${s.sort} 返回 200 但0 条数据` +
            `（端点 total=${data?.total ?? "?"}）。已计入失败。`
        );
        continue;
      }
      ok++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[gsc] 分片失败 ${s.type ?? "all"}/${s.sort}: ${msg}`);
    }
  }

  const rows = [...seen.values()].sort((a, b) => b.impressions - a.impressions);
  // 🔴 reachable 必须是「至少有分片真的带回了数据」，否则上层会以为数据源健康。
  const parts: string[] = [`${ok}/${slices.length} 分片有效`];
  if (emptySlices.length > 0) parts.push(`${emptySlices.length} 个空分片: ${emptySlices.join(", ")}`);
  return {
    rows,
    reachable: ok > 0,
    note: parts.join("；"),
  };
}

// ─────────────────────────────────────────────────────────────
// 立场过滤
// ─────────────────────────────────────────────────────────────

// 🔴 2026-10-16（DEBT-23）：名单里**不能写去空格形式**。
//   旧版写 "ilovepdf"，而真实查询词是 "i love pdf" ——
//   `t.includes("ilovepdf")` 恒为 false，于是 26 条竞品词污染进了 gaps。
//   结论：**去空格形式只适合做归一化后的比对键，不能直接当子串用**。
const BRANDS = [
  "ilovepdf", "i love pdf", "i love img", "adobe", "ezgif", "cloudconvert",
  "convertio", "smallpdf", "canva", "photoroom", "firefly", "picsart",
  "remove.bg", "toptal", "typing.com", "zoho", "kledo", "wise", "invoiced",
  "scribd", "pdf24", "midjourney", "chatgpt", "freeformatter", "seedance",
  "11zon", "w3schools", "tinypng", "optipng",
  // ↓ DEBT-23 补入：实测 gaps 里漏网的竞品/桌面软件/社区
  "sejda", "freeconvert", "free convert", "online2pdf", "pi7",
  "gimp", "photoshop", "reddit", "stack overflow", "quora",
];

const PLATFORM = [
  "app download", "download app", "for pc", "for laptop", "for android", "for ios",
  "apk", "offline", "install", "software download", "full version", "cracked",
  "macos", "windows app", "desktop app", "chrome extension", "firefox extension",
  "vscode extension", "microsoft store", "play store", "github",
  // ↓ DEBT-23 补入：环境意图（纯网页工具给不了 mac 命令/ linux 命令）
  "on mac", "on linux", "on windows", "command line", "cli", "terminal",
];

// 🔴 DEBT-23 补入：用户既定立场里还有 accent color 与 HD，此前漏了。
//   实证：tuneTargets 里出现过 "png to jpg online hd"，说明 HD 已经漏过筛选。
const FALSE_PROMISE = [
  "no watermark", "dark mode", "accent color", "accent colour",
  "arabic accent", "australian accent", " hd", "hd ", "full hd",
];

export type Exclusion = { term: string; reason: string };

/**
 * 🔴 能力边界外 / 立场明确不做的目标格式（已去空格小写，直接用 includes 比对）。
 *
 * 依据 `lib/convert/pairs.ts` 顶部注释与用户既定立场：
 *   · Canvas `toBlob` 只输出 jpeg / png / webp
 *     ⇒ **png-to-bmp / *-to-ico / webp-to-gif 一律不做**
 *   · BMP 只作**输入**可解码 ⇒ bmp-to-png 可做，反向不可做
 *   · 纯前端做不了 xlsx 二进制写出 ⇒ pdf-to-excel 不做
 * 另含一批「同类但我们主动不做」的：视频帧转换、服务器端批处理、
 * Python/Java 命令行方案（那是环境词不是工具词）。
 */
const OUT_OF_SCOPE: Array<[string, string]> = [
  ["tobmp", "BMP 输出：Canvas 不支持"],
  ["bmpconverter", "BMP 输出：Canvas 不支持"],
  ["toico", "ICO 输出：Canvas 不支持"],
  ["webptogif", "GIF 输出：Canvas 不支持逐帧"],
  ["gifoutput", "GIF 输出：Canvas 不支持逐帧"],
  ["toexcel", "xlsx 写出需新依赖，纯前端不做"],
  ["exceltopdf", "xlsx 解析需新依赖，纯前端不做"],
  ["tovideo", "视频处理需服务端"],
  ["videototxt", "视频处理需服务端"],
  ["python", "命令行方案，非网页工具"],
  ["java", "命令行方案，非网页工具"],
  ["sourcecode", "需读源码，纯前端不做"],
  ["api", "需第三方 API，纯前端不做"],
];

/**
 * 把查询词归一化成「去空格小写」，用于品牌名比对。
 *
 *🔴 为什么必须有这一步（DEBT-23）：
 *   品牌在名单里可能写成 "ilovepdf"（去空格），而查询词是 "i love pdf"（带空格），
 *   也可能反过来。不归一化就必然有一边匹配不上，而匹配不上的后果是
 *   **竞品词被当成真实缺口进入动作清单**。
 */
function normalizeForBrand(term: string): string {
  return term.toLowerCase().replace(/\s+/g, "");
}

function screenOut(term: string): Exclusion | null {
  const t = term.toLowerCase();
  const norm = normalizeForBrand(term);

  for (const b of BRANDS) {
    // 双通道：原文子串（覆盖 "freeconvert com" 这类）
    // + 归一化比对（覆盖 "i love pdf" vs "ilovepdf"）
    if (t.includes(b.toLowerCase()) || norm.includes(normalizeForBrand(b))) {
      return { term, reason: `竞品品牌词(${b})` };
    }
  }
  for (const p of PLATFORM) {
    if (t.includes(p) || norm.includes(normalizeForBrand(p))) {
      return { term, reason: `平台/环境词(${p})` };
    }
  }
  for (const f of FALSE_PROMISE) {
    if (t.includes(f) || norm.includes(normalizeForBrand(f))) {
      return { term, reason: `无法兑现代言(${f})——须逐页核实` };
    }
  }
  if (/^(best|top)\s+(ai\s+)?tools\b/.test(t)) {
    return { term, reason: "泛主题词——Google 返回全站建议链，非单页长尾" };
  }
  if (/\b(job|jobs|career|salary|resume|isle of wight)\b/.test(t)) {
    return { term, reason: "非工具意图（招聘/地理）" };
  }
  // 日文/中文词：站内 14 语言已覆盖，但这些具体词无对应落地页，
  // 记为「语言缺口」而不是直接丢掉 —— 它们是真实需求，只是当前没承接。

  // 🔴 2026-10-16：能力边界外/ 明确立场不做的目标格式。
  //   修好 DEBT-15 后这些词终于能正确落到 /c/* 页上，于是暴露出一个新问题：
  //   `can you convert webp to gif` 被派给 `/c/gif-to-webp`（方向反了，
  //   而 webp→gif 是明确不做的）；`jpg to bmp 100 kb` 派给 file-viewer。
  //   它们不是「可承接的缺口」，而是**站点主动声明不做的能力**
  //   （Canvas toBlob 只出jpeg/png/webp，见 lib/convert/pairs.ts 注释）。
  //   混进 tuneTargets 会让人以为「照着做就行」，是主动误导。
  const norm2 = normalizeForBrand(term);
  for (const [pat, why] of OUT_OF_SCOPE) {
    if (norm2.includes(pat)) {
      return { term, reason: `能力边界外/立场不做(${why})` };
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// 种子词派生
// ─────────────────────────────────────────────────────────────

const MODIFIERS = ["", " online", " free", " online free", " no signup"];
const SIZE_HINTS = [
  "to 100kb", "to 20kb", "to 200kb", "to 50kb", "to 1mb",
  "to exact size", "to specific size",
];

function deriveSeeds(limit: number): string[] {
  const seeds = new Set<string>();

  // 轴 C：格式对转 —— 最实的 4 词战场
  for (const p of CONVERT_PAIRS) {
    const phrase = p.phrase.toLowerCase();
    seeds.add(phrase);
    for (const m of [" online", " free", " online free"]) seeds.add(phrase + m);
    for (const h of [" 100kb", " and resize", " and compress", " batch"]) seeds.add(phrase + h);
  }

  // 轴 A/B：工具页主词 + 参数轴
  for (const [id, meta] of Object.entries(toolMeta)) {
    const name = String((meta as { title?: string }).title || id)
      .replace(/\s*(free|online|tool)?\s*$/i, "")
      .trim()
      .toLowerCase();
    if (!name || name.length < 3) continue;
    const core = name.split(/\s+/).slice(0, 3).join(" ");
    seeds.add(core);
    for (const m of MODIFIERS) seeds.add((core + m).trim());
    if (/compress|resize|convert|pdf|image|photo|file/i.test(core)) {
      for (const h of SIZE_HINTS) seeds.add(core + " " + h);
    }
  }

  return [...seeds].filter(Boolean).slice(0, limit);
}

// ─────────────────────────────────────────────────────────────
// 语料：页面真实文本
// ─────────────────────────────────────────────────────────────

interface CorpusEntry {
  key: string;
  text: string;
  kind: "tool" | "landing" | "pair";
}

/**
 * 🔴 DEBT-15 的核心修复：**参与匹配的字段 ≠ 页面身份字段**。
 *
 * 旧版用 `blocks[i].matchAll(/"([^"]*)"/g)` 把工具块里**每一个双引号字符串**
 * 拼成语料 —— 包括 `seoKeywords`（实测 1,566 条）、`faq`、`howToUse`、`relatedTools`。
 * 后果：格式转换类工具页成了「关键词 bag」，任何含 png/jpg/converter 的查询都能命中它。
 * 实测 `tuneTargets` 1206 条里 **817 条（68%）主题不符**，例如：
 *   `/tools/image-resize` ← `png to jpg converter`
 *   `/tools/aes-des`     ← `pdf to jpg free online no sign up`
 *   `/tools/tts`         ← `png to jpg converter free download windows 10`
 *
 * 更糟的是 auto-tune.ts:151 把 seoKeywords 算进「页面主张」，
 * 所以这批错配**会被自动写进生产 DB 覆盖层**——不只是分析层的问题。
 *
 * 正确做法：**只在「这页是什么」的声明字段上算 df**。
 * FAQ 里提一句 PNG 不代表这页能承接 png 查询；
 * 一次性举例（"For commercial projects"）更会骗过匹配器。
 */
const IDENTITY_FIELDS = [
  "title",
  "seoTitle",
  "seoDesc",
  "description",
  "technicalNote",
  "url",
] as const;

/**
 * 🔴 身份字段里仍有**能力泛述词**残留 —— DEBT-15 修完第一轮后实测发现的第二层。
 *
 * 例：`/tools/file-viewer` 的 desc 是「Open and preview 135+ file formats in your
 * browser — PDF, DOCX, XLSX, ...」，于是任何含 pdf/docx/xls 的查询都能命中它，
 * 实测它因此拿走了 39 个 `bmp to png converter` 变体。
 * 同类：`/tools/png-to-svg` 的 desc 含「raster images / scalable vector」，
 * 于是所有 png/jpg 转换词都命中它。
 *
 * 区别在于：这些词描述的是**能力范围**（"135+ formats"），不是**页面身份**
 * （"This is the File Viewer page"）。前者对匹配毫无鉴别力——
 * 几乎所有工具页都能声称自己支持 pdf。
 *
 * 所以在语料侧剔除：泛化词不参与 df，也不参与打分。
 * 这与锚点侧的 ANCHOR_STOP 是两层不同的过滤，**两道都要有**：
 *   · ANCHOR_STOP 管的是「查询词的锚不该选这个泛词」
 *   · 本表管的是「页面的身份描述不该用这些泛词」
 */
const CAPABILITY_NOISE = [
  "file format", "file formats", "format", "formats",
  "browser", "online", "free", "tool", "tools", "converter", "convert",
  "generator", "editor", "viewer", "preview", "raster", "vector", "image",
  "images", "download", "upload", "open source", "web app", "website",
  "all formats", "any format", "multiple formats", "100+", "135+",
  "images", "documents", "files",
] as const;

/**
 * 从身份文本里剔除能力泛述词。
 * 注意：只做整词删除，不做词干化—— 「format」的词干「form」会误伤 information。
 */
function stripCapabilityNoise(text: string): string {
  let out = text;
  for (const noise of CAPABILITY_NOISE) {
    out = out.replace(new RegExp(`\\b${noise.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

/** 从一个对象字面量源码块里，按字段名精确抽取字符串/字符串数组值。 */
function extractFields(block: string, fields: readonly string[]): string {
  const out: string[] = [];
  for (const field of fields) {
    // 形态1：field: "value"（含转义）
    const scalar = new RegExp(`\\b${field}\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`).exec(block);
    if (scalar?.[1]) out.push(scalar[1]);
    // 形态2：field: ["a", "b"]（seoKeywords / faqs 这类）
    const arr = new RegExp(`\\b${field}\\s*:\\s*\\[([\\s\\S]*?)\\]`).exec(block);
    if (arr?.[1]) {
      for (const m of arr[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)) out.push(m[1]);
    }
  }
  return out.join(" ");
}

function loadToolCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = [];
  const p = resolve(process.cwd(), "lib", "tools.ts");
  if (!existsSync(p)) return out;
  const src = readFileSync(p, "utf-8");
  const blocks = src.split(/\n {2}"[a-z0-9-]+": \{/);
  const ids = [...src.matchAll(/\n {2}"([a-z0-9-]+)": \{/g)].map((m) => m[1]);
  for (let i = 1; i < blocks.length; i++) {
    const id = ids[i - 1];
    if (!id) continue;
    // 🔴 不再抓「所有字符串」—— 那等于把 seoKeywords（1,566 条）灌进语料。
    // 再叠一层能力泛述词剔除（见 CAPABILITY_NOISE）。
    const text = stripCapabilityNoise(extractFields(blocks[i], IDENTITY_FIELDS));
    if (!text.trim()) continue;
    out.push({ key: `/tools/${id}`, text, kind: "tool" });
  }
  return out;
}

function loadLandingCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = [];
  const p = resolve(process.cwd(), "lib", "seo", "landing-pages.ts");
  if (!existsSync(p)) return out;
  const src = readFileSync(p, "utf-8");
  const re = /slug:\s*"([a-z0-9-]+)"[\s\S]*?(?=\n {2}"[a-z0-9-]+":\s*\{|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    // 同样的病：落地页数量少（29 页），全字符串抓取会让任何含 "alternativ"
    // 的词都命中它（实测 `free alternatives to logic pro` → /l/intellij-alternative）。
    const text = stripCapabilityNoise(extractFields(m[0], ["title", "seoTitle", "description", "seoDesc", "tagline"]));
    if (!text.trim()) continue;
    out.push({ key: `/l/${m[1]}`, text, kind: "landing" });
  }
  return out;
}

/**
 * 🔴 DEBT-15 修复后的**对称性说明**：
 *
 * 旧版的不对称正是错配的结构性来源 ——
 *   · pair 页只取 7 个手写字段（phrase/title/description/intro/faqs/…）
 *   · tool 页却抓「所有字符串」，把 seoKeywords 全灌了进去
 * 同一批锚词（png/jpg/converter）在 pair 页 df 低 → 命中正确；
 * 在 tool 页被 seoKeywords 稀释 → df 虚高 → 命中错误。
 *
 * 现在 tool / landing 都改成按字段名精确抽取（见 extractFields），
 * 三个 kind 的语料面就一致了：都只包含「这页是什么」的声明内容。
 *
 * pair 保留 intro / faqs 是**有意的**：它们是手写的主张内容（每页各不相同），
 * 不是关键词堆砌，且只有 13 页 ⇒ df 低、锚点区分度高。实测抽出的真名质量很好
 * （`Retry Logic` / `Circuit breaker` 那种）。若把 pair 也削到只剩 title/description，
 * 反而会丢失「这一页具体讲什么」的信号。
 */
function loadPairCorpus(): CorpusEntry[] {
  return CONVERT_PAIRS.map((pair) => ({
    key: `/c/${pair.slug}`,
    text: [
      pair.phrase, pair.title, pair.description, ...pair.intro,
      ...pair.faqs.map((f) => `${f.question} ${f.answer}`),
      ...pair.whenToUse.do, ...pair.whenToUse.avoid, pair.technicalNote,
    ].join(" "),
    kind: "pair" as const,
  }));
}

// ─────────────────────────────────────────────────────────────
// 逐词干比对
// ─────────────────────────────────────────────────────────────

/**
 * 🔴 free/online/tool 这类泛化修饰词必须停用。
 * 否则任意页面都会因为含这些词而"命中"泛主题词 —— 第一版产出
 * `/tools/file-viewer` 匹配 33 词就是纯噪声（靠的就是这几个词）。
 */
const STOP = new Set([
  "free", "online", "tool", "tools", "the", "for", "and", "to", "of", "a", "in",
  "best", "generator", "maker", "converter", "editor", "download", "app", "how",
  "with", "that", "you", "your", "from", "into", "like", "com", "www", "at", "is",
  "it", "be", "or", "on", "by", "as", "this", "my", "we", "no", "not", "use",
  "using", "without", "any", "all", "one", "can", "will", "make", "get",
]);

function stem(w: string): string {
  return w.replace(/(ings|ing|ers|er|ors|or|ies|es|s)$/i, "").replace(/e$/, "");
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map(stem)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

interface Match {
  key: string;
  kind: string;
  score: number;
  total: number;
  /** 🔴 语义锚：查询里最稀有那个词是否真出现在该页 */
  anchorHit: boolean;
}

/**
 * 🔴 语义锚：查询里最稀有的那个词是否真出现在该页。
 *
 * 🔴🔴 关键：ANCHOR_STOP 必须在**词干化之后**比对。
 * 第一版直接拿原形词表去滤已词干化的 token，于是
 *   free → fre、alternatives → alternativ
 * 全部漏过滤 ⇒ "fre" 的 df=176（全站每页）⇒ 被当成"最稀有的锚"
 * ⇒ "google workspace alternatives free" 被判给 /tools/id-photo（它其实一个词都不含）。
 * 这个 bug 同时污染 ratio 与 score，是错配的总根源。
 */
const ANCHOR_STOP_RAW = [
  "free", "online", "tool", "version", "google", "microsoft", "software",
  "workspace", "alternative", "alternatives", "project", "management", "schedule",
  "suite", "gsuite", "app", "web", "site", "page",
  // 🔴 功能动词/泛化描述，不是主题词。不剔除时
  // "free project management software like ms project to create schedule"
  // 的锚会落在 like（df=21）⇒ 任何含 like 的页都被判命中 ——
  // 实测把替代簇的词错配到了 /tools/handwriting-animation。
  "like", "create", "make", "use", "want", "need", "get", "find",
  "convert", "change", "turn", "add", "remove", "check", "best", "list",
];

function anchorStop(): Set<string> {
  return new Set(ANCHOR_STOP_RAW.map(stem));
}

function buildDf(corpus: CorpusEntry[]): Map<string, number> {
  const df = new Map<string, number>();
  for (const c of corpus) {
    for (const w of tokens(c.text)) df.set(w, (df.get(w) ?? 0) + 1);
  }
  return df;
}

function pickAnchor(term: string, df: Map<string, number>): string | null {
  const stop = anchorStop();
  const t = [...tokens(term)].filter((w) => !stop.has(w));
  if (t.length === 0) return null;

  // 最稀有的候选词= 最可能是这条查询的主题词
  const sorted = t
    .map((w) => [w, df.get(w) ?? 0] as const)
    .sort((a, b) => a[1] - b[1]);
  const [word, count] = sorted[0];
  // 🔴 锚必须至少在一页出现（全站 0 页 = 拼写差异 / 词干过头，不是主题词）
  if (count === 0) return null;
  // 🔴 且必须够稀有：df 过大说明它仍是个泛词（like / create 这类），
  // 用它当锚会匹配到几十个不相干的页。
  if (count > 40) return null;
  return word;
}

function matchCorpus(
  term: string,
  corpus: CorpusEntry[],
  anchor: string | null,
  df: Map<string, number>
): Match[] {
  const t = tokens(term);
  if (t.size < 2) return [];

  // 🔴🔴 anchor === null 意味着「这条查询剔掉高频泛词后没有主题词」，
  // 它无法被可靠归属到任何页 —— 必须直接不匹配。
  // 早先写成 `if (anchor && !ct.has(anchor)) continue`，null 时约束整个失效，
  // 于是 "google workspace free alternative" 又落回 id-photo。
  // **宁可漏报不可错报**：错报会让作者去改一个不相干的页，白费一轮。
  if (!anchor) return [];

  const hits: Match[] = [];
  for (const c of corpus) {
    const ct = tokens(c.text);
    if (ct.size === 0) continue;
    if (!ct.has(anchor)) continue; // 锚必须在该页出现

    let score = 0;
    for (const w of t) if (ct.has(w)) score++;
    const ratio = score / t.size;
    if (score < 3 || ratio < 0.6) continue;

    // 🔴 2026-10-16（DEBT-15 第三层）：**全部实词必须命中**。
    //   score>=3 && ratio>=0.6 单独看不够：查询越长分母越大，
    //   3 个词命中就能过线，而剩下的词可以跟主题毫无关系。
    //   实测残留的两条错配正是这么来的：
    //     `free alternative to ms project windows 7` → /c/heic-to-jpg
    //        HEIC 页的 technicalNote 里提到 Windows / 文件格式，
    //        加上 to/free 类词，ratio 就过了，但主题（MS Project）完全不对
    //     `svg file editor` → /c/svg-to-png（svg 对，但 editor≠转换）
    //
    //   为什么不能用「取一个主题词判存在」：我第一版取 df 最高的词，
    //   而 df 最高的恰恰是**泛用技术名词**（window/file/microsoft），
    //   它们在很多页的技术说明里都出现 ⇒ 判据形同虚设。
    //
    //   正确判据：**查询里每个非停用实词都必须在这页出现**。
    //   tokens() 已经滤掉了 free/online/to/alternative/convert 这类停用词，
    //   剩下的都是真正的内容词。要求它们全部命中，等价于说
    //   「这页必须真的在讲这件事」，而不是「碰巧提到了其中一个词」。
    //
    //   仍然遵循「宁可漏报不可错报」：拦下只是把条目移进 gscUncovered，
    //   它仍然可见，只是不再被标成「这个页面已经在承接」。
    const missing = [...t].filter((w) => !ct.has(w));
    if (missing.length > 0) continue;

    hits.push({ key: c.key, kind: c.kind, score, total: t.size, anchorHit: true });
  }
  return hits.sort((a, b) => b.score / b.total - a.score / a.total).slice(0, 4);
}

// ─────────────────────────────────────────────────────────────

async function probeSources(): Promise<void> {
  console.log("[src] 探测各源可用性…");
  const gsc = await fetchGscQueries(28);
  console.log(`[src] GSC（主源，走Vercel）: ${gsc.reachable ? "OK" : "FAIL"} — ${gsc.note}，${gsc.rows.length} 条去重查询`);
  for (const seed of ["png to jpg", "css minifier"]) {
    const r = await fetchSuggestionsDetailed(seed);
    console.log(`[src] Google Suggest "${seed}": ${r.source} n=${r.suggestions.length}${r.primaryError ? " err=" + r.primaryError : ""}`);
  }
}

async function main() {
  if (SRC_ONLY) {
    await probeSources();
    return;
  }

  const corpus = [...loadToolCorpus(), ...loadLandingCorpus(), ...loadPairCorpus()];
  // 预构建文档频率表：pickAnchor 每词重算全站 tokens 会是 O(words×pages×len)，400K 字符下不可接受
  const df = buildDf(corpus);
  console.log(
    `[gap] 语料 ${corpus.length} 页 / ${corpus.reduce((n, c) => n + c.text.length, 0)} 字符`,
  );

  // ── 主源：GSC ──
  const gsc = await fetchGscQueries(28);
  console.log(`[gap] GSC 主源：${gsc.reachable ? "OK" : "FAIL"}（${gsc.note}），去重查询 ${gsc.rows.length}`);
  if (!gsc.reachable) {
    console.warn("[gap] ⚠️ GSC 不可达 —— 今天的依据不含你身上真实的 Google 数据，结论可信度下降");
  }

  // GSC 里与站内语料有对应页的词 →「已发生但没吃满」
  const gscMatched: Array<{ query: string; impressions: number; position: number; hits: Match[] }> = [];
  const gscUncovered: Array<{ query: string; impressions: number; position: number }> = [];
  for (const row of gsc.rows) {
    const ex = screenOut(row.query);
    if (ex) continue;
    const anchor = pickAnchor(row.query, df);
    const hits = matchCorpus(row.query, corpus, anchor, df);
    if (hits.length > 0) gscMatched.push({ ...row, hits });
    else gscUncovered.push(row);
  }

  // ── 辅源：Google Suggest 长尾 ──
  const seeds = deriveSeeds(SEED_LIMIT);
  console.log(`[gap] Suggest 种子 ${seeds.length} 个…`);
  const suggestMap = await fetchSuggestionsForSeeds(seeds, { lang: "en" });

  const probe = seeds.slice(0, 15).map((s) => fetchSuggestionsDetailed(s));
  const probed = await Promise.all(probe);
  const sourceTally: Record<SuggestSource, number> = { google: 0, bing: 0, none: 0 };
  for (const r of probed) sourceTally[r.source]++;
  console.log(`[gap] Suggest 源抽样（15）：${JSON.stringify(sourceTally)}`);
  if (sourceTally.google === 0) {
    console.warn(
      "[gap] ⚠️ Google Suggest 本轮完全不可达（IP 长封），长尾部分来自 Bing 回退 —— " +
        "口径是 Bing 的需求宽度。GSC 主源不受影响。",
    );
  }

  const seedSet = new Set(seeds.map((s) => s.toLowerCase()));
  const all = new Map<string, Set<string>>();
  for (const [seed, list] of suggestMap.entries()) {
    for (const s of list) {
      const set = all.get(s) || new Set<string>();
      set.add(seed);
      all.set(s, set);
    }
  }

  const byTarget = new Map<string, { term: string; words: number }[]>();
  const gaps: Array<{ term: string; seeds: string[]; words: number }> = [];
  const excluded: Array<Exclusion & { seeds: string[] }> = [];

  for (const [term, fromSeeds] of all.entries()) {
    if (seedSet.has(term.toLowerCase())) continue;
    const words = term.trim().split(/\s+/).length;
    if (words < 4) continue; // 1–3 词打不动（10-08 实测 1.7K 条里仅 179）

    const ex = screenOut(term);
    if (ex) {
      excluded.push({ ...ex, seeds: [...fromSeeds] });
      continue;
    }
    const anchor = pickAnchor(term, df);
    const hits = matchCorpus(term, corpus, anchor, df);
    if (hits.length === 0) {
      gaps.push({ term, seeds: [...fromSeeds], words });
      continue;
    }
    for (const h of hits) {
      const arr = byTarget.get(h.key) || [];
      if (!arr.some((x) => x.term === term)) {
        arr.push({ term, words: term.split(/\s+/).length });
      }
      byTarget.set(h.key, arr);
    }
  }

  const tuneTargets = [...byTarget.entries()]
    .map(([key, terms]) => ({ key, terms }))
    .sort((a, b) => b.terms.length - a.terms.length);

  const sortedGaps = gaps.sort((a, b) => b.words - a.words || a.term.length - b.term.length);

  const stamp = new Date().toISOString().slice(0, 10);
  const payload = {
    generatedAt: new Date().toISOString(),
    primarySource: "gsc-google-search-console",
    gsc: {
      reachable: gsc.reachable,
      note: gsc.note,
      windowDays: 28,
      uniqueQueries: gsc.rows.length,
    },
    suggestSourceTally: sourceTally,
    corpusSize: {
      pages: corpus.length,
      chars: corpus.reduce((n, c) => n + c.text.length, 0),
      tool: corpus.filter((c) => c.kind === "tool").length,
      landing: corpus.filter((c) => c.kind === "landing").length,
      pair: corpus.filter((c) => c.kind === "pair").length,
    },
    seedsUsed: seeds.length,
    uniqueSuggestTerms: all.size,
    /** 🔴 已发生在你身上的真实 Google 数据 —— 权威度最高 */
    gscMatched,
    gscUncovered,
    /** Suggest 长尾：已写但可对齐 */
    tuneTargets,
    /** Suggest 长尾：真未命中 */
    gaps: sortedGaps,
    excluded,
  };

  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
  const outFile = join(OUT_DIR, `gap-${stamp}.json`);
  writeFileSync(outFile, JSON.stringify(payload, null, 2), "utf-8");

  console.log("");
  console.log("══════ GSC：已发生的真实 Google 数据 ══════");
  console.log(`去重查询 ${gsc.rows.length}｜命中站内页 ${gscMatched.length}｜未命中 ${gscUncovered.length}`);
  console.log("");
  console.log("─── 命中站内页的查询（改这些页最实）───");
  for (const m of gscMatched.slice(0, 20)) {
    console.log(
      `  imp=${String(m.impressions).padStart(4)} pos=${m.position.toFixed(1).padStart(5)}  ${m.query}`,
    );
    console.log(`        → ${m.hits.map((h) => h.key).join(", ")}`);
  }
  console.log("");
  console.log("─── GSC 里有但站内无对应页（真缺口）───");
  for (const u of gscUncovered.slice(0, 15)) {
    console.log(`  imp=${String(u.impressions).padStart(4)} pos=${u.position.toFixed(1).padStart(5)}  ${u.query}`);
  }

  console.log("");
  console.log("══════ Google Suggest：潜在长尾 ══════");
  console.log(`唯一词 ${all.size}｜tune 目标页 ${tuneTargets.length}｜gap ${gaps.length}｜立场排除 ${excluded.length}`);
  console.log("");
  console.log("─── tune：按命中词数排序，前 12 ───");
  for (const t of tuneTargets.slice(0, 12)) {
    console.log(`  ${String(t.terms.length).padStart(3)} 词  ${t.key}`);
    console.log("        " + t.terms.slice(0, 5).map((x) => x.term).join(" | "));
  }
  console.log("");
  console.log("─── gap：真未命中，前 20 ───");
  for (const g of sortedGaps.slice(0, 20)) console.log(`  ${g.words} 词  ${g.term}`);
  console.log("");
  console.log(`→ ${outFile}`);
}

main().catch((e) => {
  console.error("[gap] 失败：", e);
  process.exit(1);
});