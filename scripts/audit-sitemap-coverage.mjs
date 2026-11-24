#!/usr/bin/env node
/**
 * audit-sitemap-coverage.mjs — 「有曝光但不在 sitemap」反查护栏
 *
 * 为什么必须有这个护栏（2026-11-24 新增）：
 *   审计 A3 IndexGuard 规划时发现，craftisle 自家就带着这个缺陷：
 *   `/directory/compare/*` 对比页**有真实 GSC 曝光**（实测 11 页、合计 125 imp，
 *   其中 `/directory/compare/jetbrains-intellij-idea/...` 单页 55 imp），
 *   但 `app/sitemap.ts` 只生成 `/directory/alternatives/*` 与 `/l/*`
 *   ⇒ **compare 页零 sitemap URL**。
 *
 *   这类缺陷的特征是：**它不会让构建失败、不会让 lint 报警、也不会让
 *   `audit:sitemap` 报警**（那个脚本查的是「sitemap 里的 URL 会不会 404」，
 *   方向相反——它不管「有价值的 URL 有没有进 sitemap」）。
 *
 *   传统的 sitemap 工具（Screaming Frog / Ahrefs）能查，但那是外部工具；
 *   A3 要做的是「自动化体检」，这个检查必须是自己的一等公民。
 *
 * 判据：
 *   有 GSC 曝光的 URL  ⇒  必须出现在 sitemap 的 <loc> 集合里。
 *   反之（sitemap 收了但没曝光）不算问题——那只是「还没起量」，不是缺陷。
 *
 * 用法：
 *   node scripts/audit-sitemap-coverage.mjs            （或 pnpm audit:sitemap-coverage）
 *   node scripts/audit-sitemap-coverage.mjs --cache <dir>   （本机出网被阻断时读预灌缓存）
 *
 * 退出码：0 = 无「有曝光未收录」缺口；1 = 存在缺口（可用于 CI 门禁）。
 *
 * 设计取舍：
 *   - 数据源有二：线上 sitemap XML + GSC pages 端点。
 *   - 本机出网常被 TLS 中断 ⇒ 支持 GROWTH_CACHE_DIR 预灌缓存（与 growth-review 同一契约）。
 *   - **只报缺口，不改 sitemap** —— 加 URL 进 sitemap 是内容决策，不是本脚本该做的。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API = process.env.GROWTH_API || "https://craftisle.com";
const CACHE_DIR = process.env.GROWTH_CACHE_DIR
  ? path.resolve(process.env.GROWTH_CACHE_DIR)
  : null;

/** 参与判定的站（与台账口径一致：craftisle 主站）。 */
const SITE = "craftisle";
const SITE_HOST = "craftisle.com";

/**
 * 🔴 豁免名单：这些路径**故意不进 sitemap**，报出来是噪声。
 *   - /blog/*       博客页由 contentlayer 管理，sitemap 另有批次生成（不在本护栏判定范围）
 *   - /api/*        接口路由，本来就不是页面
 *   - /tools/*      工具页走另一条 sitemap 路径策略，本护栏只判主战场
 */
const EXEMPT_PREFIXES = ["/api/", "/_next/", "/blog/"];

/**
 * 冻结词族：有曝光但属既定不追的簇（如 intellij / MS Project），不报为缺口。
 *
 * 🔴 连字符与空格都要覆盖：`microsoft-project`（URL 形态）与 `microsoft project`（词形态）
 *   是同一个冻结簇。11-24 首版只写了 `microsoft\s+project`，导致 URL 里的
 *   `/directory/compare/microsoft-project/asana` 被漏判成「可行动」。
 *   ⇒ 统一用 `[\s-]+` 连接。
 */
const FROZEN_FAMILY_RE =
  /intellij|idea[\s-]+community|jetbrains|ms[\s-]+project|microsoft[\s-]+project|sudoku|sokudo|sedoku|sudpoku|20248|free[\s-]+design[\s-]+studio|free[\s-]+xd|totb0311|pokeapi/i;

/**
 * 🔴 最低曝光阈值（2026-11-24 加）：低于此值不报为缺口。
 *
 *   理由：11-24 首次实测时，10 个「可行动」缺口里 **8 个只有 1~3 曝光**、
 *   位次 P15~P91 散布 —— 这是 GSC 的低样本噪声，不是「有价值的页没被收录」。
 *   若把它们全报成 P0，这个护栏会天天误报，几天内就会被当成噪声忽略，
 *   真正的高价值缺口反而被淹没（这正是 MEMORY 里「告警白名单」被冻结的原因）。
 *
 *   取 10 的依据与 growth-review.ts 的 MIN_IMPRESSIONS 一致：
 *   曝光个位数时 position 抖动极大，同一个 P17 今天 P23 完全可能，
 *   不具备可行动性。**低于 10 曝光的页仍记录在报告里，只是不报 P0。**
 */
