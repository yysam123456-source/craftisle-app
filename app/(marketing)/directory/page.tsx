import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

/**
 * 从 home-blocks.json 中提取所有资源 ID，
 * 然后从 getAllResources() 中查找完整数据
 */
function enrichBlocksWithResources(blocksData: any) {
  if (!blocksData?.blocks) return { blocks: [], resourceMap: {} };

  const allResources = getAllResources();
  const resourceMap: Record<string, any> = {};
  for (const r of allResources) {
    resourceMap[r.id] = r;
  }

  // 如果 JSON 里已经有 resources/comparisons 数据，直接用
  const blocks = blocksData.blocks.map((b: any) => {
    if (b.resources && b.resources.length > 0) {
      // 用 JSON 里的数据（已经包含 name/description 等）
      return b;
    }
    // 否则按 ID 查找
    if (b.resourceIds) {
      b.resources = b.resourceIds.map((id: string) => resourceMap[id]).filter(Boolean);
    }
    if (b.comparisons) {
      b.comparisons = b.comparisons.map((c: any) => ({
        ...c,
        freeResource: c.freeAlternativeId ? resourceMap[c.freeAlternativeId] || null : null,
      }));
    }
    return b;
  });

  return { blocks, resourceMap };
}

export default async function ResourcesPage() {
  const categories = getAllCategories();
  const stats = getStats();
  const totalCount = stats.total || 16000;

  // 读取动态板块数据
  const homeBlocksData = loadHomeBlocks();
  const { blocks, resourceMap } = enrichBlocksWithResources(homeBlocksData);

  const hasDynamicBlocks = blocks && blocks.length > 0;

  return (
    <>
      {/* ===== 1. Hero Section ===== */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 py-20 md:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
          blocks={blocks}
          lastUpdated={homeBlocksData.lastUpdated}
        />
      ) : (
        // Fallback：还没生成 home-blocks.json 时显示提示
        <section className="py-16 px-4 sm:px-6 lg:px-8 text-center">
          <div className="container mx-auto max-w-6xl">
            <p className="text-muted-foreground mb-4">
              📊 Dynamic homepage blocks are being generated...
            </p>
            <p className="text-sm text-muted-foreground">
              Run <code className="bg-muted px-1 py-0.5 rounded">node scripts/build-home-blocks.mjs</code> to generate.
            </p>
          </div>
        </section>
      )}

      {/* ===== 4. Tool Comparisons CTA ===== */}
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
            <Link href="/directory/compare" className="no-underline group">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <GitCompareArrows className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Tool Comparisons</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Browse all paid tools and their free alternatives side by side
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View all comparisons <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/directory/best/development-2026" className="no-underline group">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Best of 2026</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Curated lists of top free & open-source tools by category
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore categories <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/directory/search?q=notion+alternative" className="no-underline group">
              <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
                <CardContent className="p-6 flex flex-col items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                    <Shuffle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-base">Find Alternatives</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Search for free alternatives to any paid tool you're using
                  </p>
                  <span className="mt-auto text-sm font-medium text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Start searching <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== 5. Social Proof ===== */}
      <SocialProof />

      {/* ===== 6. Footer CTA ===== */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Know a great free tool?
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            Help us grow the directory — recommend a tool via GitHub Issues
          </p>
          <a
            href="https://github.com/yysam123456-source/craftisle-app/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg">
              Recommend a Tool
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>
    </>
  );
}
