import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  FileEdit,
  Eye,
  Gamepad2,
  Layout,
  Sparkles,
} from "lucide-react";

// ── 子站数据（详细说明）────────────────────────────
const SUB_SITES = [
  {
    title: "PDF Tools",
    slogan: "All-in-one PDF toolkit",
    desc: "Merge, split, compress, convert, rotate, and watermark PDF files — all in your browser. Supports 50+ file formats. No upload limits, no watermarks.",
    href: "https://pdf.craftisle.com",
    icon: FileText,
    gradient: "from-red-500 to-orange-500",
    bgLight: "bg-red-50 dark:bg-red-950/20",
    features: ["Merge & Split", "Compress & Convert", "No File Size Limit"],
    users: "2M+ PDFs processed",
  },
  {
    title: "Resume Builder",
    slogan: "ATS-friendly resumes in minutes",
    desc: "Create professional, ATS-friendly resumes with 50+ templates. Export as PDF, track applications, and get AI-powered suggestions to improve your chances.",
    href: "https://resume.craftisle.com",
    icon: FileEdit,
    gradient: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/20",
    features: ["50+ Templates", "ATS-Optimized", "AI Suggestions"],
    users: "500K+ resumes created",
  },
  {
    title: "File Viewer",
    slogan: "View any file in the browser",
    desc: "Open PDF, DOCX, PPT, XLSX, and 100+ file formats directly in your browser. No downloads, no installations, no plugins required.",
    href: "https://viewer.craftisle.com",
    icon: Eye,
    gradient: "from-green-500 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-950/20",
    features: ["100+ Formats", "No Download", "Instant Preview"],
    users: "1M+ files viewed",
  },
  {
    title: "HTML5 Games",
    slogan: "Free games, no download",
    desc: "Play 500+ free HTML5 games: puzzles, arcade, strategy, and idle games. Save progress in the cloud, compete on leaderboards, and discover new games weekly.",
    href: "https://games.craftisle.com",
    icon: Gamepad2,
    gradient: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/20",
    features: ["500+ Free Games", "Cloud Saves", "Weekly New Games"],
    users: "1M+ games played monthly",
  },
  {
    title: "Online Whiteboard",
    slogan: "Collaborative drawing for teams",
    desc: "Real-time collaborative whiteboard for teams. Draw, diagram, sticky-note, and brainstorm together — with video call integration and infinite canvas.",
    href: "https://draw.craftisle.com",
    icon: Layout,
    gradient: "from-cyan-500 to-blue-500",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/20",
    features: ["Real-time Collab", "Infinite Canvas", "Video Integration"],
    users: "100K+ teams using",
  },
];

// ── 组件 ────────────────────────────────────────────
export function FeaturedSites() {
  return (
    <section className="relative overflow-hidden border-t py-24">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm text-blue-600 dark:text-blue-400">
            🌐 Our Free Sub-Sites
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            More Free Tools & Services
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Explore our specialized sub-sites — each focused on a specific task,
            all free, no signup required.
          </p>
        </div>

        {/* 子站卡片：大卡片，详细内容 */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_SITES.map((site) => {
            const Icon = site.icon;
            return (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="h-full overflow-hidden border-2 transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10">
                  {/* 顶部渐变条 */}
                  <div className={`h-2 bg-gradient-to-r ${site.gradient}`} />

                  <CardContent className="p-8">
                    {/* 图标 + 标题行 */}
                    <div className="mb-6 flex items-start gap-4">
                      <div className={`rounded-2xl ${site.bgLight} p-4 shadow-lg`}>
                        <Icon className={`h-8 w-8 bg-gradient-to-br ${site.gradient} bg-clip-text text-transparent`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold tracking-tight">
                          {site.title}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-primary">
                          {site.slogan}
                        </p>
                      </div>
                      <ExternalLink className="mt-2 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>

                    {/* 详细描述 */}
                    <p className="mb-6 leading-relaxed text-muted-foreground">
                      {site.desc}
                    </p>

                    {/* 功能标签 */}
                    <div className="mb-6 flex flex-wrap gap-2">
                      {site.features.map((feat) => (
                        <span
                          key={feat}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          ✓ {feat}
                        </span>
                      ))}
                    </div>

                    {/* 用户数据 + CTA */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        📊 {site.users}
                      </span>
                      <span className="inline-flex items-center gap-2 font-semibold text-primary group-hover:gap-3 transition-all">
                        Open Site
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          All sub-sites are free, open-source, and privacy-friendly.
        </p>
      </div>
    </section>
  );
}
