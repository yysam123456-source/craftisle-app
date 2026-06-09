export const BLOG_CATEGORIES: {
  title: string;
  slug: "news" | "education";
  description: string;
}[] = [
  {
    title: "Tools",
    slug: "news",
    description: "Discover our full suite of free online tools — from image editors to PDF processors.",
  },
  {
    title: "Guides",
    slug: "education",
    description: "Step-by-step tutorials and how-to guides for every Craftisle tool.",
  },
];

export const BLOG_AUTHORS = {
  craftisle: {
    name: "Craftisle Team",
    image: "/_static/avatars/mickasmt.png",
    twitter: "craftisle",
  },
};
