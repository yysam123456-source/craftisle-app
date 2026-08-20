import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  LANDING_PAGES,
  LANDING_PAGE_SLUGS,
  type LandingPage,
} from "@/lib/seo/landing-pages";
import { constructMetadata } from "@/lib/utils";
import { PAGE_META } from "@/lib/seo/page-meta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// 预渲染全部 T1 落地页（SSG，利于收录与速度）
export function generateStaticParams() {
  return LANDING_PAGE_SLUGS.map((slug) => ({ slug }));
}

/**
 * 跨域 canonical —— 消除同品牌双子域的内容重复（cannibalization）。
 * craftisle.com 的 6 个 PDF 工具页与 pdfcraft 的规范工具页同义，
 * 指向 pdf.craftisle.com/tools/<slug> 以合并排名信号。
 * 注意：仅对「与 pdfcraft 一对一同义」的页做 canonical；
 * 其余 3 个品牌枢纽页（pdf-converter / pdf-editor-online / free-pdf-tools）
 * 无 pdfcraft 单页等价物，保留为导流入口，不作 canonical。
 */
const PDFCRAFT_CANONICAL: Record<string, string> = {
  "merge-pdf": "https://pdf.craftisle.com/tools/merge-pdf",
  "split-pdf": "https://pdf.craftisle.com/tools/split-pdf",
  "compress-pdf": "https://pdf.craftisle.com/tools/compress-pdf",
  "rotate-pdf": "https://pdf.craftisle.com/tools/rotate-pdf",
  "pdf-watermark": "https://pdf.craftisle.com/tools/add-watermark",
  "unlock-pdf": "https://pdf.craftisle.com/tools/decrypt-pdf",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = LANDING_PAGES[slug];
  if (data) {
    return constructMetadata({
      title: data.title,
      description: data.description,
      keywords: data.keywords,
      canonical: PDFCRAFT_CANONICAL[slug],
    });
  }
  // 回退：Vercel Cron 经 DB 覆盖层生成的未来种子（本地尚未建丰富页）
  const override = PAGE_META[`/l/${slug}`];
  if (override) {
    return constructMetadata({
      title: override.title,
      description: override.description,
    });
  }
  return {};
}

function buildFaqJsonLd(data: LandingPage) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: data.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function buildSoftwareJsonLd(data: LandingPage, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: data.h1,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    url,
  };
}

export default async function LandingPageRoute({ params }: PageProps) {
  const { slug } = await params;
  const data = LANDING_PAGES[slug];
  const canonical = `https://craftisle.com/l/${slug}`;

  // 本地数据缺失时，回退到 Cron 覆盖层生成的基础页（不 404，保持闭环）
  const override = PAGE_META[`/l/${slug}`];
  if (!data) {
    if (!override) notFound();
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">{override.title}</h1>
        <p className="mt-4 text-muted-foreground">{override.description}</p>
        <p className="mt-6">
          <Link href="/tools" className="text-primary underline">
            Browse all free tools
          </Link>
        </p>
      </main>
    );
  }

  const faqLd = buildFaqJsonLd(data);
  const softLd = buildSoftwareJsonLd(data, canonical);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softLd) }}
      />

      <h1 className="text-3xl font-bold sm:text-4xl">{data.h1}</h1>

      <div className="mt-6 space-y-4 text-base leading-relaxed text-foreground/90">
        {data.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-10 space-y-8">
        {data.sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-xl font-semibold sm:text-2xl">{s.heading}</h2>
            <div className="mt-3 space-y-3 text-base leading-relaxed text-foreground/90">
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold sm:text-2xl">Frequently asked questions</h2>
        <div className="mt-4 space-y-5">
          {data.faq.map((f, i) => (
            <div key={i}>
              <h3 className="font-medium">{f.q}</h3>
              <p className="mt-1 text-base leading-relaxed text-foreground/80">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <nav className="mt-10 rounded-lg border border-border p-4" aria-label="Related tools">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Related free tools
        </h2>
        <ul className="mt-3 flex flex-wrap gap-3">
          {data.internalLinks.map((link, i) => (
            <li key={i}>
              <Link
                href={link.href}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