const MIN_IMPRESSIONS = 10;

// ── 取数（带缓存回退）────────────────────────────────────────────────────
async function fetchText(url, timeoutMs = 30_000) {
  // 缓存键名契约与 growth-review.ts 一致：path.replace(/[^a-z0-9]+/gi, "_")，
  // **末尾不保留斜杠转成的下划线**（11-23 实测：带尾下划线的旧文件不被识别）。
  if (CACHE_DIR) {
    const key = url.replace(/^https?:\/\/[^/]+/, "").replace(/[^a-z0-9]+/gi, "_");
    const f = path.join(CACHE_DIR, key + ".txt");
    if (fs.existsSync(f)) {
      console.error(`[audit:sitemap-coverage] 使用缓存 ${f}`);
      return fs.readFileSync(f, "utf-8");
    }
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    console.error(`[audit:sitemap-coverage] 请求失败 ${url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function fetchJson(url, timeoutMs = 30_000) {
  if (CACHE_DIR) {
    const key = url.replace(/^https?:\/\/[^/]+/, "").replace(/[^a-z0-9]+/gi, "_");
    const f = path.join(CACHE_DIR, key + ".json");
    if (fs.existsSync(f)) {
      console.error(`[audit:sitemap-coverage] 使用缓存 ${f}`);
      return JSON.parse(fs.readFileSync(f, "utf-8"));
    }
  }
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`[audit:sitemap-coverage] 请求失败 ${url}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

// ── 1. 取 sitemap 的 <loc> 集合 ─────────────────────────────────────────
/**
 * 解析 sitemap XML 里的所有 <loc>。
 *
 * 🔴 两种 sitemap 形态都要处理：
 *   1) 直接的 <url><loc>…</loc></url>（urlset）
 *   2) sitemap 索引 <sitemapindex><sitemap><loc>…</loc></sitemap></sitemapindex>
 *      —— 此时 loc 是**另一个 sitemap 文件**，需要再取一层。
 *   实战中 craftisle.com/sitemap.xml 是索引形态（MEMORY.md 11-12 记录过
 *   「robots 指向的是 sitemap 索引，首个 <loc> 本身就是 .xml」）。
 */
function parseLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].trim());
}

async function collectSitemapLocs(entryUrl, depth = 0, seen = new Set()) {
  if (depth > 2 || seen.has(entryUrl)) return new Set();
  seen.add(entryUrl);
  const xml = await fetchText(entryUrl);
  if (!xml) return new Set();
  const locs = parseLocs(xml);
  const out = new Set();

  // 索引形态：loc 指向 .xml ⇒ 递归取下一层
  const childXmls = locs.filter((l) => l.endsWith(".xml"));
  const pageLocs = locs.filter((l) => !l.endsWith(".xml"));
  for (const p of pageLocs) out.add(p);

  if (childXmls.length > 0) {
    for (const c of childXmls) {
      const sub = await collectSitemapLocs(c, depth + 1, seen);
      for (const s of sub) out.add(s);
    }
  }
  return out;
}

