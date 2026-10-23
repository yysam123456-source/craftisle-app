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
import { join, resolve, basename } from "path";
// 🔴 原子写：裸 writeFileSync 写 150KB+ 分片缓存，被超时打断会留半截 JSON，
// 下次 JSON.parse 在 try 里只记一条 warn ⇒ 静默少一个分片（DEBT-24）
import { writeTextAtomic } from "./lib/data-io.mjs";
import {
  fetchSuggestionsForSeedsDetailed,
  type SuggestSource,
} from "../lib/seo/trends-client";
import { CONVERT_PAIRS, INPUT_META, OUTPUT_META } from "../lib/convert/pairs";
import { toolMeta } from "../lib/tools";
import { getCombinedMap, toSlug } from "../lib/alternatives";

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
 *
 * 🔴🔴 2026-10-20（DEBT-28）：本机沙箱出网常被 TLS 阻断（curl exit 35 /
 *   node fetch failed），此时旧版直接判 `reachable=false`，于是下游
 *   `seo:autotune` 也一起死掉（它只认 gap 文件里的 gsc.reachable）。
 *   实测：本机被墙的日子里 longtail 0/10、autotune 拒绝出方案，
 *   但 Google 数据本身是好的 —— 坏的只是**本机到 craftisle.com 的这一跳**。
 *   修法与 growth-review.ts 对齐：支持 GROWTH_CACHE_DIR 预灌缓存，
 *   实时拉取失败时回退读缓存，并在 note 里**明示**用了缓存、缓存多旧。
 *   ⚠️ 回退必须 fail loud：不能静默用旧数据冒充实时数据。
 */
async function fetchGscQueries(days = 28): Promise<{
  rows: GscQuery[];
  reachable: boolean;
  note: string;
}> {
  const cacheDir = process.env.GROWTH_CACHE_DIR
    ? resolve(process.env.GROWTH_CACHE_DIR)
    : resolve(process.cwd(), "..", ".workbuddy", "tmp", "gcache-lt");
  if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
  const cacheFromEnv = Boolean(process.env.GROWTH_CACHE_DIR);

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
  // 🔴 DEBT-28：回退用了缓存的分片要单独计数并写进 note，绝不能混进「实时成功」。
  let cachedSlices: string[] = [];
  // 收集各分片自带的 snapshots 数组，用于在 note 里说明缓存有多旧。
  const snapSeen = new Set<string>();

  for (const s of slices) {
    const name = `_api_analytics_top-queries_days${days}_limit200_sort${s.sort}${
      s.type ? "_type_" + s.type : "_type_all"
    }.json`;
    const file = join(cacheDir, name.replace(/[^a-z0-9_\-.]/gi, "_"));
    const url =
      `${API_BASE}/api/analytics/top-queries?days=${days}&limit=200&sort=${s.sort}` +
      (s.type ? `&type=${s.type}` : "");

    // 先试实时拉取；失败则回退预灌缓存（GROWTH_CACHE_DIR）。
    let text: string | null = null;
    let fromCache = false;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "CraftisleGrowthReview/1.0" },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`http ${res.status}`);
      text = await res.text();
      // 🔴 非原子写：150KB+ 的分片缓存被超时打断会留半截 JSON，
      // 下次 JSON.parse 在 try 里只记一条 warn ⇒ 静默少一个分片。走原子写。
      writeTextAtomic(file, text);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // 🔴 DEBT-28 回退：本机到 craftisle.com 这一跳被墙时，数据本身是好的。
      if (existsSync(file)) {
        try {
          text = readFileSync(file, "utf-8");
          fromCache = true;
          cachedSlices.push(`${s.type ?? "all"}/${s.sort}`);
          console.warn(
            `[gsc] ⚠️ 分片 ${s.type ?? "all"}/${s.sort} 实时拉取失败(${msg}) ⇒ ` +
              `回退读缓存 ${basename(file)}（数据非实时，见 note）`
          );
        } catch {
          console.warn(`[gsc] 分片失败 ${s.type ?? "all"}/${s.sort}: ${msg}（缓存也不可读）`);
          continue;
        }
      } else {
        console.warn(
          `[gsc] 分片失败 ${s.type ?? "all"}/${s.sort}: ${msg}` +
            (cacheFromEnv ? "" : `（可用 GROWTH_CACHE_DIR 预灌缓存绕过本机网络阻断）`)
        );
        continue;
      }
    }

    try {
      const data = JSON.parse(text as string);
      const list: unknown[] = Array.isArray(data?.queries) ? data.queries : [];
      const snaps = (data as { snapshots?: unknown })?.snapshots;
      if (Array.isArray(snaps)) {
        for (const s of snaps) if (typeof s === "string") snapSeen.add(s);
      }
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
      console.warn(`[gsc] 分片 ${s.type ?? "all"}/${s.sort} JSON 解析失败: ${msg}`);
    }
  }

  const rows = [...seen.values()].sort((a, b) => b.impressions - a.impressions);
  // 🔴 reachable 必须是「至少有分片真的带回了数据」，否则上层会以为数据源健康。
  const parts: string[] = [`${ok}/${slices.length} 分片有效`];
  if (emptySlices.length > 0) parts.push(`${emptySlices.length} 个空分片: ${emptySlices.join(", ")}`);
  // 🔴 DEBT-28：用了缓存必须显式说出来，且给出缓存里最新的快照日期，
  //   否则「非实时数据」会被当成「实时数据」用，静默换源。
  if (cachedSlices.length > 0) {
    const snapDates = [...snapSeen].sort();
    parts.push(
      `${cachedSlices.length} 个分片走缓存回退(${cachedSlices.join(", ")})` +
        ` ⇒ 数据非实时${snapDates.length > 0 ? `，缓存最新快照 ${snapDates[snapDates.length - 1]}` : ""}`
    );
  }
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
  kind: "tool" | "landing" | "pair" | "alternatives";
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

