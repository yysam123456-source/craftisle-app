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
// 🔴 原子写：裸 writeFileSync 被中断会留半截 JSON（DEBT-24）
import { writeJsonAtomic } from "./lib/data-io.mjs";

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
  /**
   * 🔴 2026-10-10 修正：`activeAlerts` 在响应**顶层**，不在 `alerts` 下。
   * 此前本脚本读 `briefing.alerts.activeAlerts` ⇒恒 undefined ⇒ 衰减清单恒为 0 条，
   * 且这个「0 条」看起来像「没有衰减」，是假的。
   */
  activeAlerts?: Array<{ type: string; query: string; message: string; severity: string }>;
  risingQueries?: Array<{ query: string; count: number; previousCount: number; growthPct: number }>;
}

interface TopQueries {
  queries: QueryRow[];
  total: number;
  snapshotAt: string;
  /** 端点自描述：是否多快照聚合、实际覆盖多少天、窗口内有几个快照。 */
  aggregated?: boolean;
  windowDays?: number;
  snapshots?: string[];
  note?: string;
}

function daysBetween(a: string, b: Date): number {
  const d = new Date(a + "T00:00:00Z").getTime();
  return Math.round((b.getTime() - d) / 86_400_000);
}

// ── 拆账口径（2026-11-04）：按 type 过滤 ──────────────────────────────────
// 🔴 `candidateImpressions` 是「该页当时已有曝光」的相关性匹配，不是动作带来的增量。
//    台账实测（11-04）：曝光 Top4 全是 infra/monitor（231/120/54/15 imp）——这些动作
//    根本不改页面，却被旧逻辑判成 promote_candidate 并回写 status=kept，
//    把「修测量管道」记成了「增长」。同样，intentTerms 为空的动作没有可匹配词，
//    56d 后必然被判 unproven_or_dead（假失败，DEBT-21 回读空转的同型）。
//
// 口径（与 automation-1788142846914 §1「拆账口径」一致）：
//   **只有「改页面内容」且「带 intentTerms」的动作才用 candidateImpressions 判读。**
//   其余一律 not_applicable，但**不静默丢弃**：仍进 readback / 仍进报告，
//   candidateImpressions = null（不是 0 —— 0 会被读成「没起量」），
//   带明确 exclusionReason，且**不回写 status**（否则会覆盖人工 verified、
//   或把 infra 动作判成 failed/kept）。
const EXPOSURE_ELIGIBLE_TYPES = new Set([
  // §1 白名单原文
  "content", "tune", "page", "copy", "seo-fix", "content-gap",
  // 台账实有、语义同为「改页面内容」的两类（不列会漏掉 7 条建页/功能动作）
  "gap", "feature",
]);

type ExclusionReason = "missing_type" | "non_content_type" | "no_intent_terms";

function classifyExposure(a: Record<string, unknown>): { eligible: boolean; reason?: ExclusionReason } {
  const type = String(a.type ?? "").trim();
  if (!type) return { eligible: false, reason: "missing_type" };
  if (!EXPOSURE_ELIGIBLE_TYPES.has(type)) return { eligible: false, reason: "non_content_type" };
  const terms = (a.intentTerms as string[] | undefined) ?? [];
  if (terms.length === 0) return { eligible: false, reason: "no_intent_terms" };
  return { eligible: true };
}

/** 报告用：把排除原因做成可读的计数，避免「排除」变成看不见的黑洞。 */
const EXCLUSION_LABEL: Record<ExclusionReason, string> = {
  missing_type: "未登记 type",
  non_content_type: "非改页面内容（infra/monitor/audit/…）",
  no_intent_terms: "无 intentTerms，无法做曝光匹配",
};

