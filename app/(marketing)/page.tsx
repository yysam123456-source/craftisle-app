import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent,
  GlassCardDescription,
  GlassCardHeader,
  GlassCardTitle
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowRight, Search, Sparkles, Zap, TrendingUp,
  Bot, Shield, Film, Gamepad2, Terminal, Code, Lock
} from "lucide-react";
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

// ── 分类图标映射（lucide-react 图标 + 渐变色）────────
function getCategoryStyle(name: string): { icon: string; from: string; to: string } {
  const map: Record<string, { icon: string; from: string; to: string }> = {
    "Artificial-Intelligence": { icon: "🤖", from: "#3b82f6", to: "#8b5cf6" },
    "AI-Horde": { icon: "🤖", from: "#3b82f6", to: "#8b5cf6" },
    "AI-Text": { icon: "✍️", from: "#a855f7", to: "#ec4899" },
    "AI-Image": { icon: "🖼️", from: "#3b82f6", to: "#06b6d4" },
    Gaming: { icon: "🎮", from: "#ec4899", to: "#a855f7" },
    Reading: { icon: "📚", from: "#eab308", to: "#f59e0b" },
    Mobile: { icon: "📱", from: "#22c55e", to: "#10b981" },
    Linux: { icon: "🐧", from: "#f97316", to: "#ef4444" },
    Adblock: { icon: "🔒", from: "#ef4444", to: "#dc2626" },
    Downloading: { icon: "📥", from: "#f97316", to: "#eab308" },
    Storage: { icon: "💾", from: "#6366f1", to: "#3b82f6" },
    Misc: { icon: "🔧", from: "#6b7280", to: "#9ca3af" },
    Video: { icon: "🎬", from: "#ec4899", to: "#f43f5e" },
    Music: { icon: "🎵", from: "#22c55e", to: "#10b981" },
    Images: { icon: "🖼️", from: "#3b82f6", to: "#06b6d4" },
    Development: { icon: "💻", from: "#3b82f6", to: "#06b6d4" },
    Design: { icon: "🎨", from: "#ec4899", to: "#a855f7" },
    Privacy: { icon: "🔒", from: "#22c55e", to: "#10b981" },
    VPN: { icon: "🌐", from: "#3b82f6", to: "#6366f1" },
    Streaming: { icon: "📺", from: "#ef4444", to: "#f97316" },
  };
  return map[name] || { icon: "🔧", from: "#6b7280", to: "#9ca3af" };
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

      {/* ═══ Hero 区 ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28 lg:py-32">
        {/* ─ 动态背景：渐变光斑 + 浮动动画 ─ */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px] animate-pulse-slow" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px] animate-pulse-slow animation-delay-2000" />
          <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[100px] animate-float" />
          {/* 浮动粒子光点 */}
          <div className="absolute top-1/4 left-1/4 h-3 w-3 rounded-full bg-blue-400/30 blur-sm animate-float-delayed" />
          <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-purple-400/25 blur-sm animate-float animation-delay-3000" />
          <div className="absolute bottom-1/3 left-1/3 h-2.5 w-2.5 rounded-full bg-cyan-400/25 blur-sm animate-float-delayed animation-delay-1500" />
          <div className="absolute top-1/2 right-1/3 h-2 w-2 rounded-full bg-fuchsia-400/20 blur-sm animate-float animation-delay-4000" />
          <div className="absolute bottom-1/4 right-1/2 h-3 w-3 rounded-full bg-indigo-400/20 blur-sm animate-float-delayed animation-delay-2500" />
        </div>

        {/* 网格背景纹理（极淡） */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* 标签 — 带图标动画感 */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              16,000+ Free &amp; Open-Source Software
              <Zap className="h-3.5 w-3.5" />
            </div>

            {/* 主标题 — 渐变强调 */}
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
              Find Free &amp;{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Open-Source
              </span>{" "}
              Software
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Search 16,000+ free tools, find alternatives, compare software — all in one place.
              <span className="font-medium text-foreground"> Free games &amp; online tools included.</span>
            </p>

            {/* 搜索框 — 发光效果 */}
            <div className="mx-auto mt-12 max-w-2xl">
              <form action="/directory/search" method="GET" className="group relative">
                <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 opacity-25 blur-sm transition-opacity group-focus-within:opacity-50" />
                <div className="relative flex gap-2 rounded-xl border border-border bg-background/80 p-1.5 shadow-lg shadow-black/5 backdrop-blur-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <input
                      type="text"
                      name="q"
                      placeholder='Try: "video downloader", "adblock", "AI chat"...'
                      className="w-full rounded-lg bg-transparent py-3 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground/60"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-8 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
                  >
                    Search
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Hot searches */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Trending:</span>
                {["video downloader", "adblock", "AI tools", "games"].map((term) => (
                  <Link
                    key={term}
                    href={`/directory/search?q=${encodeURIComponent(term)}`}
                    className="rounded-full bg-muted/60 px-2.5 py-0.5 font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* 快速入口标签云 — 渐变图标圆球 */}
            <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: "AI Tools", href: "/directory/best/artificial-intelligence", icon: Bot, gradientFrom: "#3b82f6", gradientTo: "#8b5cf6", bgLight: "bg-blue-50 dark:bg-blue-950/30" },
                { label: "Adblock", href: "/directory/best/adblock", icon: Shield, gradientFrom: "#ef4444", gradientTo: "#f97316", bgLight: "bg-red-50 dark:bg-red-950/30" },
                { label: "Video Editing", href: "/directory/search?q=video+editing", icon: Film, gradientFrom: "#ec4899", gradientTo: "#a855f7", bgLight: "bg-pink-50 dark:bg-pink-950/30" },
                { label: "Games", href: "https://game.craftisle.com", icon: Gamepad2, gradientFrom: "#a855f7", gradientTo: "#ec4899", bgLight: "bg-purple-50 dark:bg-purple-950/30" },
                { label: "Linux", href: "/directory/Linux", icon: Terminal, gradientFrom: "#f97316", gradientTo: "#eab308", bgLight: "bg-orange-50 dark:bg-orange-950/30" },
                { label: "Dev Tools", href: "/directory/best/development", icon: Code, gradientFrom: "#3b82f6", gradientTo: "#06b6d4", bgLight: "bg-cyan-50 dark:bg-cyan-950/30" },
                { label: "Privacy", href: "/directory/best/privacy", icon: Lock, gradientFrom: "#22c55e", gradientTo: "#10b981", bgLight: "bg-green-50 dark:bg-green-950/30" },
              ].map((entry) => {
                const Icon = entry.icon;
                return (
                  <Link key={entry.href} href={entry.href}>
                    <span className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-background/80 px-4 py-2 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-primary/25 hover:bg-background hover:shadow-md hover:-translate-y-0.5">
                      {/* 渐变图标圆球 */}
                      <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${entry.bgLight} shadow-sm ring-1 ring-black/[0.04] transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
                        <Icon
                          className="h-3.5 w-3.5"
                          style={{
                            background: `linear-gradient(135deg, ${entry.gradientFrom}, ${entry.gradientTo})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                          }}
                        />
                      </span>
                      <span className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{entry.label}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 广告：Hero 下方（仅生产环境渲染占位）───────── */}
      {process.env.NODE_ENV === "production" && (
      <section className="flex justify-center py-6">
        <AdSlot
          slotId="homepage-below-hero"
          size="leaderboard"
          label="Homepage Below Hero"
        />
      </section>
      )}

      {/* ── 板块 1：子站入口（最上方，紧跟 Hero）──────── */}
      <FeaturedSites />

      {/* ── 板块 2：站内工具（子站下方）────────────────── */}
      <FeaturedTools />

      {/* ── 广告：站内工具与分类之间（仅生产环境）────────── */}
      {process.env.NODE_ENV === "production" && (
      <section className="flex justify-center py-6">
        <AdSlot
          slotId="homepage-between-sections"
          size="leaderboard"
          label="Homepage Between Sections"
        />
      </section>
      )}

      {/* ═══ 板块：Browse by Category ══════════════════════ */}
      <section className="relative border-t border-border/40 py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* 标题区 */}
          <div className="mb-14 flex items-end justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                Browse &amp; Discover
              </div>
              <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Browse by{" "}
                <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Category
                </span>
              </h2>
              <p className="mt-3 text-muted-foreground">
                Top categories by resource count
              </p>
            </div>
            <Link href="/directory/categories">
              <Button variant="ghost" className="hidden sm:inline-flex group">
                View All{" "}
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          {/* 分类卡片网格 — 更现代的样式 */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topCategories.map((cat) => {
              const style = getCategoryStyle(cat.name);
              return (
                <Link
                  key={cat.name}
                  href={`/directory/${encodeURIComponent(cat.name)}`}
                  className="group"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 group-hover:-translate-y-1.5 group-hover:shadow-2xl group-hover:shadow-black/10 dark:group-hover:shadow-black/30 group-hover:border-white/30">
                    {/* hover 光晕 */}
                    <div
                      className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        background: `linear-gradient(135deg, ${style.from}15, transparent 40%, transparent 60%, ${style.to}15)`,
                        filter: "blur(8px)",
                      }}
                    />
                    {/* hover 顶部渐变条 */}
                    <div
                      className="h-1 w-full transition-all duration-500 group-hover:h-1.5"
                      style={{
                        background: `linear-gradient(90deg, ${style.from}, ${style.to})`,
                      }}
                    />

                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        {/* 渐变图标圆球 */}
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-md ring-1 ring-black/[0.04] transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${style.from}12, ${style.to}12)`,
                          }}
                        >
                          {style.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                            {cat.name.replace(/-/g, " ")}
                          </h3>
                          <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                            {cat.count.toLocaleString()} resources
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 移动端 View All */}
          <div className="mt-6 text-center sm:hidden">
            <Link href="/directory/categories">
              <Button variant="outline" size="sm">
                View All Categories <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ 板块：Trending This Week ═════════════════════ */}
      {trendingResources.length > 0 && (
        <section className="relative border-t border-border/40 py-16">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-orange-500/5 blur-[100px]" />
          </div>
          <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-14 flex items-end justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-500/15 bg-orange-500/5 px-4 py-1.5 text-sm font-medium text-orange-600 dark:text-orange-400">
                  <TrendingUp className="h-4 w-4" />
                  Hot Right Now
                </div>
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Trending This{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    Week
                  </span>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  Most popular resources this week
                </p>
              </div>
              <Link href="/directory/trending">
                <Button variant="ghost" className="hidden sm:inline-flex group">
                  View All{" "}
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trendingResources.map((res) => (
                <a
                  key={res.id}
                  href={`/directory/resource/${encodeURIComponent(res.id)}`}
                  className="group block"
                >
                  <GlassCard className="h-full overflow-hidden border-2 border-transparent bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-orange-500/20 hover:shadow-xl hover:shadow-orange-500/5 hover:-translate-y-0.5">
                    <GlassCardContent className="p-6">
                      {/* 编号 + 标题 */}
                      <div className="mb-3 flex items-start gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-xs font-bold text-white shadow-md shadow-orange-500/20">
                          #
                        </span>
                        <h3 className="flex-1 text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {res.name}
                        </h3>
                      </div>
                      <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {res.description || "No description available"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 opacity-0 transition-all duration-300 group-hover:opacity-100">
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </GlassCardContent>
                  </GlassCard>
                </a>
              ))}
            </div>

            {/* 移动端 View All */}
            <div className="mt-8 text-center sm:hidden">
              <Link href="/directory/trending">
                <Button variant="outline" size="sm">
                  View All Trending <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══ 随机推荐（客户端组件）═══════════════════════ */}
      <RandomRecommendations />

      {/* ═══ SEO 内容块 ══════════════════════════════════ */}
      <section className="border-t border-border/40 py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/15 bg-indigo-500/5 px-4 py-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              About Us
            </div>
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              What is{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Craftisle
              </span>
              ?
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
              <p>
                Craftisle is a free software directory with{" "}
                <strong className="text-foreground">16,000+ open-source and free tools</strong>.
                We help you find the best free alternatives to expensive software, compare similar tools,
                and discover new software for any task.
              </p>
              <p>
                Our directory covers AI tools, privacy tools, development tools, design tools,
                gaming tools, and more. All resources are carefully curated and regularly updated.
              </p>
              <p>
                In addition to our software directory, we also provide free online tools
                (PDF tools, regex visualizer, handwriting animation, ID photo maker, etc.)
                and free HTML5 games. No download, no signup — use instantly in your browser.
              </p>
            </div>

            <div className="mt-12">
              <h3 className="text-2xl font-bold tracking-tight mb-5">
                Popular Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {topCategories.slice(0, 10).map((cat) => (
                  <Link
                    key={cat.name}
                    href={`/directory/${encodeURIComponent(cat.name)}`}
                  >
                    <Badge
                      variant="secondary"
                      className="cursor-pointer px-3 py-1 text-sm font-normal hover:bg-primary/10 hover:text-primary transition-colors"
                    >
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
