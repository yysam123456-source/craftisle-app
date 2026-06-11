/**
 * /directory/compare/[...slug]
 * "X vs Y" 对比页面 — SEO 核心页面类型
 *
 * URL 模式: /directory/compare/notion/obsidian
 * 解析: slug = ["notion", "obsidian"]
 */
import { notFound } from "next/navigation";
import { getCombinedMap, type AlternativeEntry } from "@/lib/alternatives";
import { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExternalLink, Check, X } from "lucide-react";

interface ComparePageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

/** findComparison 返回类型 */
interface CompareData {
  paidTool: string;
  paidDesc: string;
  altName: string;
  altDesc: string;
  altUrl: string | null;
  reason: string;
  isFree: boolean;
  isOpenSource: boolean;
  isSelfHosted: boolean;
  bothPaid: boolean;
}

// ── 静态生成参数 ────────────────────────────────
export async function generateStaticParams() {
  const map = getCombinedMap();
  const entries = Object.values(map) as AlternativeEntry[];
  const params: { slug: string[] }[] = [];

  for (const entry of entries) {
    for (const alt of entry.alternatives) {
      params.push({
        slug: [
          entry.paidTool.toLowerCase().replace(/\s+/g, "-"),
          alt.name.toLowerCase().replace(/\s+/g, "-"),
        ],
      });
    }
  }
  return params;
}

// ── 工具名 → slug ────────────────────────────────
function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// ── 查找对比数据 ──────────────────────────────────
function findComparison(slugA: string, slugB: string): CompareData | null {
  const map = getCombinedMap();
  const entries = Object.values(map) as AlternativeEntry[];

  // 尝试 A = 付费工具，B = 替代品
  for (const entry of entries) {
    if (toSlug(entry.paidTool) === slugA) {
      const found = entry.alternatives.find(
        (a) => toSlug(a.name) === slugB
      );
      if (found) {
        return {
          paidTool: entry.paidTool,
          paidDesc: entry.description,
          altName: found.name,
          altDesc: "",
          altUrl: found.url || null,
          reason: found.reason,
          isFree: found.isFree,
          isOpenSource: found.isOpenSource,
          isSelfHosted: found.isSelfHosted || false,
          bothPaid: false,
        };
      }
    }
  }

  // 尝试反向：B = 付费工具，A = 替代品
  for (const entry of entries) {
    if (toSlug(entry.paidTool) === slugB) {
      const found = entry.alternatives.find(
        (a) => toSlug(a.name) === slugA
      );
      if (found) {
        return {
          paidTool: entry.paidTool,
          paidDesc: entry.description,
          altName: found.name,
          altDesc: "",
          altUrl: found.url || null,
          reason: found.reason,
          isFree: found.isFree,
          isOpenSource: found.isOpenSource,
          isSelfHosted: found.isSelfHosted || false,
          bothPaid: false,
        };
      }
    }
  }

  // 两个都是付费工具？
  const entryA = entries.find((e) => toSlug(e.paidTool) === slugA);
  const entryB = entries.find((e) => toSlug(e.paidTool) === slugB);
  if (entryA && entryB) {
    return {
      paidTool: entryA.paidTool,
      paidDesc: entryA.description,
      altName: entryB.paidTool,
      altDesc: entryB.description,
      altUrl: null,
      reason: `${entryB.paidTool} is also a paid tool. See their respective alternative pages.`,
      isFree: false,
      isOpenSource: false,
      isSelfHosted: false,
      bothPaid: true,
    };
  }

  return null;
}