/**
 * 🔴🔴 DEBT-41（2026-10-21）：**格式清单不是页面身份**。
 *
 * 实测：`/tools/file-viewer` 的 description 把支持格式全列了一遍
 * （"…Images: Preview JPG, PNG, GIF, WEBP, BMP, TIFF, SVG, HEIC…"），
 * 于是任何 "bmp to png converter" 类查询的实词（bmp/png）都能在该页找齐
 * ⇒「全部实词必须命中」闸门被一份 **accept-list** 满足
 * ⇒ 71 个转换词变体错配到 viewer 页（image-resize / image-base64 /
 * png-to-svg 同类中招）。CAPABILITY_NOISE 只剥得掉 formats/files/viewer
 * 这类泛词，剥不掉清单里的格式名本身 —— 而格式名在转换词查询里恰恰是实词。
 *
 * 修法（ledger 待办「把格式清单段标记为低权重／排除 accept 列表文本」的落地）：
 * 把**连续 ≥2 个短 token（2–5 位字母数字，逗号/斜杠分隔）**的整段剥掉。
 * 为什么降到 2：accept-list 最常见的写法就是两项 —— "JPG, PNG or WebP"、
 * "(PNG, JPG)"、"SVG/PNG"。实测 /tools/image-resize 的 seoDesc/desc 正是
 * 这个形态，阈值 3 时它照样拿着 40 个 png-to-jpg converter 变体。
 * 文件扩展名天然短（pdf/docx/webp/stl/ico），品牌名天然长
 * （Bilibili/Douyin/ProjectLibre/GanttProject/Trello 都 >5）⇒ 该形态只命中
 * 格式清单；正常行文里没有 2 连短词逗号串，品牌列表也大多 ≥6 字符。
 * 保守方向：误剥只会让页面少匹配（漏报），不会造出假匹配。
 */
const FORMAT_LIST_RE = /\b[A-Za-z0-9]{2,5}\b(?:\s*[,/]\s*\b[A-Za-z0-9]{2,5}\b){1,}/g;

