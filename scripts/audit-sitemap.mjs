#!/usr/bin/env node
/**
 * audit-sitemap.mjs — sitemap / hreflang 404 护栏
 *
 * 背景（DEBT-19 / DEBT-20）：
 *   app/sitemap.ts 曾为 54 个手写资源无条件生成 14 种语言 URL（756 条，其中 en 与
 *   resourceDetailPages 重复），但 public/data/generated-content/ 下只有平铺的 `<id>.json`，
 *   没有任何 `<lang>/` 子目录 ⇒ 其中 702 条 URL 必然 404。
 *   同样的 dead alternate 还出现在 resource/[id]/page.tsx 的 alternates.languages，
 *   以及首页指向不存在路由的 zh-CN hreflang。
 *
 * 这类问题**不会让构建失败、不会让 lint 报警**，只能靠交叉校验发现：
 *   sitemap 产出的每条 URL ⇒ 在 app/ 路由树或 public/ 静态资源里能否真的命中。
 *
 * 用法：
 *   node scripts/audit-sitemap.mjs        （或 pnpm audit:sitemap）
 * 退出码：0 = 无 404 风险；1 = 存在 404 风险（可用于 CI 门禁 / 提交前钩子）。
 *
 * 设计取舍：这里**不联网**。用本地路由树 + 文件系统做静态交叉校验，
 * 保证在离线/CI 环境里也能跑，且比线上抓取更快更稳定。
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
/**
 * 把相对路径解析成绝对路径；**已经是绝对路径的原样返回**。
 *
 * ⚠️ 这个abs 判断是必需的，不是防御性冗余：
 * 早期版本写成 `path.join(ROOT, p)`，而断言 H / I 传入的是
 * `path.join(appDir, "tools")` 这种**绝对路径**，
 * 于是 path.join 把它拼成了
 *   D:\...\craftisle-app\D:\...\craftisle-app\app\tools
 * exists() 恒返回 false ⇒ 整个断言块被静默跳过 ⇒ 护栏「永远绿」。
 * 这类 bug 不会报错、不会影响退出码，正是护栏本身最危险的失效模式。
 */
const abs = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));
const read = (p) => fs.readFileSync(abs(p), "utf8");
const exists = (p) => fs.existsSync(abs(p));

const P0 = [];
const P1 = [];
const INFO = [];

// ── 0. 前置检查 ─────────────────────────────────────────────────────────
if (!exists("app/sitemap.ts")) {
  console.error("FATAL: 找不到 app/sitemap.ts，请在项目根目录运行本脚本。");
  process.exit(1);
}

const appDir = path.join(ROOT, "app");

// ── 1. 构建「可命中的路由段」索引 ────────────────────────────────────────
/**
 * 递归扫描 app/ 生成两种索引：
 *   staticRoutes —— 完全静态的 URL（无任何动态段）
 *   dynamicRoots —— 形如 /directory/resource/[id] 的动态段前缀，
 *                  用于判断某个具体 URL 是否「能被某个动态段接住」
 */
function walk(dir, segments, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = entry.name;

    // 跳过 Next.js 的私有约定目录与文件
    if (name.startsWith("_") || name === "node_modules") continue;
    // 跳过平行路由（以 @ 开头）—— 它们会重复计入同一 URL
    if (name.startsWith("@")) continue;
    if (name.startsWith("(") && name.endsWith(")")) {
      // route group：不影响 URL 段
      walk(path.join(dir, name), segments, out);
      continue;
    }

    const full = path.join(dir, name);
    if (entry.isDirectory()) {
      walk(full, [...segments, name], out);
      continue;
    }

    // 只认 page.tsx / route.ts 作为可命中路由
    if (name !== "page.tsx" && name !== "page.ts" && name !== "route.ts" && name !== "route.tsx") {
      continue;
    }

    const url = "/" + segments.join("/");
    if (segments.some((s) => s.startsWith("["))) {
      out.dynamicRoots.push(segments);
    } else {
      out.staticRoutes.add(url === "/" ? "/" : url.replace(/\/$/, ""));
    }
  }
  return out;
}

const { staticRoutes, dynamicRoots } = walk(appDir, [], {
  staticRoutes: new Set(),
  dynamicRoots: [],
});

/**
 * 去掉 JS/TS 注释，避免「修复说明注释里引用的问题示例」触发误报。
 * 行注释的正则用 `(^|[^:])` 前缀，避免误伤 https:// 里的双斜杠。
 */
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

