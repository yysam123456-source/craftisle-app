#!/usr/bin/env node
/**
 * audit-meta-overrides.mjs — 「meta 覆盖层接管」体检表
 *
 * 用途（应link-strategist 要求）：产出一张表，同时回答两件事——
 *   1. 哪些工具页的 meta **当前被 DB 覆盖层接管** ⇒ 不能用来做「改 toolMeta 看效果」的
 *      A/B 实验（因为优先级是 `ov?.title ?? toolMeta`，改 lib/tools.ts 对它们不生效，
 *      会得到「改了没变化」的假阴性）。
 *   2. 哪些页面的覆盖层**读取路径有缺陷** ⇒ 覆盖写了但页面不变（静默失效）。
 *
 * 🔴 关于「显式覆盖 vs 继承默认值」：
 *   本机**没有 DATABASE_URL**（只有 .env.example），因此无法直连线上 Postgres。
 *   所以脚本分两种模式，输出**绝不猜测**：
 *   - 无 DATABASE_URL：只输出「覆盖机制体检」（纯静态可确证的部分），
 *     并明确标注 DB 实况「未取到」，而不是编一份看起来很像真的清单。
 *   - 有 DATABASE_URL：直查 page_meta_override，逐行标注 title/description
 *     是「显式覆盖」还是「继承默认值」（NULL ⇒ 继承）。
 *
 * 用法：
 *   node scripts/audit-meta-overrides.mjs
 *   DATABASE_URL=postgres://... node scripts/audit-meta-overrides.mjs
 * 退出码：0 = 覆盖读取路径无缺陷（DB 未连上不算失败）；1 = 发现读取路径缺陷。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const read = (p) => fs.readFileSync(abs(p), "utf8");
const exists = (p) => fs.existsSync(abs(p));

const P0 = [];
const P1 = [];
const INFO = [];

const line = "─".repeat(64);

// ── 1. 读取路径体检（静态可确证，不需要 DB） ───────────────────────────
const dbLib = exists("lib/seo/page-meta-db.ts") ? read("lib/seo/page-meta-db.ts") : "";
const proxySrc = exists("lib/seo/page-meta.ts") ? read("lib/seo/page-meta.ts") : "";

/**
 * 关键区分：两种读法，语义完全不同。
 *   getOverrideAsync() —— await refreshOverrides() 后再读 ⇒ 冷缓存也正确
 *   getOverride()     —— 同步读+惰性刷新 ⇒ **冷缓存必然返回 undefined**，
 *                        这是 page-meta-db.ts 自己注释里写明的失效模式。
 */
const asyncReaders = [];
const syncReaders = [];
/**
 * 判定「同步读是否安全」：只有**没先await refreshOverrides()** 的同步读才算缺陷。
 *
 * 反例（正确写法，app/api/analytics/tune/route.ts:45-46）：
 *   const { refreshOverrides, getOverride } = await import(...);
 *   await refreshOverrides();     // ← 先刷新
 *   const probe = getOverride(..);// ← 再同步读，此时缓存已热
 * 早期版本只看「有没有调getOverride」，把这种正确写法也报成缺陷（假阳性）。
 */
function syncReadIsSafe(src, callIdx) {
  const before = src.slice(Math.max(0, callIdx - 600), callIdx);
  return /await\s+refreshOverrides\s*\(\s*\)/.test(before);
}

