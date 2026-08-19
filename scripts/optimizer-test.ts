/**
 * 离线单测：自动优化器 optimizer.ts
 * 覆盖：pageUrl→route 解析 / 标题保守改写 / 计划生成（dry-run 不改文件）/
 *       应用（备份+改写+tsc 校验+回滚）。
 *
 * 运行：esbuild 打包 → node
 *   npx esbuild scripts/optimizer-test.ts --bundle --platform=node --format=esm \
 *     --external:@prisma/client --alias:server-only=./scripts/_stub_server_only.ts --outfile=.opt.mjs && node .opt.mjs
 *   （注意：本文件含 top-level await，必须 ESM 打包，CJS 不被支持；
 *     @prisma/client 标 external 避免打包原生依赖；server-only 用测试桩替换）
 */

import { buildOptimizationPlan, applyOptimizationPlan, pageUrlToRoute, optimizeTitle, serializePageMeta, applyEditsToMeta, buildOverridesFromEdits } from "../lib/seo/optimizer";
import { analyzeTopicalGaps, QueryPageRow } from "../lib/seo/topical-gaps";
import { PAGE_META, PAGE_META_BASE, PageMeta, getResolvedMeta } from "../lib/seo/page-meta";
import { __setOverrideForTest } from "../lib/seo/page-meta-db";

let pass = 0, fail = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { pass++; console.log("  ✅ " + msg); }
  else { fail++; console.error("  ❌ " + msg); }
}

// ── 基础工具 ──
assert(pageUrlToRoute("https://craftisle.com/tools") === "/tools", "pageUrl→route 解析 /tools");
assert(pageUrlToRoute("https://pdf.craftisle.com/merge") === "/merge", "pageUrl→route 解析子域路径");
assert(pageUrlToRoute(undefined) === null, "无 pageUrl → null");

assert(optimizeTitle("Free Tools | Craftisle", "ms project alternative", "Craftisle")
  .toLowerCase().includes("ms project alternative"), "标题未含目标词时前置目标词");
assert(optimizeTitle("ms project alternative Free Tools | Craftisle", "ms project alternative", "Craftisle")
  === "ms project alternative Free Tools | Craftisle", "标题已含目标词则不改（避免重复）");

// ── 构造含近失/低CTR 的分析结果 ──
const rows: QueryPageRow[] = [
  { query: "ms project alternative", page: "https://craftisle.com/tools", impressions: 10, clicks: 0, ctr: 0, position: 22 },
  { query: "best free tools", page: "https://craftisle.com/tools", impressions: 40, clicks: 0, ctr: 0, position: 6 },
];
const clusters = analyzeTopicalGaps(rows, true);
const plan = buildOptimizationPlan(clusters);

assert(plan.dryRun === true, "计划默认 dry-run");
assert(plan.edits.length > 0, `生成编辑项（实际 ${plan.edits.length}）`);
const titleEdit = plan.edits.find((e) => e.route === "/tools" && e.field === "title");
assert(!!titleEdit, "为 /tools 生成标题编辑");
assert(titleEdit!.current === PAGE_META["/tools"].title, "编辑的 current 来自真实注册表值（未编造）");
assert(titleEdit!.proposed !== titleEdit!.current, "建议值与当前值不同（确有优化）");

// ── 应用层：用内存 fs 模拟，验证备份/改写/审计，且 dry-run 不写 ──
function makeMemFs(initial: Record<string, string>) {
  const store: Record<string, string> = { ...initial };
  const audit: string[] = [];
  return {
    store,
    readFileSync: (p: string) => store[p] ?? (() => { throw new Error("ENOENT " + p); })(),
    writeFileSync: (p: string, c: string) => { store[p] = c; },
    copyFileSync: (s: string, d: string) => { store[d] = store[s]; },
    appendFileSync: (p: string, c: string) => { audit.push(c); },
    audit,
  };
}

// dry-run 不改文件（applyOptimizationPlan 自身尊重 plan.dryRun）
const mem1 = makeMemFs({ "meta.ts": serializePageMeta(PAGE_META) });
const r1 = await applyOptimizationPlan(plan, { filePath: "meta.ts", fs: mem1, currentMeta: PAGE_META });
assert(r1.skippedDryRun === true, "dry-run 计划被 applyOptimizationPlan 拒绝写回");
assert(mem1.store["meta.ts"].includes(PAGE_META["/tools"].title), "dry-run 后文件仍是原值（未写回）");

