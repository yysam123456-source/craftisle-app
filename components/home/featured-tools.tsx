import Link from "next/link";
import {
  GlassCard,
  GlassCardContent
} from "@/components/ui/glass-card";
import {
  ArrowRight,
  Code2,
  PenTool,
  Pencil,
  Camera,
  Image,
  RefreshCcw,
  Wrench,
  Sparkles,
} from "lucide-react";

// ── 站内工具数据（详细说明）────────────────────────────
const BUILT_IN_TOOLS = [
  {
    title: "Regex Visualizer",
    desc: "Visualize & test regular expressions with real-time highlighting. Supports match groups, flags, and live test strings.",
    href: "/tools/regex-vis",
    icon: Code2,
    gradient: "from-blue-500 to-cyan-500",
    gradientFrom: "#3b82f6",
    gradientTo: "#06b6d4",
    bgLight: "bg-blue-50 dark:bg-blue-950/30",
    tags: ["Regex", "Testing", "Dev"],
    emoji: "🔤",
  },
  {
    title: "Handwriting Animation",
    desc: "Convert any text into a realistic handwriting animation. Choose styles, adjust speed, export as video or GIF.",
    href: "/tools/handwriting-animation",
    icon: PenTool,
    gradient: "from-purple-500 to-pink-500",
    gradientFrom: "#a855f7",
    gradientTo: "#ec4899",
    bgLight: "bg-purple-50 dark:bg-purple-950/30",
    tags: ["Animation", "Text", "Creative"],
    emoji: "✍️",
  },
  {
    title: "HTML Visual Editor",
    desc: "WYSIWYG HTML editor with live preview. Drag-and-drop components, edit HTML/CSS directly, see changes in real-time.",
    href: "/tools/html-visual-editor",
    icon: Pencil,
    gradient: "from-orange-500 to-amber-500",
    gradientFrom: "#f97316",
    gradientTo: "#f59e0b",
    bgLight: "bg-orange-50 dark:bg-orange-950/30",
    tags: ["HTML", "Editor", "WYSIWYG"],
    emoji: "📝",
  },
  {
    title: "AI ID Photo Maker",
    desc: "Create professional ID photos for free. AI background removal, multiple sizes (1-inch, passport, visa), custom colors.",
    href: "/tools/id-photo",
    icon: Camera,
    gradient: "from-green-500 to-emerald-500",
    gradientFrom: "#22c55e",
    gradientTo: "#10b981",
    bgLight: "bg-green-50 dark:bg-green-950/30",
    tags: ["ID Photo", "Passport", "AI"],
    emoji: "📸",
  },
  {
    title: "Image Compress",
    desc: "Compress images online for free. Reduce file size without losing quality. JPG, PNG, WebP. Quality slider (10-100%).",
    href: "/tools/image-compress",
    icon: Image,
    gradient: "from-rose-500 to-pink-500",
    gradientFrom: "#f43f5e",
    gradientTo: "#ec4899",
    bgLight: "bg-rose-50 dark:bg-rose-950/30",
    tags: ["Image", "Compress", "Optimize"],
    emoji: "🖼️",
  },
  {
    title: "Image Converter",
    desc: "Convert images between formats online for free. JPG, PNG, WebP, GIF, BMP. All processing happens in your browser.",
    href: "/tools/image-convert",
    icon: RefreshCcw,
    gradient: "from-teal-500 to-cyan-500",
    gradientFrom: "#14b8a6",
    gradientTo: "#06b6d4",
    bgLight: "bg-teal-50 dark:bg-teal-950/30",
    tags: ["Convert", "Format", "Batch"],
    emoji: "🔄",
  },
];

// ── 组件 ─────────────────────────────────────────────
export function FeaturedTools() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-16 lg:py-20">
      {/* 背景装饰 — 多层渐变光斑 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-[120px]" />
        <div className="absolute -right-20 bottom-1/3 h-[400px] w-[400px] rounded-full bg-indigo-500/6 blur-[100px]" />
        <div className="absolute left-1/2 bottom-0 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-cyan-500/5 blur-[80px]" />
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
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 backdrop-blur-sm">
            <Wrench className="h-4 w-4" />
            Built-in Online Tools
            <Sparkles className="h-3.5 w-3.5 opacity-60" />
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Free Online{" "}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              Utilities
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            No installation. No signup. Open your browser and start — completely free.
          </p>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group block">
                {/* 玻璃拟态卡片容器 */}
                <div className="relative h-full overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30 dark:group-hover:border-white/15">
                  {/* ─ Hover 光晕效果 ─ */}
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `linear-gradient(135deg, ${tool.gradientFrom}15, transparent 40%, transparent 60%, ${tool.gradientTo}15)`,
                      filter: "blur(8px)",
                    }}
                  />

                  {/* 顶部渐变条 — 动态高度 + 发光 */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${tool.gradient} transition-all duration-500 group-hover:h-1.5`}
                    style={{ boxShadow: `0 1px 12px ${tool.gradientFrom}40` }}
                  />

                  <GlassCardContent className="relative p-6 sm:p-7">
                    {/* 图标 + 标题行 */}
                    <div className="mb-4 flex items-start gap-3.5">
                      {/* 图标容器 — 渐变圆形背景 */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tool.bgLight} shadow-lg ring-1 ring-black/[0.06] transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-xl group-hover:ring-black/[0.08]`}
                      >
                        <Icon
                          className="h-6 w-6 transition-transform duration-500 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${tool.gradientFrom}, ${tool.gradientTo})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        />
                      </div>
                      <h3 className="flex-1 text-lg font-bold tracking-tight text-foreground transition-colors duration-300 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text sm:text-xl"
                        style={{
                          "--hover-from": tool.gradientFrom,
                          "--hover-to": tool.gradientTo,
                        } as React.CSSProperties}
                      >
                        {tool.title}
                      </h3>
                    </div>

                    {/* 描述 */}
                    <p className="mb-4 leading-relaxed text-sm text-muted-foreground line-clamp-2 transition-colors duration-300 group-hover:text-muted-foreground/80">
                      {tool.desc}
                    </p>

                    {/* 标签 + CTA 行 */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border/40 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70 transition-all duration-300 group-hover:border-primary/10 group-hover:bg-primary/5 group-hover:text-foreground/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* CTA — 渐变色滑入 */}
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-1.5"
                        style={{
                          background: `linear-gradient(135deg, ${tool.gradientFrom}, ${tool.gradientTo})`,
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Try it
                        <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </GlassCardContent>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground/50">
          More tools being added regularly — check back often!
        </p>
      </div>
    </section>
  );
}