// ── 2. 主流程 ───────────────────────────────────────────────────────────
async function main() {
  const line = "─".repeat(64);
  console.log(line);
  console.log("audit:sitemap-coverage — 有曝光未收录反查");
  console.log(line);

  const sitemapUrl = `${API}/sitemap.xml`;
  const sitemapLocs = await collectSitemapLocs(sitemapUrl);
  if (sitemapLocs.size === 0) {
    console.error(
      "[audit:sitemap-coverage] ❌ 取不到 sitemap 的 <loc> 集合 —— 无法判定，本次不产出任何结论。",
    );
    console.error(
      "  （本机出网常被 TLS 中断 ⇒ 可预灌缓存：把 sitemap XML 存成 " +
        `${CACHE_DIR ?? "<GROWTH_CACHE_DIR>"}/sitemap_xml.txt）`,
    );
    process.exit(1);
  }
  console.log(`sitemap 收录 URL：${sitemapLocs.size} 条`);

  const pagesRaw = await fetchJson(`${API}/api/analytics/pages?site=${SITE}`);
  const pages = Array.isArray(pagesRaw?.pages) ? pagesRaw.pages : null;
  if (!pages) {
    console.error(
      "[audit:sitemap-coverage] ❌ 取不到 GSC pages 数据 —— 无法判定，本次不产出任何结论。",
    );
    process.exit(1);
  }
  console.log(
    `GSC 页面数据：${pages.length} 页（latestWeek=${pagesRaw.latestWeek ?? "?"}）`,
  );

  // 把 sitemap 的 loc 归一化成 pathname 集合，便于比对
  const sitemapPaths = new Set();
  for (const loc of sitemapLocs) {
    try {
      const u = new URL(loc);
      if (u.hostname.endsWith(SITE_HOST)) sitemapPaths.add(u.pathname.replace(/\/$/, "") || "/");
    } catch {
      /* 忽略非法 URL */
    }
  }
  console.log(`sitemap 中属于 ${SITE_HOST} 的路径：${sitemapPaths.size} 条`);
  console.log(line);

  // ── 3. 判定：有曝光但不在 sitemap ─────────────────────────────────────
  const gaps = [];
  const skipped = [];
  for (const p of pages) {
    const url = String(p.page ?? "");
    let pathname;
    try {
      pathname = new URL(url).pathname.replace(/\/$/, "") || "/";
    } catch {
      continue;
    }
    if (EXEMPT_PREFIXES.some((x) => pathname.startsWith(x))) {
      skipped.push({ pathname, reason: "豁免前缀", impressions: p.impressions ?? 0 });
      continue;
    }
    if (sitemapPaths.has(pathname)) continue;

    const frozen = FROZEN_FAMILY_RE.test(pathname) || FROZEN_FAMILY_RE.test(url);
    gaps.push({
      pathname,
      impressions: p.impressions ?? 0,
      clicks: p.clicks ?? 0,
      position: p.position ?? null,
      queryCount: p.queryCount ?? 0,
      frozenFamily: frozen,
    });
  }

  gaps.sort((a, b) => b.impressions - a.impressions);

  const actionable = gaps.filter((g) => !g.frozenFamily);
  const frozenGaps = gaps.filter((g) => g.frozenFamily);
  // 🔴 只有曝光达标的才算 P0；低曝光的归为「观察」（记录但不报缺陷）
  const solidGaps = actionable.filter((g) => g.impressions >= MIN_IMPRESSIONS);
  const watchGaps = actionable.filter((g) => g.impressions < MIN_IMPRESSIONS);

  console.log(`有曝光但不在 sitemap：${gaps.length} 页（合计 ${gaps.reduce((s, g) => s + g.impressions, 0)} imp）`);
  console.log(`  ├─ 可行动（非冻结词族）：${actionable.length} 页`);
  console.log(`  │   ├─ 曝光 ≥ ${MIN_IMPRESSIONS}（报 P0）：${solidGaps.length} 页`);
  console.log(`  │   └─ 曝光 < ${MIN_IMPRESSIONS}（仅观察，低样本噪声）：${watchGaps.length} 页`);
  console.log(`  └─ 冻结词族（不报）：${frozenGaps.length} 页`);
  if (skipped.length) console.log(`豁免前缀跳过：${skipped.length} 页`);
  console.log(line);

  if (solidGaps.length) {
    console.log(`\n🔴 P0（有真实曝光却进不了 sitemap —— 这些页只能靠外链被动被发现）：${solidGaps.length} 页`);
    for (const g of solidGaps) {
      console.log(
        `  ${g.impressions}imp P${g.position ?? "?"} ${g.pathname}` +
          `（${g.queryCount} 词，clicks=${g.clicks}）`,
      );
    }
    console.log(
      "\n   ⇒ 修法：在 app/sitemap.ts 里为这些路径类型生成 URL 条目。" +
        "注意 generateStaticParams 的规模（/directory/compare/* 是全量笛卡尔积，" +
        "无脑全收会灌爆 sitemap）⇒ 只收**已有曝光或已内链**的那批。",
    );
  }

  if (watchGaps.length) {
    console.log(`\nℹ️ 观察项（曝光 < ${MIN_IMPRESSIONS}，低样本噪声，不作缺陷处理）：${watchGaps.length} 页`);
    for (const g of watchGaps) {
      console.log(`  ${g.impressions}imp ${g.pathname}`);
    }
    console.log("   ⇒ 这些页量级太小，多半是噪声而非真缺口；若某天曝光涨上来会自动进 P0。");
  }

  if (frozenGaps.length) {
    console.log(`\nℹ️ 冻结词族的同类缺口（不作为待办，仅留档）：${frozenGaps.length} 页`);
    for (const g of frozenGaps) {
      console.log(`  ${g.impressions}imp ${g.pathname}`);
    }
  }

  if (!solidGaps.length) {
    console.log(`\n✅ 无「有曝光未收录」实质缺口：所有曝光 ≥ ${MIN_IMPRESSIONS} 的页面都在 sitemap 里。`);
    console.log(line);
    process.exit(0);
  }

  console.log(`\n❌ 存在 ${solidGaps.length} 个「有曝光未收录」实质缺口。`);
  console.log(line);
  process.exit(1);
}

main().catch((e) => {
  console.error("[audit:sitemap-coverage] ❌ 致命错误：", e instanceof Error ? e.stack : e);
  process.exit(1);
});
