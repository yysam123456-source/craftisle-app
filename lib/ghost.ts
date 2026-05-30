const GHOST_URL = process.env.GHOST_URL || "";
const GHOST_KEY = process.env.GHOST_CONTENT_API_KEY || "";

interface GhostPost {
  id: string;
  slug: string;
  url: string;
  title: string;
  html: string;
  excerpt: string;
  feature_image: string | null;
  published_at: string;
  updated_at: string;
  reading_time: number;
  tags: { name: string; slug: string }[];
  authors: { name: string; slug: string }[];
}

interface GhostSettings {
  title: string;
  description: string;
  logo: string | null;
  icon: string | null;
  cover_image: string | null;
  facebook: string | null;
  twitter: string | null;
  lang: string;
  timezone: string;
  navigation: { label: string; url: string }[];
}

/**
 * Generic Ghost Content API request helper
 */
async function ghostFetch(endpoint: string, params: Record<string, string> = {}) {
  if (!GHOST_URL || !GHOST_KEY) {
    console.warn("Ghost CMS 未配置");
    return null;
  }

  const url = new URL(`/ghost/api/content/${endpoint}`, GHOST_URL);
  url.searchParams.set("key", GHOST_KEY);
  url.searchParams.set("version", "v5.0");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 }, // ISR：60秒重新验证
  });

  if (!res.ok) {
    throw new Error(`Ghost API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * 获取博客文章列表
 */
export async function getPosts(
  limit = 10,
  page = "1"
): Promise<GhostPost[]> {
  if (!GHOST_URL || !GHOST_KEY) return [];

  try {
    const data = await ghostFetch("posts", {
      limit: String(limit),
      page,
      include: "tags,authors",
      formats: "html",
    });
    return data?.posts || [];
  } catch (error) {
    console.error("Ghost CMS: failed to fetch posts:", error);
    return [];
  }
}

/**
 * 根据 slug 获取单篇文章
 */
export async function getPostBySlug(
  slug: string
): Promise<GhostPost | null> {
  if (!GHOST_URL || !GHOST_KEY) return null;

  try {
    const data = await ghostFetch("posts", {
      slug,
      include: "tags,authors",
      formats: "html",
    });
    return data?.posts?.[0] || null;
  } catch (error) {
    console.error(`Ghost CMS: failed to fetch post (slug: ${slug}):`, error);
    return null;
  }
}

/**
 * 获取网站设置
 */
export async function getSettings(): Promise<GhostSettings | null> {
  if (!GHOST_URL || !GHOST_KEY) return null;

  try {
    const data = await ghostFetch("settings", {});
    return data?.settings || null;
  } catch (error) {
    console.error("Ghost CMS: failed to fetch settings:", error);
    return null;
  }
}