function stripFormatLists(text: string): string {
  return text.replace(FORMAT_LIST_RE, " ").replace(/\s+/g, " ").trim();
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
    // 再叠一层能力泛述词剔除（见 CAPABILITY_NOISE）+ 格式清单剔除（DEBT-41）。
    const text = stripFormatLists(stripCapabilityNoise(extractFields(blocks[i], IDENTITY_FIELDS)));
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
    // + DEBT-41：格式清单段一并剥掉（落地页 desc 里也常列支持格式）。
    const text = stripFormatLists(stripCapabilityNoise(extractFields(m[0], ["title", "seoTitle", "description", "seoDesc", "tagline"])));
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
    // DEBT-41：对转页的 technicalNote/FAQ 里也可能出现格式清单段，一并剥掉。
    // phrase/title（"bmp to png"）不是逗号串 ⇒ 主题词不受影响。
    text: stripFormatLists([
      pair.phrase, pair.title, pair.description, ...pair.intro,
      ...pair.faqs.map((f) => `${f.question} ${f.answer}`),
      ...pair.whenToUse.do, ...pair.whenToUse.avoid, pair.technicalNote,
    ].join(" ")),
    kind: "pair" as const,
  }));
}

/**
 * 🔴🔴 DEBT-35（2026-10-21）：alternatives 簇此前**完全不在语料里**。
 *
 * 事实：87 个 /directory/alternatives/<slug> 页是全站唯一有真实曝光的一簇
 * （28 天 239 条去重查询里，P4–20 的 12 条**全部**落在替代页簇），
 * 但语料只含 tool/landing/pair 三类 219 页。
 *
 * 后果：任何提到某个付费工具名的查询都会被判成 gscUncovered「真缺口」。
 * 实测 47/177（26%）是假缺口 —— 「已存在但不在语料里」比漏报更危险：
 * 它会诱导去建一个重复页，而正确的动作本来只是给已有页调 meta。
 *
 * 修法：把这簇补进语料。文本只取「这页是什么」的声明字段
 * （paidTool / tagline / description / whySwitch / seoKeywords / 替代品名），
 * 与 tool/landing 的字段口径一致；不取 FAQ 长答案（模板化、噪声大）。
 */
