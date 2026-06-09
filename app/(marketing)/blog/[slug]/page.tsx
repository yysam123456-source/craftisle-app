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
    return { title: "Article Not Found | Craftisle" };
  }

  return constructMetadata({
    title: `${post.title} | Craftisle Blog`,
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

      {/* Post Header */}
      <section className="border-b py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/blog"
            className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(post.date).toLocaleDateString("en-US")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {readingTime} min read
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          {post.categories && post.categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.categories.map((cat) => (
                <Badge key={cat} variant="secondary">
                  <Tag className="mr-1 h-3 w-3" />
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

      {/* Post Content — rendered via MDX */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article className="prose prose-gray max-w-none dark:prose-invert">
            <Mdx code={post.body.code} />
          </article>
        </div>
      </section>

      {/* Comments */}
      <section className="border-t">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <GiscusComments />
        </div>
      </section>

      {/* Post Footer */}
      <section className="border-t py-8">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Browse Tools →
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t pt-6 text-sm text-muted-foreground">
            <img
              src={authorImage}
              alt={authorName}
              className="h-8 w-8 rounded-full"
            />
            <div>
              <p className="font-medium text-foreground">{authorName}</p>
              <p>
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
