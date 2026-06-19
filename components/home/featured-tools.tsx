import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ArrowRight,
  Code2,
  PenTool,
  Pencil,
  Camera,
  Image,
  RefreshCcw,
  Wrench,
} from "lucide-react";

// ── 站内工具数据（详细说明）────────────────────────────
const BUILT_IN_TOOLS = [
  {
    title: "Regex Visualizer",
    desc: "Visualize & test regular expressions with real-time highlighting. Supports match groups, flags, and live test strings.",
    href: "/tools/regex-vis",
    icon: Code2,
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50 dark:bg-blue-950/20",
    tags: ["Regex", "Testing", "Dev"],
  },
  {
    title: "Handwriting Animation",
    desc: "Convert any text into a realistic handwriting animation. Choose styles, adjust speed, export as video or GIF.",
    href: "/tools/handwriting-animation",
    icon: PenTool,
    gradient: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50 dark:bg-purple-950/20",
    tags: ["Animation", "Text", "Creative"],
  },
  {
    title: "HTML Visual Editor",
    desc: "WYSIWYG HTML editor with live preview. Drag-and-drop components, edit HTML/CSS directly, see changes in real-time.",
    href: "/tools/html-visual-editor",
    icon: Pencil,
    gradient: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-50 dark:bg-orange-950/20",
    tags: ["HTML", "Editor", "WYSIWYG"],
  },
  {
    title: "AI ID Photo Maker",
    desc: "Create professional ID photos for free. AI background removal, multiple sizes (1-inch, passport, visa), custom colors.",
    href: "/tools/id-photo",
    icon: Camera,
    gradient: "from-green-500 to-emerald-500",
    bgLight: "bg-green-50 dark:bg-green-950/20",
    tags: ["ID Photo", "Passport", "AI"],
  },
  {
    title: "Image Compress",
    desc: "Compress images online for free. Reduce file size without losing quality. JPG, PNG, WebP. Quality slider (10-100%).",
    href: "/tools/image-compress",
    icon: Image,
    gradient: "from-rose-500 to-pink-500",
    bgLight: "bg-rose-50 dark:bg-rose-950/20",
    tags: ["Image", "Compress", "Optimize"],
  },
  {
    title: "Image Converter",
    desc: "Convert images between formats online for free. JPG, PNG, WebP, GIF, BMP. All processing happens in your browser.",
    href: "/tools/image-convert",
    icon: RefreshCcw,
    gradient: "from-teal-500 to-cyan-500",
    bgLight: "bg-teal-50 dark:bg-teal-950/20",
    tags: ["Convert", "Format", "Batch"],
  },
];

// ── 组件 ─────────────────────────────────────────────
export function FeaturedTools() {
  return (
    <section className="relative overflow-hidden border-t border-border/40 py-24">
      {/* 背景装饰 */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute right-1/4 bottom-0 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
            <Wrench className="h-4 w-4" />
            Built-in Online Tools
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free Online{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Utilities
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            No installation. No signup. Open your browser and start — completely free.
          </p>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group block">
                <Card className="relative h-full overflow-hidden border-2 border-transparent bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
                  {/* 顶部渐变条 */}
                  <div
                    className={`h-1 w-full bg-gradient-to-r ${tool.gradient} transition-all duration-300 group-hover:h-1.5`}
                  />

                  <CardContent className="p-6 sm:p-7">
                    {/* 图标 + 标题行 */}
                    <div className="mb-4 flex items-start gap-3.5">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tool.bgLight} shadow-md ring-1 ring-black/5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                      >
                        <Icon
                          className={`h-5.5 w-5.5 bg-gradient-to-br ${tool.gradient} bg-clip-text text-transparent`}
                        />
                      </div>
                      <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {tool.title}
                      </h3>
                    </div>

                    {/* 描述 */}
                    <p className="mb-4 leading-relaxed text-sm text-muted-foreground line-clamp-2">
                      {tool.desc}
                    </p>

                    {/* 标签 + CTA 行 */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <div className="flex flex-wrap gap-1">
                        {tool.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:gap-1.5 shrink-0">
                        Try it
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground/70">
          More tools being added regularly — check back often!
        </p>
      </div>
    </section>
  );
}