async function main() {
  const today = new Date();
  console.log(`[growth-review] ${today.toISOString().slice(0, 10)}`);

  const [briefing, tq] = await Promise.all([
    getJson<Briefing>("/api/analytics/ai-briefing"),
    getJson<TopQueries>("/api/analytics/top-queries?days=28&limit=1000"),
  ]);

  const report: Record<string, unknown> = { generatedAt: today.toISOString() };

  // 🔴 数据源状态必须与结论分离。取不到 ≠ 没有。历史上「Google Suggest 挂了 ⇒ 输出 0 条」
  // 曾被误读成「今日无高价值动作」，这里显式区分，避免重犯。
  const sourceOk = Boolean(tq && Array.isArray(tq.queries));
  report.dataSource = sourceOk ? "ok" : "FAILED —— 以下所有查询侧结论无效，不得当作「没有需求」";
  report.queryWindow = tq
    ? {
        requestedDays: 28,
        windowDays: tq.windowDays ?? null,
        aggregated: tq.aggregated ?? false,
        snapshots: tq.snapshots ?? [],
        // 🔴 截断自检：total > 返回行数 ⇒ 样本不完整，段位表只是下界
        truncated: tq.total > tq.queries.length,
        note: tq.note ?? null,
      }
    : null;

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

  // 🔴🔴 曝光下限（2026-10-10 加，第三次修正段位表判据）
  //
  // 教训链：① 修 days 参数前，P4-20 被误判为 0（取数缺陷）；
  //       ② 修完之后 P4-20 冒出 34 条，于是我写进台账「窗口非空」；
  //       ③ 但这 34 条里 33 条曝光 ≤3 —— **P17 配 2 曝光是低样本噪声，不是排名信号**。
  // GSC 的 position 在曝光个位数时抖动极大（同一页今天 P17 明天 P23 完全可能）。
  // 所以「在 P4-20」这个判据本身不够，必须同时要求**最小曝光量**，
  // 否则每天的「窗口」名单都会变，而这不是变化，是噪声。
  //
  // MIN_IMPRESSIONS 的含义：低于此曝光量的 position 不具备可行动性。
  // 取 10 是因为它是「排名能在多次抓取间稳定复现」的粗略经验下限。
  const MIN_IMPRESSIONS = 10;
  const solid = rows.filter((r) => r.impressions >= MIN_IMPRESSIONS);
  const solidBands = {
    "P1-3": solid.filter((r) => r.position <= 3),
    "P4-20": solid.filter((r) => r.position >= 4 && r.position <= 20),
    "P21-50": solid.filter((r) => r.position >= 21 && r.position <= 50),
    "P51+": solid.filter((r) => r.position >= 51),
  };
  report.bandsSolid = Object.fromEntries(
    Object.entries(solidBands).map(([k, v]) => [
      k,
      v.map((r) => ({ query: r.query, impressions: r.impressions, position: Number(r.position.toFixed(1)) })),
    ])
  );
  report.bandCountsSolid = Object.fromEntries(Object.entries(solidBands).map(([k, v]) => [k, v.length]));
  report.minImpressions = MIN_IMPRESSIONS;
  report.actionable = solidBands["P4-20"].map((r) => ({
    query: r.query,
    impressions: r.impressions,
    position: Number(r.position.toFixed(1)),
  }));

  const striking = bands["P4-20"];
  if (!sourceOk) {
    console.log("[growth-review] ❌ GSC 数据源不可达 —— 段位表/衰减/回读全部无效，本次不做任何选题结论。");
  } else {
    const w = report.queryWindow as { truncated: boolean; windowDays: number | null; snapshots: string[] };
    console.log(
      `[growth-review] ${w.windowDays ?? "?"} 天窗口 / ${w.snapshots.length} 个周快照 · 去重查询 ${rows.length} 条（端点 total=${tq!.total}）${w.truncated ? " ⚠️ 被 limit 截断，段位表是下界" : ""}`
    );
    for (const [k, v] of Object.entries(report.bandCounts as Record<string, number>)) {
      console.log(`  ${k.padEnd(6)} ${v}`);
    }
    console.log(`  ── 仅保留曝光 >= ${MIN_IMPRESSIONS} 的可行动样本（${solid.length} 条）──`);
    for (const [k, v] of Object.entries(report.bandCountsSolid as Record<string, number>)) {
      console.log(`  ${k.padEnd(6)} ${v}`);
    }
    if (striking.length > 0) {
      console.log(
        `  ⚠️ P4–20 有 ${striking.length} 条，但其中曝光 >= ${MIN_IMPRESSIONS} 的只有 ${solidBands["P4-20"].length} 条。` +
          `低曝光条目的 position 是噪声，不作选题依据。`
      );
    }
    if (solidBands["P4-20"].length > 0) {
      console.log(`  ★ 真实 striking distance：${JSON.stringify(report.actionable)}`);
    } else {
      console.log(
        `  ★ 真实 striking distance（曝光 >= ${MIN_IMPRESSIONS}）为空 ——` +
          `窗口期仍不成立，只能作长期观测。本站仍处于「从 0 拿索引」阶段。`
      );
    }
  }

  // ── 2. 衰减清单（有曝光且排名下滑） ──
  // 🔴 activeAlerts 在响应顶层（此前读 briefing.alerts.activeAlerts 恒 undefined，
  //    导致衰减清单恒为 0 条，且这个「0」看起来像「没有衰减」——是假的）
  const active = briefing?.activeAlerts ?? [];
  const decay = active
    .filter((a) => a.type === "position_drop" || a.type === "low_ctr")
    .map((a) => ({ severity: a.severity, query: a.query, message: a.message }));
  report.decay = decay;
  console.log(`[growth-review] 告警 ${active.length} 条，其中衰减/低 CTR ${decay.length} 条`);
  for (const d of decay) console.log(`  [${d.severity}] ${d.query}: ${d.message}`);

  // ── 3. 台账回读 ──
  const readback: Array<Record<string, unknown>> = [];
  let structuralDebt: Array<Record<string, unknown>> = [];

  // 🔴 2026-10-16（DEBT-13）：到期判定必须用 **GSC 实际快照日期**，
  //   不能用日历。旧版 `daysBetween(动作日期, 今天) >= readbackDays` 会
  //   「日历到期 ≠ 数据成熟」：10-09 的动作在 10-16 被判「7d 成熟」，
  //   但当时最新快照只到 10-12 = 实际只覆盖 3 天。
  //   实测台账里 28 条动作有 20 条的 readbackDays 含 7 ⇒ 这是 71% 的系统性偏差，
  //   不是 3 条的局部问题。而 `days >= 56 → unproven_or_dead` 会误杀它们。
  //
  //   教训：**日历到期 ≠ 数据成熟**。新页还需先被收录，回读窗口应更长。
  const latestSnapshot = (() => {
    const snaps = (tq as unknown as { snapshots?: string[] })?.snapshots ?? [];
    const ts = snaps
      .map((s) => Date.parse(String(s)))
      .filter((n) => Number.isFinite(n));
    return ts.length > 0 ? new Date(Math.max(...ts)) : null;
  })();
  // 🔴🔴 2026-10-20（DEBT-13 重开）：这两个量**不是一回事**，旧版把它们混成了一个。
  //
  //   dataStalenessDays = 今天 − 最新快照   → 数据有多旧（新鲜度，全局一个值）
  //   coverageDays      = 最新快照 − 动作日期 → 这个动作被多长的数据覆盖（每条各自算）
  //
  //   旧版只算了前者，却拿它跟 readbackDays 比 ⇒ **数据越新，越不给结论**：
  //     10-20 早上快照 10-12（陈旧 8 天）→ 判「可判定 20 条」
  //     补拉后快照 10-19（陈旧 1 天）  → 判「可判定 0 条、还差 6 天」
  //   同一批动作，数据变新后结论反而全消失。这在方向上是反的。
  //
  //   正确判据：**快照日期 ≥ 动作日期 + readbackDays**，即 coverageDays >= window。
  //   10-16 那次只把「日历」换成「陈旧度」，判据的主体没变，所以 DEBT-13 并未真修好。
  const dataStalenessDays = latestSnapshot
    ? Math.max(0, Math.floor((today.getTime() - latestSnapshot.getTime()) / 86_400_000))
    : -1;
  // 兼容旧字段名（报告里叫 dataAgeDays 的地方继续有值），语义改为「陈旧度」
  const dataAgeDays = dataStalenessDays;
  // 🔴 快照拿不到时必须 fail loud：静默退回日历 = 又一次「形式指标代替事实判据」
  if (!latestSnapshot) {
    console.warn(
      "[growth-review] ⚠️⚠️ 拿不到 GSC 快照日期，无法判断数据成熟度。" +
        "本次**不产出任何到期结论**（宁可报「不可判定」也不给假结论）。"
    );
  }

  if (existsSync(LEDGER)) {
    const ledger = JSON.parse(readFileSync(LEDGER, "utf-8")) as {
      actions: Array<Record<string, unknown>>;
      structuralDebt?: Array<Record<string, unknown>>;
    };
    // 🔴 2026-10-12：只数真正未清的。此前把 retracted（判断错误已撤回）和
    // resolved（已修）的条目也计入「未清」，日报出的数字虚高（报 6 实为 2），
    // 会让真欠账被噪声淹没。status 缺失视为未清（保守）。
    structuralDebt = (ledger.structuralDebt ?? []).filter(
      (d) => !["retracted", "resolved"].includes(String(d.status ?? "")),
    );

    // 台账里的意图词，用 GSC 的曝光匹配 —— 命中即说明该动作已开始起效
    // （latestSnapshot 已在函数作用域算出，见上方 DEBT-13）
    for (const a of ledger.actions) {
      const days = daysBetween(String(a.date), today);
      const windows = (a.readbackDays as number[]) ?? [];
      // 🔴 2026-10-20（DEBT-13 重开）：到期判据用**该动作被数据覆盖的天数**，
      //   不是全局陈旧度。快照缺失时一律视为未到期（data_not_mature）。
      const coverageDays = latestSnapshot
        ? Math.max(0, Math.floor((latestSnapshot.getTime() - new Date(String(a.date) + "T00:00:00Z").getTime()) / 86_400_000))
        : -1;
      const due = coverageDays >= 0 ? windows.filter((d) => coverageDays >= d) : [];
      // 🔴 只有「最早的窗口都还没到」才算未成熟。
      //   反例（我第一版的bug）：用 windows.some(d => coverageDays < d)，
      //   则窗口 [7,14,28,56] 在 coverage=8 时仍被判未成熟 ⇒
      //   明明 7 天窗口已可判定，却被埋掉（实测 28 条里只有 1 条能判定）。
      const notMature = coverageDays < 0 || due.length === 0;
      const terms = (a.intentTerms as string[]) ?? [];
      // 🔴 拆账口径（见文件顶部 EXPOSURE_ELIGIBLE_TYPES）：先判资格，再谈匹配。
      //    旧版对 78 条一视同仁 ⇒ infra/monitor 的既有曝光被记成「动作带来的增长」，
      //    intentTerms 为空的动作则会在 56d 被判成假失败。两类都必须先挡在这里。
      const cls = classifyExposure(a);
      if (!cls.eligible) {
        readback.push({
          id: a.id,
          target: a.target,
          title: a.title,
          type: a.type ?? null,
          eligible: false,
          exclusionReason: cls.reason,
          exclusionLabel: EXCLUSION_LABEL[cls.reason as ExclusionReason],
          ageDays: days,
          dataAgeDays,
          coverageDays,
          latestSnapshot: latestSnapshot ? latestSnapshot.toISOString().slice(0, 10) : null,
          baseline: a.baseline,
          matchedQueries: [],
          // 🔴 null ≠ 0：0 会被读成「没起量」，null 是「本动作不适用曝光回读」
          candidateImpressions: null,
          dueWindows: due,
          decision: "not_applicable",
          daysUntilMature: null,
          caveats: a.caveats,
          nextPatch: a.nextPatch,
        });
        continue;
      }
      // 🔴 匹配收紧（旧版是无序子串全包含：`stem.every(w => q.includes(w))`
      //   既不管词序也不去停用词，会同时产生假阳与假阴）。
      //   现在要求：所有实词**按序连续**出现（允许中间夹一个连接词）。
      const hits = rows.filter((r) => {
        // 🔴 2026-10-19 修回归：归一化后**不要保留尾部空格**。
        //   旧写法 ` ${clean} ` 让 `...edition\b` 在 " intellij community edition "
        //   上匹配失败（\b 要求边界后是非单词字符，而尾空格 + 无后续字符时行为不同）
        //   ⇒ 实测 30 条动作**全部 0 命中**，回读「看起来跑了但永远没结论」。
        //   判据：不带首尾空白的归一化串 + \b 才是正确的组合。
        const q = r.query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        return terms.some((t) => {
          const parts = t
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .split(" ")
            .filter((w) => w.length > 2)
            .map((w) => w.replace(/s$/, ""));
          if (parts.length === 0) return false;
          // 🔴 分隔符不能写成 `(?:\s+\w{1,3}\s+)?` —— 它要求插入组**两侧都带空格**，
          // 于是 `intellij community edition`（单空格直接相连）匹配不上。
          //   实测这条正则让 30 条台账动作**全部 0 命中**，回读「跑了但永远没结论」。
          //   正确形态：允许直接单空格 / 连字符 / 中间夹一个短连接词。
          // 🔴🔴 DEBT-34（2026-10-21）：词干化砍掉尾 s 后，**尾部 \b 会把该词的
          //   所有复数形态判死** —— "free asana alternatives" 词干成
          //   "free asana alternative"，再要求 \b ⇒ 永远匹配不上
          //   "free asana alternatives"（14 曝光 P19 被记成 0）。
          //   同理 "class" 词干成 "clas" 也永远匹配不上。
          //   修法：每个词干补一个可选 s（`s?`），单复数都认。
          //   实测影响 19 条 intentTerm、3 条动作判定被改判。
          const re = new RegExp(
            `\\b${parts
              .map((w) => `${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?`)
              .join("(?:[\\s-]+\\w{1,3}[\\s-]+|[\\s-]+)?")}\\b`
          );
          return re.test(q);
        });
      });
      const entry = {
        id: a.id,
        target: a.target,
        title: a.title,
        type: a.type ?? null,
        eligible: true,
        exclusionReason: null,
        ageDays: days,
        // 🔴 2026-10-20（DEBT-13 重开）：dataAgeDays 是全局陈旧度（数据有多旧），
        //   coverageDays 才是这条动作被数据覆盖了多久。判到期只看后者。
        dataAgeDays,
        coverageDays,
        latestSnapshot: latestSnapshot ? latestSnapshot.toISOString().slice(0, 10) : null,
        baseline: a.baseline,
        matchedQueries: hits.map((h) => ({
          query: h.query,
          impressions: h.impressions,
          position: Number(h.position.toFixed(1)),
        })),
        candidateImpressions: hits.reduce((s, h) => s + h.impressions, 0),
        dueWindows: due,
        // 🔴 新增 data_not_mature：把「日历没到期」与「数据没成熟」区分开。
        //   之前这两者都叫 too_early，于是报告里看不出还差几天。
        decision: notMature
          ? "data_not_mature"
          : hits.length > 0
            ? "promote_candidate"
            : coverageDays >= 56
              ? "unproven_or_dead"
              : windows.some((d) => coverageDays >= d)
                ? "keep_testing"
                : "too_early",
        // GSC 是周级快照 ⇒ 还差几天要按「还需几个周快照」说，不能按自然天。
        // 快照缺失时 daysUntilMature 为 null（数据年龄未知，不是「还差无限天」）。
        daysUntilMature:
          notMature && coverageDays >= 0
            ? Math.min(...windows.filter((d) => coverageDays < d)) - coverageDays
            : null,
        caveats: a.caveats,
        nextPatch: a.nextPatch,
      };
      readback.push(entry);
    }
  }
  report.readback = readback;
  report.structuralDebt = structuralDebt;

  // ── 到期结论闸门（automation §1：到期 N 条 ⇒ 必须产出 N 条结论）──
  // 只统计「有资格做曝光回读」的动作：infra/monitor 等被排除的动作本来就不该进
  // 这套判据，把它们算进分母会让闸门数字虚高、看起来像没结论。
  const eligibleReadback = readback.filter((r) => r.eligible === true);
  const excludedReadback = readback.filter((r) => r.eligible === false);
  const dueEligible = eligibleReadback.filter((r) => (r.dueWindows as number[]).length > 0);
  const concluded = dueEligible.filter(
    (r) => r.decision !== "data_not_mature" && r.decision !== "not_applicable",
  );
  const exclusionCounts: Record<string, number> = {};
  for (const r of excludedReadback) {
    const k = String(r.exclusionReason);
    exclusionCounts[k] = (exclusionCounts[k] ?? 0) + 1;
  }
  const readbackGate = {
    totalActions: readback.length,
    eligible: eligibleReadback.length,
    excluded: excludedReadback.length,
    exclusionCounts,
    exclusionLabels: EXCLUSION_LABEL,
    due: dueEligible.length,
    concluded: concluded.length,
    // 快照缺失时 due 恒为空 ⇒ dueEligible 为空（数据没长出来，不是漏结论）。
    // 保留此清单用于自检：正常路径下它应恒为空。
    unconcluded: dueEligible
      .filter((r) => r.decision === "data_not_mature")
      .map((r) => ({ id: r.id, coverageDays: r.coverageDays })),
    gate: dueEligible.length === concluded.length ? "pass" : "review_needed",
  };
  report.readbackGate = readbackGate;

  // ── type 错标检测（只读告警，绝不自动改判）──
  // 台账实测（11-04）：2026-10-15-28 标成 tune，但 target 是 /api/analytics/tune +
  // lib/seo/optimizer.ts、title 是「修调优器 + 加端点 + 闸门」⇒ 实为 infra，
  // 旧口径把它判成 promote_candidate(6 imp)。用**确定性路径特征**识别，
  // 不靠语义猜测（DEBT-42③：语义排序替代 keyCovered 风险高于收益）。
  const CODE_TARGET = /\/api\/|lib\/|scripts\/|\.github\/|\.ts\b|\.mjs\b|route\.ts|workflow|optimizer/i;
  const suspectMistyped = eligibleReadback.filter((r) => CODE_TARGET.test(String(r.target ?? "")));
  report.suspectMistyped = suspectMistyped.map((r) => ({
    id: r.id,
    type: r.type,
    target: r.target,
    title: r.title,
  }));
  if (suspectMistyped.length > 0) {
    console.warn(
      `[growth-review] ⚠️ ${suspectMistyped.length} 条动作 type 疑似错标（白名单类型却指向代码/端点路径）：` +
        `${suspectMistyped.map((r) => String(r.id)).join(", ")} —— 本脚本不自动改判，请人工核对台账 type`
    );
  }
  console.log(
    `[growth-review] 拆账口径：${eligibleReadback.length} 条进曝光回读 / ${excludedReadback.length} 条排除` +
      `（${Object.entries(exclusionCounts).map(([k, v]) => `${k}=${v}`).join("、")}）`
  );
  console.log(
    `[growth-review] 到期闸门：到期 ${dueEligible.length} 条 / 已出结论 ${concluded.length} 条` +
      ` / 数据未成熟 ${dueEligible.length - concluded.length} 条 ⇒ ${readbackGate.gate}`
  );

  //🔴 2026-10-16（DEBT-21）：回读结论**必须回写台账**。
  //   旧版只写 growth-review-latest.json 就结束 ⇒ 28 条动作 status 100% 停在
  //   pending，「先回读再决定今天做什么」在结构上完全空转。
  //   教训：**字段存在 ≠ 字段被维护**（status 没有写入者，就是死字段）。
  const ledgerPath = resolve(process.cwd(), "..", "growth-ledger.json");
  if (existsSync(ledgerPath)) {
    try {
      const ledgerRaw = JSON.parse(readFileSync(ledgerPath, "utf-8")) as {
        actions?: Array<Record<string, unknown>>;
      };
      const byId = new Map(readback.map((r) => [r.id, r]));
      let touched = 0;
      for (const a of ledgerRaw.actions ?? []) {
        const r = byId.get(String(a.id));
        if (!r) continue;
        // 🔴 拆账口径：not_applicable 的动作**完全不回写**。
        //   它们不改页面，曝光是相关性读数而非增量；回写会把 infra 判成
        //   failed/kept、或覆盖人工标注的 verified，重演 DEBT-21 的假结论。
        if (r.decision === "not_applicable") continue;
        // 只有真到了数据成熟窗口才改status；否则保持原状。
        // ⚠️ 不覆盖已有的人工verified（那是事实记录，不是本次推断）。
        if (r.decision !== "data_not_mature") {
          a.readback = {
            at: new Date().toISOString().slice(0, 10),
            decision: r.decision,
            dataAgeDays: r.dataAgeDays,
            coverageDays: r.coverageDays,
            candidateImpressions: r.candidateImpressions,
            matchedQueryCount: (r.matchedQueries as unknown[]).length,
          };
          a.status =
            r.decision === "promote_candidate"
              ? "kept"
              : r.decision === "unproven_or_dead"
                ? "failed"
                : "testing";
          touched++;
        }
      }
      writeJsonAtomic(ledgerPath, ledgerRaw);
      console.log(
        `[growth-review] ↺ 回写台账 ${touched} 条 status（data_not_mature 与 not_applicable 保持原状）`
      );

      // 🔴 历史污染审计（只读，不擅自删数据）：旧口径曾给 infra/monitor 等写入
      //   readback.candidateImpressions 并把 status 抬到 kept。这些数字是相关性读数，
      //   不是增量，且会让人误以为「修管道带来了曝光」。列出来供人工决定如何回滚；
      //   本脚本不改写历史事实记录（避免又一次静默数据迁移）。
      const legacy = (ledgerRaw.actions ?? []).filter((a) => {
        const t = String(a.type ?? "").trim();
        const rb = a.readback as { candidateImpressions?: number } | undefined;
        return !EXPOSURE_ELIGIBLE_TYPES.has(t) && typeof rb?.candidateImpressions === "number";
      });
      report.legacyNonContentReadback = legacy.map((a) => ({
        id: a.id,
        type: a.type,
        status: a.status,
        candidateImpressions: (a.readback as { candidateImpressions?: number }).candidateImpressions,
        target: a.target,
      }));
      if (legacy.length > 0) {
        console.warn(
          `[growth-review] ⚠️ 历史遗留：${legacy.length} 条非内容类动作仍带旧 readback.candidateImpressions` +
            `（相关性读数，非增量）；本脚本已不再回写它们，但未删除历史记录。详见 report.legacyNonContentReadback`
        );
      }
    } catch (e) {
      // 🔴 静默 catch 会把「回写失败」伪装成「本次无回读结论」。
      //   失败必须让调用方看到 —— 否则台账会永远停在 pending 而没人知道。
      console.error(
        "[growth-review] ❌ 回写台账失败（status 将继续停在 pending）：",
        e instanceof Error ? e.message : String(e)
      );
    }
  } else {
    console.warn(`[growth-review] ⚠️ 找不到台账 ${ledgerPath}，本次不回写`);
  }

  // 🔴 注意：data_not_mature 也要排除在「可判定」之外。
  //   否则报表会说「可判定 29 条、数据未成熟 29 条」——两句都成立但互相矛盾，
  //   读的人只能自己去猜。这正是「形式指标自相矛盾」的又一种形态。
  const ready = readback.filter(
    (r) =>
      r.decision !== "too_early" &&
      r.decision !== "data_not_mature" &&
      r.decision !== "not_applicable"
  );
  const notMature = readback.filter((r) => r.decision === "data_not_mature");
  console.log(
    `[growth-review] 台账动作 ${readback.length} 条 · 可判定 ${ready.length} 条 · 数据未成熟 ${notMature.length} 条` +
      (latestSnapshot
        ? `（最新快照 ${latestSnapshot.toISOString().slice(0, 10)}；数据陈旧 ${dataAgeDays} 天）`
        : `（⚠️ 无快照，本次不给到期结论）`)
  );
  if (notMature.length > 0) {
    //🔴 快照缺失时所有 daysUntilMature 都是 null（数据年龄未知，不是「还差无限天」）。
    //   旧写法`(r.daysUntilMature ?? MAX_SAFE_INTEGER)` 会把 null 当成一个有限大数，
    //   于是打印出「还差 9007199254740991 天数据」—— 这种数字会让人以为读数坏了。
    //   正确做法：null 一律排除，全部为 null 时明确说「快照缺失，天数不可估」。
    const known = notMature
      .map((r) => r.daysUntilMature)
      .filter((d): d is number => typeof d === "number" && Number.isFinite(d));
    if (known.length > 0) {
      // GSC 是周级快照 ⇒ 「还差 N 天」实际是「还需 ⌈N/7⌉ 个周快照」，两个都打印，
      // 否则读者会按自然日去等（DEBT-13 的原始困惑就是周快照被当成日级数据）。
      const needDays = Math.min(...known);
      const needSnaps = Math.ceil(needDays / 7);
      console.log(
        `  · ${notMature.length} 条等数据成熟，最快还差 ${needDays} 天覆盖` +
          `（≈ ${needSnaps} 个周快照，不是 ${needDays} 个自然日）`
      );
    } else {
      console.log(
        `  · ${notMature.length} 条等数据成熟，但**无法估算还差几天**：GSC 快照缺失`
      );
    }
  }
  for (const r of ready) {
    console.log(
      `  [${r.decision}] ${r.target} (覆盖 ${r.coverageDays}d / 陈旧 ${r.dataAgeDays}d) 候选曝光=${r.candidateImpressions} 命中词=${(r.matchedQueries as unknown[]).length}`
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });
  // 🔴 原子写（DEBT-24）：裸 writeFileSync 被中断会留半截 JSON。
  writeJsonAtomic(join(OUT_DIR, "growth-review-latest.json"), report);
  console.log(`[growth-review] wrote ${join(OUT_DIR, "growth-review-latest.json")}`);

  if (structuralDebt.length) {
    console.log(`[growth-review] ⚠️ 结构性欠账 ${structuralDebt.length} 项未清（每日必须复查，见 SEO_GROWTH_DIGEST.md）`);
  }
}

main();