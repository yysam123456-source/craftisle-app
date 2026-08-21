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

type Tab = "overview" | "queries" | "trends" | "alerts" | "compare" | "gaps" | "sites";

// ── Topical Gap Detector types ──
interface RankingGapQuery {
  query: string;
  impressions: number;
  position: number;
}
interface ObservedQuery {
  query: string;
  impressions: number;
  position: number;
  ctr: number;
}
interface ActionItem {
  id: string;
  kind: string;
  siteSlug: string;
  target: string;
  detail: string;
  effort: "S" | "M" | "L";
  potentialClicks: number;
  potentialValue: number;
  isNonBrand: boolean;
  pageUrl?: string;
  tier: "quick_wins" | "foundation" | "authority";
}
interface GapCluster {
  siteSlug: string;
  siteName: string;
  color: string;
  demand: number;
  capturedSeedCount: number;
  missingSeedCount: number;
  seedCoveragePct: number;
  rankingGapQueries: RankingGapQuery[];
  lowCtrQueries: ObservedQuery[];
  newQueries: ObservedQuery[];
  avgPosition: number;
  avgCtr: number;
  authorityScore: number;
  trafficOpportunity: number;
  gapScore: number;
  priority: "critical" | "warning" | "info" | "ok";
  gapType: "ranking" | "visibility" | "depth" | "healthy" | "no_data";
  recommendation: string;
  actions: ActionItem[];
}
interface TopicalSummary {
  clusterCount: number;
  zeroPresenceCount: number;
  rankingGapCount: number;
  lowCtrCount: number;
  totalMissingSeeds: number;
  totalNearMissQueries: number;
  trafficOpportunityTotal: number;
  potentialValueTotal: number;
  newQueryCount: number;
  actionCount: number;
  brandImpressions: number;
  nonBrandImpressions: number;
}

// ── v3 新增维度类型 ──
interface TechIssue {
  severity: "critical" | "warning" | "info";
  check: string;
  message: string;
}
interface SiteTechHealth {
  siteSlug: string;
  siteName: string;
  host: string;
  httpStatus: number | null;
  noindex: boolean;
  robotsAllowed: boolean | null;
  sitemapOk: boolean | null;
  score: number;
  issues: TechIssue[];
}
interface TechnicalReport {
  avgScore: number;
  criticalCount: number;
  sites: SiteTechHealth[];
}
interface PageContentAudit {
  siteSlug: string;
  url: string;
  ok: boolean;
  status: number | null;
  textLength: number;
  hasJsonLd: boolean;
  hasAuthorOrOrg: boolean;
  hasH1: boolean;
  score: number;
  issues: string[];
}
interface ContentAuditReport {
  avgTextLength: number;
  thinPages: number;
  pages: PageContentAudit[];
}
interface CompetitorGapItem {
  query: string;
  competitors: string[];
  ourPosition: number | null;
  siteSlug: string;
  competitorCount: number;
}
interface CompetitorReport {
  available: boolean;
  reason?: string;
  missingQueryCount: number;
  gaps: CompetitorGapItem[];
  topCompetitors: Array<{ domain: string; count: number }>;
}
interface NetworkRec {
  site?: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
}