function loadAlternativesCorpus(): CorpusEntry[] {
  const out: CorpusEntry[] = [];
  try {
    const map = getCombinedMap();
    for (const [paidTool, e] of Object.entries(map)) {
      if (!paidTool) continue;
      const text = stripFormatLists(stripCapabilityNoise(
        [
          paidTool,
          e.tagline,
          e.description,
          ...(e.whySwitch ?? []),
          ...(e.seoKeywords ?? []),
          ...(e.alternatives ?? []).map((a) => a?.name).filter(Boolean),
        ]
          .filter(Boolean)
          .join(" ")
      ));
      if (!text.trim()) continue;
      out.push({
        key: `/directory/alternatives/${toSlug(paidTool)}`,
        text,
        kind: "alternatives",
      });
    }
  } catch (e: any) {
    // 语料源缺失不能让整条管道静默少一簇 —— 必须说出来
    console.warn(`[gap] ⚠️ alternatives 语料加载失败（该簇缺席 ⇒ 假缺口风险）：${e?.message || String(e)}`);
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// 逐词干比对
// ─────────────────────────────────────────────────────────────

/**
 * 🔴 free/online/tool 这类泛化修饰词必须停用。
 * 否则任意页面都会因为含这些词而"命中"泛主题词 —— 第一版产出
 * `/tools/file-viewer` 匹配 33 词就是纯噪声（靠的就是这几个词）。
 *
 * 🔴🔴 DEBT-37 附带修复（2026-10-21）：STOP 必须在**词干化之后**比对。
 *   原表是原形（"free"/"generator"/"converter"），而 tokens() 里比对的是词干
 *   （"fre"/"generat"/"convert"）⇒ 这些停用词**一个都没生效**。
 *   实测后果：`free asana alternatives` 带着 "fre" 去匹配，
 *   而语料文本被 stripCapabilityNoise 剥掉了 "free" ⇒ 永远缺一词 ⇒ 假缺口。
 *   （这正是 MEMORY 里「语义锚定三个必做修正 ①」的同一类病，
 *    当时只修了 ANCHOR_STOP，漏了 STOP。）
 */
const STOP_RAW = [
  "free", "online", "tool", "tools", "the", "for", "and", "to", "of", "a", "in",
  "best", "generator", "maker", "converter", "editor", "download", "app", "how",
  "with", "that", "you", "your", "from", "into", "like", "com", "www", "at", "is",
  "it", "be", "or", "on", "by", "as", "this", "my", "we", "no", "not", "use",
  "using", "without", "any", "all", "one", "can", "will", "make", "get",
  // 🔴 DEBT-40（2026-10-21）："no longer free" 里的 long/longer 是**功能词**，
  // 不是主题词。不剔它，"is intellij no longer free" 就要求页面必须出现
  // "long" —— 而专门回答这个问题的 /l/intellij-alternative 并没有这个词。
  "long",
];

/**
 * 🔴 DEBT-40（2026-10-21）：**有主题意义的 2 字母缩写白名单**。
 *
 * `tokens()` 的长度门槛（>2）会把 ms/ai/pc/os 这类品牌与技术缩写整类吃掉。
 * 实测代价："ms project alternative"（27 曝光）里唯一能把该查询钉到
 * `/directory/alternatives/microsoft-project` 的就是 "ms" ——
 * project/alternativ 都是 anchorStop 泛词，锚必然为 null ⇒ 永不匹配 ⇒ 假缺口。
 * 而语料侧（该页 seoKeywords 明写 "ms project alternative"）一直有这个 token，
 * 是**查询侧单方面**丢失了区分度。
 *
 * 为什么不放宽成「所有 ≥2 字母词都留」：vs/to/an/if 这类功能词会给查询
 * **新增**页面必须满足的要求（"jpg vs png" 要求页面出现 vs，而
 * /c/jpg-to-png 的正文并没有）⇒ 反而掉命中。宁可漏报不可错报：
 * 白名单外的 2 字母词继续当噪声丢，名单只收**承载主题的缩写**。
 */
const SHORT_KEEP_RAW = [
  "ms", "ai", "pc", "tv", "ui", "ux", "hr", "os", "ar", "vr", "hd",
  "ip", "js", "ts", "qa", "bi", "3d", "4k", "2d", "8k",
];

function stem(w: string): string {
  const out = w.replace(/(ings|ing|ers|er|ors|or|ies|es|s)$/i, "").replace(/e$/, "");
  // 🔴 DEBT-40：短词禁不起这套词干化 —— "ms"→""、"os"→"o"、"vs"→"v"。
  // 缩写被词干器销毁后长度门槛再补一刀，查询侧与语料侧**同时**丢失该词。
  // 规则：词干结果不足 2 字符就视为「这个词不该被词干化」，原样返回。
  return out.length >= 2 ? out : w;
}

/** 词干化后的停用词表 —— tokens() 直接用它比对。 */
const STOP = new Set(STOP_RAW.map(stem));

/** 词干化后的缩写白名单 —— 同样按词干形态比对（pcs→pc、ais→ai）。 */
const SHORT_KEEP = new Set(SHORT_KEEP_RAW.map(stem));

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .map(stem)
      // 🔴 DEBT-40：长度门槛从「>2」放宽为「>2 或在缩写白名单里」。
      // 白名单外的 2 字母词仍当噪声丢（见 SHORT_KEEP_RAW 注释）。
      .filter((w) => (w.length > 2 || SHORT_KEEP.has(w)) && !STOP.has(w)),
  );
}

interface Match {
  key: string;
  kind: string;
  score: number;
  total: number;
  /** 🔴 语义锚：查询里最稀有那个词是否真出现在该页 */
  anchorHit: boolean;
  /** 🔴 DEBT-41：该页 URL 的最后一段实词是否全部被查询覆盖（专用承接页） */
  keyCovered: boolean;
}

/**
 * URL 是否就是这条查询的专用承接页：路径最后一段的实词全部出现在查询里。
 *   /c/bmp-to-png      ↔ "bmp to png converter"   ✓
 *   /directory/alternatives/asana ↔ "free asana alternatives" ✓
 *   /tools/signature-maker ↔ "png to jpg converter" ✗（正文只是提了一嘴）
 */
