import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowRight,
  Search,
  Gamepad2,
  FileText,
  Eye,
  Code2,
  PenTool,
  Pencil,
  FileEdit,
  Layout,
  QrCode,
} from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { RandomRecommendations } from "@/components/home/random-recommendations";

// ── 静态数据（build 时读取）────────────────────────────
interface CategoryInfo {
  name: string;
  count: number;
}

interface ResourceInfo {
  id: string;
  name: string;
  description: string;
  url: string;
}

function getHomepageData() {
  const basePath = path.join(process.cwd(), "public", "data");

  // 1. 读取 fmhy-resources.json → 按资源数取 Top 10 分类
  let topCategories: CategoryInfo[] = [];
  try {
    const fmhyRaw = fs.readFileSync(
      path.join(basePath, "fmhy-resources.json"),
      "utf-8"
    );
    const fmhyData = JSON.parse(fmhyRaw);
    const categories = fmhyData.categories || {};

    topCategories = Object.entries(categories)
      .map(([name, cat]: [string, any]) => ({
        name,
        count: (cat.resources || []).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch (err) {
    console.error("Failed to load fmhy-resources.json:", err);
  }

  // 2. 读取 home-blocks.json → weekly-hottest 块（取前 6 个）
  let trendingResources: ResourceInfo[] = [];
  try {
    const blocksRaw = fs.readFileSync(
      path.join(basePath, "home-blocks.json"),
      "utf-8"
    );
    const blocksData = JSON.parse(blocksRaw);
    const weeklyBlock = (blocksData.blocks || []).find(
      (b: any) => b.id === "weekly-hottest"
    );
    trendingResources = (weeklyBlock?.resources || []).slice(0, 6).map(
      (r: any) => ({
        id: r.id || "",
        name: r.name || "Unnamed",
        description: r.description || "",
        url: r.url || "",
      })
    );
  } catch (err) {
    console.error("Failed to load home-blocks.json:", err);
  }

  return { topCategories, trendingResources };
}

// ── Metadata ───────────────────────────────────────────
export const metadata: Metadata = {
  title: "Craftisle — Free Software Directory & Online Tools",
  description:
    "Search 16,000+ free & open-source software. Find alternatives, compare tools. Plus: play free HTML5 games & use 100+ online tools.",
  keywords: [
    "free software directory",
    "open source software",
    "free online tools",
    "software alternatives",
    "free games online",
    "Craftisle",
    "fmhy",
    "free tools",
  ],
  openGraph: {
    title: "Craftisle — Free Software Directory & Online Tools",
    description: "Search 16,000+ free & open-source software.",
    url: "https://craftisle.com",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://craftisle.com/_static/og.jpg",
        width: 1200,
        height: 630,
        alt: "Craftisle — Free Software Directory & Online Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Craftisle — Free Software Directory & Online Tools",
    description: "Search 16,000+ free & open-source software.",
    images: ["https://craftisle.com/_static/og.jpg"],
  },
  alternates: {
    canonical: "https://craftisle.com",
    languages: {
      en: "https://craftisle.com",
      "zh-CN": "https://craftisle.com/zh",
      "x-default": "https://craftisle.com",
    },
  },
};

// ── 分类图标映射（用函数避免编码问题）────────────────
function getCategoryIcon(name: string): string {
  const icons: Record<string, string> = {
    "Artificial-Intelligence": "🤖",
    "AI-Horde": "🤖",
    "AI-Text": "✍️",
    "AI-Image": "🖼️",
    Gaming: "🎮",
    Reading: "📚",
    Mobile: "📱",
    Linux: "🐧",
    Adblock: "🔒",
    Downloading: "📥",
    Storage: "💾",
    Misc: "🔧",
    Video: "🎬",
    Music: "🎵",
    Images: "🖼️",
    Development: "💻",
    Design: "🎨",
    Privacy: "🔒",
    VPN: "🌐",
    Streaming: "📺",
  };
  return icons[name] || "🔧";
}

// ── 首页主组件 ─────────────────────────────────────────
export default function IndexPage() {
  const { topCategories, trendingResources } = getHomepageData();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Craftisle",
    url: "https://craftisle.com",
    description:
      "Free software directory with 16,000+ tools. Play free HTML5 games. Use 100+ free online tools.",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://craftisle.com/directory/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      {/* JSON-LD 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero 区 ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-32">
        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* 标签 */}
            <Badge variant="secondary" className="mb-6">
              🔥 16,000+ Free & Open-Source Software
            </Badge>

            {/* 主标题 */}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Find Free & Open-Source{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Software
              </span>{" "}
              for Any Task
            </h1>

            {/* 副标题 */}
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Search 16,000+ free tools, find alternatives, compare software.
              Plus: play free games & use 100+ online tools.
            </p>

            {/* 搜索框 */}
            <div className="mx-auto mt-10 max-w-2xl">
              <form action="/directory/search" method="GET" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="q"
                    placeholder='Try: "video downloader", "adblock", "AI chat"'
                    className="w-full rounded-lg border border-input bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" size="lg">
                  Search
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                Hot searches: video downloader, adblock, AI tools, manga, games
              </p>
            </div>

            {/* 快捷入口 */}
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2">
              {[
                { label: "AI Tools", href: "/directory/best/artificial-intelligence" },
                { label: "Adblock", href: "/directory/best/adblock" },
                { label: "Video Editing", href: "/directory/search?q=video+editing" },
                { label: "Games", href: "/games" },
                { label: "Linux", href: "/directory/Linux" },
                { label: "Development", href: "/directory/best/development" },
                { label: "Storage", href: "/directory/Storage" },
                { label: "Downloading", href: "/directory/Downloading" },
              ].map((entry) => (
                <Link key={entry.href} href={entry.href}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                    {entry.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 广告：Hero 下方 ───────────────────────────── */}
      <section className="flex justify-center py-6">
        <AdSlot
          slotId="homepage-below-hero"
          size="leaderboard"
          label="Homepage Below Hero"
        />
      </section>

      {/* ── 板块 1：热门分类 ───────────────────────────── */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Browse by Category
              </h2>
              <p className="mt-2 text-muted-foreground">
                Top categories by resource count
              </p>
            </div>
            <Link href="/directory/categories">
              <Button variant="ghost">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {topCategories.map((cat) => (
              <Link
                key={cat.name}
                href={`/directory/${encodeURIComponent(cat.name)}`}
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">
                        {getCategoryIcon(cat.name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {cat.name.replace(/-/g, " ")}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {cat.count.toLocaleString()} resources
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 广告：分类与 Trending 之间 ────────────────── */}
      <section className="flex justify-center py-6">
        <AdSlot
          slotId="homepage-between-sections"
          size="leaderboard"
          label="Homepage Between Sections"
        />
      </section>

      {/* ── 板块 2：Trending This Week ─────────────────── */}
      {trendingResources.length > 0 && (
        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  🔥 Trending This Week
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Most popular resources this week
                </p>
              </div>
              <Link href="/directory/trending">
                <Button variant="ghost">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trendingResources.map((res) => (
                <Card
                  key={res.id}
                  className="transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{res.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {res.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/directory/resource/${encodeURIComponent(res.id)}`}>
                      <Button variant="ghost" size="sm" className="w-full">
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 板块 3：随机推荐（客户端组件）───────────────── */}
      <RandomRecommendations />

      {/* ── 板块 4：子站入口 ───────────────────────────── */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              More Free Tools
            </h2>
            <p className="mt-2 text-muted-foreground">
              Explore our other free tools & services
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              {
                title: "PDF Tools",
                desc: "Merge, split, compress, convert PDF files",
                href: "https://pdf.craftisle.com",
                icon: FileText,
              },
              {
                title: "Resume Builder",
                desc: "Build ATS-friendly resume in minutes",
                href: "https://resume.craftisle.com",
                icon: FileEdit,
              },
              {
                title: "File Viewer",
                desc: "View PDF/DOCX/PPT online, no download",
                href: "https://viewer.craftisle.com",
                icon: Eye,
              },
              {
                title: "Online Games",
                desc: "Free HTML5 games, no download",
                href: "https://games.craftisle.com",
                icon: Gamepad2,
              },
              {
                title: "Online Whiteboard",
                desc: "Collaborative whiteboard for teams",
                href: "https://draw.craftisle.com",
                icon: Layout,
              },
            ].map((site) => (
              <a
                key={site.href}
                href={site.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <site.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">
                      {site.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {site.desc}
                    </p>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 板块 5：内置工具快捷入口 ──────────────────── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Online Utilities
            </h2>
            <p className="mt-2 text-muted-foreground">
              Free online tools, no installation
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Regex Visualizer",
                desc: "Visualize & test regex patterns",
                href: "/tools/regex-vis",
                icon: Code2,
              },
              {
                title: "Handwriting Animation",
                desc: "Convert text to handwriting animation",
                href: "/tools/handwriting-animation",
                icon: PenTool,
              },
              {
                title: "HTML Visual Editor",
                desc: "WYSIWYG HTML editor with live preview",
                href: "/tools/html-visual-editor",
                icon: Pencil,
              },
              {
                title: "QR Code Generator",
                desc: "Generate QR codes for free",
                href: "/tools/qr",
                icon: QrCode,
              },
            ].map((tool) => (
              <Link key={tool.href} href={tool.href}>
                <Card className="h-full transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="p-5 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <tool.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tool.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO 内容块 ─────────────────────────────────── */}
      <section className="border-t py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">
              What is Craftisle?
            </h2>
            <div className="mt-6 space-y-4 text-muted-foreground">
              <p>
                Craftisle is a free software directory with 16,000+ open-source
                and free tools. We help you find the best free alternatives to
                expensive software, compare similar tools, and discover new
                software for any task.
              </p>
              <p>
                Our directory covers AI tools, privacy tools, development tools,
                design tools, gaming tools, and more. All resources are carefully
                curated and regularly updated.
              </p>
              <p>
                In addition to our software directory, we also provide free
                online tools (PDF tools, regex visualizer, handwriting animation,
                etc.) and free HTML5 games. No download, no signup — use
                instantly in your browser.
              </p>
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-bold tracking-tight">
                Popular Categories
              </h3>
              <div className="mt-6 flex flex-wrap gap-2">
                {topCategories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/directory/${encodeURIComponent(cat.name)}`}
                  >
                    <Badge variant="secondary" className="cursor-pointer">
                      {cat.name.replace(/-/g, " ")} ({cat.count})
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
