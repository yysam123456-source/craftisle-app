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
import { ArrowRight, Search } from "lucide-react";
import { AdSlot } from "@/components/ads/AdSlot";
import type { Metadata } from "next";
import fs from "fs";
import path from "path";
import { RandomRecommendations } from "@/components/home/random-recommendations";
import { FeaturedTools } from "@/components/home/featured-tools";
import { FeaturedSites } from "@/components/home/featured-sites";

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
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.com",
      logo: {
        "@type": "ImageObject",
        url: "https://craftisle.com/logo.png",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://github.com/craftisle",
        "https://twitter.com/craftisle",
      ],
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Craftisle",
    url: "https://craftisle.com",
    logo: "https://craftisle.com/logo.png",
    description: "Free software directory with 16,000+ open-source and free tools.",
    sameAs: [
      "https://github.com/craftisle",
    ],
  };

  return (
      <>
        {/* JSON-LD 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

      {/* ── Hero 区 ────────────────────────────────── */}
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
                { label: "Games", href: "/game" },
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

      {/* ── 板块 1：子站入口（最上方，紧跟 Hero）──────── */}
      <FeaturedSites />

      {/* ── 板块 2：站内工具（子站下方）────────────────── */}
      <FeaturedTools />

      {/* ── 广告：站内工具与分类之间 ───────────────────── */}
      <section className="flex justify-center py-6">
        <AdSlot
          slotId="homepage-between-sections"
          size="leaderboard"
          label="Homepage Between Sections"
        />
      </section>

      {/* ── 板块 3：热门分类 ───────────────────────────── */}
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

      {/* ── 板块 4：Trending This Week ─────────────────── */}
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

      {/* ── 板块 5：随机推荐（客户端组件）───────────────── */}
      <RandomRecommendations />

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
