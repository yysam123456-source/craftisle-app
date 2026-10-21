/**
 * 自动优化器 v1（分析 → 改站，安全可审计）
 * ───────────────────────────────────────────────
 * 把差距分析产出的 ActionItem 转成针对本仓库页面的「真实编辑操作」：
 *   - optimize_ctr / push_position：改写承接页 title/description（基于真实当前值 + 真实目标词）
 *   - build_page：为缺失种子生成新落地页元数据骨架
 *   - index_fix：标记需在 GSC 侧处理（不自动改代码）
 *
 * 安全护栏（默认 dry-run）：
 *   - dryRun=true（默认）：只产出计划 + 预览 diff，不动任何文件
 *   - dryRun=false：先备份 page-meta.ts，写回，tsc 校验，失败自动回滚，追加审计日志
 *
 * 不编造：标题/描述改写基于「真实当前值 + 真实目标查询」，模板保守；
 *         新页面骨架的 route/title 来自真实种子词。
 */

import { ActionItem, ClusterGap } from "./topical-gaps";
import { PAGE_META, PageMeta } from "./page-meta";

export interface OptimizationEdit {
  actionId: string;
  kind: ActionItem["kind"];
  route: string; // 目标路由（由 pageUrl 解析；build_page 为新建路由）
  field: "title" | "description" | "create";
  current: string;
  proposed: string;
  rationale: string;
  potentialClicks: number;
  potentialValue: number;
}

export interface OptimizationPlan {
  generatedAt: string;
  dryRun: boolean;
  edits: OptimizationEdit[];
  /** 无法自动落地的行动（需人工 / GSC 侧处理） */
  deferred: Array<{ actionId: string; kind: ActionItem["kind"]; reason: string }>;
  totalPotentialClicks: number;
  totalPotentialValue: number;
}

/** 自动优化落地到数据库覆盖层所需的单条记录 */
export interface PageMetaOverrideInput {
  route: string;
  title?: string;
  description?: string;
  provenance: "generated" | "verified" | "recommended";
  lastOptimized: string;
}

/**
 * 把优化计划中的编辑折叠成「按路由」的数据库覆盖记录。
 * 同一路由的 title/description 编辑合并为一条（与 applyEditsToMeta 的去重逻辑一致）；
 * build_page（field="create"）不回写现有注册表，跳过。
 */
export function buildOverridesFromEdits(edits: OptimizationEdit[]): PageMetaOverrideInput[] {
  const map = new Map<string, PageMetaOverrideInput>();
  for (const e of edits) {
    if (e.field === "create") continue;
    let o = map.get(e.route);
    if (!o) {
      o = { route: e.route, provenance: "generated", lastOptimized: new Date().toISOString() };
      map.set(e.route, o);
    }
    if (e.field === "title") o.title = e.proposed;
    else if (e.field === "description") o.description = e.proposed;
  }
  return [...map.values()];
}

/** 从 GSC page URL 解析本仓库路由（去 host，保留 path） */
export function pageUrlToRoute(pageUrl?: string): string | null {
  if (!pageUrl) return null;
  try {
    const u = new URL(pageUrl);
    return u.pathname === "" ? "/" : u.pathname;
  } catch {
    return null;
  }
}

/**
 * 品牌门面路由:自动优化器永不改写其 title/description。
 * 主页承载全站品牌与 200+ 查询的泛意图,为一个长尾查询改写门面标题必然净负
 * (曾发生:主页标题被改写为仓库名 "Boona13/mykonos-island-voxels")。
 */
export const PROTECTED_ROUTES: ReadonlySet<string> = new Set(["/"]);

/** SERP 展示上限。标题还要留出品牌后缀空间（` | Craftisle` = 13 字符）。 */
const TITLE_MAX = 60;
const DESC_MAX = 160;

/**
 * 轻量词干：供身份词覆盖判定用（resizer→resiz、resize→resiz、minifier→minifi）。
 * 只求「同一词族」，不追求语言学的正确性 —— 判错的方向是「放行」，
 * 而放行等于回到无保护的旧行为，不会制造新的错配。
 */