// ── 子站 GSC 分站看板类型 ──
interface NetworkSite {
  slug: string;
  name: string;
  host: string;
  color: string;
  enabled: boolean;
  impressions: number;
  clicks: number;
  avgPosition: number;
  avgCtr: number;
  queryCount: number;
  uniquePages: number;
  share: number;
}
interface NetworkData {
  total: { impressions: number; clicks: number; avgPosition: number; avgCtr: number; queryCount: number; uniquePages: number };
  lastWeek: { impressions: number; clicks: number; avgPosition: number; avgCtr: number };
  changes: { impressionsPct: number; clicksPct: number } | null;
  sites: NetworkSite[];
  siteConfig: any[];
  snapshotAt: string;
}
interface SiteDetailTopQuery {
  query: string;
  impressions: number;
  clicks: number;
  position: number;
}
interface SiteDetail {
  site: { slug: string; name: string; host: string; color: string };
  thisWeek: any;
  lastWeek: any;
  changes: any;
  topQueries: SiteDetailTopQuery[];
}

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
  const [topical, setTopical] = useState<{
    summary: TopicalSummary;
    clusters: GapCluster[];
    roadmap: Record<string, ActionItem[]>;
    cannibalization: Array<{ query: string; sites: string[]; impressions: number }>;
    technical: TechnicalReport | null;
    content: ContentAuditReport | null;
    competitor: CompetitorReport | null;
    hasData: boolean;
  } | null>(null);
  const [networkRecs, setNetworkRecs] = useState<NetworkRec[]>([]);
  const [network, setNetwork] = useState<NetworkData | null>(null);
  const [siteDetail, setSiteDetail] = useState<SiteDetail | null>(null);
  const [detailSite, setDetailSite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [sum, trend, top, alt, type, gap, net, netData] = await Promise.all([
          fetch("/api/analytics/summary").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/trends?period=90").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/top-queries?limit=25").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/alerts?limit=30").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/by-type").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/topical-gaps").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/network/recommendations").then(r => r.ok ? r.json() : null),
          fetch("/api/analytics/network").then(r => r.ok ? r.json() : null),
        ]);
        if (sum) setSummary(sum);
        if (trend) setTrends(trend);
        if (top?.queries) setTopQueries(top.queries);
        if (alt?.alerts) setAlerts(alt.alerts);
        if (type) setByType(type.byType);
        if (gap?.clusters) setTopical({ summary: gap.summary, clusters: gap.clusters, roadmap: gap.roadmap ?? {}, cannibalization: gap.cannibalization ?? [], technical: gap.technical ?? null, content: gap.content ?? null, competitor: gap.competitor ?? null, hasData: gap.hasData });
        if (net?.recommendations) setNetworkRecs(net.recommendations);
        if (netData) setNetwork(netData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function selectSite(slug: string) {
    setDetailSite(slug);
    try {
      const r = await fetch(`/api/analytics/network?site=${slug}`);
      if (r.ok) setSiteDetail(await r.json());
    } catch (e) {
      console.error("[SitesTab] detail fetch failed:", e);
    }
  }
  function closeDetail() {
    setSiteDetail(null);
    setDetailSite(null);
  }

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
        {(["overview", "queries", "trends", "alerts", "compare", "gaps", "sites"] as Tab[]).map(t => (
          <TabButton
            key={t}
            active={tab === t}
            onClick={() => setTab(t)}
            label={t === "overview" ? "概览" : t === "queries" ? "搜索词" : t === "trends" ? "趋势" : t === "alerts" ? `告警${alerts.filter(a => !a.resolved).length ? ` (${alerts.filter(a => !a.resolved).length})` : ""}` : t === "compare" ? "对比" : t === "sites" ? "子站" : "差距"}
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
        ) : tab === "sites" ? (
          <SitesTab network={network} siteDetail={siteDetail} onSelectSite={selectSite} onCloseDetail={closeDetail} />
        ) : (
          <CompareTab byType={byType} />
        )}
        {tab === "gaps" && topical && (
          <GapsTab topical={topical} networkRecs={networkRecs} />
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

// ── 子站 GSC 分站看板 Tab ──
function SitesTab({ network, siteDetail, onSelectSite, onCloseDetail }: {
  network: NetworkData | null;
  siteDetail: SiteDetail | null;
  onSelectSite: (slug: string) => void;
  onCloseDetail: () => void;
}) {
  if (!network) {
    return <div className="text-zinc-500 text-center py-10">子站数据加载中…</div>;
  }
  const t = network.total;
  const ch = network.changes;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card title="全网展示" value={formatNum(t.impressions)} change={ch?.impressionsPct} />
        <Card title="全网点击" value={formatNum(t.clicks)} change={ch?.clicksPct} />
        <Card title="平均排名" value={t.avgPosition.toFixed(1)} inverseChange />
        <Card title="平均 CTR" value={t.avgCtr.toFixed(2)} unit="%" />
        <Card title="搜索词" value={formatNum(t.queryCount)} />
        <Card title="收录页" value={formatNum(t.uniquePages)} />
      </div>

      <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="px-4 py-2 text-sm text-zinc-400 border-b border-zinc-700/50">各子站 GSC 表现（本周 · 点击行查看 Top 查询词）</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700/50 text-zinc-400 text-left">
                <th className="p-3 font-medium">子站</th>
                <th className="p-3 font-medium text-right">展示</th>
                <th className="p-3 font-medium text-right">点击</th>
                <th className="p-3 font-medium text-right">CTR</th>
                <th className="p-3 font-medium text-right">排名</th>
                <th className="p-3 font-medium text-right">词数</th>
                <th className="p-3 font-medium text-right">收录页</th>
                <th className="p-3 font-medium">占全网</th>
              </tr>
            </thead>
            <tbody>
              {network.sites.map((s) => (
                <tr key={s.slug} onClick={() => onSelectSite(s.slug)} className="border-b border-zinc-700/20 hover:bg-zinc-700/20 transition-colors cursor-pointer">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="text-zinc-200 truncate">{s.name}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 ml-[18px] mt-0.5">{s.host}</div>
                  </td>
                  <td className="p-3 text-right text-zinc-300 font-mono">{formatNum(s.impressions)}</td>
                  <td className="p-3 text-right text-zinc-300 font-mono">{formatNum(s.clicks)}</td>
                  <td className="p-3 text-right text-zinc-300 font-mono">{s.avgCtr}%</td>
                  <td className={`p-3 text-right font-mono ${positionColor(s.avgPosition)}`}>{s.avgPosition > 0 ? (s.avgPosition > 100 ? "100+" : s.avgPosition.toFixed(1)) : "—"}</td>
                  <td className="p-3 text-right text-zinc-300 font-mono">{s.queryCount}</td>
                  <td className="p-3 text-right text-zinc-300 font-mono">{s.uniquePages}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden max-w-[80px]">
                        <div className="h-full" style={{ width: `${s.share}%`, background: s.color }} />
                      </div>
                      <span className="text-xs text-zinc-400 w-10 text-right">{s.share}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {siteDetail && (
        <SiteDetailPanel detail={siteDetail} onClose={onCloseDetail} />
      )}

      <p className="text-xs text-zinc-500">数据快照：{network.snapshotAt}。数据源：GSC Domain 属性 sc-domain:craftisle.com 的 page 维度，按子域名自动归类（无需各子站独立 property）。零曝光子站（imgprompt / resume / viewer）需在 GSC 验证收录 + 提交 sitemap + 主站内链导量。</p>
    </div>
  );
}

function SiteDetailPanel({ detail, onClose }: { detail: SiteDetail; onClose: () => void }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: detail.site.color }} />
          <h3 className="font-semibold text-white">{detail.site.name}</h3>
          <span className="text-xs text-zinc-500">{detail.site.host}</span>
        </div>
        <button onClick={onClose} className="text-xs px-2 py-1 bg-zinc-700 text-zinc-300 rounded hover:bg-zinc-600 transition-colors">关闭</button>
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div><div className="text-xs text-zinc-500">展示</div><div className="font-bold text-zinc-200">{formatNum(detail.thisWeek?.impressions ?? 0)}</div></div>
        <div><div className="text-xs text-zinc-500">点击</div><div className="font-bold text-zinc-200">{formatNum(detail.thisWeek?.clicks ?? 0)}</div></div>
        <div><div className="text-xs text-zinc-500">平均排名</div><div className={`font-bold ${positionColor(detail.thisWeek?.avgPosition ?? 0)}`}>{detail.thisWeek?.avgPosition ? detail.thisWeek.avgPosition.toFixed(1) : "—"}</div></div>
        <div><div className="text-xs text-zinc-500">搜索词</div><div className="font-bold text-zinc-200">{detail.thisWeek?.queryCount ?? 0}</div></div>
      </div>
      {detail.topQueries && detail.topQueries.length > 0 ? (
        <div>
          <div className="text-xs text-zinc-400 mb-2">Top 查询词</div>
          <div className="space-y-1">
            {detail.topQueries.map((q, i) => (
              <div key={i} className="flex justify-between text-xs text-zinc-400 border-b border-zinc-700/30 last:border-0 py-1">
                <span className="truncate text-zinc-300" title={q.query}>{q.query}</span>
                <span className="text-zinc-500 ml-2 shrink-0">P{q.position.toFixed(1)} · {formatNum(q.impressions)} 展示</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-zinc-500">暂无 Top 查询词（可能零曝光）</div>
      )}
    </div>
  );
}

// ── Topical Gap Detector Tab ──

function gapTypeLabel(t: string): string {
  return t === "ranking" ? "排名近失" : t === "visibility" ? "可见性缺口" : t === "depth" ? "深度不足" : t === "healthy" ? "健康" : "无数据";
}
function gapTypeColor(t: string): string {
  return t === "ranking" ? "bg-yellow-500/20 text-yellow-400"
    : t === "visibility" ? "bg-red-500/20 text-red-400"
    : t === "depth" ? "bg-orange-500/20 text-orange-400"
    : t === "healthy" ? "bg-green-500/20 text-green-400"
    : "bg-zinc-500/20 text-zinc-400";
}
function priorityColor(p: string): string {
  return p === "critical" ? "text-red-400" : p === "warning" ? "text-yellow-400" : p === "info" ? "text-blue-400" : "text-green-400";
}

/** 0-100 分数条 */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-zinc-400 mb-1">
        <span>{label}</span>
        <span className="text-zinc-300 font-mono">{value}</span>
      </div>
      <div className="h-2 bg-zinc-700/50 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
    </div>
  );
}

function GapsTab({ topical, networkRecs }: { topical: { summary: TopicalSummary; clusters: GapCluster[]; roadmap: Record<string, ActionItem[]>; cannibalization: Array<{ query: string; sites: string[]; impressions: number }>; technical: TechnicalReport | null; content: ContentAuditReport | null; competitor: CompetitorReport | null; hasData: boolean }; networkRecs: NetworkRec[] }) {
  const { summary, clusters, roadmap, cannibalization, technical, content, competitor, hasData } = topical;

  if (!hasData) {
    return (
      <div className="text-center py-16 text-zinc-500 space-y-3">
        <div className="text-3xl">🧭</div>
        <p className="text-lg font-medium">Gap Detector 待激活</p>
        <p className="text-sm max-w-md mx-auto">GSC 数据尚未就绪。配置凭证后，Vercel Cron 每周拉取 query+page 维度，本页自动产出「排名近失 / 低 CTR / 可见性缺口 / 深度不足」四类话题差距、流量机会量化与可执行行动蓝图。</p>
      </div>
    );
  }

  const tierMeta: Array<{ key: string; label: string; desc: string; color: string }> = [
    { key: "quick_wins", label: "Quick Wins（投入小·见效快）", desc: "近失词上首页 + 前 10 低 CTR 重写标题，立刻涨点击", color: "border-green-500/40" },
    { key: "foundation", label: "Foundation（地基）", desc: "零曝光子站索引急救 + 缺失话题新建落地页", color: "border-blue-500/40" },
    { key: "authority", label: "Authority（权威建设）", desc: "基石内容 + 内链 + 外链，拉整体排名", color: "border-purple-500/40" },
  ];

  return (
    <div className="space-y-6">
      {/* 汇总卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card title="流量机会" value={formatNum(summary.trafficOpportunityTotal)} unit="点击/月" />
        <Card title="潜在价值" value={"$" + formatNum(summary.potentialValueTotal)} unit="/月" />
        <Card title="零曝光子站" value={String(summary.zeroPresenceCount)} unit="个" />
        <Card title="近失词簇" value={String(summary.rankingGapCount)} unit="个" />
        <Card title="低CTR词" value={String(summary.lowCtrCount)} unit="个" />
        <Card title="待补话题" value={String(summary.totalMissingSeeds)} unit="个" />
        <Card title="新词发现" value={String(summary.newQueryCount)} unit="个" />
        <Card title="行动项" value={String(summary.actionCount)} unit="个" />
      </div>

      {/* 品牌 / 非品牌展示分拆 */}
      {hasData && (summary.brandImpressions + summary.nonBrandImpressions) > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-300 font-medium">展示量构成：品牌 vs 非品牌</span>
            <span className="text-zinc-500 text-xs">
              非品牌占比 {Math.round((summary.nonBrandImpressions / (summary.brandImpressions + summary.nonBrandImpressions)) * 100)}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex bg-zinc-700/50">
            <div
              className="h-full bg-blue-500/70"
              style={{ width: `${(summary.nonBrandImpressions / (summary.brandImpressions + summary.nonBrandImpressions)) * 100}%` }}
              title={`非品牌 ${formatNum(summary.nonBrandImpressions)}`}
            />
            <div
              className="h-full bg-zinc-500/70"
              style={{ width: `${(summary.brandImpressions / (summary.brandImpressions + summary.nonBrandImpressions)) * 100}%` }}
              title={`品牌 ${formatNum(summary.brandImpressions)}`}
            />
          </div>
          <div className="flex justify-between text-xs mt-1.5 text-zinc-500">
            <span>🔵 非品牌（增长盘）：{formatNum(summary.nonBrandImpressions)}</span>
            <span>⚪ 品牌（存量盘）：{formatNum(summary.brandImpressions)}</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">路线图优先排非品牌高意图词——这是净增流量，而非消耗已有品牌词。</p>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        按「差距/机会度」降序 —— 越靠前越该优先。<b className="text-zinc-300">流量机会</b> = 用 CTR-by-position 基准曲线把每个差距折算成的「月潜在新增点击」，
        <b className="text-zinc-300">潜在价值</b> = 流量机会 × 该子站单点击业务价值（美元）。权威分 = 话题覆盖广度 × 排名质量（0-100）。
      </p>

      {/* 簇卡片 */}
      <div className="grid md:grid-cols-2 gap-4">
        {clusters.map((c, i) => (
          <div key={c.siteSlug} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="font-semibold text-white truncate">{c.siteName}</span>
                <span className="text-xs text-zinc-500">#{i + 1}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-xs px-1.5 py-0.5 rounded ${gapTypeColor(c.gapType)}`}>{gapTypeLabel(c.gapType)}</span>
                <span className={`text-xs font-medium ${priorityColor(c.priority)}`}>
                  {c.priority === "critical" ? "🔴" : c.priority === "warning" ? "🟡" : c.priority === "info" ? "🔵" : "🟢"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ScoreBar label="话题权威分" value={c.authorityScore} color="linear-gradient(90deg,#22c55e,#84cc16)" />
              <ScoreBar label="差距/机会度" value={c.gapScore} color="linear-gradient(90deg,#ef4444,#f59e0b)" />
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-zinc-500">需求(曝光)</div>
                <div className="font-bold text-zinc-200">{formatNum(c.demand)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">话题覆盖</div>
                <div className="font-bold text-zinc-200">{c.capturedSeedCount}/{c.capturedSeedCount + c.missingSeedCount}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">流量机会</div>
                <div className="font-bold text-green-400">+{formatNum(c.trafficOpportunity)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">平均排名</div>
                <div className={`font-bold ${positionColor(c.avgPosition)}`}>{c.avgPosition > 0 ? (c.avgPosition > 100 ? "100+" : c.avgPosition.toFixed(1)) : "—"}</div>
              </div>
            </div>

            {c.rankingGapQueries.length > 0 && (
              <div>
                <div className="text-xs text-yellow-400 mb-1">📈 近失词（推一把上首页）</div>
                <div className="space-y-1">
                  {c.rankingGapQueries.slice(0, 4).map((q, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-zinc-400 border-b border-zinc-700/30 last:border-0 py-0.5">
                      <span className="truncate text-zinc-300" title={q.query}>{q.query}</span>
                      <span className="text-zinc-500 ml-2 shrink-0">P{q.position} · {formatNum(q.impressions)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {c.lowCtrQueries.length > 0 && (
              <div>
                <div className="text-xs text-orange-400 mb-1">⚡ 前 10 低 CTR（重写标题即涨点击）</div>
                <div className="space-y-1">
                  {c.lowCtrQueries.slice(0, 4).map((q, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-zinc-400 border-b border-zinc-700/30 last:border-0 py-0.5">
                      <span className="truncate text-zinc-300" title={q.query}>{q.query}</span>
                      <span className="text-zinc-500 ml-2 shrink-0">P{q.position} · CTR{(q.ctr * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {c.newQueries.length > 0 && (
              <div>
                <div className="text-xs text-sky-400 mb-1">🔎 新词（未纳入地图的真实查询）</div>
                <div className="flex flex-wrap gap-1">
                  {c.newQueries.slice(0, 6).map((q, idx) => (
                    <span key={idx} className="text-[11px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300">{q.query}</span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/40 rounded p-2">{c.recommendation}</p>
          </div>
        ))}
      </div>

      {/* 执行路线图（按投入×收益分档，非品牌优先·价值降序） */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">🗺️ 执行路线图（按投入×收益分档，已按「非品牌优先 + 价值降序」排列）</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {tierMeta.map((t) => {
            const items = roadmap[t.key] || [];
            const tierClicks = items.reduce((s, a) => s + a.potentialClicks, 0);
            const tierValue = items.reduce((s, a) => s + a.potentialValue, 0);
            return (
              <div key={t.key} className={`bg-zinc-800/50 border ${t.color} rounded-lg p-4`}>
                <div className="text-sm font-medium text-zinc-100 mb-0.5">{t.label}</div>
                <div className="text-xs text-zinc-500 mb-2">{t.desc}</div>
                <div className="text-xs text-green-400 mb-2">预计 +{formatNum(tierClicks)} 点击/月 · 价值 ${formatNum(Math.round(tierValue * 100) / 100)} · {items.length} 项</div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {items.length === 0 && <div className="text-xs text-zinc-600">暂无</div>}
                  {items.map((a) => (
                    <div key={a.id} className="text-xs bg-zinc-900/40 rounded p-2">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-zinc-200 font-medium truncate">{a.target}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {a.isNonBrand && <span className="px-1 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">非品牌</span>}
                          <span className={`px-1 py-0.5 rounded text-[10px] ${a.effort === "S" ? "bg-green-500/20 text-green-400" : a.effort === "M" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>{a.effort}</span>
                        </span>
                      </div>
                      <div className="text-zinc-400 leading-snug">{a.detail}</div>
                      <div className="flex justify-between mt-1">
                        {a.potentialClicks > 0 ? <span className="text-green-400">+{formatNum(a.potentialClicks)} 点击/月</span> : <span />}
                        {a.potentialValue > 0 && <span className="text-emerald-400">${formatNum(Math.round(a.potentialValue * 100) / 100)}/月</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 技术 SEO / 索引健康 */}
      {technical && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">🔧 技术 SEO / 索引健康（均分 {technical.avgScore}，critical {technical.criticalCount}）</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {technical.sites.map((s) => (
              <div key={s.siteSlug} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-200 font-medium truncate">{s.siteName}</span>
                  <span className={`text-xs font-mono ${s.score >= 80 ? "text-green-400" : s.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>健康分 {s.score}</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center text-[11px] mb-2">
                  <div><div className="text-zinc-500">HTTP</div><div className={s.httpStatus === 200 ? "text-green-400" : "text-red-400"}>{s.httpStatus ?? "—"}</div></div>
                  <div><div className="text-zinc-500">noindex</div><div className={s.noindex ? "text-red-400" : "text-green-400"}>{s.noindex ? "是" : "否"}</div></div>
                  <div><div className="text-zinc-500">robots</div><div className={s.robotsAllowed === false ? "text-red-400" : "text-green-400"}>{s.robotsAllowed === null ? "未探" : s.robotsAllowed ? "允许" : "拦截"}</div></div>
                  <div><div className="text-zinc-500">sitemap</div><div className={s.sitemapOk ? "text-green-400" : "text-yellow-400"}>{s.sitemapOk === null ? "未探" : s.sitemapOk ? "OK" : "缺"}</div></div>
                </div>
                {s.issues.length > 0 ? (
                  <div className="space-y-1">
                    {s.issues.slice(0, 4).map((iss, idx) => (
                      <div key={idx} className="text-[11px] flex gap-1.5">
                        <span className={`shrink-0 px-1 rounded ${severityColor(iss.severity)}`}>{iss.severity === "critical" ? "严重" : iss.severity === "warning" ? "警" : "提示"}</span>
                        <span className="text-zinc-400">{iss.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-green-400">无问题 ✅</div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">探针真实抓取 robots.txt / sitemap.xml / 首页 HTTP 与 noindex 信号（无需 GSC 凭证）。critical 项会直接切断索引，优先修。</p>
        </div>
      )}

      {/* 内容深度 / E-E-A-T 审计 */}
      {content && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">📄 内容深度 / E-E-A-T 审计（均正文 {content.avgTextLength} 字符，薄弱页 {content.thinPages}）</h3>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-1">
            {content.pages.map((p) => (
              <div key={p.siteSlug} className="flex items-center justify-between gap-3 text-xs border-b border-zinc-700/30 last:border-0 py-1.5">
                <span className="text-zinc-300 truncate" title={p.url}>{p.url}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={p.textLength < 300 ? "text-red-400" : "text-green-400"}>正文 {p.textLength}</span>
                  <span className={p.hasJsonLd ? "text-green-400" : "text-zinc-500"}>JSON-LD</span>
                  <span className={p.hasAuthorOrOrg ? "text-green-400" : "text-zinc-500"}>作者/组织</span>
                  <span className={p.hasH1 ? "text-green-400" : "text-zinc-500"}>H1</span>
                  <span className={`font-mono ${p.score >= 80 ? "text-green-400" : p.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>{p.score}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">薄弱页（正文 &lt; 300 字符）与缺结构化数据/作者实体，是 E-E-A-T 信号缺口，影响富媒体展示与排名。</p>
        </div>
      )}

      {/* 竞品差距（需 SERP API） */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-200 mb-3">🥊 竞品差距（GSC 永远看不到的净增流量池）</h3>
        {competitor?.available ? (
          <div className="space-y-3">
            <div className="text-xs text-zinc-400">缺失词（竞品进前 10 而我们没进）：<b className="text-zinc-200">{competitor.missingQueryCount}</b> 个</div>
            {competitor.topCompetitors.length > 0 && (
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                <div className="text-xs text-zinc-500 mb-2">最常出现的竞品域名（在抢我们的话题）</div>
                <div className="flex flex-wrap gap-2">
                  {competitor.topCompetitors.map((c) => (
                    <span key={c.domain} className="text-[11px] px-2 py-0.5 rounded bg-red-500/10 text-red-300">{c.domain} ×{c.count}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-1 max-h-60 overflow-auto">
              {competitor.gaps.slice(0, 20).map((g, idx) => (
                <div key={idx} className="flex justify-between text-xs border-b border-zinc-700/30 last:border-0 py-1">
                  <span className="text-zinc-300 truncate">"{g.query}"</span>
                  <span className="text-zinc-500 ml-2 shrink-0">{g.ourPosition ? `我们 P${g.ourPosition}` : "未进前10"} · {g.competitors.length} 竞品</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 text-sm text-zinc-400">
            <p>尚未接入 SERP API，竞品排名数据不可见。</p>
            <p className="text-xs text-zinc-500 mt-1">{competitor?.reason ?? "配置 SERP_API_BASE + SERP_API_KEY 后自动启用——绝不返回编造的竞品排名。"}</p>
          </div>
        )}
      </div>

      {/* 跨子站 cannibalization */}
      {cannibalization.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">🔀 跨子站关键词互打架（指定主承接站）</h3>
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 space-y-2">
            {cannibalization.slice(0, 8).map((c, idx) => (
              <div key={idx} className="flex justify-between text-sm border-b border-zinc-700/30 last:border-0 py-1">
                <span className="text-zinc-300 truncate">"{c.query}"</span>
                <span className="text-zinc-500 ml-2 shrink-0">{c.sites.join(" / ")} · {formatNum(c.impressions)}</span>
              </div>
            ))}
            <p className="text-xs text-zinc-500 pt-1">建议选定一个主承接站，其它站用 canonical 指向主站，或合并内容，避免 Google 分散权重。</p>
          </div>
        </div>
      )}

      {/* 全网结构性建议（network recommendations） */}
      {networkRecs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">🏗️ 全网结构性建议</h3>
          <div className="space-y-2">
            {networkRecs.map((r, idx) => (
              <div key={idx} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${severityColor(r.severity)}`}>
                    {r.severity === "critical" ? "🔴" : r.severity === "warning" ? "🟡" : "🔵"}
                  </span>
                  <span className="text-sm text-zinc-100">{r.title}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
