import { Metadata } from "next";
import { notFound } from "next/navigation";
import { allPosts } from "contentlayer/generated";

import { BLOG_CATEGORIES } from "@/config/blog";
import { constructMetadata, getBlurDataURL } from "@/lib/utils";
import { BlogCard } from "@/components/content/blog-card";

interface BlogCategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: BlogCategoryPageProps): Promise<Metadata | undefined> {
  const resolved = await params;
  const category = BLOG_CATEGORIES.find(
    (category) => category.slug === resolved.slug
  );
  if (!category) {
    return;
  }

  const { title, description } = category;

  return constructMetadata({
    // 🔴 移除 SaaS 脚手架残留。原为 `${title} Posts – Next SaaS Starter`，
    // 线上实测产出 "Tools Posts – Next SaaS Starter | Craftisle" /
    // "Guides Posts – Next SaaS Starter | Craftisle"。
    // 注意：不能只删 " – Next SaaS Starter" 而留下 `${title} Posts` ——
    // BLOG_CATEGORIES 里 title 本身已是复数（如 "Tools"、"Guides"），
    // 拼上 "Posts" 会产出 "Tools Posts" 这种读起来就不对的标题。
    // 这里直接用 category.title，站点后缀由 constructMetadata 统一追加。
    title,
    description,
    canonical: `https://craftisle.com/blog/category/${resolved.slug}`,
  });
}

export default async function BlogCategory({
  params,
}: BlogCategoryPageProps) {
  const resolved = await params;
  const category = BLOG_CATEGORIES.find(
    (ctg) => ctg.slug === resolved.slug
  );

  if (!category) {
    notFound();
  }

  const articles = await Promise.all(
    allPosts
      .filter((post) => post.categories.includes(category.slug))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(async (post) => ({
        ...post,
        blurDataURL: await getBlurDataURL(post.image),
      })),
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, idx) => (
        <BlogCard key={article._id} data={article} priority={idx <= 2} />
      ))}
    </div>
  );
}
