import {
  GlassCard
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, GitFork, Figma, MessageSquare, Database, Code2, ListTodo,
  Image, Key, Mail, BarChart3, Cloud, Video, Music, Palette, Bot, Table,
} from "lucide-react";
import Link from "next/link";
import { getCombinedMap, toSlug, type AlternativeEntry } from "@/lib/alternatives";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Tool Alternatives Comparison | Craftisle",
  description: "Compare popular paid tools with their free & open-source alternatives. Notion vs Obsidian, Figma vs Penpot, Slack vs Mattermost, and more.",
  canonical: "https://craftisle.com/directory/compare",
});

// ── 图标映射 ─────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  "Notion": <GitFork className="h-5 w-5" />,
  "Figma": <Figma className="h-5 w-5" />,
  "Slack": <MessageSquare className="h-5 w-5" />,
  "Airtable": <Database className="h-5 w-5" />,
  "Jira": <Code2 className="h-5 w-5" />,
  "Trello": <ListTodo className="h-5 w-5" />,
  "Canva": <Image className="h-5 w-5" />,
  "Canva Pro": <Image className="h-5 w-5" />,
  "LastPass": <Key className="h-5 w-5" />,
  "GitHub Copilot": <Code2 className="h-5 w-5" />,
  "Salesforce": <BarChart3 className="h-5 w-5" />,
  "Zendesk": <Mail className="h-5 w-5" />,
  "Monday.com": <BarChart3 className="h-5 w-5" />,
  "Confluence": <Cloud className="h-5 w-5" />,
  "HubSpot": <BarChart3 className="h-5 w-5" />,
  "Dropbox": <Cloud className="h-5 w-5" />,
  "Miro": <Image className="h-5 w-5" />,
  "Asana": <ListTodo className="h-5 w-5" />,
  "Evernote": <Mail className="h-5 w-5" />,
  "Sketch": <Image className="h-5 w-5" />,
  // 新增工具图标
  "ChatGPT": <Bot className="h-5 w-5" />,
  "Adobe Photoshop": <Palette className="h-5 w-5" />,
  "Adobe Premiere Pro": <Video className="h-5 w-5" />,
  "Tableau": <Table className="h-5 w-5" />,
  "Logic Pro": <Music className="h-5 w-5" />,
  "Zoom": <MessageSquare className="h-5 w-5" />,
  "Microsoft Teams": <MessageSquare className="h-5 w-5" />,
};

// ── 页面组件 ─────────────────────────────
export default function CompareListPage() {
  const map = getCombinedMap();
  const entries = Object.values(map) as AlternativeEntry[];

  // 按分类分组
  const categoryGroups: Record<string, AlternativeEntry[]> = {};
  for (const entry of entries) {
    const cat = entry.category || "Other";
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(entry);
  }

  const categoryOrder = [
    "AI Tools",
    "Productivity",
    "Design",
    "Video",
    "Communication",
    "Project Management",
    "CRM",
    "Marketing",
    "Development",
    "Data Analysis",
    "Cloud Storage",
    "Music",
    "Security & Privacy",
    "Other",
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/directory" className="hover:underline">Directory</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Compare Alternatives</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">Tool Alternatives Comparison</h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        Compare popular paid tools with their best free and open-source alternatives.
        Find the right tool for your needs in 2026.
      </p>

      {/* 快速入口：最流行的对比 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">🔥 Most Popular Comparisons</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.slice(0, 9).map((entry) => {
            const topAlt = entry.alternatives[0];
            if (!topAlt) return null;
            const slugA = toSlug(entry.paidTool);
            const slugB = toSlug(topAlt.name);
            return (
              <Link
                key={entry.paidTool}
                href={`/directory/compare/${slugA}/${slugB}`}
                className="no-underline"
              >
                <GlassCard className="p-4 hover:shadow-md transition-shadow h-full">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      {ICON_MAP[entry.paidTool] || <ArrowRight className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {entry.paidTool} <span className="text-muted-foreground">vs</span> {topAlt.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.alternatives.length} alternatives available
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 按分类分组的所有工具 */}
      {categoryOrder.map((cat) => {
        const items = categoryGroups[cat];
        if (!items || items.length === 0) return null;
        return (
          <section key={cat} className="mb-10">
            <h2 className="text-lg font-semibold mb-4">{cat}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((entry) => {
                const topAlt = entry.alternatives[0];
                const slugA = toSlug(entry.paidTool);
                return (
                  <div key={entry.paidTool}>
                    <GlassCard className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                          {ICON_MAP[entry.paidTool] || <ArrowRight className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/directory/alternatives/${slugA}`} className="no-underline">
                            <h3 className="font-medium text-sm hover:text-primary hover:underline">{entry.paidTool}</h3>
                          </Link>
                          <p className="text-xs text-gray-500 line-clamp-2">{entry.description}</p>
                        </div>
                      </div>
                      {/* 替代品列表 */}
                      <div className="space-y-1.5">
                        {entry.alternatives.slice(0, 4).map((alt) => {
                          const slugB = toSlug(alt.name);
                          return (
                            <Link
                              key={alt.name}
                              href={`/directory/compare/${slugA}/${slugB}`}
                              className="no-underline"
                            >
                              <div className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50 transition-colors">
                                {alt.isFree ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Free</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">Paid</Badge>
                                )}
                                {alt.isOpenSource && (
                                  <Badge variant="outline" className="text-xs">OSS</Badge>
                                )}
                                <span className="truncate">{alt.name}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto flex-shrink-0" />
                              </div>
                            </Link>
                          );
                        })}
                        <Link
                          href={`/directory/alternatives/${slugA}`}
                          className="text-xs text-primary hover:underline block pt-2 mt-1 border-t"
                        >
                          View {entry.alternatives.length} alternative{entry.alternatives.length > 1 ? 's' : ''} →
                        </Link>
                      </div>
                    </GlassCard>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="mt-12 text-center border-t pt-8">
        <h2 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h2>
        <p className="text-gray-600 mb-4">
          Browse all {entries.length} tool categories with free alternatives.
        </p>
        <Link href="/directory/alternatives">
          <span className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
            View All Alternatives <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </div>
  );
}
