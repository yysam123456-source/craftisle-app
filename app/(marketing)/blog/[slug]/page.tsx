import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Tag } from "lucide-react";
import { getPostBySlug, getSettings } from "@/lib/ghost";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: "Article Not Found | Craftisle" };
  }

  return {
    title: `${post.title} | Craftisle Blog`,
    description: post.excerpt || undefined,
    openGraph: post.feature_image
      ? {
          images: [post.feature_image],
        }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    getPostBySlug(slug),
    getSettings(),
  ]);

  if (!post) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-4xl font-bold">Article Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          This article does not exist or has been removed.
        </p>
        <Link href="/blog">
          <Button variant="ghost" className="mt-8">
            ← Back to Blog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Post Header */}
      <section className="border-b py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-8">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>

          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString("en-US")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.reading_time} min read
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>

          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag.slug} variant="secondary">
                  <Tag className="mr-1 h-3 w-3" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Image */}
      {post.feature_image && (
        <section className="py-8">
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="overflow-hidden rounded-lg">
              <img
                src={post.feature_image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Post Content */}
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <article
            className="prose prose-gray max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.html || "" }}
          />
        </div>
      </section>

      {/* Post Footer */}
      <section className="border-t py-8">
        <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/blog">
              <Button variant="ghost">
                ← Back to Blog
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline">
                Browse Tools →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