function stemWord(w: string): string {
  return w.toLowerCase().replace(/(ers|er|or|s)$/i, "").replace(/e$/i, "");
}

/**
 * 改写标题：把目标长尾词**并入**原标题，而不是简单前置。
 *
 * 🔴 2026-10-15 重写。旧实现是「前缀 + 原标题」，实测 8 个真实长尾词 **8/8 有问题**：
 *   "letter b handwriting practice" → "Letter b handwriting practice — Handwriting Practice Shee…"
 *      原标题被砍 12 字符，且被截掉的正是最有价值的后半段（Worksheets）。
 *   "css minifier online free" → 剥掉 free/online 后只剩 "Css minifier"，
 *      产出 "Css minifier — CSS Minifier — Minify CSS Online…"，目标词与原标题重复。
 *
 * 三个致命缺陷：
 *   1. 前缀叠加后超长 ⇒ 直接 slice 截断原文，而被截的往往是价值最高的后半段
 *   2. 剥掉 free/online/best 时，**区分性修饰词**（"60 seconds"、"to 100kb"、
 *      "without watermark"）也被当语气词丢掉 —— 而那恰恰是长尾的全部价值
 *   3. 大小写破碎（"Css"）+ 语义重复（CSS Minifier 出现两次）
 *
 * 新策略：原标题已够长时**不叠加**（让它保持完整，交给描述层承接该词）；
 * 原标题较短时才合并，并去掉与目标词同义的头部。
 */
