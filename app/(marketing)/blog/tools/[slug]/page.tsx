import Link from "next/link";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowLeft, ExternalLink, Tag } from "lucide-react";
import { constructMetadata } from "@/lib/utils";

interface ToolBlogContent {
  slug: string;
  title: string;
  toolName: string;
  toolUrl: string;
  category: string;
  date: string;
  readTime: number;
  tags: string[];
  keyTakeaways?: string[];
  content: {
    intro: string;
    sections: { heading: string; body: string }[];
    conclusion: string;
  };
}

function loadToolBlog(slug: string): ToolBlogContent | null {
  try {
    const filePath = join(process.cwd(), "public", "data", "tool-blogs", `${slug}.json`);
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

function getAllSlugs(): string[] {
  try {
    const dir = join(process.cwd(), "public", "data", "tool-blogs");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json") && f !== "_manifest.json")
      .map((f) => f.replace(".json", ""));
  } catch {
    return [];
  }
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const blog = loadToolBlog(slug);
  if (!blog) return { title: "Guide Not Found" };

  return constructMetadata({
    title: blog.title,
    description: blog.content.intro.substring(0, 160),
    keywords: blog.tags,
  });
}

export default async function ToolBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const blog = loadToolBlog(slug);

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tool Guide Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The tool guide you&apos;re looking for doesn&apos;t exist yet.
          </p>
          <Link
            href="/blog/tools"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> View all tool guides
          </Link>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": blog.title,
    "description": blog.content.intro,
    "datePublished": blog.date,
    "author": {
      "@type": "Organization",
      "name": "Craftisle",
      "url": "https://craftisle.app",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Craftisle",
      "url": "https://craftisle.app",
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://craftisle.app/blog/tools/${slug}`,
    },
    "about": {
      "@type": "SoftwareApplication",
      "name": blog.toolName,
      "url": `https://craftisle.app${blog.toolUrl}`,
      "applicationCategory": blog.category,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-h-screen">
        {/* Header */}
        <header className="border-b bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <Link
                href="/blog/tools"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
              >
                <ArrowLeft className="h-3 w-3" /> Tool Guides
              </Link>
              <Badge variant="secondary" className="mb-4">
                {blog.category}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                {blog.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" /> {blog.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {blog.readTime} min read
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {blog.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs flex items-center gap-1">
                    <Tag className="h-3 w-3" /> {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              {/* Try the tool CTA */}
              <div className="mb-12 p-6 rounded-xl border bg-primary/5 border-primary/20">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-lg">{blog.toolName}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try it yourself — free, no signup required
                    </p>
                  </div>
                  <Link
                    href={blog.toolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
                  >
                    Open Tool <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {/* Intro */}
              <p className="text-lg text-muted-foreground leading-relaxed mb-12">
                {blog.content.intro}
              </p>

              {/* Sections */}
              {blog.content.sections.map((section, idx) => (
                <section key={idx} className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">{section.heading}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                </section>
              ))}

              {/* Key Takeaways */}
              {blog.keyTakeaways && blog.keyTakeaways.length > 0 && (
                <div className="mt-12 p-6 rounded-2xl border bg-amber-50">
                  <h3 className="text-lg font-semibold mb-3">📝 Key Takeaways</h3>
                  <ul className="space-y-2">
                    {blog.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conclusion */}
              <div className="mt-12 p-6 rounded-xl border bg-muted/30">
                <p className="text-muted-foreground leading-relaxed">
                  {blog.content.conclusion}
                </p>
              </div>

              {/* CTA */}
              <div className="mt-12 text-center">
                <Link
                  href={blog.toolUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  Try {blog.toolName} Now <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related */}
        <div className="border-t py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-muted-foreground text-sm">
                More tool guides →
                <Link href="/blog/tools" className="ml-1 text-primary hover:underline">
                  View all tool tutorials
                </Link>
              </p>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
