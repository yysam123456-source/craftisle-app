import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/resources/category-grid";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourceSearchClient } from "@/components/resources/resource-search-client";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { readFileSync } from "fs";
import { join } from "path";

export const metadata: Metadata = constructMetadata({
  title: "资源目录 | Craftisle",
  description:
    "15000+ 免费资源导航 — AI工具、学习资源、开发工具、隐私安全。100% 合规资源，无需注册，免费使用。",
});

interface Category {
  id: string;
  nameZh: string;
  description: string;
  icon: string;
  count: number;
}

interface Resource {
  id: string;
  category: string;
  categoryZh: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

// 构建时直接读文件，不依赖 fetch
function getIndexData(): { categories: Category[] } | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-index.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load index data:", err);
    return null;
  }
}

function getHotData(): { resources: Resource[] } | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "fmhy-hot.json");
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load hot data:", err);
    return null;
  }
}

export default async function ResourcesPage() {
  const indexData = getIndexData();
  const hotData = getHotData();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];

  return (
    <>
      {/* Hero Section */}
      <section className="border-b bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              📂 资源目录
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              免费资源导航
            </h1>
            <p className="mt-4 text-lg text-muted-foreground md:text-xl">
              15000+ 精选合规资源，涵盖 AI 工具、学习资源、开发工具等
            </p>
            {/* 搜索框 */}
            <div className="mt-8 max-w-2xl mx-auto">
              <ResourceSearchClient />
            </div>
          </div>
        </div>
      </section>

      {/* 热门资源 */}
      {hotResources.length > 0 && (
        <HotResources resources={hotResources} />
      )}

      {/* 全部分类 */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">
              📂 全部分类
            </h2>
            <p className="mt-1 text-muted-foreground">
              共 {categories.reduce((sum, c) => sum + c.count, 0)} 个资源，{categories.length} 个分类
            </p>
          </div>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold">
              有优质资源推荐？
            </h2>
            <p className="mt-4 text-muted-foreground">
              如果你发现优质的免费资源，欢迎通过 Issues 推荐给我们。
            </p>
            <a
              href="https://github.com/yysam123456/yysam123456-source/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="mt-8">
                推荐资源 <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
