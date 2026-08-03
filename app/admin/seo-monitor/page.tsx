"use client";

import { useState, useEffect } from "react";

// ── Types ──
interface Summary {
  thisWeek: {
    impressions: number;
    clicks: number;
    avgPosition: number;
    avgCtr: number;
    totalQueries: number;
  };
  changes: {
    impressionsPct: number;
    clicksPct: number;
    positionChange: number;
    ctrChange: number;
  };
  top3Count: number;
  alertCount: number;
  hasGscData: boolean;
  snapshotAt: string;
}

interface TrendPoint {
  date: string;
  impressions: number;
  clicks: number;
}

interface TopQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  type: string;
}

interface Alert {
  id: string;
  type: string;
  query: string;
  severity: string;
  message: string;
  data: any;
  resolved: boolean;
  createdAt: string;
}

interface ByTypeData {
  tools: any;
  directory: any;
  blog: any;
  other: any;
}

type Tab = "overview" | "queries" | "trends" | "alerts" | "compare";

// ── Utils ──
function formatNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

function pctClass(val: number, inverse = false): string {
  const good = inverse ? val < 0 : val > 0;
  return good ? "text-green-400" : val === 0 ? "text-gray-400" : "text-red-400";
}

function severityColor(s: string): string {
  return s === "critical" ? "bg-red-500/20 text-red-400"
    : s === "warning" ? "bg-yellow-500/20 text-yellow-400"
    : "bg-blue-500/20 text-blue-400";
}

function typeLabel(t: string): string {
  return t === "position_drop" ? "排名暴跌"
    : t === "position_rise" ? "排名上升"
    : t === "new_query" ? "新词发现"
    : t === "lost_query" ? "流失词"
    : t === "low_ctr" ? "低CTR"
    : t;
}

function queryTypeLabel(t: string): string {
  return t === "tools" ? "工具站" : t === "directory" ? "目录站" : t === "blog" ? "博客" : "其他";
}

function queryTypeColor(t: string): string {
  return t === "tools" ? "bg-blue-500/20 text-blue-400"
    : t === "directory" ? "bg-purple-500/20 text-purple-400"
    : t === "blog" ? "bg-green-500/20 text-green-400"
    : "bg-gray-500/20 text-gray-400";
}

function positionColor(p: number): string {
  if (p <= 3) return "text-green-400";
  if (p <= 10) return "text-yellow-400";
  return "text-red-400";
}

// ── Components ──

function Card({ title, value, unit, change, changeLabel, inverseChange = false }: {
  title: string; value: string; unit?: string; change?: number; changeLabel?: string; inverseChange?: boolean;
}) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 hover:border-zinc-600/50 transition-colors">
      <div className="text-zinc-400 text-sm mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        {unit && <span className="text-sm font-normal text-zinc-400 ml-1">{unit}</span>}
      </div>
      {change != null && (
        <div className={`text-xs mt-1 ${pctClass(change, inverseChange)}`}>
          {change > 0 ? "↑" : change < 0 ? "↓" : "→"} {Math.abs(change)}{changeLabel || "%"}
          <span className="text-zinc-500 ml-1">vs 上周</span>
        </div>
      )}
    </div>
  );
}

function BarChart({ data, maxVal }: { data: TrendPoint[]; maxVal?: number }) {
  const max = maxVal || Math.max(...data.map(d => d.impressions), 1);
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center min-w-[6px]">
          <div
            className="w-full bg-blue-500/60 hover:bg-blue-500/80 rounded-t transition-all"
            style={{ height: `${(d.impressions / max) * 100}%`, minHeight: "2px" }}
            title={`${d.date}: ${formatNum(d.impressions)}`}
          />
          {i % 5 === 0 && <span className="text-[10px] text-zinc-500 mt-1 rotate-45 origin-left">{d.date.slice(5)}</span>}
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        active ? "bg-blue-500/20 text-blue-400" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}

