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
import AnimatedGradientText from "@/components/animata/text/animated-gradient-text";
import {
  ArrowRight, Search, Sparkles, Zap, TrendingUp,
  Bot, Shield, Film, Terminal, Code, Lock,
  Package, FolderOpen, RefreshCw,
  BotMessageSquare, ShieldQuestion, Smartphone, Download,
  BookOpen, HardDrive, Tv, Code2, Globe,
  Wrench, Music, Image as ImgIcon, Palette,
  Cloud, Cpu
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
    "Search 16,000+ free & open-source software. Find alternatives, compare tools. Plus: use 100+ online tools.",
  keywords: [
    "free software directory",
    "open source software",
    "free online tools",
    "software alternatives",
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

// ── 分类图标映射（lucide-react 图标组件 + 渐变色）────────
function getCategoryStyle(name: string): { icon: React.FC<any>; from: string; to: string } {
  const map: Record<string, { icon: React.FC<any>; from: string; to: string }> = {
    "Artificial-Intelligence": { icon: BotMessageSquare, from: "#3b82f6", to: "#8b5cf6" },
    "AI-Horde": { icon: Cpu, from: "#3b82f6", to: "#8b5cf6" },
    "AI-Text": { icon: Code2, from: "#a855f7", to: "#ec4899" },
    "AI-Image": { icon: ImgIcon, from: "#3b82f6", to: "#06b6d4" },
    Reading: { icon: BookOpen, from: "#eab308", to: "#f59e0b" },
    Mobile: { icon: Smartphone, from: "#22c55e", to: "#10b981" },
    Linux: { icon: Terminal, from: "#f97316", to: "#ef4444" },
    Adblock: { icon: ShieldQuestion, from: "#ef4444", to: "#dc2626" },
    Downloading: { icon: Download, from: "#f97316", to: "#eab308" },
    Storage: { icon: HardDrive, from: "#6366f1", to: "#3b82f6" },
    Misc: { icon: Wrench, from: "#6b7280", to: "#9ca3af" },
    Video: { icon: Film, from: "#ec4899", to: "#f43f5e" },
    Music: { icon: Music, from: "#22c55e", to: "#10b981" },
    Images: { icon: ImgIcon, from: "#3b82f6", to: "#06b6d4" },
    Development: { icon: Code2, from: "#3b82f6", to: "#06b6d4" },
    Design: { icon: Palette, from: "#ec4899", to: "#a855f7" },
    Privacy: { icon: Lock, from: "#22c55e", to: "#10b981" },
    VPN: { icon: Globe, from: "#3b82f6", to: "#6366f1" },
    Streaming: { icon: Tv, from: "#ef4444", to: "#f97316" },
    Media: { icon: Tv, from: "#a855f7", to: "#ec4899" },
  };
  return map[name] || { icon: Globe, from: "#6b7280", to: "#9ca3af" };
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
      "Free software directory with 16,000+ tools. Use 100+ free online tools.",
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

      {/* ═══ Hero 区（浅色系） ═══════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 py-20 sm:py-28 lg:py-32">
        {/* 装饰性浮动圆点 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-blue-200/20 blur-3xl animate-pulse" />
          <div className="absolute right-[15%] top-[25%] h-96 w-96 rounded-full bg-violet-200/20 blur-3xl animate-pulse [animation-delay:2s]" />
          <div className="absolute bottom-[10%] left-[20%] h-64 w-64 rounded-full bg-cyan-200/20 blur-3xl animate-pulse [animation-delay:4s]" />
          <div className="absolute right-[30%] bottom-[20%] h-48 w-48 rounded-full bg-pink-200/15 blur-3xl animate-pulse [animation-delay:3s]" />
          {/* 散落小点 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-40"
              style={{
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: ["#93c5fd", "#c4b5fd", "#67e8f9", "#f9a8d4", "#a78bfa"][i % 5],
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
            {/* 标签 */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-medium text-emerald-700">
              <Sparkles className="h-4 w-4" />
              100% Free &amp; Open-Source
              <Zap className="h-3.5 w-3.5" />
            </div>

            {/* 主标题 */}
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 sm:text-5xl lg:text-7xl">
              Find the best{" "}
              <AnimatedGradientText className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
                free tools
              </AnimatedGradientText>{" "}
              for any task
            </h1>

            {/* 副标题 */}
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500 sm:text-xl">
              Search 16,000+ curated tools across 200+ categories.
              Always free, no signup required.
            </p>

            {/* 统计数字 */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Package className="h-4 w-4 text-amber-500" /> 16,000+ tools
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-blue-500" /> 200+ categories
              </span>
              <span className="inline-flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-green-500" /> Updated weekly
              </span>
            </div>

            {/* 搜索框 */}
            <div className="mx-auto mt-10 max-w-2xl">
              <form action="/directory/search" method="GET" className="group relative">
                <div className="relative flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-200/50 transition-shadow group-focus-within:ring-2 group-focus-within:ring-blue-400/20 group-focus-within:border-blue-300 group-focus-within:shadow-md">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      name="q"
                      placeholder='Search resources by name, description, or URL...'
                      className="w-full rounded-xl bg-transparent py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="rounded-xl bg-slate-800 px-7 font-semibold text-white shadow-sm transition-all hover:bg-slate-900 hover:shadow-md"
                  >
                    Search
                  </Button>
                </div>
              </form>

              {/* Hot searches — 浅色可见 */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Popular:</span>
                {["AI Tools", "Development", "Design", "Privacy", "Learning", "DevOps"].map((term) => (
                  <Link
                    key={term}
                    href={`/directory/search?q=${encodeURIComponent(term.toLowerCase())}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-600 shadow-xs transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>

            {/* 快速入口标签 */}
            <div className="mx-auto mt-10 flex flex-wrap items-center justify-center gap-2.5">
              {[
                { label: "AI Tools", href: "/directory/best/artificial-intelligence", icon: Bot, color: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" },
                { label: "Adblock", href: "/directory/best/adblock", icon: Shield, color: "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" },
                { label: "Video Editing", href: "/directory/search?q=video+editing", icon: Film, color: "bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100" },
                { label: "Linux", href: "/directory/Linux", icon: Terminal, color: "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100" },
                { label: "Dev Tools", href: "/directory/best/development", icon: Code, color: "bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100" },
                { label: "Privacy", href: "/directory/best/privacy", icon: Lock, color: "bg-green-50 text-green-600 border-green-200 hover:bg-green-100" },
              ].map((entry) => {
                const Icon = entry.icon;
                return (
                  <Link key={entry.href} href={entry.href}>
                    <span className={`group inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${entry.color}`}>
                      <Icon className="h-4 w-4" />
                      {entry.label}
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
      <div>
        <FeaturedSites />
      </div>

      {/* ── 板块 2：站内工具（子站下方）────────────────── */}
      <div>
        <FeaturedTools />
      </div>

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
      <section className="relative border-t border-border/40 py-16 bg-slate-50/50">
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
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ring-1 ring-black/[0.04] transition-transform duration-300 group-hover:scale-110"
                          style={{
                            background: `linear-gradient(135deg, ${style.from}, ${style.to})`,
                          }}
                        >
                          <style.icon className="h-5 w-5 text-white" />
                        </div>
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
        <section className="relative border-t border-border/40 py-16 bg-slate-50/50">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[350px] w-[350px] -translate-x-1/2 rounded-full bg-orange-200/20 blur-[100px]" />
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

      <div>
        <RandomRecommendations />
      </div>

      {/* ═══ SEO 内容块 ══════════════════════════════════ */}
      <section className="border-t border-border/40 py-16 bg-slate-50/50">
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
                No download, no signup — use instantly in your browser.
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
