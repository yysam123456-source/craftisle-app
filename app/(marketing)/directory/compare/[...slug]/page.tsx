export const revalidate = 86400;
/**
 * /directory/compare/[...slug]
 * "X vs Y" 对比页面 — SEO 核心页面类型（丰富版）
 *
 * URL 模式: /directory/compare/notion/obsidian
 * 解析: slug = ["notion", "obsidian"]
 */
import { notFound } from "next/navigation";
import {
  getCombinedMap,
  getAlternativeBySlug,
  toSlug,
  type AlternativeEntry,
  type AlternativeTool,
} from "@/lib/alternatives";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ExternalLink,
  Check,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface ComparePageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

// ── 静态生成参数 ────────────────────────────────
export async function generateStaticParams() {
  const map = getCombinedMap();
  const entries = Object.values(map) as AlternativeEntry[];
  const params: { slug: string[] }[] = [];

  for (const entry of entries) {
    for (const alt of entry.alternatives) {
      params.push({
        slug: [toSlug(entry.paidTool), toSlug(alt.name)],
      });
    }
  }
  return params.slice(0, 10);
}

// ── 查找对比数据（增强版）─────────────────────────
interface ComparisonResult {
  entry: AlternativeEntry;
  paidTool: AlternativeTool; // 构造一个虚拟的付费工具对象
  alt: AlternativeTool;
  slugA: string;
  slugB: string;
}

function findComparison(slugA: string, slugB: string): ComparisonResult | null {
  const map = getCombinedMap();
  const entries = Object.values(map) as AlternativeEntry[];

  // 尝试 A = 付费工具，B = 替代品
  for (const entry of entries) {
    if (toSlug(entry.paidTool) === slugA) {
      const found = entry.alternatives.find((a) => toSlug(a.name) === slugB);
      if (found) {
        return {
          entry,
          paidTool: {
            name: entry.paidTool,
            url: entry.paidToolUrl,
            reason: "",
            description: entry.description,
            isFree: false,
            isOpenSource: false,
            isSelfHosted: false,
            features: [],
            pros: [],
            cons: [],
          },
          alt: found,
          slugA,
          slugB,
        };
      }
    }
  }

  // 尝试反向：B = 付费工具，A = 替代品
  for (const entry of entries) {
    if (toSlug(entry.paidTool) === slugB) {
      const found = entry.alternatives.find((a) => toSlug(a.name) === slugA);
      if (found) {
        return {
          entry,
          paidTool: {
            name: entry.paidTool,
            url: entry.paidToolUrl,
            reason: "",
            description: entry.description,
            isFree: false,
            isOpenSource: false,
            isSelfHosted: false,
            features: [],
            pros: [],
            cons: [],
          },
          alt: found,
          slugA,
          slugB,
        };
      }
    }
  }

  return null;
}

// ── 评分星星组件 ─────────────────────────────────
function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-sm text-muted-foreground">N/A</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </span>
  );
}

