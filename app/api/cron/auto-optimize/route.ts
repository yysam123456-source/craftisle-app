/**
 * Vercel Cron：自动优化器（分析 → 改站 → 回写仓库）
 * ───────────────────────────────────────────────
 * 触发：vercel.json 中的周级 cron（在 pull-gsc-data 之后，确保 GSC 数据最新）。
 * 鉴权：Vercel Cron 自动带 x-vercel-cron 头；手动触发用 ?secret=<CRON_SECRET>。
 *
 * 为什么跑在 Vercel 而不是 GitHub Action：
 *   GSC Service Account 密钥只配置在 Vercel 环境变量（敏感、不可导出），
 *   所以「拉 GSC」必须发生在 Vercel。回写仓库用 GitHub Contents API
 *   （Vercel 无 git 二进制），仅需一个 GITHUB_TOKEN（有 repo 写权限的 PAT，
 *   由用户在 Vercel 环境变量添加），无需把 GSC 密钥跨平台复制到 GitHub。
 *
 * 安全：默认 dryRun 预览；仅当 ?apply=1 且 applied>0 才回写。每次改写都带
 *       乐观并发 sha，若仓库已被他人改动则失败不覆盖。
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchGscPerformance, isGscConfigured } from "@/lib/seo/gsc-client";
import { analyzeTopicalGaps, QueryPageRow } from "@/lib/seo/topical-gaps";
import { buildOptimizationPlan, applyEditsToMeta, serializePageMeta } from "@/lib/seo/optimizer";
import { PAGE_META } from "@/lib/seo/page-meta";
import { getFile, commitFile } from "@/lib/seo/github-commit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET || "";
const GH_TOKEN = process.env.GITHUB_TOKEN || "";
const META_PATH = "lib/seo/page-meta.ts";

function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get("x-vercel-cron")) return true;
  const secret = req.nextUrl.searchParams.get("secret");
  return !!(CRON_SECRET && secret === CRON_SECRET);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apply = req.nextUrl.searchParams.get("apply") === "1";
  if (!GH_TOKEN) {
    return NextResponse.json({ ok: false, error: "GITHUB_TOKEN 未配置（请在 Vercel 环境变量添加有 repo 写权限的 PAT）。" }, { status: 200 });
  }

  // 1) 拉真实 GSC 数据（Vercel 环境已配置 GSC 密钥）
  let rows: QueryPageRow[] = [];
  let hasData = false;
  let source = "none";
  if (isGscConfigured()) {
    try {
      const end = new Date().toISOString().split("T")[0];
      const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const r = await fetchGscPerformance(start, end, ["query", "page"], 5000);
      if (r.error) console.warn("[auto-optimize] GSC 错误：", r.error);
      rows = (r.rows || []).map((x) => ({
        query: x.query, page: x.page, impressions: x.impressions,
        clicks: x.clicks, ctr: x.ctr, position: x.position,
      }));
      hasData = rows.length > 0;
      source = hasData ? "GSC" : "none";
    } catch (e: any) {
      console.warn("[auto-optimize] GSC 拉取失败：", e?.message);
    }
  }

  // 2) 分析 + 生成计划 + 应用到注册表副本（一次计算，多处复用）
  const clusters = analyzeTopicalGaps(rows, hasData);
  const plan = buildOptimizationPlan(clusters);
  const { meta, applied, errors } = applyEditsToMeta(PAGE_META, plan.edits);

  const summary = {
    ok: true,
    source,
    hasData,
    gscConfigured: isGscConfigured(),
    edits: plan.edits.length,
    applied,
    deferred: plan.deferred.length,
    totalPotentialClicks: plan.totalPotentialClicks,
    totalPotentialValue: plan.totalPotentialValue,
    apply,
    errors,
  };

  if (!apply) {
    return NextResponse.json({ ...summary, note: "dryRun 预览，未回写仓库。加 ?apply=1 真实提交。" });
  }
  if (applied === 0) {
    return NextResponse.json({ ...summary, note: "无字段被改写，跳过提交。" });
  }

  // 3) 回写仓库：GET 当前文件（带 sha）→ PUT 新内容
  try {
    const newSrc = serializePageMeta(meta);
    const { sha } = await getFile(GH_TOKEN, META_PATH);
    const message = `chore(seo): auto-optimize page-meta — ${applied} edits (${new Date().toISOString()})`;
    const res = await commitFile(GH_TOKEN, META_PATH, newSrc, sha, message);
    if (!res.ok) {
      return NextResponse.json({ ...summary, ok: false, commitError: res.error });
    }
    return NextResponse.json({ ...summary, committed: true, commitUrl: res.commitUrl });
  } catch (e: any) {
    return NextResponse.json({ ...summary, ok: false, commitError: e?.message || String(e) });
  }
}