function keyFullyCovered(key: string, queryToks: Set<string>): boolean {
  const kt = tokens(key.split("/").pop() ?? "");
  if (kt.size === 0) return false;
  for (const w of kt) if (!queryToks.has(w)) return false;
  return true;
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
  "free", "online", "tool", "version", "software",
  "alternative", "alternatives",
  "project", "management", "schedule",
  "app", "web", "site", "page",
  // 🔴 功能动词/泛化描述，不是主题词。不剔除时
  // "free project management software like ms project to create schedule"
  // 的锚会落在 like（df=21）⇒ 任何含 like 的页都被判命中 ——
  // 实测把替代簇的词错配到了 /tools/handwriting-animation。
  "like", "create", "make", "use", "want", "need", "get", "find",
  "convert", "change", "turn", "add", "remove", "check", "best", "list",
  // 🔴🔴 DEBT-35 补（2026-10-21）：**不要把品牌词本身停用**。
  //   原表里有 google/workspace/suite/gsuite/microsoft，初衷是防止
  //   "google workspace alternatives free" 错配到不相干的工具页。
  //   但实测这直接把替代簇自己的查询全判成 anchor=null ⇒ 永不匹配
  //   ⇒ 假缺口（P17–20、有真实曝光的 google-workspace 簇 3 条全中）。
  //   判别泛词不该靠词表，该靠 **df 上限 40**（googl df=20、workspac df=7、
  //   suit df=8 都够稀有）；配上「全部实词必须命中」闸门，
  //   品牌词当锚不会错配（id-photo 那种页压根不含 workspace）。
  //   project/microsoft/management/schedule 保留停用：它们是跨品类泛词
  //   （df=16 且遍布项目管理簇），当锚会把 "ms project alternative"
  //   错配到 asana/trello 页 —— 而本站确实没有 MS Project 页，
  //   那条查询留在 gscUncovered 是**正确**的真缺口。
];

function anchorStop(): Set<string> {
  return new Set(ANCHOR_STOP_RAW.map(stem));
}

/**
 * 🔴 DEBT-42 ①（2026-10-23 实施）：格式名词典。
 *
 * 种子取自 `lib/convert/pairs.ts` 的 INPUT_META / OUTPUT_META —— 站内格式词的
 * 唯一事实源，不另维护词表（那边加格式，这边自动生效）。
 *
 * 要解决的问题：查询剔掉停用词后**只剩格式名**时（"png to jpg converter"
 * → {png, jpg}），「全部实词必须命中」闸门会被任何正文提了一句格式名的页
 * 满足 —— png-to-svg 的 desc 写「Supports JPG input」就整页接住 27 个
 * png-to-jpg 变体，signature-maker 24 个、handwriting-worksheet 15 个
 * （2026-10-21 实测）。这类匹配没有语义，只有字面重合。
 *
 * 判据：格式词查询**只认 URL 本身就是该格式对的承接页** ——
 *   /c/png-to-jpg      ↔ "png to jpg converter"  ✓（URL 实词被查询全覆盖）
 *   /tools/png-to-svg  ↔ "png to jpg converter"  ✗（svg 不在查询里）
 *   /tools/signature-maker ↔ "png to jpg converter" ✗（正文只提了一嘴）
 * 对不存在的对（png-to-bmp / webp-to-gif）⇒ 无页可接 ⇒ 进 gscUncovered，
 * 由人判断「真缺口但技术不可行」，匹配器不猜。
 */
const FORMAT_STEMS: Set<string> = new Set(
  [...Object.keys(INPUT_META), ...Object.keys(OUTPUT_META)].map(stem)
);

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
  // 🔴 DEBT-40（2026-10-21）：df=0 的候选要**跳过**，不是判死整条查询。
  //   旧逻辑取 sorted[0]（最稀有）后见 df=0 直接 return null ——
  //   于是一条查询里只要含一个语料里没有的词（拼写差异 / 缩写 / 新词），
  //   其余词再能精确钉到唯一一页也永不匹配。
  //   精度不受影响：matchCorpus 的「全部实词必须命中」闸门会拦下任何
  //   含 df=0 词的查询（没有任何页能含它）—— 锚侧的 df=0 检查本就是冗余的，
  //   它唯一的作用就是把好查询一起判死。
  for (const [word, count] of sorted) {
    if (count === 0) continue; // 语料没有的词：不当锚，但别连坐其他词
    // 🔴 且必须够稀有：df 过大说明它仍是个泛词（like / create 这类），
    // 用它当锚会匹配到几十个不相干的页。
    // （升序遍历 ⇒ 第一个非 0 即最小 df；它都 >40 说明全部 >40。）
    if (count > 40) return null;
    return word;
  }
  return null;
}

