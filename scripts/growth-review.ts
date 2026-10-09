/**
 * growth-review —— 每日增长回读（seo-ops 技能的闭环要求，此前完全缺失）
 *
 * 为什么必须有这个脚本：巡检一直只做「产出清单」，从不知道上一批动作有没有用。
 * 技能的原话是「读回后才推广 playbook」。没有台账 + 没有回读，每天做的都是猜。
 *
 * 本脚本做三件事（都用公开端点，本地可跑）：
 *   1. 段位表：把 GSC 查询按排名分桶，看 striking distance（P4–20）窗口里到底有没有东西
 *   2. 衰减清单：找出「有曝光但排名在掉」的查询，交人工判断
 *   3. 台账回读：对每条到龄动作给出 baseline vs candidate + 判定建议
 *
 * 输出：growth-review-latest.json（stdout 打印人读摘要）
 * 运行：npx tsx scripts/growth-review.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd(), "..");
const LEDGER = join(ROOT, "growth-ledger.json");
const OUT_DIR = join(ROOT, ".workbuddy", "growth");
const API = process.env.GROWTH_API || "https://craftisle.com";

interface QueryRow {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  type: string;
}

/** GSC 导出含国家分群原始行，必须按 query 去重取 impressions 最大（历史踩坑点）。 */
function dedupe(rows: QueryRow[]): QueryRow[] {
  const m = new Map<string, QueryRow>();
  for (const r of rows) {
    const key = r.query.trim().toLowerCase();
    if (!key) continue;
    const prev = m.get(key);
    if (!prev || r.impressions > prev.impressions) m.set(key, r);
  }
  return [...m.values()];
}

