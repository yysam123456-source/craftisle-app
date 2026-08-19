/**
 * 自动优化器 CLI v1
 * ─────────────────────────────────────────────
 * 运行：从 GSC（或本地快照）拉数据 → 差距分析 → 生成优化计划 → （可选）应用。
 *
 *   npx tsx scripts/auto-optimize.ts            # 默认 dry-run，仅打印计划
 *   npx tsx scripts/auto-optimize.ts --apply     # 真实写回 page-meta.ts（带备份+tsc校验+审计）
 *
 * 注意：--apply 会修改 lib/seo/page-meta.ts。先 dry-run 审查，再 --apply。
 */

import { readFileSync, writeFileSync, copyFileSync, appendFileSync, existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import {
  analyzeTopicalGaps, ClusterGap, QueryPageRow,
} from "../lib/seo/topical-gaps";
import { buildOptimizationPlan, applyOptimizationPlan, OptimizationPlan } from "../lib/seo/optimizer";
import { PAGE_META } from "../lib/seo/page-meta";
import { runTechnicalProbe } from "../lib/seo/technical-probe";
import { runContentAudit } from "../lib/seo/content-audit";
import { computeCompetitorGaps, fetchCompetitorData } from "../lib/seo/competitor-gap";
import { fetchGscPerformance, isGscConfigured } from "../lib/seo/gsc-client";

const execFileP = promisify(execFile);
const ROOT = path.resolve(__dirname, "..");
const META_PATH = path.join(ROOT, "lib/seo/page-meta.ts");

// 本地 GSC 快照（无凭证时的回退数据源；真实部署由端点拉 GSC）
const SNAPSHOT_PATH = path.join(ROOT, "scripts/gsc-snapshot.json");

async function loadRows(): Promise<{ rows: QueryPageRow[]; hasData: boolean; source: string }> {
  // 1) 优先拉真实 GSC 数据（生产 / CI 自动优化路径）
  if (isGscConfigured()) {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const res = await fetchGscPerformance(startDate, endDate, ["query", "page"], 5000);
      if (res.error) console.warn("[auto-optimize] GSC 错误：", res.error);
      const rows: QueryPageRow[] = (res.rows || []).map((r) => ({
        query: r.query, page: r.page,
        impressions: r.impressions, clicks: r.clicks, ctr: r.ctr, position: r.position,
      }));
      if (rows.length > 0) return { rows, hasData: true, source: "GSC" };
      console.log("[auto-optimize] GSC 已配置但无数据，回退快照。");
    } catch (e: any) {
      console.warn("[auto-optimize] GSC 拉取失败：", e?.message);
    }
  }
  // 2) 回退本地快照（离线开发 / 无凭证）
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      const snap = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
      const rows: QueryPageRow[] = snap.rows ?? [];
      if (rows.length > 0) return { rows, hasData: true, source: "snapshot" };
    } catch { /* fall through */ }
  }
  // 3) 无任何数据 → no_data 分支（不产生盲目编辑）
  return { rows: [], hasData: false, source: "none" };
}

async function runTsc(editedSource: string): Promise<{ ok: boolean; output: string }> {
  // 把生成源写到临时文件，单文件 tsc 校验（带正确 target，避免 Map 迭代报错）
  const tmp = path.join(ROOT, "lib/seo/page-meta.__check.ts");
  try {
    writeFileSync(tmp, editedSource, "utf8");
    const { stderr } = await execFileP(
      path.join(ROOT, "node_modules/.bin/tsc"),
      ["--noEmit", "--skipLibCheck", "--target", "es2020", "--module", "esnext", "--moduleResolution", "bundler", tmp],
      { cwd: ROOT },
    ).catch((e) => ({ stdout: "", stderr: e?.stderr || e?.message || String(e) }));
    const output = stderr || "";
    return { ok: !/error TS/.test(output), output };
  } catch (e: any) {
    return { ok: false, output: String(e?.message || e) };
  } finally {
    try { require("node:fs").unlinkSync(tmp); } catch { /* ignore */ }
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const { rows, hasData, source } = await loadRows();

  console.log(`== 自动优化器 ==\n数据源：${source} ${hasData ? `( ${rows.length} 行 )` : "（无，走 no_data 分支）"}`);
  const clusters: ClusterGap[] = analyzeTopicalGaps(rows, hasData);

  // 技术 / 内容 / 竞品（竞品需 SERP key，无则优雅降级）
  const tech = await runTechnicalProbe();
  const content = await runContentAudit();
  const serpRows = await fetchCompetitorData([], undefined, {});
  const competitor = computeCompetitorGaps(serpRows);

  console.log(`技术健康均分：${tech.avgScore}（critical ${tech.criticalCount}）`);
  console.log(`内容均长：${content.avgTextLength} 字符，薄弱页 ${content.thinPages}`);
  console.log(`竞品差距：${competitor.available ? `${competitor.missingQueryCount} 个缺失词` : "未启用（需 SERP API key）"}`);

  const plan: OptimizationPlan = buildOptimizationPlan(clusters);
  console.log(`\n== 优化计划（dry-run）==\n编辑项：${plan.edits.length}，延迟项：${plan.deferred.length}`);
  console.log(`潜在月新增点击：${plan.totalPotentialClicks}，潜在价值：$${plan.totalPotentialValue}`);
  for (const e of plan.edits.slice(0, 12)) {
    console.log(`  [${e.field}] ${e.route}\n     当前: ${e.current.slice(0, 60)}\n     建议: ${e.proposed.slice(0, 60)}`);
  }
  if (plan.deferred.length) {
    console.log("延迟项（需人工/GSC）：");
    for (const d of plan.deferred.slice(0, 5)) console.log(`  - ${d.actionId} (${d.kind}): ${d.reason}`);
  }

  if (!apply) {
    console.log("\n（dry-run）未修改任何文件。加 --apply 真实写回 page-meta.ts（带备份+tsc校验）。");
    return;
  }

  // 真实应用：显式把计划切到非 dry-run，再交给自带 dryRun 护栏的 applyOptimizationPlan
  console.log("\n== 应用（写回 page-meta.ts）==");
  const fsShim = { readFileSync, writeFileSync, copyFileSync, appendFileSync };
  const applyPlan: OptimizationPlan = { ...plan, dryRun: false };
  const result = await applyOptimizationPlan(applyPlan, {
    filePath: META_PATH,
    fs: fsShim,
    currentMeta: PAGE_META,
    runTsc,
  });
  console.log(`已应用 ${result.applied} 项；备份：${result.backupPath}；回滚：${result.rolledBack}`);
  if (result.errors.length) console.log("提示：\n" + result.errors.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
