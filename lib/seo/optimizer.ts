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

/** 保守改写标题：若目标词未出现在当前标题，则把「目标词」前置为卖点短语 */
export function optimizeTitle(current: string, query: string, siteName: string): string {
  const c = current.trim();
  const q = query.trim();
  if (!q || c.toLowerCase().includes(q.toLowerCase())) return c; // 已含该词则不改
  // 取查询中的核心名词短语，去掉语气词，构造自然标题
  const phrase = q.replace(/\b(free|online|best|the|a|an)\b/gi, "").replace(/\s+/g, " ").trim();
  if (!phrase) return c;
  const brand = c.includes("|") ? c.slice(c.indexOf("|")) : `| ${siteName}`;
  return `${capitalize(phrase)} ${brand}`.trim();
}

/** 保守改写描述：在原文前补一句点题句（含目标词），不覆盖原文价值信息 */
export function optimizeDescription(current: string, query: string): string {
  const c = current.trim();
  const q = query.trim();
  if (!q || c.toLowerCase().includes(q.toLowerCase())) return c;
  const lead = `Looking for ${q}? `;
  return (lead + c).slice(0, 320);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
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
          const proposedTitle = `${capitalize(seed)} — Free Online Tool | Craftisle`;
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