// ── Page ──
export default function SeoMonitorPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<{
    timeline: TrendPoint[];
    rising: any[];
    declining: any[];
  } | null>(null);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [byType, setByType] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [sum, trend, top, alt, type] = await Promise.all([
          fetch("/api/analytics/summary").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/trends?period=90").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/top-queries?limit=25").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/alerts?limit=30").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/by-type").then(r => r.ok ? r.json() : null),
        ]);
        if (sum) setSummary(sum);
        if (trend) setTrends(trend);
        if (top?.queries) setTopQueries(top.queries);
        if (alt?.alerts) setAlerts(alt.alerts);
        if (type) setByType(type.byType);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">加载 SEO 监控数据...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center flex-col gap-4">
        <div className="text-red-400">加载失败：{error}</div>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-700 text-zinc-200 rounded hover:bg-zinc-600">重试</button>
      </div>
    );
  }

  const hasData = summary?.hasGscData;

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="border-b border-zinc-700/50 bg-zinc-800/50 px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">SEO 搜索监控看板</h1>
          {!hasData && (
            <p className="text-xs text-yellow-400 mt-0.5">
              GSC 数据尚未拉取——配置环境变量 GSC_SERVICE_ACCOUNT_EMAIL 和 GSC_SERVICE_ACCOUNT_KEY 后自动拉取
            </p>
          )}
        </div>
        <div className="text-xs text-zinc-500">
          {summary?.snapshotAt ? `数据快照：${summary.snapshotAt}` : "暂无数据"}
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-zinc-700/50 px-6 py-2 flex gap-2">
        {(["overview", "queries", "trends", "alerts", "compare"] as Tab[]).map(t => (
          <TabButton
            key={t}
            active={tab === t}
            onClick={() => setTab(t)}
            label={t === "overview" ? "概览" : t === "queries" ? "搜索词" : t === "trends" ? "趋势" : t === "alerts" ? `告警${alerts.filter(a => !a.resolved).length ? ` (${alerts.filter(a => !a.resolved).length})` : ""}` : "对比"}
          />
        ))}
      </nav>

      {/* Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {!hasData ? (
          <EmptyState />
        ) : tab === "overview" ? (
          <OverviewTab summary={summary!} trends={trends} />
        ) : tab === "queries" ? (
          <QueriesTab queries={topQueries} />
        ) : tab === "trends" ? (
          <TrendsTab trends={trends} />
        ) : tab === "alerts" ? (
          <AlertsTab alerts={alerts} />
        ) : (
          <CompareTab byType={byType} />
        )}
      </main>
    </div>
  );
}

// ── Tab Components ──

function EmptyState() {
  return (
    <div className="text-center py-20 text-zinc-500 space-y-4">
      <div className="text-4xl">📊</div>
      <p className="text-lg font-medium">等待首次 GSC 数据拉取</p>
      <p className="text-sm max-w-md mx-auto">
        配置环境变量后，Vercel Cron 每周一自动从 Google Search Console 拉取搜索表现数据。数据到位后，此看板自动展示。
      </p>
      <div className="bg-zinc-800 rounded-lg p-4 text-left text-xs font-mono text-zinc-400 inline-block">
        <div>GSC_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com</div>
        <div>GSC_SERVICE_ACCOUNT_KEY=-----BEGIN PRIVATE KEY-----...</div>
      </div>
    </div>
  );
}

function OverviewTab({ summary, trends }: { summary: Summary; trends: any }) {
  const tw = summary.thisWeek;
  const ch = summary.changes;

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card title="总展示量" value={formatNum(tw.impressions)} change={ch.impressionsPct} />
        <Card title="总点击量" value={formatNum(tw.clicks)} change={ch.clicksPct} />
        <Card title="平均排名" value={tw.avgPosition.toFixed(1)} change={Math.round(ch.positionChange * 10) / 10} inverseChange changeLabel="" />
        <Card title="平均 CTR" value={(tw.avgCtr * 100).toFixed(1)} unit="%" />
        <Card title="Top 3 词数" value={String(summary.top3Count)} changeLabel="个" />
      </div>

      {/* Trend chart */}
      {trends?.timeline?.length > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm text-zinc-400 mb-3">展示量趋势（近 90 天）</h3>
          <BarChart data={trends.timeline.slice(-60)} />
        </div>
      )}

      {/* Rising / Declining */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm text-green-400 mb-2">📈 上升关键词</h3>
          {trends?.rising?.slice(0, 5).map((q: any, i: number) => (
            <div key={i} className="flex justify-between py-1 text-sm border-b border-zinc-700/30 last:border-0">
              <span className="text-zinc-300 truncate">{q.query}</span>
              <span className="text-green-400 ml-2">{q.growth != null ? `+${Math.round(q.growth * 100)}%` : "NEW"}</span>
            </div>
          ))}
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm text-red-400 mb-2">📉 下降关键词</h3>
          {trends?.declining?.slice(0, 5).map((q: any, i: number) => (
            <div key={i} className="flex justify-between py-1 text-sm border-b border-zinc-700/30 last:border-0">
              <span className="text-zinc-300 truncate">{q.query}</span>
              <span className="text-red-400 ml-2">{Math.round((q.growth ?? 0) * 100)}%</span>
            </div>
          ))}
          {(!trends?.declining || trends.declining.length === 0) && (
            <span className="text-xs text-zinc-500">暂无下降关键词 🎉</span>
          )}
        </div>
      </div>
    </div>
  );
}

