import {
  Card,
  CardContent,
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
    featured: true,
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
    featured: false,
  },
  {
    title: "File Viewer",
    slogan: "View any file in your browser",
    desc: "Open PDF, DOCX, PPT, XLSX, and 100+ file formats directly in your browser. No downloads, no installations, no plugins required.",
    href: "https://viewer.craftisle.com",
    icon: Eye,
    gradient: "from-green-500 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-950/20",
    features: ["100+ Formats", "No Download", "Instant Preview"],
    users: "1M+ files viewed",
    featured: false,
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
    featured: true,
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
    featured: false,
  },
];

// ── 组件 ────────────────────────────────────────────
export function FeaturedSites() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-24">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/15 bg-violet-500/5 px-4 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400">
            <Sparkles className="h-4 w-4" />
            Our Free Sub-Sites
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            More Free Tools{" "}
            <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              &amp; Services
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Explore our specialized sub-sites — each focused on a specific task, all free, no signup.
          </p>
        </div>

        {/* Bento 网格：大卡片 + 普通卡片混合 */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SUB_SITES.map((site, idx) => {
            const Icon = site.icon;
            const isFeatured = site.featured;

            return (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group ${isFeatured ? "md:col-span-2 lg:col-span-1" : ""}`}
              >
                <Card className="relative h-full overflow-hidden border-2 border-transparent bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
                  {/* 顶部渐变条 — hover 时变亮 */}
                  <div
                    className={`h-1.5 w-full bg-gradient-to-r ${site.gradient} transition-all duration-300 group-hover:h-2`}
                  />

                  <CardContent className={`p-7 ${isFeatured ? "lg:p-8" : ""}`}>
                    {/* 图标 + 标题行 */}
                    <div className="mb-5 flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${site.bgLight} shadow-md ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                      >
                        <Icon
                          className={`h-6 w-6 bg-gradient-to-br ${site.gradient} bg-clip-text text-transparent`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {site.title}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-primary/70">
                          {site.slogan}
                        </p>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:text-primary" />
                    </div>

                    {/* 描述 */}
                    <p className="mb-5 leading-relaxed text-sm text-muted-foreground line-clamp-3">
                      {site.desc}
                    </p>

                    {/* 功能标签 */}
                    <div className="mb-6 flex flex-wrap gap-1.5">
                      {site.features.map((feat) => (
                        <span
                          key={feat}
                          className="rounded-full bg-muted/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:bg-primary/5 group-hover:text-foreground/80"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* 用户数据 + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <span className="text-xs font-medium text-muted-foreground">
                        {site.users}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                        Open Site
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground/70">
          All sub-sites are free, open-source, and privacy-friendly. No signup required.
        </p>
      </div>
    </section>
  );
}
