import type { Metadata } from "next";
import Link from "next/link";
import { LANDING_PAGES, LANDING_PAGE_SLUGS } from "@/lib/seo/landing-pages";
import { constructMetadata } from "@/lib/utils";

// ★ 新增（2026-11-05，索引覆盖修复 / 孤儿簇枢纽）：
// /l/* 落地页簇此前在首页/全局页脚没有任何入口链路 ⇒ Google 仅能靠 sitemap 被动发现，
// 内链权重（PageRank）几乎为零。本页作为该簇的 hub，聚合全部 29 个落地页内部链接，
// 既给 Google 一个从首页可达的抓取入口，也解决孤儿页问题。
export const revalidate = 7200;

export function generateMetadata(): Metadata {
  return constructMetadata({
    title: "Free Online Tools & Software Topics — Craftisle Guides",
    description:
      "Browse Craftisle's topic guides: free online tools, open-source software alternatives, PDF tools, developer utilities and more. Every guide links to the best free tools for the job.",
    path: "/l",
  });
}

export default function LandingHubPage() {
  const pages = LANDING_PAGE_SLUGS.map((slug) => ({
    slug,
    title: LANDING_PAGES[slug]?.title ?? slug,
    description: LANDING_PAGES[slug]?.description ?? "",
  }));

  return (
    <section className="border-t border-border/40 bg-slate-50/50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-4 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Topics
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free Tools &amp; Software{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Topic Guides
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Hand-written guides to the best free and open-source tools for every job —
            alternatives, PDF utilities, developer tooling and more. Pick a topic to dive in.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/l/${p.slug}`}
              className="group block rounded-2xl border border-border/50 bg-card/80 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5"
            >
              <h2 className="text-base font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                {p.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {p.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
