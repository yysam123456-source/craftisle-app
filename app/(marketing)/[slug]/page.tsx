import { notFound } from "next/navigation";
import { allPages } from "contentlayer/generated";

import { Mdx } from "@/components/content/mdx-components";

import "@/styles/mdx.css";

import { Metadata } from "next";

import { constructMetadata, getBlurDataURL } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<Record<string, string | string[]>>;
}

export async function generateStaticParams() {
  return allPages.map((page) => ({
    slug: page.slugAsParams,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata | undefined> {
  const resolved = await params;
  const page = allPages.find((page) => page.slugAsParams === resolved.slug);
  if (!page) {
    return;
  }

  const { title, description } = page;

  // 🔴 移除 SaaS 脚手架残留：本行原为 `title: `${title} – SaaS Starter``，
  // 是上游模板留下的占位文案，会产出「XXX – SaaS Starter | Craftisle」这种
  // 与品牌无关的 title，直接损害 SERP 点击率与品牌一致性。
  // 现只传 MDX 自带的 title，站点后缀由 constructMetadata 统一追加。
  //
  // 注：content/pages/ 下当前只有 privacy.mdx / terms.mdx 两个文件，而
  // app/privacy/page.tsx 与 app/terms/page.tsx（静态路由）在 Next.js 中
  // **优先于**本动态段 ⇒ 线上 /privacy、/terms 均由静态路由渲染，
  // 本路由实际不产出任何可索引 URL（实测线上无 "SaaS Starter" 标记）。
  // 保留本段是为了 content/pages/ 未来新增文档时无需再搭路由。
  return constructMetadata({
    title,
    description: description,
    canonical: `https://craftisle.com/${resolved.slug}`,
  });
}

export default async function PagePage({
  params,
}: PageProps) {
  const resolved = await params;
  const page = allPages.find((page) => page.slugAsParams === resolved.slug);

  if (!page) {
    notFound();
  }

  const images = await Promise.all(
    page.images.map(async (src: string) => ({
      src,
      blurDataURL: await getBlurDataURL(src),
    })),
  );

  return (
    <article className="container max-w-3xl py-6 lg:py-12">
      <div className="space-y-4">
        <h1 className="inline-block font-heading text-4xl lg:text-5xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="text-xl text-muted-foreground">{page.description}</p>
        )}
      </div>
      <hr className="my-4" />
      <Mdx code={page.body.code} images={images} />
    </article>
  );
}
