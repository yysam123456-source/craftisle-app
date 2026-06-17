import Link from "next/link";
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
  Code2,
  PenTool,
  Pencil,
  QrCode,
  Wand2,
  FileJson,
  Type,
} from "lucide-react";

// ── 站内工具数据（详细说明）────────────────────────────
const BUILT_IN_TOOLS = [
  {
    title: "Regex Visualizer",
    desc: "Visualize & test regular expressions with real-time highlighting. Supports match groups, flags, and live test strings. Perfect for debugging complex patterns.",
    href: "/tools/regex-vis",
    icon: Code2,
    color: "from-blue-500 to-cyan-500",
    tags: ["Regex", "Testing", "Developer"],
  },
  {
    title: "Handwriting Animation",
    desc: "Convert any text into a realistic handwriting animation. Choose from multiple handwriting styles, adjust speed, and export as video or GIF.",
    href: "/tools/handwriting-animation",
    icon: PenTool,
    color: "from-purple-500 to-pink-500",
    tags: ["Animation", "Text", "Creative"],
  },
  {
    title: "HTML Visual Editor",
    desc: "WYSIWYG HTML editor with live preview. Drag-and-drop components, edit HTML/CSS directly, and see changes in real-time. No coding required.",
    href: "/tools/html-visual-editor",
    icon: Pencil,
    color: "from-orange-500 to-amber-500",
    tags: ["HTML", "Editor", "WYSIWYG"],
  },
  {
    title: "QR Code Generator",
    desc: "Generate QR codes for URLs, text, WiFi, or contact info. Customize colors, add logos, and export in PNG/SVG. Free, no signup.",
    href: "/tools/qr",
    icon: QrCode,
    color: "from-green-500 to-emerald-500",
    tags: ["QR Code", "Generator", "Free"],
  },
];

// ── 组件 ─────────────────────────────────────────────
export function FeaturedTools() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* 背景装饰 */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        {/* 标题区 */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
            🛠️ Built-in Online Tools
          </div>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free Online Utilities
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            No installation. No signup. Just open your browser and start using
            these powerful tools — completely free.
          </p>
        </div>

        {/* 工具卡片：大卡片，详细内容 */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {BUILT_IN_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.href} href={tool.href} className="group">
                <Card className="h-full overflow-hidden border-2 transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10">
                  {/* 顶部渐变条 */}
                  <div className={`h-2 bg-gradient-to-r ${tool.color}`} />

                  <CardContent className="p-8">
                    {/* 图标 */}
                    <div
                      className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${tool.color} bg-opacity-10 shadow-lg`}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>

                    {/* 标题 + 描述 */}
                    <h3 className="mb-3 text-2xl font-bold tracking-tight">
                      {tool.title}
                    </h3>
                    <p className="mb-6 leading-relaxed text-muted-foreground">
                      {tool.desc}
                    </p>

                    {/* 标签 */}
                    <div className="mb-6 flex flex-wrap gap-2">
                      {tool.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-2 font-semibold text-primary group-hover:gap-3 transition-all">
                      Open Tool
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* 底部提示 */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          More tools being added regularly — check back often!
        </p>
      </div>
    </section>
  );
}