function matchCorpus(
  term: string,
  corpus: CorpusEntry[],
  anchor: string | null,
  df: Map<string, number>
): Match[] {
  const t = tokens(term);
  // 🔴 DEBT-40（2026-10-21）：单实词查询也要能匹配。
  //   旧门槛 `t.size < 2` 把剔掉功能词后只剩一个主题词的查询一律判死 ——
  //   "is intellij free" / "is intellij no longer free"（合计 38 曝光）全中，
  //   而站内恰恰有 /l/intellij-alternative 这页专门回答它。
  //   精度由锚的 df∈(0,40] 兜底：单词查询只有在该词足够稀有时才锚定，
  //   泛词（pdf/tool/convert）df 超 40 ⇒ 锚不上 ⇒ 仍不匹配。
  if (t.size < 1) return [];

  // 🔴🔴 anchor === null 意味着「这条查询剔掉高频泛词后没有主题词」，
  // 它无法被可靠归属到任何页 —— 必须直接不匹配。
  // 早先写成 `if (anchor && !ct.has(anchor)) continue`，null 时约束整个失效，
  // 于是 "google workspace free alternative" 又落回 id-photo。
  // **宁可漏报不可错报**：错报会让作者去改一个不相干的页，白费一轮。
  if (!anchor) return [];

  const hits: Match[] = [];
  // DEBT-42 ①：这条查询剔掉停用词后是不是只剩格式名（png to jpg converter）。
  // 是的话只有 URL 即格式对的页有资格匹配（见 FORMAT_STEMS 注释）。
  const distinctive = [...t].filter((w) => !FORMAT_STEMS.has(w));
  const formatOnlyQuery = distinctive.length === 0;
  for (const c of corpus) {
    const ct = tokens(c.text);
    if (ct.size === 0) continue;
    if (!ct.has(anchor)) continue; // 锚必须在该页出现
    // 正文散文提一句格式名不构成承接：URL 实词必须被查询全覆盖。
    // 实测依据：改前 "png to pdf" 的 hits 是
    // [/c/png-to-pdf, /tools/handwriting-worksheet, /c/jpg-to-pdf]——
    // 后两个一个正文提 PDF、一个格式对根本不对，都是字面重合。
    if (formatOnlyQuery && !keyFullyCovered(c.key, t)) continue;

    let score = 0;
    for (const w of t) if (ct.has(w)) score++;
    const ratio = score / t.size;
    // 🔴🔴 DEBT-37（2026-10-21）：绝对门槛 `score < 3` 会**系统性杀掉短查询**。
    //   注意上面还有一道「全部实词必须命中」的闸门（missing.length > 0 ⇒ continue），
    //   所以能走到这里的 score 恒等于 t.size —— `score < 3` 等价于
    //   「查询不足 3 个实词就永不匹配」。而簇内最大的词往往是 2 词
    //   （asana alternative / zoom alternative），实测抽样 20 条里 8 条 ≤2 词
    //   ⇒ 100% 漏报，全被写进 gscUncovered 假缺口。
    //   修法：改成相对门槛 —— 有 3 个以上实词才要求 3 个，短查询按自身长度要求。
    if (score < Math.min(3, t.size) || ratio < 0.6) continue;

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

    hits.push({
      key: c.key,
      kind: c.kind,
      score,
      total: t.size,
      anchorHit: true,
      keyCovered: keyFullyCovered(c.key, t),
    });
  }
  // 🔴 DEBT-41（排序层）：同分时优先「URL 即查询」的专用承接页，再退回语料顺序。
  //   没有这道排序时工具页恒排在专用对转页前面（语料数组顺序就是 tools 在前）——
  //   实测 "png to pdf" 的 hits[0] 是 /tools/handwriting-worksheet（它的正文
  //   提了一嘴可导出 PDF/PNG），真正的承接页 /c/png-to-pdf 只能排第二；
  //   "microsoft project alternative" 的 hits[0] 则是 microsoft-visio。
  //   auto-tune 取 hits[0] 当目标路由 ⇒ 这道排序直接决定改写落到哪个页。
  return hits
    .sort(
      (a, b) =>
        b.score / b.total - a.score / b.total ||
        Number(b.keyCovered) - Number(a.keyCovered)
    )
    .slice(0, 4);
}

