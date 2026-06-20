import { MetadataRoute } from "next";
import { toolMeta } from "@/lib/tools";
import { getAllCategories, getAllResources, getRichInfoResourceIds } from "@/lib/fmhy-data";
import { ALTERNATIVES_MAP } from "@/lib/alternatives";
import { DOMAINS } from "@/lib/unified-categories";
import { BLOG_CATEGORIES } from "@/config/blog";
import { allPosts, allGuides } from "contentlayer/generated";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

const baseUrl = "https://craftisle.com";
const now = new Date();
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
    { url: `${baseUrl}/games`, priority: 0.8, changeFreq: "weekly" as const },
    { url: `${baseUrl}/tools`, priority: 0.8, changeFreq: "weekly" as const },
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
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  // 资源分类页面
  const resourceCategories = getAllCategories();
  const categoryPages = resourceCategories.map((cat) => ({
    url: `${baseUrl}/directory/${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // 资源详情页：仅收录「有丰富信息」的资源（避免搜索引擎收录垃圾页面）
  const richIds = getRichInfoResourceIds();
  const resourceDetailPages = getAllResources()
    .filter((r) => richIds.has(r.id))
    .map((r) => ({
      url: `${baseUrl}/directory/resource/${r.id}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  // ★ 新增：替代品页面
  const alternativePages = Object.keys(ALTERNATIVES_MAP).map((tool) => ({
    url: `${baseUrl}/directory/alternatives/${encodeURIComponent(tool.toLowerCase().replace(/\s+/g, "-"))}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：MDX 博客文章
  const mdxBlogPages = allPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slugAsParams}`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // ★ 新增：博客分类页
  const blogCategoryPages = BLOG_CATEGORIES.map((cat) => ({
    url: `${baseUrl}/blog/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ★ 新增：Guides 页面
  const guidePages = allGuides.map((guide) => ({
    url: `${baseUrl}/guides/${guide.slugAsParams}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：评测博文页面
  const reviewSlugs = loadReviewSlugs();
  const reviewPages = reviewSlugs.map((slug) => ({
    url: `${baseUrl}/blog/review/${slug}`,
    lastModified: now,
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
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const otherPages = [
    url: `${baseUrl}/directory/domain/${d.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const otherPages = [
    { url: `${baseUrl}/compare`, priority: 0.6, changeFreq: "monthly" as const },
  ].map((r) => ({
    url: r.url,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));

  const toolPages = Object.keys(toolMeta).map((id) => ({
    url: `${baseUrl}/tools/${id}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ★ 新增：多语种资源详情页（14 种语言）
  const contentDir = join(process.cwd(), "public", "data", "generated-content");
  const resourcesWithContent = existsSync(contentDir)
    ? readdirSync(contentDir).filter(f => f.endsWith(".json")).slice(0, 100) // 限制前 100 个
    : [];
  const multiLangPages = resourcesWithContent.flatMap(slug => {
    const resourceId = slug.replace(".json", "");
    return LANGUAGES.map(lang => ({
      url: `${baseUrl}/directory/resource/${resourceId}${lang === "en" ? "" : `/${lang}`}`,
      lastModified: now,
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
    ...domainPages,
    ...resourceDetailPages,
    ...multiLangPages,
    ...alternativePages,
    ...mdxBlogPages,
    ...blogCategoryPages,
    ...guidePages,
    ...reviewPages,
    ...toolBlogPages,
    ...playPages,
    ...otherPages,
    ...toolPages,
  ];
}