// ── 页面组件 ──────────────────────────────────────
export default async function ComparePage(props: ComparePageProps) {
  const { slug } = await props.params;

  if (!slug || slug.length < 2) notFound();

  const [slugA, slugB] = slug;
  const data = findComparison(slugA, slugB);

  if (!data) notFound();

  const pageTitle = `${data.paidTool} vs ${data.altName}: Which is Better in 2026?`;
  const canonical = `https://craftisle.com/directory/compare/${slugA}/${slugB}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 面包屑 */}
      <nav className="text-sm text-gray-500 mb-6">
        <a href="/directory" className="hover:underline">Directory</a>
        <span className="mx-2">/</span>
        <a href={`/directory/alternatives/${slugA}`} className="hover:underline">
          {data.paidTool} Alternatives
        </a>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Compare</span>
      </nav>

      <h1 className="text-3xl font-bold mb-2">{pageTitle}</h1>
      <p className="text-gray-600 mb-8">
        Quick comparison between <strong>{data.paidTool}</strong> and{" "}
        <strong>{data.altName}</strong> to help you decide.
      </p>

      {/* 对比表格 */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-3 gap-4 pb-4 border-b">
          <div className="font-medium text-gray-500">Feature</div>
          <div className="font-semibold text-center">{data.paidTool}</div>
          <div className="font-semibold text-center text-green-700">
            {data.altName}
          </div>
        </div>

        {/* 价格 */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="text-gray-600">Price</div>
          <div className="text-center">
            <Badge variant="destructive">Paid</Badge>
          </div>
          <div className="text-center">
            {data.isFree ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Free</Badge>
            ) : (
              <Badge variant="secondary">Paid</Badge>
            )}
          </div>
        </div>

        {/* 开源 */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="text-gray-600">Open Source</div>
          <div className="text-center">
            <X className="inline w-5 h-5 text-red-500" />
          </div>
          <div className="text-center">
            {data.isOpenSource ? (
              <Check className="inline w-5 h-5 text-green-600" />
            ) : (
              <X className="inline w-5 h-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Self-Hosted */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="text-gray-600">Self-Hosted</div>
          <div className="text-center">
            <X className="inline w-5 h-5 text-gray-400" />
          </div>
          <div className="text-center">
            {data.isSelfHosted ? (
              <Check className="inline w-5 h-5 text-green-600" />
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        </div>

        {/* 推荐理由 */}
        <div className="py-4">
          <div className="text-gray-600 mb-2">Why choose {data.altName}?</div>
          <p className="text-sm text-gray-700 italic">"{data.reason}"</p>
        </div>
      </Card>

      {/* CTA */}
      <div className="flex gap-4">
        {data.altUrl && (
          <a
            href={data.altUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "default" }), "no-underline")}
          >
            Visit {data.altName}
            <ExternalLink className="w-4 h-4 ml-2 inline" />
          </a>
        )}
        <a
          href={`/directory/alternatives/${slugA}`}
          className={cn(buttonVariants({ variant: "outline" }), "no-underline")}
        >
          View All {data.paidTool} Alternatives
        </a>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pageTitle,
            description: `Compare ${data.paidTool} and ${data.altName}. Find out which tool is better for your needs in 2026.`,
            url: canonical,
          }),
        }}
      />
    </div>
  );
}

// ── Metadata ──────────────────────────────────────
export async function generateMetadata(props: ComparePageProps): Promise<Metadata> {
  const { slug } = await props.params;
  if (!slug || slug.length < 2) return {};

  const [slugA, slugB] = slug;
  const data = findComparison(slugA, slugB);
  if (!data) return {};

  return {
    title: `${data.paidTool} vs ${data.altName}: Which is Better in 2026? | Craftisle`,
    description: `Compare ${data.paidTool} and ${data.altName}. ${(data.reason || "").slice(0, 150)}`,
    alternates: {
      canonical: `https://craftisle.com/directory/compare/${slugA}/${slugB}`,
    },
    openGraph: {
      title: `${data.paidTool} vs ${data.altName} (2026)`,
      description: `Which is better: ${data.paidTool} or ${data.altName}? Quick comparison.`,
      url: `https://craftisle.com/directory/compare/${slugA}/${slugB}`,
    },
  };
}