/**
 * 🔴 DEBT-40 待办③（2026-10-21）：gscUncovered 的「同义页存在性」二次校验。
 *
 * ①②修完后仍会有查询因为**用词不同**匹配不上（freeware / kostenlos /
 * 带年份 / 同义词替换），但它指向的主题页可能早已存在。
 * 「已存在但没匹配上」比漏报更危险 —— 它会诱导去建一个重复页
 * （10-21 动作 47「MS Project 是真缺口」正是这么差点发生的，
 *  而那页 /directory/alternatives/microsoft-project 一直好好地在站上）。
 *
 * 判据刻意保守，**只作提示、不算匹配**：查询实词与某页语料实词的
 * 交集 ≥ 2 个词。交 1 个词太弱（pdf/tool 满天飞），交 2 个词
 * 基本说明两处在讲同一件事。返回重叠最多的前 3 页。
 */
function synonymHints(
  query: string,
  pages: Array<{ key: string; t: Set<string> }>
): string[] {
  const qt = tokens(query);
  if (qt.size < 2) return [];
  const scored: Array<{ key: string; n: number }> = [];
  for (const p of pages) {
    let n = 0;
    for (const w of qt) if (p.t.has(w)) n++;
    if (n >= 2) scored.push({ key: p.key, n });
  }
  return scored.sort((a, b) => b.n - a.n).slice(0, 3).map((s) => s.key);
}

// ─────────────────────────────────────────────────────────────

async function probeSources(): Promise<void> {
  console.log("[src] 探测各源可用性…");
  const gsc = await fetchGscQueries(28);
  console.log(`[src] GSC（主源，走Vercel）: ${gsc.reachable ? "OK" : "FAIL"} — ${gsc.note}，${gsc.rows.length} 条去重查询`);
  for (const seed of ["png to jpg", "css minifier"]) {
    const r = await fetchSuggestionsForSeedsDetailed([seed]);
    const one = r.get(seed);
    if (!one) continue;
    console.log(`[src] Google Suggest "${seed}": ${one.source} n=${one.suggestions.length}${one.primaryError ? " err=" + one.primaryError : ""}`);
  }
}