async function getJson<T>(path: string): Promise<T | null> {
  //🔴 本机沙箱对 craftisle.com / *.vercel.app 的出网常被 TLS 中断（curl exit 35、
  // node fetch failed）。允许外部把预取到的 JSON 放进来，避免"取不到"被当成"没有"。
  const cache = process.env.GROWTH_CACHE_DIR;
  if (cache) {
    const key = path.replace(/[^a-z0-9]+/gi, "_");
    const f = join(cache, key + ".json");
    if (existsSync(f)) {
      console.error(`[growth-review] 使用缓存 ${f}`);
      return JSON.parse(readFileSync(f, "utf-8")) as T;
    }
  }
  try {
    const url = `${API}${path}${path.includes("?") ? "&" : "?"}_cb=${Date.now()}`;
    const ctl = AbortSignal.timeout(60_000);
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: ctl });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.error(`[growth-review] 请求失败 ${path}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

interface Briefing {
  pipeline: { health: string; freshnessDays: number | null };
  alerts: { activeAlerts?: Array<{ type: string; query: string; message: string; severity: string }> };
  risingQueries?: Array<{ query: string; count: number; previousCount: number; growthPct: number }>;
}

function daysBetween(a: string, b: Date): number {
  const d = new Date(a + "T00:00:00Z").getTime();
  return Math.round((b.getTime() - d) / 86_400_000);
}

async function main() {
  const today = new Date();
  console.log(`[growth-review] ${today.toISOString().slice(0, 10)}`);

  const [briefing, tq] = await Promise.all([
    getJson<Briefing>("/api/analytics/ai-briefing"),
    getJson<{ queries: QueryRow[]; total: number; snapshotAt: string }>(
      "/api/analytics/top-queries?days=28&limit=500"
    ),
  ]);

  const report: Record<string, unknown> = { generatedAt: today.toISOString() };

  // 🔴 数据源状态必须与结论分离。取不到 ≠ 没有。历史上「Google Suggest 挂了 ⇒ 输出 0 条」
  // 曾被误读成「今日无高价值动作」，这里显式区分，避免重犯。
  const sourceOk = Boolean(tq && Array.isArray(tq.queries));
  report.dataSource = sourceOk ? "ok" : "FAILED —— 以下所有查询侧结论无效，不得当作「没有需求」";

  // ── 0. 管道健康（不输出曝光/点击数字） ──
  report.pipeline = briefing
    ? { health: briefing.pipeline.health, freshnessDays: briefing.pipeline.freshnessDays }
    : { health: "unreachable", note: "ai-briefing 读取失败" };

  // ── 1. 段位表（技能的核心判据：striking distance = P4–20） ──
  const rows = dedupe(tq?.queries ?? []);
  const bucket = (lo: number, hi: number) => rows.filter((r) => r.position >= lo && r.position <= hi);
  const bands = {
    "P1-3": bucket(1, 3),
    "P4-20": bucket(4, 20),
    "P21-50": bucket(21, 50),
    "P51+": bucket(51, 999),
  };
  report.bands = Object.fromEntries(
    Object.entries(bands).map(([k, v]) => [
      k,
      v.map((r) => ({ query: r.query, impressions: r.impressions, position: Number(r.position.toFixed(1)) })),
    ])
  );
  report.bandCounts = Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, v.length]));

  const striking = bands["P4-20"];
  if (!sourceOk) {
    console.log("[growth-review] ❌ GSC 数据源不可达 —— 段位表/衰减/回读全部无效，本次不做任何选题结论。");
  } else {
    console.log(`[growth-review] 28 天去重查询 ${rows.length} 条`);
    for (const [k, v] of Object.entries(report.bandCounts as Record<string, number>)) {
      console.log(`  ${k.padEnd(6)} ${v}`);
    }
    if (striking.length === 0) {
      console.log("  ⚠️ striking distance(P4–20) 为空 —— 每日巡检「抢 P4–20」这条判据对本站在窗口期是空的，只能作长期观测，不能作选题依据。");
    }
  }

  // ── 2. 衰减清单（有曝光且排名下滑） ──
  const active = briefing?.alerts?.activeAlerts ?? [];
  const decay = active
    .filter((a) => a.type === "position_drop" || a.type === "low_ctr")
    .map((a) => ({ severity: a.severity, query: a.query, message: a.message }));
  report.decay = decay;
  console.log(`[growth-review] 衰减/低 CTR 告警 ${decay.length} 条`);

  // ── 3. 台账回读 ──
  const readback: Array<Record<string, unknown>> = [];
  let structuralDebt: Array<Record<string, unknown>> = [];
  if (existsSync(LEDGER)) {
    const ledger = JSON.parse(readFileSync(LEDGER, "utf-8")) as {
      actions: Array<Record<string, unknown>>;
      structuralDebt?: Array<Record<string, unknown>>;
    };
    structuralDebt = ledger.structuralDebt ?? [];

    // 台账里的意图词，用 GSC 的曝光匹配 —— 命中即说明该动作已开始起效
    for (const a of ledger.actions) {
      const days = daysBetween(String(a.date), today);
      const due = (a.readbackDays as number[]).filter((d) => days >= d);
      const terms = (a.intentTerms as string[]) ?? [];
      const hits = rows.filter((r) =>
        terms.some((t) => {
          const stem = t.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
          return stem.every((w) => r.query.toLowerCase().includes(w.replace(/s$/, "")));
        })
      );
      const entry = {
        id: a.id,
        target: a.target,
        title: a.title,
        ageDays: days,
        baseline: a.baseline,
        matchedQueries: hits.map((h) => ({
          query: h.query,
          impressions: h.impressions,
          position: Number(h.position.toFixed(1)),
        })),
        candidateImpressions: hits.reduce((s, h) => s + h.impressions, 0),
        dueWindows: due,
        decision:
          due.length === 0
            ? "too_early"
            : hits.length > 0
              ? "promote_candidate"
              : days >= 56
                ? "unproven_or_dead"
                : "keep_testing",
        caveats: a.caveats,
        nextPatch: a.nextPatch,
      };
      readback.push(entry);
    }
  }
  report.readback = readback;
  report.structuralDebt = structuralDebt;

  const ready = readback.filter((r) => r.decision !== "too_early");
  console.log(`[growth-review] 台账动作 ${readback.length} 条，其中已到回读窗口 ${ready.length} 条`);
  for (const r of ready) {
    console.log(
      `  [${r.decision}] ${r.target} (${r.ageDays}d) 候选曝光=${r.candidateImpressions} 命中词=${(r.matchedQueries as unknown[]).length}`
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, "growth-review-latest.json"), JSON.stringify(report, null, 2), "utf-8");
  console.log(`[growth-review] wrote ${join(OUT_DIR, "growth-review-latest.json")}`);

  if (structuralDebt.length) {
    console.log(`[growth-review] ⚠️ 结构性欠账 ${structuralDebt.length} 项未清（每日必须复查，见 SEO_GROWTH_DIGEST.md）`);
  }
}

main();