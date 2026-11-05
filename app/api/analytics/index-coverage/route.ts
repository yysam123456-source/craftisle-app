/**
 * GET /api/analytics/index-coverage?limit=20
 *
 * 🔴 2026-11-04 新增：索引覆盖率分母。
 *
 * 存在的理由：北极星只有「有曝光页面数」，没有「已提交 / 已索引 / 已抓未索引」
 * 分母 ⇒ 分不清「没被抓」和「被抓了没排名」。prompt-hub 5,031 页 0 曝光的内链
 * 断裂是靠读代码才定位的，不是监控发现的 —— 这正是分母缺失的代价。
 *
 * 数据源：Google Search Console URL Inspection API（官方，webmasters.readonly scope），
 *   属性用 `sc-domain:craftisle.com`（域名属性，与 gsc-client.ts 一致）。
 *   官方配额：每属性 2,000 次/天、600 次/分钟 ⇒ 端点默认只抽样 20 条、硬上限 50。
 *
 * 🔴 判据边界（必须诚实）：
 *   · URL Inspection 返回的是「Google 已索引版本的当前状态」，不是实时测试；
 *     官方明确 "you cannot test the indexability of a live URL" through the API。
 *   · 它不预测排名、不代表流量，也不构成因果结论。
 *   · 抽样 ≠ 全站覆盖率，只是按页型分层的**分层抽样估计**，报告里必须写明样本量。
 *
 * 鉴权：需要 CRON_SECRET（?secret= 或 x-cron-secret），避免公开端点被刷爆配额。
 * 未配置 GSC 凭证时返回明确「未配置」，不静默返回空数组伪装成「没有未索引页」。
 */

import { NextResponse } from "next/server";
import { getAccessToken, getGscStatus } from "@/lib/seo/gsc-client";

const SITE_URL = "sc-domain:craftisle.com";
const INSPECT_ENDPOINT =
  "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";

/** 按页型分层抽样：每类取固定几条，避免样本全落在同一页簇。 */
const SAMPLE_URLS: Array<{ group: string; url: string }> = [
  { group: "home", url: "https://craftisle.com/" },
  { group: "tools-hub", url: "https://craftisle.com/tools" },
  { group: "tools", url: "https://craftisle.com/tools/image-compress" },
  { group: "tools", url: "https://craftisle.com/tools/png-to-jpg" },
  { group: "tools", url: "https://craftisle.com/tools/background-remover" },
  { group: "alternatives", url: "https://craftisle.com/directory/alternatives/asana" },
  { group: "alternatives", url: "https://craftisle.com/directory/alternatives/plausible-analytics" },
  { group: "landing", url: "https://craftisle.com/l/intellij-alternative" },
  { group: "landing", url: "https://craftisle.com/l/compress-pdf" },
  { group: "pair", url: "https://craftisle.com/c/png-to-jpg" },
  { group: "pair", url: "https://craftisle.com/c/png-to-pdf" },
  { group: "blog", url: "https://craftisle.com/blog" },
  { group: "directory", url: "https://craftisle.com/directory" },
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = process.env.CRON_SECRET || "";
  const given = searchParams.get("secret") || request.headers.get("x-cron-secret") || "";
  if (!secret || given !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20") || 20, 1), 50);
  const status = getGscStatus();
  if (!status.configured) {
    return NextResponse.json({
      ok: false,
      error: "GSC_SERVICE_ACCOUNT_* 未配置 —— 无法查询索引状态。这是「没凭证」，不是「全部已索引」。",
      configured: false,
    }, { status: 503 });
  }

  const targets = SAMPLE_URLS.slice(0, limit);
  const results: Array<Record<string, unknown>> = [];
  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: `GSC 鉴权失败：${e instanceof Error ? e.message : String(e)}`,
    }, { status: 502 });
  }

  for (const t of targets) {
    try {
      const res = await fetch(INSPECT_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inspectionUrl: t.url, siteUrl: SITE_URL }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        // 单条失败必须显式记录，不能静默跳过 —— 否则样本量会悄悄缩水
        results.push({ group: t.group, url: t.url, error: `HTTP ${res.status}`, verdict: "ERROR" });
        continue;
      }
      const data = await res.json() as {
        inspectionResult?: {
          indexStatusResult?: {
            verdict?: string;
            coverageState?: string;
            robotsTxtState?: string;
            indexingState?: string;
            lastCrawlTime?: string;
            googleCanonical?: string;
            pageFetchState?: string;
          };
        };
      };
      const idx = data.inspectionResult?.indexStatusResult ?? {};
      results.push({
        group: t.group,
        url: t.url,
        verdict: idx.verdict ?? "UNKNOWN",
        coverageState: idx.coverageState ?? null,
        robotsTxtState: idx.robotsTxtState ?? null,
        indexingState: idx.indexingState ?? null,
        lastCrawlTime: idx.lastCrawlTime ?? null,
        googleCanonical: idx.googleCanonical ?? null,
        pageFetchState: idx.pageFetchState ?? null,
      });
    } catch (e) {
      results.push({
        group: t.group,
        url: t.url,
        verdict: "ERROR",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const withVerdict = results.filter((r) => r.verdict && r.verdict !== "ERROR" && r.verdict !== "UNKNOWN");
  const indexed = withVerdict.filter((r) => r.verdict === "PASS");
  const summary = {
    sampled: results.length,
    answered: withVerdict.length,
    errors: results.length - withVerdict.length,
    pass: indexed.length,
    notPass: withVerdict.length - indexed.length,
    /** 分层抽样估计，不是全站覆盖率 */
    sampledPassRatio: withVerdict.length ? Number((indexed.length / withVerdict.length).toFixed(3)) : null,
  };

  return NextResponse.json({
    ok: true,
    generatedAt: new Date().toISOString(),
    siteUrl: SITE_URL,
    method: "GSC URL Inspection API (layered sample, NOT live indexability test)",
    caveat: "抽样估计，不预测排名/流量；URL Inspection 只读 Google 已索引版本的状态",
    summary,
    results,
  });
}
