import {
  GlassCard,
  GlassCardContent
} from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ExternalLink,
  FileText,
  FileEdit,
  Eye,
  Gamepad2,
  Layout,
  Image,
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
    gradientFrom: "#ef4444",
    gradientTo: "#f97316",
    bgLight: "bg-red-50 dark:bg-red-950/30",
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
    gradientFrom: "#3b82f6",
    gradientTo: "#6366f1",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
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
    gradientFrom: "#22c55e",
    gradientTo: "#10b981",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    features: ["100+ Formats", "No Download", "Instant Preview"],
    users: "1M+ files viewed",
    featured: false,
  },
  {
    title: "HTML5 Games",
    slogan: "Free games, no download",
    desc: "Play 500+ free HTML5 games: puzzles, arcade, strategy, and idle games. Save progress in the cloud, compete on leaderboards, and discover new games weekly.",
    href: "https://game.craftisle.com",
    icon: Gamepad2,
    gradient: "from-purple-500 to-pink-500",
    gradientFrom: "#a855f7",
    gradientTo: "#ec4899",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
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
    gradientFrom: "#06b6d4",
    gradientTo: "#3b82f6",
    bgLight: "bg-cyan-50 dark:bg-cyan-950/30",
    features: ["Real-time Collab", "Infinite Canvas", "Video Integration"],
    users: "100K+ teams using",
    featured: false,
  },
  {
    title: "Image Prompt",
    slogan: "AI image prompt generator & optimizer",
    desc: "Generate, optimize, and enhance AI image prompts for Midjourney, DALL-E, Stable Diffusion. Built-in prompt templates, style presets, and one-click enhancement.",
    href: "https://imgprompt.craftisle.com",
    icon: Image,
    gradient: "from-fuchsia-500 to-pink-500",
    gradientFrom: "#d946ef",
    gradientTo: "#ec4899",
    bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
    features: ["Prompt Templates", "Style Presets", "One-tap Enhance"],
    users: "50K+ prompts generated",
    featured: true,
  },
];

// ── 组件 ────────────────────────────────────────────
export function FeaturedSites() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-16 lg:py-20">
      {/* 背景装饰 — 多层渐变光斑 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-20 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/8 blur-[120px]" />
        <div className="absolute -left-20 bottom-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/6 blur-[100px]" />
        <div className="absolute left-1/2 top-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[80px]" />
      </div>

      {/* 网格背景纹理 */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-12 text-center animate-fade-in-up stagger-1">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-purple-500/10 px-5 py-2 text-sm font-semibold text-violet-600 dark:text-violet-400 backdrop-blur-sm">
            <Sparkles className="h-4 w-4" />
            Our Free Sub-Sites
            <Sparkles className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            More Free Tools{" "}
            <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
              &amp; Services
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Explore our specialized sub-sites — each focused on a specific task, all free, no signup.
          </p>
        </div>

        {/* Bento 网格：大卡片 + 普通卡片混合 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SUB_SITES.map((site, idx) => {
            const Icon = site.icon;
            const isFeatured = site.featured;

            return (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block ${isFeatured ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                {/* 玻璃拟态卡片容器 */}
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30 dark:group-hover:border-white/15">
                  {/* ─ Hover 光晕效果 ─ */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${site.gradientFrom}15, transparent 40%, transparent 60%, ${site.gradientTo}15)`,
                      filter: "blur(8px)",
                    }}
                  />

                  {/* 顶部渐变条 — 动态高度 */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${site.gradient} transition-all duration-500 group-hover:h-1.5 group-hover:shadow-lg`}
                    style={{ boxShadow: `0 1px 12px ${site.gradientFrom}40` }}
                  />

                  <GlassCardContent className={`relative p-6 sm:p-7 ${isFeatured ? "lg:p-8" : ""}`}>
                    {/* 图标 + 标题行 */}
                    <div className="mb-4 flex items-start gap-3.5">
                      {/* 图标容器 — 渐变圆形背景 */}
                      <div
                        className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl ${site.bgLight} shadow-lg ring-1 ring-black/[0.06] transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-xl group-hover:ring-black/[0.08]`}
                      >
                        <Icon
                          className="h-6 w-6 transition-transform duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${site.gradientFrom}, ${site.gradientTo})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-lg font-bold tracking-tight text-foreground transition-all duration-300 sm:text-xl"
                          style={{
                            color: "inherit",
                          }}
                        >
                          <span className="group-hover:hidden">{site.title}</span>
                          <span
                            className="hidden group-hover:inline-block bg-gradient-to-r bg-clip-text text-transparent"
                            style={{
                              backgroundImage: `linear-gradient(135deg, ${site.gradientFrom}, ${site.gradientTo})`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            }}
                          >
                            {site.title}
                          </span>
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-primary/60 transition-colors group-hover:text-primary/80">
                          {site.slogan}
                        </p>
                      </div>
                      {/* 外链图标 — 滑入动画 */}
                      <ExternalLink className="mt-1.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" />
                    </div>

                    {/* 描述 */}
                    <p className="mb-5 leading-relaxed text-sm text-muted-foreground line-clamp-3 transition-colors duration-300 group-hover:text-muted-foreground/80">
                      {site.desc}
                    </p>

                    {/* 功能标签 — pill 样式增强 */}
                    <div className="mb-5 flex flex-wrap gap-1.5">
                      {site.features.map((feat) => (
                        <span
                          key={feat}
                          className="rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground/80 transition-all duration-300 group-hover:border-primary/15 group-hover:bg-primary/5 group-hover:text-foreground/70"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>

                    {/* 用户数据 + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <span className="text-xs font-medium text-muted-foreground/60 transition-colors group-hover:text-muted-foreground/80">
                        {site.users}
                      </span>
                      {/* CTA 按钮 — 渐变文字 + 滑动箭头 */}
                      <span
                        className="inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-300 group-hover:gap-2.5"
                        style={{
                          background: `linear-gradient(135deg, ${site.gradientFrom}, ${site.gradientTo})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Open Site
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" style={{ color: site.gradientFrom }} />
                      </span>
                    </div>
                  </GlassCardContent>
                </div>
              </a>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground/50">
          All sub-sites are free, open-source, and privacy-friendly. No signup required.
        </p>
      </div>
    </section>
  );
}
