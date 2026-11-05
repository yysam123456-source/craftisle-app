import type { Metadata } from "next";
import Link from "next/link";
import { CONVERT_PAIRS } from "@/lib/convert/pairs";
import { constructMetadata } from "@/lib/utils";

// ★ 新增（2026-11-05，索引覆盖修复 / 孤儿簇枢纽）：
// /c/* 格式对转页簇此前在首页/全局页脚没有任何入口链路 ⇒ 与 /l/* 同样的发现层缺陷。
// 本页聚合全部 13 个格式对转页内部链接，给 Google 一个从首页可达的抓取入口。
export const revalidate = 7200;

export function generateMetadata(): Metadata {
  return constructMetadata({
    title: "Free File Converters — Convert Images, PDF & More Online",
    description:
      "Browse Craftisle's free, private file converters: convert PNG to JPG, HEIC to JPG, PDF to JPG, SVG to PNG, and more — all in your browser, no upload, no signup.",
    path: "/c",
  });
}

export default function ConvertHubPage() {
  return (
    <section className="border-t border-border/40 bg-slate-50/50 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/15 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
            Converters
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Free File{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-transparent">
              Converters
            </span>
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Convert images and PDFs entirely in your browser — nothing is uploaded, no signup required.
            Pick a format pair to start.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONVERT_PAIRS.map((p) => (
            <Link
              key={p.slug}
              href={`/c/${p.slug}`}
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