export function optimizeTitle(current: string, query: string, siteName: string): string {
  const brandToken = `| ${siteName}`;
  const c = current.includes(brandToken)
    ? current.slice(0, current.indexOf(brandToken)).trim()
    : current.replace(/\s*\|\s*.*$/, "").trim();
  const q = query.trim().toLowerCase();
  if (!q || c.toLowerCase().includes(q)) return c;

  // 🔴 只剥语气词，不剥区分性修饰词
  const phrase = titleCase(
    query
      .replace(/\b(free|online|best|the|a|an)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  if (!phrase) return c;
  if (c.toLowerCase().includes(phrase.toLowerCase())) return c;

  // 原标题已经**很长**（≥70，必然在 SERP 被截）⇒ 叠加只会让它更糟。
  // 此时不动标题，让描述层承接这个词 —— 一个完整但未优化的标题，胜过一个被截断的。
  // 🔴 门槛曾是 TITLE_MAX-12=48，实测把 6/8 个标题全判为"太长"而放弃调优（等于没调）。
  // 正确做法是**先试合并再判长度**：多数标题合并后仍 ≤60，只有极少数极长的才放弃。
  if (c.length >= 72) return c;

  // 去掉与目标词**语义重叠**的头部，避免产出
  // "Resize Image To 100kb — Image Resizer — Resize Image to Exact…" 这种同义反复。
  // 规则：头部去掉语气词后，若与目标词有 ≥60% 的词重合，或头部本身就是目标词的子串，
  // 就丢掉头部（它是同一个意思），保留更有信息量的尾部。
  const pLower = phrase.toLowerCase();
  const pTokens = pLower.split(/\s+/).filter((w) => w.length > 2);

  // 🔴 DEBT-43（2026-10-21）：**身份词保护**。
  // 头段里的 converter/generator/maker/editor/viewer 这类词是页面身份
  // （"这是什么工具"），不是与目标词重复。头段含身份词而目标词没覆盖它时，
  // 丢头段就会把身份一起丢 ——
  //   "Seconds to Time Converter Free — Online Tool" + "seconds to time format"
  //   ⇒ "Seconds To Time Format — Online Tool"（Converter 没了）
  // 此时不动标题（完整但未优化 > 被截断/被删身份），交给描述层承接该词。
  const IDENTITY_RE =
    /\b(converter|generator|maker|editor|viewer|resizer|compressor|downloader|uploader|checker|formatter|minifier|encoder|decoder|extractor|analyzer)\b/i;
  const sepIdxForId = c.search(/ — | - |: /);
  const headForId = sepIdxForId > 0 ? c.slice(0, sepIdxForId) : c;
  const headIdentity = headForId.match(IDENTITY_RE)?.[0];
  if (headIdentity) {
    // 判据按词干+前缀比对：resize↔resizer、minify↔minifier、convert↔converter 算覆盖。
    // （只比词干不够：resize 的词干是 resiz、minify 的词干是 minify，拼写形态不一致；
    //   加「前 4 字符相同」兜底 —— 误放行只会回到「无保护」的旧行为，不会出新错。）
    const idStem = stemWord(headIdentity);
    const covered = pTokens.some((w) => {
      const s = stemWord(w);
      return (
        s === idStem ||
        s.startsWith(idStem) ||
        idStem.startsWith(s) ||
        s.slice(0, 4) === idStem.slice(0, 4)
      );
    });
    if (!covered) return c;
  }

  let tail = c;
  for (const sep of [" — ", " - ", ": "]) {
    const idx = c.indexOf(sep);
    if (idx <= 0) continue;
    const head = c.slice(0, idx).trim();
    const headCore = head
      .toLowerCase()
      .replace(/\b(free|online|tool|generator|maker|converter)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (headCore.length <= 4) continue;

    const hTokens = headCore.split(/\s+/).filter((w) => w.length > 2);
    const shared = hTokens.filter((w) => pTokens.includes(w)).length;
    const overlapRatio = hTokens.length ? shared / hTokens.length : 0;

    if (
      pLower.includes(headCore) ||
      headCore.includes(pLower) ||
      overlapRatio >= 0.6
    ) {
      tail = c.slice(idx + sep.length).trim();
      break;
    }
  }

  // 🔴 尾部开头若仍与目标词首词重复（"Resize Image to 100kb — Resize Image to Exact…"），
  // 去掉这段重复，否则标题前半段会全是同一个词
  const firstPhraseWord = pTokens[0];
  if (firstPhraseWord) {
    const lowerTail = tail.toLowerCase();
    const idx2 = lowerTail.indexOf(firstPhraseWord);
    if (idx2 > 0 && idx2 < 14) {
      // 重复出现在很靠前 ⇒ 多半是同一短语的延续，切到它之后
      const after = tail.slice(idx2);
      const sepIdx = after.search(/[—–\-:]/);
      if (sepIdx > 0) tail = after.slice(sepIdx + 1).trim();
    }
  }

  const combined = `${phrase} — ${tail}`;
  if (combined.length <= TITLE_MAX) return combined;

  // 🔴 超长时截**尾部**（原标题的补充说明），保留「目标词 + 核心头部」
  const room = TITLE_MAX - phrase.length - 3;
  if (room >= 14) {
    const kept = tail.slice(0, room).replace(/[\s—–-]+$/, "");
    if (kept.length >= 14) return `${phrase} — ${kept}`;
  }
  return phrase.slice(0, TITLE_MAX - 1).replace(/[\s—–-]+$/, "") + "…";
}

/**
 * 改写描述：在**长度预算内**把目标词写进去。
 *
 * 🔴 2026-10-15 重写。旧实现是 `"Looking for " + q + "? " + 原描述`，实测 5 个真实长尾词
 * **5/5 全部超 160 字符**（+23 ~ +34）—— 而 `.slice(0, 320)` 这个上限远高于 SERP 的 160，
 * 等于没有护栏。SERP 截断时切掉的正是原描述的价值信息。
 *
 * 新策略：算预算 → 放得下才前置；放不下就不改。
 * 描述层的长度价值高于多一个关键词：超限的描述在 SERP 里和没写一样。
 */
export function optimizeDescription(current: string, query: string): string {
  const c = current.trim();
  const q = query.trim();
  if (!q || c.toLowerCase().includes(q.toLowerCase())) return c;
  if (c.length > DESC_MAX) return c; // 原描述已超限，不叠加

  const lead = `${titleCase(q)} — `;
  // 🔴 预算不足 60 字符时改写会挤掉原描述的大半价值 ⇒ 不改
  if (DESC_MAX - lead.length < 60) return c;

  return (lead + c).slice(0, DESC_MAX);
}

/** 逐词大小写：缩写词保持全大写（CSS/JPEG/PDF…），其余首字母大写。 */
const ACRONYMS = new Set([
  "css", "html", "pdf", "jpg", "jpeg", "png", "svg", "webp", "avif", "heic", "bmp",
  "gif", "url", "seo", "utf", "json", "xml", "api", "ai", "ui", "ux", "ocr", "wav", "mp3", "sql",
]);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .map((w) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (/^[A-Z]{2,5}$/.test(w)) return w; // 本来就是缩写
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/**
 * 由分析结果生成优化计划（不写文件）。
 */
export function buildOptimizationPlan(
  clusters: ClusterGap[],
  meta: Record<string, PageMeta> = PAGE_META,
): OptimizationPlan {
  const bestEdit = new Map<string, OptimizationEdit>();
  const deferred: OptimizationPlan["deferred"] = [];

  // 同一路由的多条 title/description 编辑按「潜在价值最高」折叠为一条，
  // 避免应用阶段后写覆盖前写、静默丢失优化（页面只承载一个最终标题/描述）。
  const keepBest = (key: string, e: OptimizationEdit) => {
    const prev = bestEdit.get(key);
    if (!prev || e.potentialValue > prev.potentialValue ||
        (e.potentialValue === prev.potentialValue && e.potentialClicks > prev.potentialClicks)) {
      bestEdit.set(key, e);
    }
  };

  for (const cluster of clusters) {
    for (const a of cluster.actions) {
      if (a.kind === "index_fix") {
        deferred.push({ actionId: a.id, kind: a.kind, reason: "需在 GSC 侧添加 property / 提交 sitemap，不自动改代码。" });
        continue;
      }
      if (a.kind === "build_page") {
        // 为缺失种子生成新落地页骨架（route 由 target 解析种子词）
        const seeds = extractSeedsFromTarget(a.target);
        for (const seed of seeds.slice(0, 3)) {
          const route = `/l/${slugify(seed)}`;
          const proposedTitle = `${capitalize(seed)} — Free Online Tool`;
          const proposedDesc = `Free online ${seed}. No signup, 100% client-side, private.`;
          keepBest(`${route}|${a.id}|${seed}`, {
            actionId: `${a.id}-${slugify(seed)}`,
            kind: "build_page",
            route,
            field: "create",
            current: "(新页面)",
            proposed: proposedTitle,
            rationale: `覆盖零曝光种子「${seed}」，承接该高意图查询。`,
            potentialClicks: Math.round(a.potentialClicks / Math.max(1, seeds.length)),
            potentialValue: Math.round((a.potentialValue / Math.max(1, seeds.length)) * 100) / 100,
          });
        }
        continue;
      }
      // optimize_ctr / push_position：改写承接页 title/description
      const route = pageUrlToRoute(a.pageUrl) ?? fallbackRoute(cluster.siteSlug);
      if (PROTECTED_ROUTES.has(route)) {
        deferred.push({ actionId: a.id, kind: a.kind, reason: `路由 ${route} 为品牌门面(PROTECTED_ROUTES),不参与自动改写。` });
        continue;
      }
      const current = meta[route];
      if (!current) {
        deferred.push({ actionId: a.id, kind: a.kind, reason: `路由 ${route} 不在 page-meta 注册表，需先接入集中元数据或人工指定页面。` });
        continue;
      }
      const query = extractQueryFromAction(a);
      const proposedTitle = optimizeTitle(current.title, query, cluster.siteName);
      const proposedDesc = optimizeDescription(current.description, query);
      if (proposedTitle !== current.title) {
        keepBest(`${route}|title`, {
          actionId: a.id, kind: a.kind, route, field: "title",
          current: current.title, proposed: proposedTitle,
          rationale: `针对「${query}」优化标题，提升该高意图查询的搜索点击率。`,
          potentialClicks: a.potentialClicks, potentialValue: a.potentialValue,
        });
      }
      if (proposedDesc !== current.description) {
        keepBest(`${route}|description`, {
          actionId: a.id, kind: a.kind, route, field: "description",
          current: current.description, proposed: proposedDesc,
          rationale: `针对「${query}」优化描述，点出用户真实意图。`,
          potentialClicks: a.potentialClicks, potentialValue: a.potentialValue,
        });
      }
    }
  }

  const edits = [...bestEdit.values()];

  const totalPotentialClicks = edits.reduce((s, e) => s + e.potentialClicks, 0);
  const totalPotentialValue = Math.round(edits.reduce((s, e) => s + e.potentialValue, 0) * 100) / 100;
  return { generatedAt: new Date().toISOString(), dryRun: true, edits, deferred, totalPotentialClicks, totalPotentialValue };
}

function extractQueryFromAction(a: ActionItem): string {
  // target 形如「重写 X 承接页 title/description（url）」或「优化承接页（url）」
  const m = a.target.match(/重写\s+(.+?)\s+承接页/);
  if (m) return m[1].trim();
  // push_position 的 detail 里有「将「X」从 P..」
  const m2 = a.detail.match(/将「(.+?)」从/);
  if (m2) return m2[1].trim();
  return "";
}

function extractSeedsFromTarget(target: string): string[] {
  // target: 「新建落地页覆盖：a / b / c」
  const m = target.match(/覆盖：(.+)$/);
  if (!m) return [];
  return m[1].split("/").map((s) => s.trim()).filter(Boolean);
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function fallbackRoute(siteSlug: string): string {
  const map: Record<string, string> = {
    craftisle: "/tools", pdf: "/tools", resume: "/tools", viewer: "/tools",
    whiteboard: "/tools", imgprompt: "/tools", games: "/game", fxlab: "/tools/craftisle-dev-tools",
  };
  return map[siteSlug] ?? "/tools";
}

/**
 * 把注册表序列化为完整 page-meta.ts 源（确定性、可 tsc 校验）。
 * 整文件重写比正则替换更稳妥，避免破坏文件结构。
 */
export function serializePageMeta(meta: Record<string, PageMeta>): string {
  const routes = Object.keys(meta).sort();
  const blocks = routes.map((route) => {
    const m = meta[route];
    const provenance = m.provenance === "verified" ? "verified" : m.provenance === "recommended" ? "recommended" : "generated";
    const lastOpt = m.lastOptimized ? `"${m.lastOptimized}"` : "null";
    return `  "${route}": {
    route: "${route}",
    title: ${JSON.stringify(m.title)},
    description: ${JSON.stringify(m.description)},
    provenance: "${provenance}",
    lastOptimized: ${lastOpt},
  },`;
  });
  return `/**
 * 集中式 SEO 元数据注册表（自动优化器重写）
 * 本文件由自动优化器（scripts/auto-optimize.ts / Vercel Cron /api/cron/auto-optimize）整体重写。
 * 手工修改亦可；PageMeta 接口定义在本文件内，避免循环依赖（不自我 import）。
 */

export interface PageMeta {
  route: string;
  title: string;
  description: string;
  provenance: "verified" | "recommended" | "generated";
  lastOptimized: string | null;
}

export const PAGE_META: Record<string, PageMeta> = {
${blocks.join("\n")}
};

export function getPageMeta(route: string): PageMeta | undefined {
  return PAGE_META[route];
}
`;
}

/**
 * 纯函数：把编辑应用到注册表副本，返回新注册表 + 应用计数 + 错误。
 * 不触碰文件系统，便于测试，也被 applyOptimizationPlan 与 Vercel Cron 复用。
 */
export function applyEditsToMeta(
  currentMeta: Record<string, PageMeta>,
  edits: OptimizationEdit[],
): { meta: Record<string, PageMeta>; applied: number; errors: string[] } {
  const meta: Record<string, PageMeta> = JSON.parse(JSON.stringify(currentMeta));
  let applied = 0;
  const errors: string[] = [];
  for (const e of edits) {
    if (e.field === "create") {
      errors.push(`create 类编辑「${e.route}」需生成页面文件，本次仅记录，未写入注册表。`);
      continue;
    }
    const cur = meta[e.route];
    if (!cur) {
      errors.push(`路由 ${e.route} 不在注册表，跳过 ${e.field}。`);
      continue;
    }
    if (e.field === "title") cur.title = e.proposed;
    else if (e.field === "description") cur.description = e.proposed;
    cur.lastOptimized = new Date().toISOString();
    cur.provenance = "generated";
    applied++;
  }
  return { meta, applied, errors };
}

/**
 * 应用优化计划（写回 page-meta.ts）。
 * @param fs 注入文件系统（便于测试）
 * @param runTsc 注入 tsc 校验（便于测试）；默认不校验
 * 安全：先备份，整文件重写，tsc 校验，失败回滚，追加审计日志。
 */
export async function applyOptimizationPlan(
  plan: OptimizationPlan,
  opts: {
    filePath: string;
    fs: any;
    currentMeta: Record<string, PageMeta>;
    runTsc?: (editedSource: string) => Promise<{ ok: boolean; output: string }>;
  },
): Promise<{ applied: number; backupPath: string | null; rolledBack: boolean; skippedDryRun?: boolean; errors: string[] }> {
  const { filePath, fs, currentMeta, runTsc } = opts;
  const errors: string[] = [];

  // 安全护栏：计划为 dry-run 时绝不写回文件，仅返回预览。
  // 调用方（脚本）必须在确认 --apply 后显式传 dryRun:false 的副本。
  if (plan.dryRun) {
    return {
      applied: 0, backupPath: null, rolledBack: false, skippedDryRun: true,
      errors: ["计划为 dry-run，未写回文件（调用方应在对齐 --apply 后传 dryRun:false）。"],
    };
  }
  if (plan.edits.length === 0) return { applied: 0, backupPath: null, rolledBack: false, errors: ["无编辑可应用。"] };

  // 复用纯函数应用编辑（克隆 + 改写），保留下方的备份/回滚/审计护栏
  const { meta, applied, errors: applyErrors } = applyEditsToMeta(currentMeta, plan.edits);
  if (applyErrors.length) errors.push(...applyErrors);

  if (applied === 0) {
    return { applied: 0, backupPath: null, rolledBack: false, errors: ["没有任何字段被改写。"].concat(errors) };
  }

  // 1. 备份
  const backupPath = `${filePath}.bak-${Date.now()}`;
  try {
    fs.copyFileSync(filePath, backupPath);
  } catch (e: any) {
    return { applied: 0, backupPath: null, rolledBack: false, errors: [`备份失败：${e?.message}`] };
  }

  // 2. 整文件重写
  const newSrc = serializePageMeta(meta);
  try {
    fs.writeFileSync(filePath, newSrc, "utf8");
  } catch (e: any) {
    try { fs.copyFileSync(backupPath, filePath); } catch { /* ignore */ }
    return { applied: 0, backupPath, rolledBack: true, errors: [`写回失败：${e?.message}`] };
  }

  // 3. tsc 校验（写入临时文件校验语法，避免污染）
  if (runTsc) {
    const res = await runTsc(newSrc);
    if (!res.ok) {
      try { fs.copyFileSync(backupPath, filePath); } catch { /* ignore */ }
      return { applied: 0, backupPath, rolledBack: true, errors: [`tsc 校验失败，已回滚：\n${res.output}`].concat(errors) };
    }
  }

  // 4. 审计日志
  try {
    const logPath = `${filePath}.audit.log`;
    fs.appendFileSync(logPath, `${new Date().toISOString()} applied=${applied} edits=${plan.edits.length}\n`);
  } catch { /* 审计日志失败不致命 */ }

  return { applied, backupPath, rolledBack: false, errors };
}
