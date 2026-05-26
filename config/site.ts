import { SidebarNavItem, SiteConfig } from "@/types";
import { env } from "@/env.mjs";

const site_url = env.NEXT_PUBLIC_APP_URL || "https://craftisle.com";

export const siteConfig: SiteConfig = {
  name: "Craftisle",
  description:
    "Free online games, tools, and resources. Play games, use free tools, browse directory, read articles.",
  url: site_url,
  ogImage: `${site_url}/_static/og.jpg`,
  links: {
    twitter: "https://twitter.com/craftisle",
    github: "https://github.com/yysam123456-source/craftisle",
  },
  mailSupport: "support@craftisle.com",
};

export const footerLinks: SidebarNavItem[] = [
  {
    title: "Company",
    items: [
      { title: "About", href: "/about" },
      { title: "Terms", href: "/terms" },
      { title: "Privacy", href: "/privacy" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Games", href: "/games" },
      { title: "Tools", href: "/tools" },
      { title: "Directory", href: "/directory" },
      { title: "Blog", href: "/blog" },
    ],
  },
];
