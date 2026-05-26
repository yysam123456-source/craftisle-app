import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarDays, Clock } from "lucide-react";
import { getPosts, getSettings } from "@/lib/ghost";

export const metadata = {
  title: "Blog | Craftisle",
  description: "Latest gaming news, tool tutorials & practical guides.",
};

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([
    getPosts(12),
    getSettings(),
  ]);

  const siteTitle = settings?.title || "Craftisle";
  const siteDescription = settings?.description || "Free online tools & games platform";

  return (
    <div>
      {/* Page Header */}
      <section className="border-b bg-muted/30 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              Blog
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Latest Articles
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {siteDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Ghost CMS not configured. Please set <code>.env</code> in{" "}
                <code>GHOST_URL</code> and{" "}
                <code>GHOST_CONTENT_API_KEY</code>.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden transition-shadow hover:shadow-lg"
                >
                  {post.feature_image && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img
                        src={post.feature_image}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(post.published_at).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.reading_time} min read
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="hover:text-primary"
                      >
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" size="sm">
                        Read More →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
