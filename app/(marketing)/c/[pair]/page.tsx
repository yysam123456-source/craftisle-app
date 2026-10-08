import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { CONVERT_PAIRS, getPairBySlug, getPairSlugs, OUTPUT_META, INPUT_META } from "@/lib/convert/pairs";
import ConvertTool from "@/components/convert/ConvertTool";
import { toolMeta } from "@/lib/tools";

const baseUrl = "https://craftisle.com";

/** 静态化全部对转页。 */
export async function generateStaticParams() {
  return getPairSlugs().map((pair) => ({ pair }));
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pair: string }>;
}): Promise<Metadata> {
  const { pair: slug } = await params;
  const pair = getPairBySlug(slug);
  // 未注册的 slug 必须返回空元数据，让 page 走 notFound()，
  // 否则会变成「软 404 生成器」（任意乱码路径都出 200 页）。
  if (!pair) return {};

  return {
    title: pair.title,
    description: pair.description,
    alternates: { canonical: `${baseUrl}/c/${pair.slug}` },
    openGraph: {
      title: pair.title,
      description: pair.description,
      url: `${baseUrl}/c/${pair.slug}`,
    },
  };
}

export default async function ConvertPage({
  params,
}: {
  params: Promise<{ pair: string }>;
}) {
  const { pair: slug } = await params;
  const pair = getPairBySlug(slug);
  if (!pair) notFound();

  const inputMeta = INPUT_META[pair.from];
  const outputMeta = OUTPUT_META[pair.to];

  // 同类对转页（过滤自身）
  const relatedPairs = CONVERT_PAIRS.filter((p) => p.slug !== pair.slug).slice(0, 6);

  // 内链到站内工具页。注意 getRelatedTools(toolId) 接受单个 id，
  // 因此这里对每个声明的 relatedTool 各自取其同分类兄弟工具，
  // 再用 pair.relatedTools 里的 id 兜底，确保不产生死引用。
  const relatedToolIds = pair.relatedTools
    .map((t) => (toolMeta[t.id] ? t.id : null))
    .filter((id): id is string => !!id);
  const resolvedTools = relatedToolIds.map((id) => ({ id, meta: toolMeta[id] }));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pair.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to convert ${inputMeta.label} to ${outputMeta.label}`,
    step: [
      { "@type": "HowToStep", text: `Select or drop your ${inputMeta.label} file(s) into the area above` },
      { "@type": "HowToStep", text: "The conversion runs locally in your browser" },
      { "@type": "HowToStep", text: `Download the resulting ${outputMeta.label} file(s)` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <div className="min-h-screen">
        {/* Breadcrumb */}
        <div className="border-b bg-muted/30 py-3">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/tools" className="hover:text-foreground transition-colors">Tools</Link>
              <span>/</span>
              <span className="text-foreground font-medium">{pair.phrase}</span>
            </nav>
          </div>
        </div>

        {/* Hero */}
        <section className="border-b py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                {pair.phrase} Converter
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Convert {inputMeta.label} to {outputMeta.label} without uploading anything. Runs
                entirely in your browser.
              </p>

              {/* 隐私声明 */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 mb-8 dark:border-green-800 dark:bg-green-950/30">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-200">
                      Your files never leave this device
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      This page has no upload endpoint. Decoding and re-encoding happen inside your
                      browser, so there is no server holding a copy of your {inputMeta.label} file
                      and no size limit beyond your own device&apos;s memory.
                    </p>
                  </div>
                </div>
              </div>

              {/* 正文 */}
              <div className="prose prose-sm max-w-none text-muted-foreground mb-8 space-y-3">
                {pair.intro.map((para, i) => (
                  <p key={i} className="leading-relaxed">{para}</p>
                ))}
              </div>

              {/* 转换器 */}
              <div className="rounded-xl border p-6 mb-8">
                <ConvertTool pair={pair} />
              </div>

              {/* 技术说明 */}
              <div className="rounded-lg bg-muted/40 p-4 mb-8">
                <p className="text-sm font-medium mb-1">How the conversion works</p>
                <p className="text-sm text-muted-foreground">{pair.technicalNote}</p>
              </div>
            </div>
          </div>
        </section>

        {/* 何时使用 */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">
                When to convert {inputMeta.label} to {outputMeta.label}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-lg border p-5">
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Use it when
                  </p>
                  <ul className="space-y-2">
                    {pair.whenToUse.do.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border p-5">
                  <p className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Avoid it when
                  </p>
                  <ul className="space-y-2">
                    {pair.whenToUse.avoid.map((t) => (
                      <li key={t} className="flex items-start gap-2 text-sm">
                        <XCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-8">
                <HelpCircle className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">
                  {pair.phrase} Conversion FAQ
                </h2>
              </div>
              <div className="space-y-4">
                {pair.faqs.map((f) => (
                  <div key={f.question} className="rounded-lg border p-5">
                    <p className="font-semibold mb-2">{f.question}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 内链：相关工具 + 相关对转页（孤儿页铁律：必须有入站） */}
        <section className="py-12 bg-muted/20 border-t">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {resolvedTools.length > 0 ? (
                <div>
                  <h2 className="text-lg font-bold mb-4">Related image tools</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {resolvedTools.map(({ id, meta }) => (
                      <Link
                        key={id}
                        href={`/tools/${id}`}
                        className="rounded-lg border bg-card p-4 hover:border-primary/40 transition-colors"
                      >
                        <p className="font-medium text-sm">
                          {(meta as { title?: string }).title ?? id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{`/tools/${id}`}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold">Other format conversions</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedPairs.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/c/${p.slug}`}
                      className="rounded-lg border bg-card p-4 hover:border-primary/40 transition-colors"
                    >
                      <p className="font-medium text-sm">{p.phrase} Converter</p>
                      <p className="text-xs text-muted-foreground mt-1">{`/c/${p.slug}`}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse all image tools →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}