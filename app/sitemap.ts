import { MetadataRoute } from "next";
import { toolMeta } from "@/lib/tools";
import { getAllCategories, getAllResources, getHandwrittenResourceIds, isHandwrittenResource } from "@/lib/fmhy-data";
import { getAllAlternativeSlugs } from "@/lib/alternatives";
import { DOMAINS } from "@/lib/unified-categories";
import { BLOG_CATEGORIES } from "@/config/blog";
import { allPosts, allGuides } from "contentlayer/generated";
import { LANDING_PAGE_SLUGS } from "@/lib/seo/landing-pages";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const baseUrl = "https://craftisle.com";
// 注意：不要给没有真实更新时间来源的页面补 `lastModified: now`。
// 此前全站 578 个 URL 一律写构建时刻的 now，等于每次部署全站「同时更新」，
// Google 无法据此识别真实变更，lastmod 信号完全失效。
// 只有内容源自带日期（Post.date / Guide.date）时才输出 lastModified。
const LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'de', 'fr', 'es', 'pt', 'ru', 'ko', 'vi', 'th', 'id', 'tr'];

function loadReviewSlugs(): string[] {
  try {
    const dir = join(process.cwd(), "public", "data", "reviews");
    const files = readdirSync(dir).filter(f => f.endsWith(".json") && !f.startsWith("_"));
    return files.map(f => {
      const r = JSON.parse(readFileSync(join(dir, f), "utf-8"));
      return r.resourceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    });
  } catch { return []; }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${baseUrl}/`, priority: 1.0, changeFreq: "daily" as const },
    { url: `${baseUrl}/tools`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/tools/craftisle-image-tools`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/tools/craftisle-dev-tools`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/about/craftisle-vs-craft-island`, priority: 0.7, changeFreq: "monthly" as const },
    { url: `${baseUrl}/directory`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory/search`, priority: 0.6, changeFreq: "weekly" as const },
    { url: `${baseUrl}/directory/favorites`, priority: 0.5, changeFreq: "weekly" as const },
    { url: `${baseUrl}/blog`, priority: 0.7, changeFreq: "weekly" as const },
    { url: `${baseUrl}/guides`, priority: 0.7, changeFreq: "monthly" as const },
    { url: `${baseUrl}/privacy`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/terms`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/cookie-policy`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/disclaimer`, priority: 0.4, changeFreq: "monthly" as const },
    { url: `${baseUrl}/about`, priority: 0.5, changeFreq: "monthly" as const },
    { url: `${baseUrl}/contact`, priority: 0.5, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // 资源分类页面
  const resourceCategories = getAllCategories();
  const categoryPages = resourceCategories.map((cat) => ({
    url: `${baseUrl}/directory/${cat.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 资源详情页：仅收录「人工手写的原创资源」（避免收录任何薄内容/模板页）
  const handwrittenIds = getHandwrittenResourceIds();
  const resourceDetailPages = getAllResources()
    .filter((r) => handwrittenIds.has(r.id))
    .map((r) => ({
      url: `${baseUrl}/directory/resource/${r.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  // 替代品页面
  // 用 getAllAlternativeSlugs()（含 lib/alternatives.ts 里 39 个 batch JSON 的条目），
  // 此前只遍历手写 ALTERNATIVES_MAP，导致 ~125 个已渲染页面从未进入 sitemap。
  // 同时它的 toSlug() 与路由 getAlternativeBySlug() 的匹配规则一致，
  // 旧的 tool.toLowerCase().replace(/\s+/g,"-") 对含特殊字符的名称会算出不一致的 slug。
  const alternativePages = getAllAlternativeSlugs().map((slug) => ({
    url: `${baseUrl}/directory/alternatives/${encodeURIComponent(slug)}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：MDX 博客文章
  const mdxBlogPages = allPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slugAsParams}`,
    ...(post.date ? { lastModified: new Date(post.date) } : {}),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ★ 新增：博客分类页
  const blogCategoryPages = BLOG_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/blog/category/${cat.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ★ 新增：Guides 页面
  const guidePages = allGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slugAsParams}`,
    ...(guide.date ? { lastModified: new Date(guide.date) } : {}),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：评测博文页面
  const reviewSlugs = loadReviewSlugs();
  const reviewPages = reviewSlugs.map((slug) => ({
    url: `${baseUrl}/blog/review/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ★ 新增：工具教程博文页面
  const toolBlogSlugs = (() => {
    try {
      const manifestPath = join(process.cwd(), "public", "data", "tool-blogs", "_manifest.json");
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      return (Array.isArray(manifest) ? manifest : []).map((b: any) => b.slug);
    } catch { return []; }
  })();
  const toolBlogPages = toolBlogSlugs.map((slug: string) => ({
    url: `${baseUrl}/blog/tools/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const otherPages = [
    { url: `${baseUrl}/compare`, priority: 0.6, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const toolPages = Object.keys(toolMeta).map((id) => ({
    url: `${baseUrl}/tools/${id}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：T1 主题权威落地页（18 个零曝光种子：craftisle 9 + pdf 9）
  const landingPages = LANDING_PAGE_SLUGS.map((slug) => ({
    url: `${baseUrl}/l/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ★ 多语种资源详情页（14 种语言）
  // 仅收录「人工手写的原创资源」，与详情页 noindex 逻辑（isHandwrittenResource）完全对齐
  const contentDir = join(process.cwd(), "public", "data", "generated-content");
  const resourcesWithContent = existsSync(contentDir)
    ? readdirSync(contentDir)
        .filter(f => f.endsWith(".json"))
        .filter(f => isHandwrittenResource(f.replace(".json", ""))) // 只保留手写资源
    : [];
  const multiLangPages = resourcesWithContent.flatMap(slug => {
    const resourceId = slug.replace(".json", "");
    return LANGUAGES.map(lang => ({
      url: `${baseUrl}/directory/resource/${resourceId}${lang === "en" ? "" : `/${lang}`}`,
      changeFrequency: "monthly" as const,
      priority: 0.4,
      alternates: {
        languages: LANGUAGES.reduce((acc, l) => ({
          ...acc,
          [l]: `${baseUrl}/directory/resource/${resourceId}${l === "en" ? "" : `/${l}`}`,
        }), {}),
      },
    }));
  });

  return [
    ...staticPages,
    ...categoryPages,
    ...resourceDetailPages,
    ...multiLangPages,
    ...alternativePages,
    ...mdxBlogPages,
    ...blogCategoryPages,
    ...guidePages,
    ...reviewPages,
    ...toolBlogPages,
    ...otherPages,
    ...toolPages,
    ...landingPages,
  ];
}
