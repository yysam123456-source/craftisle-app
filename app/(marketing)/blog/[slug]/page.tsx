import { allPosts } from "contentlayer/generated";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Mdx } from "@/components/content/mdx-components";
import { GiscusComments } from "@/components/giscus-comments";
import { Badge } from "@/components/ui/badge";
import { BLOG_AUTHORS } from "@/config/blog";
import { constructMetadata } from "@/lib/utils";
import { ArrowLeft, CalendarDays, Clock, Tag } from "lucide-react";

import "@/styles/mdx.css";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({
    slug: post.slugAsParams,
  }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata | undefined> {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slugAsParams === slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return constructMetadata({
    title: `${post.title}`,
    description: post.description,
    image: post.image ? `https://craftisle.com${post.image}` : undefined,
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slugAsParams === slug);

  if (!post) {
    notFound();
  }

  const authorName = post.authors?.[0]
    ? (BLOG_AUTHORS[post.authors[0] as keyof typeof BLOG_AUTHORS]?.name ?? "Craftisle Team")
    : "Craftisle Team";
  const authorImage = post.authors?.[0]
    ? (BLOG_AUTHORS[post.authors[0] as keyof typeof BLOG_AUTHORS]?.image ?? "/_static/avatars/mickasmt.png")
    : "/_static/avatars/mickasmt.png";

  // Estimate reading time (200 words/min)
  const wordCount = post.body.raw.split(/\s+/).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            image: post.image ? [`https://craftisle.com${post.image}`] : undefined,
            datePublished: post.date,
            dateModified: post.date,
            author: {
              "@type": "Organization",
              name: "Craftisle Team",
              url: "https://craftisle.com/about",
            },
            publisher: {
              "@type": "Organization",
              name: "Craftisle",
              url: "https://craftisle.com",
              logo: {
                "@type": "ImageObject",
                url: "https://craftisle.com/logo.png",
              },
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://craftisle.com/blog/${slug}`,
            },
          }),
        }}
      />

      {/* Post Header — 玻璃拟态 + 渐变标题 */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 top-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
          <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
        </div>
        <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Blog
          </Link>
          
          <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/40 px-3 py-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/40 px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
              {post.title}
            </span>
          </h1>
          
          {post.categories && post.categories.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  <Tag className="mr-1.5 h-3 w-3" />
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {post.image && (
        <section className="py-8">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-lg">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Post Content — 玻璃拟态容器 + MDX 渲染 */}
      <section className="relative py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-blue-500/3 blur-[120px]" />
        </div>
        <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 shadow-lg shadow-black/5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 p-6 sm:p-10">
            <article className="prose prose-gray max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl">
              <Mdx code={post.body.code} />
            </article>
          </div>
        </div>
      </section>

      {/* Comments */}
      <section className="border-t">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <GiscusComments />
        </div>
      </section>

      {/* Post Footer — 玻璃拟态 */}
      <section className="relative overflow-hidden border-t py-12 md:py-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-500/5 blur-[80px]" />
        </div>
        <div className="container relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Back to Blog
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-5 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Browse Tools
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
          
          {/* Author Info Card — 玻璃拟态 */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl transition-all duration-500 ease-out dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/20 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <img
                src={authorImage}
                alt={authorName}
                className="h-12 w-12 rounded-full ring-2 ring-border/50 transition-all duration-300 hover:ring-primary/50"
              />
              <div>
                <p className="font-semibold text-foreground">{authorName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