function QueriesTab({ queries }: { queries: TopQuery[] }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700/50 text-zinc-400 text-left">
              <th className="p-3 font-medium">搜索词</th>
              <th className="p-3 font-medium text-right">展示</th>
              <th className="p-3 font-medium text-right">点击</th>
              <th className="p-3 font-medium text-right">CTR</th>
              <th className="p-3 font-medium text-right">排名</th>
              <th className="p-3 font-medium">类型</th>
            </tr>
          </thead>
          <tbody>
            {queries.map((q, i) => (
              <tr key={i} className="border-b border-zinc-700/20 hover:bg-zinc-700/20 transition-colors">
                <td className="p-3 text-zinc-200 max-w-[300px] truncate" title={q.query}>
                  {q.query}
                </td>
                <td className="p-3 text-right text-zinc-300">{formatNum(q.impressions)}</td>
                <td className="p-3 text-right text-zinc-300">{formatNum(q.clicks)}</td>
                <td className="p-3 text-right text-zinc-300">{q.ctr}%</td>
                <td className={`p-3 text-right font-mono ${positionColor(q.position)}`}>
                  {q.position > 100 ? "100+" : q.position.toFixed(1)}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${queryTypeColor(q.type)}`}>
                    {queryTypeLabel(q.type)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendsTab({ trends }: { trends: any }) {
  if (!trends?.timeline?.length) {
    return <div className="text-zinc-500 text-center py-10">趋势数据尚未生成</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
        <h3 className="text-sm text-zinc-400 mb-4">展示量趋势（近 90 天）</h3>
        <BarChart data={trends.timeline} />
        <div className="mt-2 text-xs text-zinc-500">
          趋势方向：{trends.trend?.direction === "rising" ? "📈 上升" : trends.trend?.direction === "declining" ? "📉 下降" : "→ 平稳"}
          {" "}({trends.trend?.changePct}%)
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm text-green-400 mb-2">上升关键词（Top 10）</h3>
          {trends?.rising?.map((q: any, i: number) => (
            <div key={i} className="flex justify-between py-1.5 text-sm border-b border-zinc-700/30 last:border-0">
              <span className="text-zinc-300 truncate">{q.query}</span>
              <span className="text-green-400 ml-2">{q.growth != null ? `+${Math.round(q.growth * 100)}%` : "NEW"}</span>
            </div>
          ))}
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <h3 className="text-sm text-red-400 mb-2">下降关键词（Top 10）</h3>
          {trends?.declining?.map((q: any, i: number) => (
            <div key={i} className="flex justify-between py-1.5 text-sm border-b border-zinc-700/30 last:border-0">
              <span className="text-zinc-300 truncate">{q.query}</span>
              <span className="text-red-400 ml-2">{Math.round((q.growth ?? 0) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: Alert[] }) {
  const unresolved = alerts.filter(a => !a.resolved);

  async function markResolved(id: string) {
    await fetch("/api/analytics/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved: true }),
    });
    window.location.reload();
  }

  return (
    <div className="space-y-3">
      {unresolved.length === 0 && (
        <div className="text-center py-10 text-zinc-500">无活跃告警 ✅</div>
      )}
      {unresolved.map(a => (
        <div key={a.id} className={`bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${severityColor(a.severity)}`}>
                  {a.severity === "critical" ? "🔴 严重" : a.severity === "warning" ? "🟡 警告" : "🔵 提示"}
                </span>
                <span className="text-xs text-zinc-500">{typeLabel(a.type)}</span>
                <span className="text-xs text-zinc-600">{new Date(a.createdAt).toLocaleDateString("zh-CN")}</span>
              </div>
              <p className="text-sm text-zinc-300">{a.message}</p>
              {a.data && (
                <div className="mt-2 text-xs text-zinc-500 bg-zinc-900/50 rounded p-2 flex flex-wrap gap-2">
                  {Object.entries(a.data).map(([k, v]) => (
                    <span key={k}>{k}: <b className="text-zinc-300">{String(v ?? "")}</b></span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => markResolved(a.id)}
              className="shrink-0 px-2 py-1 text-xs bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors"
            >
              处理
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareTab({ byType }: { byType: Record<string, any> | null }) {
  if (!byType) {
    return <div className="text-zinc-500 text-center py-10">暂无分类数据</div>;
  }

  const types = [
    { key: "tools", label: "🛠️ 工具站", color: "text-blue-400" },
    { key: "directory", label: "📂 目录站", color: "text-purple-400" },
    { key: "blog", label: "📝 博客", color: "text-green-400" },
    { key: "other", label: "📌 其他", color: "text-gray-400" },
  ];

  return (
    <div className="space-y-4">
      {types.map(({ key, label, color }) => {
        const data = byType[key];
        if (!data) return null;
        return (
          <div key={key} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
            <h3 className={`text-sm font-medium mb-3 ${color}`}>{label}</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-zinc-500">展示量</div>
                <div className="text-lg font-bold">{formatNum(data.impressions)}</div>
                {data.changes?.impressionsPct != null && (
                  <div className={`text-xs ${pctClass(data.changes.impressionsPct)}`}>
                    {data.changes.impressionsPct > 0 ? "↑" : "↓"} {data.changes.impressionsPct}%
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-zinc-500">点击量</div>
                <div className="text-lg font-bold">{formatNum(data.clicks)}</div>
                {data.changes?.clicksPct != null && (
                  <div className={`text-xs ${pctClass(data.changes.clicksPct)}`}>
                    {data.changes.clicksPct > 0 ? "↑" : "↓"} {data.changes.clicksPct}%
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-zinc-500">CTR / 排名</div>
                <div className="text-lg font-bold">
                  {data.ctr}% / {data.avgPosition}
                </div>
                <div className="text-xs text-zinc-500">{data.queryCount} 个搜索词</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
