import { getToolMeta, toolMeta, CATEGORIES, type ToolMeta } from "@/lib/tools";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ tool: string }>;
}

export async function generateStaticParams() {
  return Object.keys(toolMeta).map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) return {};

  const url = `https://craftisle.com/blog/how-to/${tool}`;
  return {
    title: `How to Use ${meta.title} — Free Online Tool Guide`,
    description: `Learn how to use ${meta.title} free online. Step-by-step guide, use cases, FAQ. No signup required — 100% browser-based.`,
    keywords: [
      `how to use ${meta.title.toLowerCase()}`,
      `${meta.title.toLowerCase()} guide`,
      `${meta.title.toLowerCase()} tutorial`,
      `free ${meta.title.toLowerCase()} online`,
      ...(meta.seoKeywords?.slice(0, 3) || []),
    ],
    openGraph: {
      title: `How to Use ${meta.title} — Free Online Tool Guide`,
      description: `Step-by-step guide to using ${meta.title} online for free.`,
      url,
      type: "article",
      locale: "en_US",
    },
    alternates: { canonical: url },
  };
}

export default async function HowToPage({ params }: Props) {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Use ${meta.title}`,
    description: meta.description || meta.desc,
    step: meta.howToUse?.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.heading,
      text: step.text,
    })) || [],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/blog/how-to" className="hover:text-foreground">How-to Guides</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{meta.title}</span>
      </nav>

      <Link
        href="/blog/how-to"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All How-to Guides
      </Link>

      <header className="space-y-4 mb-10">
        <Badge variant="secondary">{meta.category}</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          How to Use {meta.title}: Complete Guide (2026)
        </h1>
        <p className="text-lg text-muted-foreground">
          Learn how to use {meta.title.toLowerCase()} free online — no signup, no download.
          Follow our step-by-step guide below.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{meta.icon}</span>
          <span>Free Online Tool</span>
          <span>·</span>
          <span>Updated: June 2026</span>
        </div>
      </header>

      {/* What is this tool */}
      <section className="space-y-4 mb-10">
        <h2 className="text-2xl font-semibold">What is {meta.title}?</h2>
        <p className="text-muted-foreground leading-relaxed">
          {meta.description || meta.desc}
        </p>
        <div className="rounded-xl border bg-card p-5">
          <div className="font-semibold mb-2">Key Features</div>
          <ul className="list-disc ml-5 text-sm text-muted-foreground space-y-1">
            <li>100% browser-based — no data uploaded to servers</li>
            <li>Free to use — no signup required</li>
            <li>Instant results — no waiting</li>
            <li>Works on all devices — mobile, tablet, desktop</li>
          </ul>
        </div>
      </section>

      {/* How to Use */}
      {meta.howToUse && meta.howToUse.length > 0 && (
        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold">How to Use {meta.title}: Step-by-Step</h2>
          <ol className="space-y-6">
            {meta.howToUse.map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold">{step.heading}</h3>
                  <p className="text-muted-foreground mt-1">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Use Cases */}
      {meta.useCases && meta.useCases.length > 0 && (
        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold">Common Use Cases</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {meta.useCases.map((uc, i) => (
              <div key={i} className="rounded-xl border bg-card p-4">
                <h3 className="font-semibold">{uc.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{uc.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      {meta.faq && meta.faq.length > 0 && (
        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold">FAQ About {meta.title}</h2>
          <div className="space-y-3">
            {meta.faq.map((item, i) => (
              <details key={i} className="rounded-xl border bg-card p-4">
                <summary className="cursor-pointer font-semibold">{item.q}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl border bg-primary/5 p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold">Ready to Try {meta.title}?</h2>
        <p className="text-muted-foreground text-sm">
          No signup. No download. 100% free.
        </p>
        <Link href={`/tools/${tool}`} className="inline-block">
          <Button size="lg">
            Open {meta.title} →
          </Button>
        </Link>
      </section>

      {/* Related Tools */}
      {meta.relatedTools && meta.relatedTools.length > 0 && (
        <section className="space-y-4 mt-10">
          <h2 className="text-xl font-semibold">Related Tools</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {meta.relatedTools
              .map((id: string) => toolMeta[id])
              .filter(Boolean)
              .map((m: ToolMeta) => (
                <Link
                  key={m.title}
                  href={`/blog/how-to/${Object.keys(toolMeta).find(k => toolMeta[k] === m)}`}
                  className="block rounded-xl border bg-card p-3 hover:shadow-md transition text-sm"
                >
                  <span>{m.icon}</span> {m.title}
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