// 真实应用：显式切到非 dry-run
const applyPlan = { ...plan, dryRun: false };
const mem2 = makeMemFs({ "meta.ts": serializePageMeta(PAGE_META) });
const result = await applyOptimizationPlan(applyPlan, {
  filePath: "meta.ts", fs: mem2, currentMeta: PAGE_META,
  runTsc: async () => ({ ok: true, output: "" }),
});
assert(result.applied > 0, `应用了 ${result.applied} 项`);
assert(!!result.backupPath, "生成了备份路径");
assert(result.rolledBack === false, "未触发回滚");
assert(mem2.store["meta.ts"].includes(titleEdit!.proposed), "文件已写入新标题");
assert(!mem2.store["meta.ts"].includes(PAGE_META["/tools"].title) || mem2.store["meta.ts"].includes(titleEdit!.proposed), "新标题生效");

// tsc 失败 → 回滚
const mem3 = makeMemFs({ "meta.ts": serializePageMeta(PAGE_META) });
const r3 = await applyOptimizationPlan(applyPlan, {
  filePath: "meta.ts", fs: mem3, currentMeta: PAGE_META,
  runTsc: async () => ({ ok: false, output: "error TS: mock" }),
});
assert(r3.rolledBack === true && r3.applied === 0, "tsc 失败时回滚且不应用");
assert(mem3.store["meta.ts"].includes(PAGE_META["/tools"].title), "回滚后恢复原标题");

// v3: applyEditsToMeta 纯函数（被 Vercel Cron 复用，不触碰文件系统）
const { meta: m2, applied: a2 } = applyEditsToMeta(PAGE_META, plan.edits);
const applicable = plan.edits.filter((e) => e.field !== "create").length;
assert(a2 === applicable, `applyEditsToMeta 应用数 = 非 create 编辑数（${a2} vs ${applicable}）`);
assert(m2["/tools"].title === titleEdit!.proposed, "applyEditsToMeta 改写 /tools 标题");
assert(PAGE_META["/tools"].title !== m2["/tools"].title, "原注册表未被 mutate（纯函数）");

// v3: serializePageMeta 自包含（修自我 import 循环依赖 bug）
const src = serializePageMeta(m2);
assert(!src.includes('import { PageMeta } from "./page-meta"'), "serializePageMeta 不再自我 import（避免循环依赖）");
assert(src.includes("export interface PageMeta"), "serializePageMeta 内联定义 PageMeta 接口");
assert(src.includes("export const PAGE_META"), "serializePageMeta 导出 PAGE_META");
assert(src.includes("export function getPageMeta"), "serializePageMeta 保留 getPageMeta");

// v3.5: buildOverridesFromEdits 折叠（同路由 title+description 合并为一条，create 跳过）
const ovEdits = [
  { actionId: "a1", kind: "push_position" as const, route: "/tools", field: "title" as const, current: "x", proposed: "New Title", rationale: "", potentialClicks: 1, potentialValue: 1 },
  { actionId: "a2", kind: "optimize_ctr" as const, route: "/tools", field: "description" as const, current: "y", proposed: "New Desc", rationale: "", potentialClicks: 1, potentialValue: 1 },
  { actionId: "a3", kind: "build_page" as const, route: "/l/foo", field: "create" as const, current: "(新页面)", proposed: "Foo", rationale: "", potentialClicks: 1, potentialValue: 1 },
];
const ovs = buildOverridesFromEdits(ovEdits);
assert(ovs.length === 1, `buildOverridesFromEdits 合并同路由为 1 条（实际 ${ovs.length}）`);
assert(ovs[0].route === "/tools" && ovs[0].title === "New Title" && ovs[0].description === "New Desc", "覆盖含合并后的 title+description");
assert(ovs[0].provenance === "generated", "覆盖 provenance=generated");

// v3.5: PAGE_META Proxy 叠加数据库覆盖层（用测试钩子注入，不触真实 DB）
__setOverrideForTest("/tools", { title: "DB Override Title", description: "DB Override Desc" });
assert(getResolvedMeta("/tools")!.title === "DB Override Title", "getResolvedMeta 叠加 DB 标题覆盖");
assert(PAGE_META["/tools"].title === "DB Override Title", "PAGE_META Proxy 叠加 DB 标题覆盖");
assert(PAGE_META["/tools"].description === "DB Override Desc", "PAGE_META Proxy 叠加 DB 描述覆盖");
assert(PAGE_META["/tools"].provenance === "generated", "覆盖 provenance 生效");
assert(getResolvedMeta("/about/craftisle-vs-craft-island")!.title === PAGE_META_BASE["/about/craftisle-vs-craft-island"].title, "无覆盖路由回退静态");
__setOverrideForTest("/tools", null); // 清理
assert(PAGE_META["/tools"].title === PAGE_META_BASE["/tools"].title, "清除覆盖后回退静态");

console.log(`\n== 优化器结果：${pass} 通过 / ${fail} 失败 ==`);
if (fail > 0) process.exit(1);