// ── 页面组件 ──────────────────────────────────────
export default async function ComparePage(props: ComparePageProps) {
  const { slug } = await props.params;

  if (!slug || slug.length < 2) notFound();

  const [slugA, slugB] = slug;
  const data = findComparison(slugA, slugB);

  if (!data) notFound();

  const { entry, paidTool, alt } = data;
  const pageTitle = `${paidTool.name} vs ${alt.name}: Which is Better in 2026?`;
  const canonical = `https://craftisle.com/directory/compare/${slugA}/${slugB}`;

  // 计算其他替代品（排除当前对比的这个）
  const otherAlts = entry.alternatives.filter((a) => toSlug(a.name) !== slugB).slice(0, 3);

  // 合并特征进行对比（付费工具的特征从 entry 推断）
  const allFeatures = new Set<string>([
    ...(paidTool.features || []),
    ...(alt.features || []),
  ]);

  return (
    <div className="min-h-screen">
      {/* ===== Breadcrumb ===== */}
      <div className="border-b bg-muted/30 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/directory" className="hover:text-foreground transition-colors">Directory</Link>
            <span>/</span>
            <Link href={`/directory/alternatives/${slugA}`} className="hover:text-foreground transition-colors">
              {paidTool.name} Alternatives
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Compare</span>
          </nav>
        </div>
      </div>

      {/* ===== Hero Section ===== */}
      <section className="border-b py-12 md:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/directory/alternatives/${slugA}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to {paidTool.name} Alternatives
            </Link>

            <Badge variant="secondary" className="mb-4">{entry.category}</Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl mb-4">
              {paidTool.name} <span className="text-muted-foreground">vs</span> {alt.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-3xl">
              {`A detailed comparison of ${paidTool.name} and ${alt.name} to help you choose the best tool for your needs in 2026. ${alt.description ? alt.description.slice(0, 120) + "..." : ""}`}
            </p>

            {/* 快速概览卡片 */}
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {/* 付费工具卡片 */}
              <Card className="border-2 hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{paidTool.name}</CardTitle>
                    <Badge variant="secondary">Paid</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{paidTool.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      <X className="h-3 w-3 mr-1 text-red-500" /> Not Open Source
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <X className="h-3 w-3 mr-1 text-red-500" /> Not Self-Hosted
                    </Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">PRICING</p>
                    <p className="text-sm font-medium text-amber-700">{entry.pricing}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 替代品卡片 */}
              <Card className="border-2 border-green-200 dark:border-green-800 hover:shadow-md transition-all bg-green-50/30 dark:bg-green-950/10">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-green-700 dark:text-green-400">{alt.name}</CardTitle>
                    <div className="flex gap-1.5">
                      {alt.isFree && <Badge className="bg-green-600 text-xs">Free</Badge>}
                      {alt.isOpenSource && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          Open Source
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{alt.description || alt.reason}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {alt.isOpenSource ? (
                      <Badge variant="outline" className="text-xs">
                        <Check className="h-3 w-3 mr-1 text-green-500" /> Open Source
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <X className="h-3 w-3 mr-1 text-red-500" /> Not Open Source
                      </Badge>
                    )}
                    {alt.isSelfHosted ? (
                      <Badge variant="outline" className="text-xs">
                        <Check className="h-3 w-3 mr-1 text-green-500" /> Self-Hosted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <X className="h-3 w-3 mr-1 text-gray-400" /> Not Self-Hosted
                      </Badge>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">RATING</p>
                    <RatingStars rating={alt.rating} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Detailed Comparison Table ===== */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Side-by-Side Comparison</h2>
            <p className="text-muted-foreground mb-8">
              Detailed breakdown of features, pricing, and capabilities
            </p>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left py-3 px-4 font-semibold w-1/3">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold w-1/3">{paidTool.name}</th>
                    <th className="text-center py-3 px-4 font-semibold w-1/3 text-green-700 dark:text-green-400">{alt.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">Price</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="secondary">Paid</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{entry.pricing?.split(";")[0] || "See website"}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {alt.isFree ? (
                        <Badge className="bg-green-600">Free</Badge>
                      ) : (
                        <Badge variant="secondary">Freemium</Badge>
                      )}
                    </td>
                  </tr>
                  {/* Open Source */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">Open Source</td>
                    <td className="py-3 px-4 text-center"><XCircle className="h-5 w-5 text-red-500 mx-auto" /></td>
                    <td className="py-3 px-4 text-center">
                      {alt.isOpenSource ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                      )}
                    </td>
                  </tr>
                  {/* Self-Hosted */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">Self-Hosted</td>
                    <td className="py-3 px-4 text-center"><XCircle className="h-5 w-5 text-red-500/50 mx-auto" /></td>
                    <td className="py-3 px-4 text-center">
                      {alt.isSelfHosted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Rating */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">User Rating</td>
                    <td className="py-3 px-4 text-center text-muted-foreground text-xs">—</td>
                    <td className="py-3 px-4 text-center">
                      <RatingStars rating={alt.rating} />
                    </td>
                  </tr>
                  {/* Migration Difficulty */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">Migration Difficulty</td>
                    <td className="py-3 px-4 text-center text-muted-foreground text-xs">N/A</td>
                    <td className="py-3 px-4 text-center">
                      {alt.migrationDifficulty ? (
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          alt.migrationDifficulty === "Easy" && "text-green-600 border-green-300",
                          alt.migrationDifficulty === "Medium" && "text-amber-600 border-amber-300",
                          alt.migrationDifficulty === "Hard" && "text-red-600 border-red-300",
                        )}>
                          {alt.migrationDifficulty}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Best For */}
                  <tr className="border-b hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-medium">Best For</td>
                    <td className="py-3 px-4 text-center text-xs text-muted-foreground">General use</td>
                    <td className="py-3 px-4 text-center text-xs">{alt.bestFor || "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why Choose Alternative ===== */}
      <section className="py-12 border-b bg-muted/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-2xl font-bold">Why Choose {alt.name} Over {paidTool.name}?</h2>
            </div>

            <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
              <CardContent className="p-6">
                <p className="text-lg leading-relaxed mb-6">{alt.reason}</p>

                {alt.features && alt.features.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">KEY FEATURES</p>
                    <div className="flex flex-wrap gap-2">
                      {alt.features.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {alt.bestFor && (
                  <div className="flex items-start gap-2 bg-white dark:bg-background rounded-lg p-3 border">
                    <Users className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Best For</p>
                      <p className="text-sm text-muted-foreground">{alt.bestFor}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== Pros & Cons ===== */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Pros & Cons</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Paid Tool Pros/Cons */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{paidTool.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">KNOWN FOR</p>
                    <p className="text-sm text-muted-foreground">{entry.description?.slice(0, 150)}...</p>
                  </div>
                  <div className="pt-3 border-t">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">PAIN POINTS</p>
                    {entry.painPoints && entry.painPoints.length > 0 ? (
                      <ul className="space-y-1.5">
                        {entry.painPoints.slice(0, 3).map((pain, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm">
                            <AlertTriangle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{pain.problem}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">Premium features and support come at a cost.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Pros/Cons */}
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-green-700 dark:text-green-400">{alt.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {alt.pros && alt.pros.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">PROS</p>
                      <ul className="space-y-1.5">
                        {alt.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {alt.cons && alt.cons.length > 0 && (
                    <div className="pt-3 border-t">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2">CONS</p>
                      <ul className="space-y-1.5">
                        {alt.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-sm">
                            <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Why Switch Section ===== */}
      {entry.whySwitch && entry.whySwitch.length > 0 && (
        <section className="py-12 border-b bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Why Consider Switching from {paidTool.name}?</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {entry.whySwitch.map((reason, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card border rounded-lg p-4">
                    <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <p className="text-sm leading-relaxed">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Pain Points Section ===== */}
      {entry.painPoints && entry.painPoints.length > 0 && (
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h2 className="text-2xl font-bold">Common {paidTool.name} Pain Points</h2>
              </div>
              <div className="space-y-4">
                {entry.painPoints.map((pain, i) => (
                  <div key={i} className="bg-card border rounded-lg p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-sm font-bold text-red-600">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-foreground">{pain.problem}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="text-red-600 font-medium">Impact: </span>
                          {pain.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Migration Guide ===== */}
      {entry.migrationGuide && (
        <section className="py-12 border-b bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-6">
                <ArrowRight className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">
                  How to Migrate from {paidTool.name} to {alt.name}
                </h2>
              </div>
              <div className="bg-card border rounded-xl p-6 md:p-8">
                <ol className="space-y-4">
                  {(entry.migrationGuide?.steps || []).map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
                {(entry.migrationGuide?.tips || []).length > 0 && (
                  <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">Pro Tips</p>
                    <ul className="space-y-1.5">
                      {(entry.migrationGuide?.tips || []).map((tip, i) => (
                        <li key={i} className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                          <Zap className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ Section ===== */}
      {entry.faqs && entry.faqs.length > 0 && (
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-8">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4">
                {entry.faqs.map((faq, i) => (
                  <Card key={i} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Other Alternatives ===== */}
      {otherAlts.length > 0 && (
        <section className="py-12 border-b bg-muted/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-2">Other {paidTool.name} Alternatives</h2>
              <p className="text-muted-foreground mb-8">
                Not sure {alt.name} is right for you? Check these other options:
              </p>
              <div className="space-y-4">
                {otherAlts.map((otherAlt) => (
                  <Card key={otherAlt.name} className="hover:shadow-sm transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{otherAlt.name}</h3>
                            {otherAlt.isFree && <Badge className="bg-green-600 text-xs">Free</Badge>}
                            {otherAlt.isOpenSource && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300">OSS</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{otherAlt.reason}</p>
                          <div className="flex items-center gap-3">
                            <RatingStars rating={otherAlt.rating} />
                            {otherAlt.migrationDifficulty && (
                              <Badge variant="outline" className="text-xs">
                                {otherAlt.migrationDifficulty} migration
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Link href={`/directory/compare/${slugA}/${toSlug(otherAlt.name)}`}>
                            <Button variant="outline" size="sm">Compare</Button>
                          </Link>
                          {otherAlt.url && (
                            <a href={otherAlt.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="gap-1">
                                Visit <ExternalLink className="h-3 w-3" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA Section ===== */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {alt.url && (
                <a
                  href={alt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Try {alt.name} for Free
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
              <Link href={`/directory/alternatives/${slugA}`} className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View All {paidTool.name} Alternatives
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* 回到目录 */}
            <div className="mt-8 text-center">
              <Link href="/directory/compare" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Browse more tool comparisons →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== JSON-LD ===== */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pageTitle,
            description: `Detailed comparison of ${paidTool.name} and ${alt.name}. Find out which tool is better for your needs in 2026.`,
            url: canonical,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: paidTool.name,
                  description: paidTool.description,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: alt.name,
                  description: alt.description || alt.reason,
                },
              ],
            },
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

  const { paidTool, alt } = data;

  return {
    title: `${paidTool.name} vs ${alt.name}: Which is Better in 2026? | Craftisle`,
    description: `Compare ${paidTool.name} and ${alt.name}. ${(alt.reason || "").slice(0, 150)}`,
    alternates: {
      canonical: `https://craftisle.com/directory/compare/${slugA}/${slugB}`,
    },
    openGraph: {
      title: `${paidTool.name} vs ${alt.name} (2026)`,
      description: `Which is better: ${paidTool.name} or ${alt.name}? Detailed comparison of features, pricing, and more.`,
      url: `https://craftisle.com/directory/compare/${slugA}/${slugB}`,
    },
  };
}
