import Link from "next/link";
import { readFileSync } from "fs";
import { join } from "path";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, ArrowRight, Wrench } from "lucide-react";
import { constructMetadata } from "@/lib/utils";

export const metadata: Metadata = constructMetadata({
  title: "Free Tool Guides & Tutorials | Learn How to Use Online Tools | Craftisle",
  description:
    "Comprehensive guides for every free online tool. Learn how to compress images, format JSON, generate QR codes, merge PDFs, and more — all free, all in your browser.",
});

interface ToolBlogMeta {
  slug: string;
  title: string;
  toolName: string;
  category: string;
  excerpt: string;
  date: string;
  readTime: number;
  tags: string[];
}

function getToolBlogs(): ToolBlogMeta[] {
  try {
    const filePath = join(process.cwd(), "public", "data", "tool-blogs", "_manifest.json");
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

export default function ToolBlogsPage() {
  const toolBlogs = getToolBlogs();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b bg-muted/30 py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              <Wrench className="h-3 w-3 mr-1" /> Tool Guides
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Free Tool Guides & Tutorials
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Learn how to use every free online tool on Craftisle — with step-by-step tutorials, best practices, and real-world examples.
            </p>
          </div>
        </div>
      </section>

      {/* Tool Blog Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {toolBlogs.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">Tool guides coming soon!</p>
              <p className="mt-2 text-sm">
                We&apos;re writing comprehensive tutorials for every tool on Craftisle.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {toolBlogs.map((blog) => (
                <Link
                  key={blog.slug}
                  href={`/blog/tools/${blog.slug}`}
                  className="group block"
                >
                  <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {blog.category}
                        </Badge>
                      </div>
                      <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2">
                        {blog.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {blog.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {blog.readTime} min read
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Back to Blog */}
      <section className="border-t py-12 text-center">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          <ArrowRight className="h-3 w-3 rotate-180" /> Back to Blog
        </Link>
      </section>
    </div>
  );
}