(function collect(dir) {
  if (!exists(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(e.name)) continue;
      collect(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    if (e.name === "page-meta-db.ts") continue;
    const src = fs.readFileSync(full, "utf8");
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");
    if (/\bgetOverrideAsync\s*\(/.test(src)) asyncReaders.push(rel);

    for (const m of src.matchAll(/\bgetOverride\s*\(/g)) {
      if (syncReadIsSafe(src, m.index)) {
        INFO.push(`${rel} 的同步 getOverride 前已 await refreshOverrides() ⇒ 读法正确。`);
      } else {
        syncReaders.push(rel);
      }
    }
  }
})(path.join(ROOT, "app"));

// PAGE_META Proxy 内部用的是同步 getOverride
const proxyUsesSync = /getOverride\s*\(\s*key\s*\)/.test(proxySrc);
if (proxyUsesSync && !syncReaders.includes("lib/seo/page-meta.ts")) {
  syncReaders.push("lib/seo/page-meta.ts (PAGE_META Proxy)");
}

/**
 * 🔴 DEBT-25 已修：PAGE_META 的 Proxy 仍保留（供构建期/非 async 上下文兼容），
 * 但**页面不再使用它**——所有 PAGE_META_BASE 的路由都改走getResolvedMetaAsync()。
 * 所以这里的检查从「Proxy 是不是同步读」升级为更强的命题：
 *   **每个吃得到覆盖层的路由，都必须有一条async 读取通路。**
 * 这才是真正要保证的性质，且能在「有人把某个页改回同步读/构建期常量」时报红。
 */

// ── 2. 覆盖可作用的路由面（哪些页面吃得到覆盖层） ───────────────────────
// 两条来源：
//   A) PAGE_META_BASE 的静态键（页面须用 getResolvedMetaAsync 显式解析）
//   B) 直接调用 getOverrideAsync(route) 的工具页
const baseRoutes = [];
if (exists("lib/seo/page-meta.ts")) {
  const src = proxySrc;
  const i = src.indexOf("PAGE_META_BASE");
  if (i >= 0) {
    const seg = src.slice(i, src.indexOf("new Proxy", i));
    baseRoutes.push(
      ...seg.matchAll(/^\s*"(\/[^"]*)":/gm).map((m) => m[1]),
    );
  }
}

// 工具页：谁读了 toolMeta[x] 就意味着它的 /tools/<id> 路由吃覆盖层
const toolRoutes = [];
const toolsDir = path.join(ROOT, "app", "tools");
if (exists(toolsDir)) {
  const tsrc = exists("lib/tools.ts") ? read("lib/tools.ts") : "";
  const mi = tsrc.indexOf("export const toolMeta");
  const metaIds = new Set(
    mi < 0 ? [] : [...tsrc.slice(mi).matchAll(/^ {2}"([a-z0-9-]+)": \{/gm)].map((m) => m[1]),
  );
  for (const e of fs.readdirSync(toolsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const pf = path.join(toolsDir, e.name, "page.tsx");
    if (!fs.existsSync(pf)) continue;
    const src = fs.readFileSync(pf, "utf8");
    if (!/\bgetOverrideAsync\s*\(/.test(src)) continue;
    if (metaIds.size && !metaIds.has(e.name)) continue; // 枢纽页走 PAGE_META
    toolRoutes.push(`/tools/${e.name}`);
  }
}
const overrideRoutes = [...new Set([...baseRoutes, ...toolRoutes])].sort();

// ── 2.5 关键断言：每个吃得到覆盖层的路由，都必须真的有 async 读取通路 ────
/**
 * 这是 DEBT-25 的核心性质，也是本护栏的主要断言（可负向验证）。
 *
 * 为什么必须断言「通路存在」而不是「没有同步读」：
 *   - 同步 Proxy 可以合法存在于构建期/脚本上下文（optimizer 等只读基值）；
 *   - 真正的失败是「某个吃覆盖层的页面，没有任何 async 入口能读到它」。
 * 所以逐个路由检查：有谁在读它？读法是不是 async？
 *
 * 判定依据（期望报哪些行）：
 *   - `/` 与 `/tools` 等 baseRoutes ⇒ 必须能在 app/(marketing)/page.tsx 与
 *     app/tools/page.tsx 里找到 `getResolvedMetaAsync("<route>")` 或
 *     模板变量 `getResolvedMetaAsync(\`/l/${slug}\`)`；
 *   - 任何页面若重新出现 `export const metadata = ... PAGE_META[...` ⇒ 报 P0
 *     （构建期常量，覆盖层永远进不了HTML）；
 *   - 任何页面若重新出现 `PAGE_META[\`...\`] ` 形式的同步读 ⇒ 报 P0。
 */
/** 去注释：避免「修复说明注释里引用 PAGE_META[...」被当成真的同步读。 */
function stripComments2(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

const asyncReadRoutes = new Set();
const batchReaders = [];
const buildTimeConstHits = [];
const syncProxyReadHits = [];

(function collectPages(dir) {
  if (!exists(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["node_modules", ".next", ".git"].includes(e.name)) continue;
      collectPages(full);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(e.name)) continue;
    const src = stripComments2(fs.readFileSync(full, "utf8"));
    const rel = path.relative(ROOT, full).replace(/\\/g, "/");

    // (a) 构建期常量里读 PAGE_META[...] ⇒ 覆盖层永不生效
    //     两种真实写法都要覆盖：
    //       export const metadata = { title: PAGE_META[...].title }
    //       export const metadata = constructMetadata({ title: PAGE_META[...].title })
    //     所以不能只匹配 `{ ... };`，必须允许 constructMetadata(...) 包裹后仍匹配到
    //     「第一个 `;` 之前的全部内容」。
    const constMeta = src.match(/export\s+const\s+metadata\b[\s\S]{0,4000}?;/);
    if (constMeta && /\bPAGE_META\s*\[/.test(constMeta[0])) {
      buildTimeConstHits.push(rel);
    }
    // (b) 任何同步读 PAGE_META[...] 都是 P0 —— Proxy 的 get trap 是同步的，
    //     冷缓存下 getOverride恒undefined，**与外层函数是否 async 无关**。
    //     早期版本用「文件里有 generateMetadata 就放行」，结果把
    //     `async function generateMetadata(){ const m = PAGE_META[x] }`
    //     这种真实退化判为合法（实测漏报）。同步读必须独立成立。
    for (const m of src.matchAll(/\bPAGE_META\s*\[/g)) {
      syncProxyReadHits.push(rel);
    }
    // (c) 记录 async 解析器读到的具体路由
    //     ⚠️ 必须排除 import 行！否则「把调用删掉但忘了删 import」这种退化
    //     仍会因为 import 语句而被判定为「有通路」⇒ 假阴性（已实测踩过）。
    const srcNoImports = src.replace(/^\s*import\s[\s\S]*?from\s+["'][^"']+["'];?$/gm, " ");
    for (const m of srcNoImports.matchAll(/getResolvedMetaAsync\s*\(\s*[`"'](\/[^`"']*)[`"']/g)) {
      asyncReadRoutes.add(m[1]);
    }
    for (const m of srcNoImports.matchAll(/getResolvedMetaBatch\s*\(/g)) {
      batchReaders.push(rel);
    }
  }
})(path.join(ROOT, "app"));

// baseRoutes 里每个静态路由都必须有 async 通路（/l/ 是动态 slug，单独按前缀判定）
const unreachable = [];
for (const r of baseRoutes) {
  if (asyncReadRoutes.has(r)) continue;
  // /l/ 系列是模板串，源码里读不到字面量；只要有页面用 async 解析 /l/ 模板即可
  if (r.startsWith("/l/")) {
    const hasTemplate = [...asyncReadRoutes].some((x) => x.includes("${slug}") || x === "/l/");
    if (hasTemplate) continue;
  }
  unreachable.push(r);
}

if (buildTimeConstHits.length) {
  P0.push(
    `以下页面用**构建期常量**读 PAGE_META（DEBT-25 复发）：${buildTimeConstHits.join(", ")}。` +
      `export const metadata 是 build 时求值的常量 ⇒ DB 覆盖层写了也不会进 HTML。` +
      `必须改成 generateMetadata + await getResolvedMetaAsync()。`,
  );
}
if (syncProxyReadHits.length) {
  P0.push(
    `以下页面在非 async 上下文同步读 PAGE_META[...]（DEBT-25 复发）：${[...new Set(syncProxyReadHits)].join(", ")}。` +
      `冷缓存下 getOverride 恒undefined ⇒ 覆盖层静默失效。改用 await getResolvedMetaAsync()。`,
  );
}
if (unreachable.length) {
  P1.push(
    `以下 PAGE_META_BASE 路由**没有任何 async 读取通路**（覆盖层写了不会被读到）：` +
      `${unreachable.join(", ")}。请在对应页面用 await getResolvedMetaAsync("<route>") 解析。`,
  );
}

// 反向校验：消费页里 getResolvedMetaAsync("<route>") 的字面量必须真实存在于
// PAGE_META_BASE —— 否则拼错 route 时 getResolvedMetaAsync 返回 undefined，
// constructMetadata 会静默回退到 siteConfig 默认标题（不报错，只是标题变品牌名）。
// 这类退化没有任何运行时报错，只能静态查。
const knownRoutes = new Set(baseRoutes);
const bogusRoutes = [...asyncReadRoutes].filter(
  (r) => !knownRoutes.has(r) && !r.includes("${"),
);
if (bogusRoutes.length) {
  P0.push(
    `页面里 getResolvedMetaAsync() 用了 PAGE_META_BASE 中不存在的 route：` +
      `${bogusRoutes.join(", ")}。拼错 ⇒ 返回 undefined ⇒ title 静默回退成 siteConfig 默认值。` +
      `合法 route：${[...knownRoutes].join(", ")}；/l/<slug> 属动态模板，不在此校验范围。`,
  );
}

// ── 3. DB 实况（能连就连，连不上就明说，绝不猜） ────────────────────────
const dbUrl = process.env.DATABASE_URL || "";
let dbRows = null;
let dbError = null;

async function loadDb() {
  if (!dbUrl) {
    dbError = "本机无 DATABASE_URL（仅 .env.example），无法直连线上 Postgres。";
    return;
  }
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS page_meta_override (
      route TEXT PRIMARY KEY, title TEXT, description TEXT,
      provenance TEXT NOT NULL DEFAULT 'generated', last_optimized TIMESTAMPTZ)`);
    dbRows = await prisma.$queryRawUnsafe(
      `SELECT route, title, description, provenance, last_optimized FROM page_meta_override ORDER BY route`,
    );
    await prisma.$disconnect();
  } catch (e) {
    dbError = e?.message || String(e);
  }
}
await loadDb();

// ── 输出 ────────────────────────────────────────────────────────────────
console.log(line);
console.log("audit:meta-overrides — 覆盖层接管体检表");
console.log(line);
console.log(`覆盖可作用的路由面：${overrideRoutes.length} 条`);
console.log(`  ├─ 经 PAGE_META Proxy：${baseRoutes.length} 条 → ${baseRoutes.join(", ") || "无"}`);
console.log(`  └─ 经 getOverrideAsync 的工具页：${toolRoutes.length} 条`);
console.log(line);

console.log("【一】覆盖读取路径体检（静态可确证）");
console.log(`  异步读（正确）：${asyncReaders.length} 个文件`);
console.log(`  同步读（有冷缓存缺陷）：${syncReaders.length} 个文件`);
for (const f of syncReaders) console.log(`    ⚠ ${f}`);
console.log("");

console.log("【二】显式覆盖 vs 继承默认值（需 DATABASE_URL）");
if (dbRows) {
  const byRoute = new Map(dbRows.map((r) => [r.route, r]));
  const explicit = [];
  const inherited = [];
  for (const r of dbRows) {
    const hasT = r.title != null && String(r.title).trim() !== "";
    const hasD = r.description != null && String(r.description).trim() !== "";
    const reachable = overrideRoutes.includes(r.route);
    (hasT || hasD ? explicit : inherited).push({
      ...r,
      reachable,
      kind: hasT && hasD ? "title+desc" : hasT ? "仅title" : hasD ? "仅desc" : "全NULL",
    });
  }
  console.log(`  DB 实况：共 ${dbRows.length} 行`);
  console.log(`  ├─ 显式覆盖：${explicit.length} 行`);
  console.log(`  └─ 继承默认（全 NULL）：${inherited.length} 行`);
  console.log("");
  console.log("  route".padEnd(34) + "kind".padEnd(12) + "provenance".padEnd(14) + "读取路径");
  for (const r of dbRows) {
    const hasT = r.title != null && String(r.title).trim() !== "";
    const hasD = r.description != null && String(r.description).trim() !== "";
    const kind = hasT && hasD ? "title+desc" : hasT ? "仅title" : hasD ? "仅desc" : "全NULL";
    const path2 = overrideRoutes.includes(r.route)
      ? baseRoutes.includes(r.route)
        ? "PAGE_META(同步⚠)"
        : "getOverrideAsync"
      : "⚠ 无人读取";
    console.log(
      "  " + String(r.route).padEnd(32) + kind.padEnd(12) + String(r.provenance).padEnd(14) + path2,
    );
  }
  const orphans = dbRows.filter((r) => !overrideRoutes.includes(r.route));
  if (orphans.length) {
    P1.push(
      `page_meta_override 里有 ${orphans.length} 行的 route 在代码里**没有任何页面会读取**` +
        `（写了但不生效）：${orphans.map((r) => r.route).join(", ")}`,
    );
  }
} else {
  console.log("  ⚠ 未取到 DB 实况 —— 本机没有 DATABASE_URL。");
  console.log(`原因：${dbError}`);
  console.log("");
  console.log("  我不会用静态代码推测「哪些行有值」—— 那等于编数据。");
  console.log("  要拿实况，请在有 DATABASE_URL 的环境跑：");
  console.log("    DATABASE_URL=postgres://... node scripts/audit-meta-overrides.mjs");
  console.log("  或直接执行 SQL：");
  console.log(`    SELECT route, title IS NOT NULL AS has_title,
       description IS NOT NULL AS has_desc, provenance, last_optimized
       FROM page_meta_override ORDER BY route;`);
  console.log("");
  console.log("  另外：上面【一】的读取路径体检已经能独立回答");
  console.log("「哪些页面的覆盖层是坏的」，这一部分不需要 DB。");
}

if (INFO.length) {
  console.log("");
  for (const m of INFO) console.log(`ℹ ${m}`);
}
if (P0.length) {
  console.log(`\n🔴 P0：${P0.length} 项`);
  P0.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (P1.length) {
  console.log(`\n🟡 P1：${P1.length} 项`);
  P1.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}

console.log("");
console.log(line);
if (P0.length) {
  console.log("❌ 存在 P0，禁止发布。");
} else if (P1.length) {
  console.log("⚠️  无 P0，但有 P1 待办。");
} else {
  console.log("✅ 覆盖读取路径无缺陷。");
}
console.log(line);
process.exit(P0.length ? 1 : 0);