async function main() {
  if (SRC_ONLY) {
    await probeSources();
    return;
  }

  const corpus = [
    ...loadToolCorpus(),
    ...loadLandingCorpus(),
    ...loadPairCorpus(),
    ...loadAlternativesCorpus(),
  ];
  // 预构建文档频率表：pickAnchor 每词重算全站 tokens 会是 O(words×pages×len)，400K 字符下不可接受
  const df = buildDf(corpus);
  // DEBT-40 待办③ 用：每页实词集合只算一次（未命中查询 × 全站页重算太贵）
  const pageToks = corpus.map((c) => ({ key: c.key, t: tokens(c.text) }));
  console.log(
    `[gap] 语料 ${corpus.length} 页 / ${corpus.reduce((n, c) => n + c.text.length, 0)} 字符`,
  );

  // 调试通道：GAP_DEBUG_Q="free asana alternatives|ms project alternative"
  // 打印每个查询的词干/锚/df/命中，用于定位「假缺口」为什么没匹配上。
  if (process.env.GAP_DEBUG_Q) {
    for (const q of process.env.GAP_DEBUG_Q.split("|").map((s) => s.trim()).filter(Boolean)) {
      const toks = [...tokens(q)];
      const anchor = pickAnchor(q, df);
      const hits = matchCorpus(q, corpus, anchor, df);
      const stop = anchorStop();
      const dfs = toks.map((w) => `${w}=${df.get(w) ?? 0}${stop.has(w) ? "(anchorStop)" : ""}`);
      console.log(
        `[dbg] "${q}" tokens=${JSON.stringify(toks)} anchor=${anchor} hits=${JSON.stringify(hits.map((h) => h.key))}`
      );
      console.log(`[dbg]    df: ${dfs.join("  ")}`);
    }
  }

  // ── 主源：GSC ──
  const gsc = await fetchGscQueries(28);
  console.log(`[gap] GSC 主源：${gsc.reachable ? "OK" : "FAIL"}（${gsc.note}），去重查询 ${gsc.rows.length}`);
  if (!gsc.reachable) {
    console.warn("[gap] ⚠️ GSC 不可达 —— 今天的依据不含你身上真实的 Google 数据，结论可信度下降");
  }

  // GSC 里与站内语料有对应页的词 →「已发生但没吃满」
  const gscMatched: Array<{ query: string; impressions: number; position: number; hits: Match[] }> = [];
  const gscUncovered: Array<{ query: string; impressions: number; position: number; synonymHints?: string[] }> = [];
  for (const row of gsc.rows) {
    const ex = screenOut(row.query);
    if (ex) continue;
    const anchor = pickAnchor(row.query, df);
    const hits = matchCorpus(row.query, corpus, anchor, df);
    if (hits.length > 0) gscMatched.push({ ...row, hits });
    else gscUncovered.push(row);
  }

  // 🔴 DEBT-40 待办③：匹配是字面的，提示是语义的 —— 别把两者混为一谈。
  for (const u of gscUncovered) {
    u.synonymHints = synonymHints(u.query, pageToks);
  }

  // ── 辅源：Google Suggest 长尾 ──
  // 🔴 2026-10-20（DEBT-29）：只拉**一轮**，来源与数据同生同死。
  //   旧版拉两轮（先全部种子产 gaps，再对前 15 个种子重捞算 tally），
  //   于是「15 个种子全部双源均失败」与「tally=google:13」能同时成立 ——
  //   tally 测的不是产出 gaps 的那批请求，等于给「静默换源」发了假许可证。
  const seeds = deriveSeeds(SEED_LIMIT);
  console.log(`[gap] Suggest 种子 ${seeds.length} 个…`);
  const suggestDetailed = await fetchSuggestionsForSeedsDetailed(seeds, { lang: "en" });
  const suggestMap = new Map<string, string[]>();
  for (const [seed, r] of suggestDetailed) suggestMap.set(seed, r.suggestions);

  const sourceTally: Record<SuggestSource, number> = { google: 0, bing: 0, none: 0 };
  for (const r of suggestDetailed.values()) sourceTally[r.source]++;
  console.log(
    `[gap] Suggest 源（全部 ${seeds.length} 个种子，与产 gaps 同一轮）：${JSON.stringify(sourceTally)}`
  );
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
    // 🔴 DEBT-42 修法②（2026-10-22 实施）：tuneTargets 只归因 hits[0]。
    //   旧逻辑把 4 个命中页全挂上这个词 ⇒ 散文提及格式名的假匹配（如 g suite 词挂到
    //   ableton-live、png-to-jpg 变体挂到 png-to-svg）会把 tuneTargets 撑爆，
    //   人工按报表改文案就会被误导。DEBT-40/41 修完后 hits[0] 已由 keyCovered 排到
    //   专用承接页（auto-tune 写入侧本就只取 hits[0]），报表侧必须与写入侧同口径。
    //   hits[1..3] 仍保留在 gscMatched 段供人工复核（看正确承接页是否在列），不进 tune 报表。
    const top = hits[0];
    const arr = byTarget.get(top.key) || [];
    if (!arr.some((x) => x.term === term)) {
      arr.push({ term, words: term.split(/\s+/).length });
    }
    byTarget.set(top.key, arr);
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
      alternatives: corpus.filter((c) => c.kind === "alternatives").length,
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
  console.log("─── GSC 里有但站内无对应页（真缺口？先看同义页提示）───");
  for (const u of gscUncovered.slice(0, 15)) {
    const hint = u.synonymHints?.length ? `  [疑似同义页: ${u.synonymHints.join(", ")}]` : "";
    console.log(`  imp=${String(u.impressions).padStart(4)} pos=${u.position.toFixed(1).padStart(5)}  ${u.query}${hint}`);
  }
  const hinted = gscUncovered.filter((u) => (u.synonymHints?.length ?? 0) > 0);
  if (hinted.length > 0) {
    console.log(`  （${hinted.length}/${gscUncovered.length} 条未命中带同义页提示 —— 别急着建新页，先看那页）`);
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