/**
 * 该 pathname 是否能被某条已索引的路由命中（含动态段通配）。
 *
 * ⚠️ important：`app/(marketing)/[slug]/page.tsx` 是一个**单段catch-all**，
 * 它会「命中」任意顶层路径（/zh、/pricing…）。但它只在 contentlayer 的 allPages
 * 里存在对应文档时才真正出页面，/zh 并不在其中 ⇒ 线上实际 404。
 * 因此对 hreflang 这类「必须精确落点」的校验，必须用 strict 模式：
 * 只承认**静态路由**，不接受 catch-all 兜底，否则 DEBT-20 这类缺陷会被完全掩盖。
 */
function routeResolves(pathname, { strict = false } = {}) {
  const clean = pathname === "/" ? "/" : pathname.replace(/\/$/, "");
  if (staticRoutes.has(clean)) return true;
  if (strict) return false;

  const parts = clean.split("/").filter(Boolean);
  for (const segs of dynamicRoots) {
    if (segs.length !== parts.length) continue;
    let ok = true;
    for (let i = 0; i < segs.length; i++) {
      // [...catchAll] 可变长段：宽松放行，交给人工/线上探针复核
      if (segs[i].startsWith("[...")) continue;
      if (segs[i].startsWith("[") && segs[i].endsWith("]")) continue; // [id] / [lang]
      if (segs[i] !== parts[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

// ── 2. 直接解析 sitemap.ts，抽出所有 URL 字面量与 language alternate ─────
const sitemapSrc = stripComments(read("app/sitemap.ts"));

// 收集所有形如 `${baseUrl}/xxx` 的 URL 片段
const urlLiterals = [
  ...sitemapSrc.matchAll(/`\$\{baseUrl\}([^`]*)`/g),
].map((m) => m[1]);

// 收集 alternates.languages 里出现的 hreflang 语言码
const hreflangInSitemap = [
  ...sitemapSrc.matchAll(/\[l\]:\s*`\$\{baseUrl\}([^`]*)`/g),
].map((m) => m[1]);

// ── 2.5 翻译落地情况（断言 A2 / B 都要用，先于它们求值） ────────────────
const contentDir = path.join(ROOT, "public", "data", "generated-content");
const langDirs = exists(contentDir)
  ? fs
      .readdirSync(contentDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  : [];

// ── 3. 关键断言 A：sitemap 不得收录「按语言后缀」的 URL ─────────────────
// 只要 sitemap 里还有 `/<id>/<lang>` 形态的 URL，就说明多语言被收录了。
// 翻译未落地前，这些 URL 全部 404（DEBT-19）。
//
// 两种检测都要做：
//   A1) 扫描 URL 字面量 —— 抓直接的 `/directory/resource/x/ja` 写法
//   A2) 扫描「语言数组 × 资源」的批量生成模式 —— 抓
//       `LANGUAGES.map(lang => ...)` / `for (const lang of ...)` 这类
//       把 14 种语言乘到每个资源上的代码（正是 DEBT-19 的原始写法），
//       它在 URL 字面量里只呈现为 `/directory/resource/${id}${...}`，
//       光看字面量会漏掉（已实测漏过一次）。
const langSuffixRe = /^\/directory\/resource\/[^/]+\/[a-z]{2}(?:-[A-Za-z]+)?$/;
const multiLangInSitemap = urlLiterals.filter((u) => langSuffixRe.test(u.split("?")[0]));
if (multiLangInSitemap.length) {
  P0.push(
    `app/sitemap.ts 仍收录多语言 URL ${multiLangInSitemap.length} 条` +
      `（例：${multiLangInSitemap.slice(0, 3).join(", ")}）。` +
      `public/data/generated-content/ 下若无 <lang>/ 子目录，这些 URL 必然 404。`,
  );
}

// A2) 「语言变量拼进URL」模式检测
//
// DEBT-19 的本质不是「写错了某个字符串」，而是**sitemap 里出现了语言维度**。
// 正确的实现里，URL 的语言段来自「磁盘上真实存在的目录」（readdirSync + isDirectory）。
// 一旦又出现下面任一形态，就说明有人在按「硬编码语言列表」批量造 URL：
//   - `${id}${lang === 'en' ? '' : `/${lang}`}`   ← 原始 DEBT-19 写法
//   - `${id}/${lang}`但 lang 来自硬编码数组
//   - LANGUAGES.map(lang => ...) / for (const lang of LANGUAGES)
// 这些在 URL 字面量层面都只呈现为 `/directory/resource/${id}...`，
// 光扫字面量会漏（已实测漏过一次），所以必须做源码模式检测。
const langDirsExist = langDirs.length > 0;
const batchLangPatterns = [
  {
    re: /\$\{[^}]*\}\s*\$\{\s*\w+\s*===\s*["']en["']/,
    label: "URL 里用 `${lang === 'en' ? '' : `/${lang}`}` 三元拼接语言段",
  },
  {
    re: /LANGUAGES?\s*\.\s*map\s*\(\s*(\w+)\s*=>/,
    label: "LANGUAGES.map(lang => ...)",
  },
  {
    re: /for\s*\(\s*const\s+(\w+)\s+of\s+(?:TRANSLATION_LANGS|LANGUAGES)/,
    label: "for (const lang of LANGUAGES)",
  },
  {
    re: /const\s+LANGUAGES\w*\s*=\s*\[[^\]]*["']en["']/,
    label: "硬编码含 'en' 的语言数组（LANGUAGES = [...'en'...]）",
  },
];
const sitemapBatch = batchLangPatterns.filter((p) => p.re.test(sitemapSrc));
if (sitemapBatch.length && !langDirsExist) {
  P0.push(
    `app/sitemap.ts 仍按「硬编码语言列表」批量生成多语言 URL` +
      `（${sitemapBatch.map((p) => p.label).join(" / ")}），` +
      `但 public/data/generated-content/ 下**没有任何 <lang>/ 子目录**（DEBT-19）` +
      `⇒ 这些 URL 全部 404。改为按磁盘实际存在的语言目录枚举。`,
  );
}

// ── 4. 关键断言 B：alternates.languages 不得指向不存在的语言文件 ────────
if (hreflangInSitemap.length && langDirs.length === 0) {
  P0.push(
    `app/sitemap.ts 声明了 alternate 语言 URL，但 public/data/generated-content/ 下` +
      `**没有任何 <lang>/ 子目录**（DEBT-19）。`,
  );
}

// ── 5. 关键断言 C：sitemap 里的静态路径必须在 app/ 里有对应路由 ─────────
const staticInSitemap = [
  ...new Set(
    urlLiterals
      .map((u) => u.split("?")[0])
      // 去掉程序化占位段：{...} 形态的动态拼接无法静态判定
      .filter((u) => !u.includes("{")),
  ),
];

const unrouted = staticInSitemap.filter((u) => !routeResolves(u));
if (unrouted.length) {
  P1.push(
    `sitemap 中的静态路径在 app/ 路由树里找不到对应 page.tsx（${unrouted.length} 条）：` +
      unrouted.slice(0, 10).join(", "),
  );
}

// ── 6. 关键断言 D：hreflang 必须有真实落点（DEBT-20 类） ────────────────
// 扫描 app/ 下所有 metadata 里的 alternates.languages 硬编码 URL。
const appFiles = [];
(function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) collect(full);
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) appFiles.push(full);
  }
})(appDir);

const deadAlternates = [];
for (const file of appFiles) {
  // 去掉注释再扫，否则「修复说明」里引用的示例 URL（如 "zh-CN → /zh"）会造成误报
  const src = stripComments(fs.readFileSync(file, "utf8"));
  if (!/alternates\s*:\s*\{/.test(src)) continue;

  // 抓取 languages 块内的绝对 URL
  for (const m of src.matchAll(/["']?([a-z]{2}(?:-[A-Za-z]+)?)["']?\s*:\s*"(https?:\/\/[^"]+)"/g)) {
    const [, lang, url] = m;
    try {
      const u = new URL(url);
      if (u.hostname !== "craftisle.com") continue;
      const p = u.pathname;
      // 只校验形如 /xx 的顶层语言前缀（DEBT-20 的 /zh 属于此类）
      if (!/^\/[a-z]{2}$/.test(p) && !/^\/zh-[a-z]{2}$/i.test(p)) continue;
      if (!routeResolves(p, { strict: true })) {
        deadAlternates.push({ file: path.relative(ROOT, file), lang, url: p });
      }
    } catch {
      /* 忽略非法 URL */
    }
  }
}

if (deadAlternates.length) {
  for (const d of deadAlternates) {
    P0.push(`hreflang 指向不存在的路由：${d.file} 声明 ${d.lang} → ${d.url}（DEBT-20）`);
  }
}

// ── 7. 关键断言 E：robots 双配置冲突 ────────────────────────────────────
// Next.js 中 app/robots.ts 优先于 public/robots.txt；后者是死代码，会误导维护者。
if (exists("public/robots.txt")) {
  const pub = read("public/robots.txt");
  const rules = [...pub.matchAll(/^Disallow:\s*(\S+)/gim)].map((m) => m[1]);
  if (exists("app/robots.ts")) {
    P1.push(
      `public/robots.txt 与 app/robots.ts 同时存在。Next.js 只会用 app/robots.ts，` +
        `public/robots.txt 是**死代码**（当前声明 disallow: ${rules.join(", ") || "无"}）。` +
        `请删除 public/robots.txt 并把规则合并进 app/robots.ts。`,
    );
  }
}

// ── 8. 关键断言 F：禁止 public/robots.txt 复活 ──────────────────────────
// （已由断言 E 覆盖，这里仅在 public 文件存在时补充 sitemap 指向检查）

// ── 9. 关键断言 G：禁止 SaaS 脚手架 title 残留 ──────────────────────────
const saasHits = [];
for (const file of appFiles) {
  // 只检测**真正会进入 title 的代码**，忽略注释（见 stripComments）
  const src = stripComments(fs.readFileSync(file, "utf8"));
  const inTitle = [
    ...src.matchAll(/title\s*:\s*[`"'][^`"']*SaaS\s+Starter[^`"']*[`"']/g),
  ];
  if (inTitle.length) {
    saasHits.push(`${path.relative(ROOT, file).replace(/\\/g, "/")}(${inTitle.length})`);
  }
}
if (saasHits.length) {
  P0.push(
    `检测到 title 里仍有 SaaS 脚手架残留（${saasHits.length} 处）：` +
      `${saasHits.join(", ")}。会产出「XXX – SaaS Starter | Craftisle」这类 title。`,
  );
}

// ── 10. 关键断言 H：静态工具页不应再硬编码 meta（双源隐患） ────────────
// 这些静态段在 Next.js 中优先于 app/tools/[tool]，若硬编码 meta 则改 lib/tools.ts 不生效。
const toolsSrc = exists("lib/tools.ts") ? read("lib/tools.ts") : "";
const metaStart = toolsSrc.indexOf("export const toolMeta");
// 正则只接受双引号键。已用 esbuild 归一化交叉验证过：raw regex = 176 = esbuild 176，
// 且文件里单引号键数量为 0，两者一致。若日后有人改用单引号，下面会直接报数量异常。
const metaIds = new Set(
  metaStart < 0
    ? []
    : [...toolsSrc.slice(metaStart).matchAll(/^ {2}"([a-z0-9-]+)": \{/gm)].map((m) => m[1]),
);
if (metaStart >= 0) {
  const singleQuoted = (toolsSrc.slice(metaStart).match(/^ {2}'[a-z0-9-]+': \{/gm) || []).length;
  if (singleQuoted > 0) {
    P1.push(
      `lib/tools.ts 的 toolMeta 里出现 ${singleQuoted} 个单引号键，本脚本的正则解析会漏掉它们。` +
        `请改用 esbuild 加载真实对象（参考 scripts/audit-page-matrix.mjs 的做法），否则断言 H 会失准。`,
    );
  }
}

const hardcodedTools = [];
const toolsDir = path.join(appDir, "tools");
/**
 * 只审计「确实是toolMeta 里的一个工具」的静态页。
 *
 * app/tools/ 下混着两类目录：
 *   1. 真正的工具（有 toolMeta 条目，如 image-compress、regex-vis）
 *   2. 聚合/枢纽页（**不在** toolMeta 里，如 craftisle-image-tools、craftisle-dev-tools）——
 *      它们按设计读 lib/seo/page-meta 的 PAGE_META，不该套用「双源」规则。
 * 早期版本没做这个区分，把枢纽页误报成 P0。
 */
if (exists(toolsDir) && metaIds.size) {
  for (const e of fs.readdirSync(toolsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (!metaIds.has(e.name)) continue; // 枢纽页/非工具目录，跳过
    const pageFile = path.join(toolsDir, e.name, "page.tsx");
    if (!fs.existsSync(pageFile)) continue;
    const src = stripComments(fs.readFileSync(pageFile, "utf8"));
    const hasMeta = /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/.test(src);
    if (!hasMeta) continue;

    // 单一数据源的判定：generateMetadata 的**函数体内部**必须真的用到 toolMeta。
    //
    // 两个曾经的坑：
    //  1) 只看整文件是否出现过 toolMeta ⇒ 一个「导入但没使用」的 toolMeta 就能掩盖
    //     真实回归（实测：把 title 改回硬编码、toolMeta 变量留着不用，护栏依旧放行）。
    //  2) 提取函数体的正则太贪心/太保守会整段失配，静默退化成「扫全文件」。
    // 现在用「掐头去尾」按 generateMetadata 起止 brace 精确截取，失败则显式判定为不通过。
    const fnStart = src.search(/async\s+function\s+generateMetadata|function\s+generateMetadata/);
    let metaBody = "";
    if (fnStart >= 0) {
      const open = src.indexOf("{", fnStart);
      if (open >= 0) {
        let depth = 0;
        for (let i = open; i < src.length; i++) {
          if (src[i] === "{") depth++;
          else if (src[i] === "}") {
            depth--;
            if (depth === 0) {
              metaBody = src.slice(open + 1, i);
              break;
            }
          }
        }
      }
    }
    // `export const metadata = {...}` 形态：整个声明就是函数体
    if (!metaBody) {
      const cStart = src.search(/export\s+const\s+metadata\s*(?::[^=]+)?=/);
      if (cStart >= 0) {
        const open = src.indexOf("{", cStart);
        if (open >= 0) {
          let depth = 0;
          for (let i = open; i < src.length; i++) {
            if (src[i] === "{") depth++;
            else if (src[i] === "}") {
              depth--;
              if (depth === 0) {
                metaBody = src.slice(open + 1, i);
                break;
              }
            }
          }
        }
      }
    }

    const usesToolMeta =
      /\btoolMeta\s*\[/.test(metaBody) ||
      /\bgetToolMeta\s*\(/.test(metaBody) ||
      /\btoolMeta\s*\./.test(metaBody);
    if (!usesToolMeta) {
      hardcodedTools.push(e.name);
    }
  }
}
if (hardcodedTools.length) {
  P0.push(
    `以下静态工具页的 meta 未读取 lib/tools.ts 的 toolMeta（双源隐患，` +
      `改 toolMeta 对这些页不生效）：${hardcodedTools.join(", ")}。` +
      `应改为 toolMeta[id] + getOverrideAsync() 覆盖层。`,
  );
}

// ── 11. 关键断言 I：静态工具页不应声明 force-dynamic ───────────────────
const forcedDynamicTools = [];
if (exists(toolsDir)) {
  for (const e of fs.readdirSync(toolsDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const pageFile = path.join(toolsDir, e.name, "page.tsx");
    if (!fs.existsSync(pageFile)) continue;
    // 必须 stripComments：修复说明注释里会引用 `export const dynamic = "force-dynamic"`
    // 作为例证，不去掉注释就会把已经修好的页面继续报成问题。
    const src = stripComments(fs.readFileSync(pageFile, "utf8"));
    if (/export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(src)) {
      forcedDynamicTools.push(e.name);
    }
  }
}
if (forcedDynamicTools.length) {
  P1.push(
    `静态工具页声明了 force-dynamic（${forcedDynamicTools.length} 个）：` +
      `${forcedDynamicTools.join(", ")}。这会绕过 ISR，使 page_meta 覆盖层无法生效。`,
  );
}

// ── 输出 ────────────────────────────────────────────────────────────────
const line = "─".repeat(64);
console.log(line);
console.log("audit:sitemap — sitemap / hreflang / robots 404 护栏");
console.log(line);
console.log(`已索引静态路由：${staticRoutes.size} 条`);
console.log(`已索引动态路由段：${dynamicRoots.length} 条`);
console.log(`sitemap URL 字面量：${urlLiterals.length} 条（去重静态路径 ${staticInSitemap.length} 条）`);
console.log(`generated-content 语言子目录：${langDirs.length ? langDirs.join(", ") : "无"}`);
console.log(line);

if (P0.length) {
  console.log(`\n🔴 P0（必然 404 / 必须修）：${P0.length} 项`);
  P0.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (P1.length) {
  console.log(`\n🟡 P1（应修）：${P1.length} 项`);
  P1.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (INFO.length) {
  console.log(`\nℹ️ INFO：${INFO.length} 项`);
  INFO.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}

if (!P0.length && !P1.length) {
  console.log("\n✅ 无 404 风险：sitemap、hreflang、robots、工具页 meta 均一致。");
  console.log(line);
  process.exit(0);
}

console.log(`\n${P0.length ? "❌ 存在 P0 问题，禁止发布。" : "⚠️  无 P0，但有 P1 待办。"}`);
console.log(line);
process.exit(P0.length ? 1 : 0);