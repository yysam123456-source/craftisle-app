/**
 * /directory/best/[slug]
 * "Best X Tools 2026" - 程序化 SEO 页面
 *
 * URL 模式: /directory/best/ai-tools-2026
 * 也可以简化: /directory/best/ai-tools
 */
import { notFound } from "next/navigation";
import { getAllResources, type Resource } from "@/lib/fmhy-data";
import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

interface BestPageProps {
  params: Promise<{ slug: string }>;
}

// ── 分类映射 ──────────────────────────────────────
const CATEGORY_SLUG_MAP: Record<string, string> = {
  "ai-tools": "AI Tools",
  "development-tools": "Development Tools",
  "design-tools": "Design Tools",
  "productivity": "Productivity",
  "communication": "Communication",
  "file-storage": "File Storage",
  "self-hosted": "Self-Hosted",
  "api-data": "API & Data",
};

const REVERSE_MAP: Record<string, string> = {};
for (const [slug, name] of Object.entries(CATEGORY_SLUG_MAP)) {
  REVERSE_MAP[name] = slug;
}

// ── 静态生成参数 ──────────────────────────────────
export async function generateStaticParams() {
  return Object.keys(CATEGORY_SLUG_MAP).map((slug) => ({
    slug: slug,
  }));
}

// ── 获取分类下的资源 ──────────────────────────────
function getResourcesByCategory(categoryName: string): Resource[] {
  const all = getAllResources();
  return all
    .filter((r) => r.categoryName === categoryName)
    .slice(0, 12); // top 12
}

// ── 页面组件 ──────────────────────────────────────
export default async function BestToolsPage(props: BestPageProps) {
  const { slug } = await props.params;
  const categoryName = CATEGORY_SLUG_MAP[slug];

  if (!categoryName) notFound();

  const resources = getResourcesByCategory(categoryName);
  const pageTitle = `Best ${categoryName} Tools (2026) | Craftisle`;
  const description = `Discover the best free and open-source ${categoryName.toLowerCase()} tools for 2026. Curated list with alternatives and reviews.`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/directory" className="hover:underline">Directory</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Best {categoryName} Tools 2026</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">
        Best {categoryName} Tools to Use in 2026
      </h1>
      <p className="text-gray-600 mb-8 max-w-2xl">
        {description}
      </p>

      {/* Top Picks */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Picks</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.slice(0, 6).map((r) => (
            <Link
              key={r.id}
              href={`/directory/resource/${r.id}`}
              className="no-underline"
            >
              <Card className="p-4 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Globe className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-sm truncate">{r.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {r.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {r.tags?.slice(0, 2).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Full List */}
      {resources.length > 6 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">More Great Options</h2>
          <div className="space-y-3">
            {resources.slice(6).map((r, i) => (
              <Link
                key={r.id}
                href={`/directory/resource/${r.id}`}
                className="no-underline"
              >
                <Card className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-gray-300 w-6 text-right">
                      {i + 7}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{r.name}</h3>
                      <p className="text-sm text-gray-500 truncate">
                        {r.description}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">FAQ</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm">Are these tools really free?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Yes! All tools listed on Craftisle are 100% free or have a generous free tier. We do not list tools that require a paid subscription for basic use.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">How do you choose the best tools?</h3>
            <p className="text-sm text-gray-600 mt-1">
              We evaluate based on features, ease of use, community support, and update frequency. Only tools that meet our quality standards make the list.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm">Can I suggest a tool?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Absolutely! Visit our <a href="/directory/submit" className="text-primary hover:underline">submit page</a> to suggest a tool.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Metadata ──────────────────────────────────────
export async function generateMetadata(props: BestPageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const categoryName = CATEGORY_SLUG_MAP[slug];
  if (!categoryName) return {};

  return {
    title: `Best ${categoryName} Tools (2026) — Free & Open Source | Craftisle`,
    description: `Discover the best free and open-source ${categoryName.toLowerCase()} tools for 2026. Curated list with alternatives and reviews.`,
    alternates: {
      canonical: `https://craftisle.com/directory/best/${slug}`,
    },
    openGraph: {
      title: `Best ${categoryName} Tools 2026`,
      description: `Top free and open-source ${categoryName.toLowerCase()} tools to use in 2026.`,
      url: `https://craftisle.com/directory/best/${slug}`,
    },
  };
}
