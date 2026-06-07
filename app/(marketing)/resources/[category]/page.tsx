import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryGrid } from "@/components/resources/category-grid";
import { HotResources } from "@/components/resources/hot-resources";
import { ResourcesClient } from "@/components/resources/resources-client";
import { ResourceSearchClientWrapper } from "@/components/resources/resource-search-client-wrapper";
import { ArrowRight } from "lucide-react";
import type { Metadata, ResolvingMetadata } from "next";
import { constructMetadata } from "@/lib/utils";

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

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

// 服务端：获取分类索引
async function getIndexData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/data/fmhy-index.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  return res.json();
}

// 服务端：获取热门资源
async function getHotData() {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/data/fmhy-hot.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  return res.json();
}

// 服务端：获取某分类的资源列表
async function getCategoryResources(categoryId: string): Promise<Resource[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/data/fmhy-resources.json`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const catData = data.categories?.[categoryId];
  return catData?.resources || [];
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const data = await getIndexData();
  const cat = data?.categories?.find(
    (c: Category) => c.id === category
  );

  if (!cat) {
    return constructMetadata({
      title: "分类未找到 | Craftisle",
      description: "该资源分类不存在。",
    });
  }

  return constructMetadata({
    title: `${cat.nameZh} | 资源目录 | Craftisle`,
    description: `${cat.description}。共 ${cat.count} 个免费资源。`,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const indexData = await getIndexData();
  const hotData = await getHotData();

  const categories: Category[] = indexData?.categories || [];
  const hotResources: Resource[] = hotData?.resources || [];
  const categoryInfo: Category | undefined = categories.find(
    (c: Category) => c.id === category
  );
  const resources: Resource[] = await getCategoryResources(category);

  if (!categoryInfo) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">分类未找到</h1>
        <p className="mt-4 text-muted-foreground">
          该资源分类不存在。
        </p>
        <a href="/resources">
          <Button className="mt-8">返回资源目录</Button>
        </a>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              📂 资源目录
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {categoryInfo.icon} {categoryInfo.nameZh}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {categoryInfo.description}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              共 {categoryInfo.count} 个资源
            </p>
            {/* 搜索框：跳转到全站搜索 */}
            <div className="mt-6 max-w-xl">
              <ResourceSearchClientWrapper />
            </div>
          </div>
        </div>
      </section>

      {/* 热门资源 */}
      {hotResources.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="mb-6 text-2xl font-bold tracking-tight">
              🔥 热门资源
            </h2>
            <HotResources resources={hotResources.slice(0, 12)} />
          </div>
        </section>
      )}

      {/* 全部分类快捷跳转 */}
      <section className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            📂 全部分类
          </h2>
          <CategoryGrid categories={categories} />
        </div>
      </section>

      {/* 当前分类资源列表：客户端搜索 + 分页 */}
      <section className="border-t py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">
            {categoryInfo.icon} {categoryInfo.nameZh} · 全部资源
          </h2>
          <ResourcesClient resources={resources} category={categoryInfo} />
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
