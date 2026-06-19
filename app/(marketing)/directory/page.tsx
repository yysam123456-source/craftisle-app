import { Button } from "@/components/ui/button";
import {
  GlassCard,
  GlassCardContent
} from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { ArrowRight, GitCompareArrows, TrendingUp, Shuffle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getAllCategories, getStats, getAllResources } from "@/lib/fmhy-data";
import { TopCategories } from "@/components/directory/home/top-categories";
import { SocialProof } from "@/components/directory/home/social-proof";
import { DynamicHomeBlocks } from "@/components/directory/home/dynamic-blocks";
import { FeaturedWithTabs } from "@/components/directory/home/featured-with-tabs";
import { ScenarioGlassCards } from "@/components/directory/home/scenario-cards";
import { ByUseCase } from "@/components/directory/home/by-use-case";
import { DirectoryFAQ } from "@/components/directory/DirectoryFAQ";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOME_BLOCKS_FILE = join(__dirname, "../../..", "public", "data", "home-blocks.json");

export const metadata: Metadata = constructMetadata({
  title: "Find Free Tools for Any Task | Craftisle Directory",
  description:
    "Discover 16,000+ curated free & open-source tools across 200+ categories. AI assistants, development tools, design software, and more. 100% free, no signup required.",
  keywords: [
    "free tools directory",
    "open source tools",
    "free software directory",
    "AI tools directory",
    "developer tools",
    "free alternatives",
    "no signup required",
  ],
});

/**
 * 尝试读取 home-blocks.json（服务端）
 * 如果文件不存在，返回 null（客户端会显示 fallback）
 */
function loadHomeBlocks() {
  try {
    if (!existsSync(HOME_BLOCKS_FILE)) return null;
    const raw = readFileSync(HOME_BLOCKS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function ResourcesPage() {
  const categories = getAllCategories();
  const stats = getStats();
  const totalCount = stats.total || 16000;

  // 读取动态板块数据
  const homeBlocksData = loadHomeBlocks();
  const hasDynamicBlocks = homeBlocksData?.blocks && homeBlocksData.blocks.length > 0;

  // 方案 A：从动态板块数据中直接提取 CTA 区域需要的数据
  const allBlocks = homeBlocksData?.blocks || [];
  const comparisonsBlock = allBlocks.find((b: any) => b.id === "most-compared") || null;
  const bestBlock = allBlocks.find((b: any) => b.id === "weekly-hottest" || b.id === "rising-stars") || null;
  const alternativesBlock = allBlocks.find((b: any) => b.id === "best-free-alternatives") || null;

  // Structured Data: CollectionPage + ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Craftisle Free Tools Directory",
    description: `Discover ${totalCount.toLocaleString()}+ curated free & open-source tools across ${categories.length}+ categories.`,
    url: "https://craftisle.com/directory",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: totalCount,
      itemListElement: categories.slice(0, 10).map((cat: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: cat.name,
        url: `https://craftisle.com/directory/${encodeURIComponent(cat.name)}`,
        description: `${cat.count} resources`,
      })),
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ===== 1. Hero Section ===== */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 py-20 md:py-28">
        {/* ─ 动态背景：渐变光斑 + 浮动粒子动画 ─ */}
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
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1">
              🔧 100% Free & Open-Source
            </Badge>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Find the best{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                free tools
              </span>{" "}
              for any task
            </h1>

            <p className="mt-6 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              {totalCount.toLocaleString()}+ curated tools across 200+ categories.
              Always free, no signup required.
            </p>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>📦 {totalCount.toLocaleString()}+ tools</span>
              <span>📁 {categories.length}+ categories</span>
              <span>🔄 Updated weekly</span>
            </div>

            <div className="mt-10 max-w-2xl mx-auto">
              <ResourceSearchClient />
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {["AI Tools", "Development", "Design", "Privacy", "Learning", "DevOps"].map((cat) => (
                <Link key={cat} href={`/directory/best/${cat.toLowerCase().replace(" ", "-")}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-primary/10 text-sm px-4 py-1">
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== 2. Top Categories ===== */}
      <TopCategories />

      {/* ===== 3. 动态板块（10 个，数据驱动）===== */}
      {hasDynamicBlocks ? (
        <DynamicHomeBlocks
          blocks={homeBlocksData.blocks}
          lastUpdated={homeBlocksData.lastUpdated}
        />
      ) : (
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="container mx-auto max-w-6xl">
            <p className="text-muted-foreground mb-4">
              📊 Dynamic homepage blocks are being generated...
            </p>
          </div>
        </section>
      )}

      {/* ===== 4. Scenario Finder（场景搜索入口，自动生成）===== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              What are you looking for?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find free tools by task — curated for your specific needs
            </p>
          </div>
          <ScenarioGlassCards />
        </div>
      </section>

      {/* ===== 5. Featured This Week（Editor's Picks + Rankings + Alternatives）===== */}
      <FeaturedWithTabs />

      {/* ===== 6. By Use Case（任务导向浏览）===== */}
      <ByUseCase />

      {/* ===== 7. Tool Comparisons CTA（数据驱动，方案 A）===== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Compare & Find Alternatives
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Can't decide between tools? Side-by-side comparisons to help you pick the right one.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* GlassCard 1: Tool Comparisons — 数据驱动 */}
            <Link
              href={comparisonsBlock ? "/directory/compare" : "/directory/compare"}
              className="no-underline group"
            >
              <GlassCard className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <GlassCardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <GitCompareArrows className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Tool Comparisons</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {comparisonsBlock
                      ? `Browse ${comparisonsBlock.comparisons?.length || 0} paid tools and their free alternatives`
                      : "Browse all paid tools and their free alternatives side by side"}
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View all comparisons <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </GlassCardContent>
              </GlassCard>
            </Link>

            {/* GlassCard 2: Best of 2026 — 数据驱动（链接到动态板块中的热门分类） */}
            <Link
              href={bestBlock ? `/directory/best/${bestBlock.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "development-2026"}` : "/directory/best/development-2026"}
              className="no-underline group"
            >
              <GlassCard className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <GlassCardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Best of 2026</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {bestBlock
                      ? `Curated: ${bestBlock.title} — top free & open-source tools`
                      : "Curated lists of top free & open-source tools by category"}
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore categories <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </GlassCardContent>
              </GlassCard>
            </Link>

            {/* GlassCard 3: Find Alternatives — 数据驱动 */}
            <Link
              href={alternativesBlock ? "/directory/search?q=notion+alternative" : "/directory/search?q=notion+alternative"}
              className="no-underline group"
            >
              <GlassCard className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <GlassCardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                    <Shuffle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Find Alternatives</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {alternativesBlock
                      ? `${alternativesBlock.resources?.length || 0} top-rated free alternatives available`
                      : "Search for free alternatives to any paid tool you're using"}
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Start searching <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </GlassCardContent>
              </GlassCard>
            </Link>
          </div>
        </div>
      </section>
      {/* ===== 8. FAQ Section (SEO optimization) ===== */}
      <DirectoryFAQ />

      {/* ===== 8. Social Proof ===== */}
      <SocialProof />
    </>
  );
}
