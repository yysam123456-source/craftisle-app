/**
 * SEO 周报生成脚本
 * 
 * 用法：node scripts/generate-seo-report.mjs [--output markdown|json]
 * 
 * 从数据库拉取最近一周的搜索表现数据，生成 Markdown 格式周报。
 * 可在 Vercel Cron 中定时调用，也可本地手动运行。
 */

import { PrismaClient } from "@prisma/client";
import { classifyQueryType } from "../lib/seo/gsc-client.js";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const outputFormat = args.includes("--output") 
    ? args[args.indexOf("--output") + 1] 
    : "markdown";

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weekLabel = `2026-W${getWeekNumber(weekStart)}`;

  // ── 1. 本周概览 ──
  const [thisWeek, lastWeek] = await Promise.all([
    prisma.searchQuery.aggregate({
      where: { snapshotAt: weekStart },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true, ctr: true },
      _count: true,
    }),
    prisma.searchQuery.aggregate({
      where: { snapshotAt: lastWeekStart },
      _sum: { clicks: true, impressions: true },
      _avg: { position: true },
    }),
  ]);

  const tw = thisWeek._sum;
  const lw = lastWeek._sum;
  const pct = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

  // ── 2. 上升/下降词 ──
  const [rising, declining] = await Promise.all([
    prisma.searchTrend.findMany({
      where: { weekStart, source: "gsc", growth: { gt: 0 } },
      orderBy: { growth: "desc" },
      take: 10,
    }),
    prisma.searchTrend.findMany({
      where: { weekStart, source: "gsc", growth: { lt: 0 } },
      orderBy: { growth: "asc" },
      take: 5,
    }),
  ]);

  // ── 3. 分类统计 ──
  const allQueries = await prisma.searchQuery.findMany({
    where: { snapshotAt: weekStart },
    orderBy: { impressions: "desc" },
    take: 300,
  });

  const typeStats = { tools: { impressions: 0, clicks: 0, queries: 0 }, directory: { impressions: 0, clicks: 0, queries: 0 }, blog: { impressions: 0, clicks: 0, queries: 0 }, other: { impressions: 0, clicks: 0, queries: 0 } };
  for (const q of allQueries) {
    const type = classifyQueryType(q.query);
    typeStats[type].impressions += q.impressions;
    typeStats[type].clicks += q.clicks;
    typeStats[type].queries++;
  }

  // ── 4. 告警 ──
  const activeAlerts = await prisma.alertEvent.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // ── 5. 新词发现 ──
  const newQueryAlerts = activeAlerts.filter(a => a.type === "new_query");

  // ── Generate Report ──
  const impPct = pct(tw.impressions || 0, lw.impressions || 0);
  const clickPct = pct(tw.clicks || 0, lw.clicks || 0);

  if (outputFormat === "json") {
    const report = {
      week: weekLabel,
      generatedAt: new Date().toISOString(),
      overview: {
        impressions: tw.impressions || 0,
        clicks: tw.clicks || 0,
        avgPosition: thisWeek._avg.position || 0,
        avgCtr: thisWeek._avg.ctr || 0,
        totalQueries: thisWeek._count,
        impressionsChangePct: impPct,
        clicksChangePct: clickPct,
      },
      rising: rising.map(r => ({ query: r.query, growth: r.growth, count: r.count })),
      declining: declining.map(r => ({ query: r.query, growth: r.growth, count: r.count })),
      byType: typeStats,
      alerts: activeAlerts.slice(0, 10).map(a => ({
        type: a.type,
        query: a.query,
        severity: a.severity,
        message: a.message,
      })),
      newQueries: newQueryAlerts.slice(0, 5).map(a => ({
        query: a.query,
        message: a.message,
      })),
    };
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Markdown 输出
  const sign = (v) => v > 0 ? "↑" : v < 0 ? "↓" : "→";
  const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);

  const report = [
    `📊 **CRAFTISLE SEO 周报 | ${weekLabel}**`,
    ``,
    `**生成时间：** ${new Date().toISOString().split("T")[0]}`,
    ``,
    `## 一、本周概览`,
    ``,
    `| 指标 | 本周 | 周环比 |`,
    `|------|------|--------|`,
    `| 总展示量 | ${fmt(tw.impressions || 0)} | ${sign(impPct)} ${impPct}% |`,
    `| 总点击量 | ${fmt(tw.clicks || 0)} | ${sign(clickPct)} ${clickPct}% |`,
    `| 平均排名 | ${((thisWeek._avg.position || 0)).toFixed(1)} | — |`,
    `| 平均 CTR | ${((thisWeek._avg.ctr || 0) * 100).toFixed(1)}% | — |`,
    `| 搜索词数 | ${thisWeek._count} | — |`,
    ``,
    `## 二、Top 10 上升词`,
    ``,
    ...rising.slice(0, 10).map((r, i) => 
      `  ${i + 1}. **${r.query}** — 展示 ${fmt(r.count)}，周环比 ${sign(r.growth || 0)} ${Math.round((r.growth || 0) * 100)}%`
    ),
    ``,
    `## 三、Top 5 下降词（需关注）`,
    ``,
    ...declining.slice(0, 5).map((r, i) =>
      `  ${i + 1}. **${r.query}** — 展示 ${fmt(r.count)}，周环比 ${sign(r.growth || 0)} ${Math.round((r.growth || 0) * 100)}%`
    ),
    ``,
    `## 四、工具站 vs 目录站`,
    ``,
    `| 类型 | 展示量 | 点击量 | 搜索词数 |`,
    `|------|--------|--------|----------|`,
    `| 🛠️ 工具站 | ${fmt(typeStats.tools.impressions)} | ${fmt(typeStats.tools.clicks)} | ${typeStats.tools.queries} |`,
    `| 📂 目录站 | ${fmt(typeStats.directory.impressions)} | ${fmt(typeStats.directory.clicks)} | ${typeStats.directory.queries} |`,
    `| 📝 博客 | ${fmt(typeStats.blog.impressions)} | ${fmt(typeStats.blog.clicks)} | ${typeStats.blog.queries} |`,
    ``,
    `## 五、新词发现`,
    ``,
    ...(newQueryAlerts.length > 0
      ? newQueryAlerts.slice(0, 5).map((a, i) => `  ${i + 1}. ${a.message}`)
      : ["  本周无新词进入 Top 10"]),
    ``,
    `## 六、告警与建议`,
    ``,
    ...(activeAlerts.length > 0
      ? activeAlerts.slice(0, 10).map((a, i) => {
        const sev = a.severity === "critical" ? "🔴" : a.severity === "warning" ? "🟡" : "🔵";
        return `  ${i + 1}. ${sev} ${a.message}`;
      })
      : ["  ✅ 无活跃告警"]),
    ``,
    `---`,
    `*报告由 SEO Monitor v2.0 自动生成*`,
  ];

  console.log(report.join("\n"));
}

function getWeekNumber(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date - start;
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + start.getDay() + 1) / 7);
}

main()
  .catch(e => {
    console.error("Report generation failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
