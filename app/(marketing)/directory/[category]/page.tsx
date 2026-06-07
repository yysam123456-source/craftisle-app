import { ResourcesClient } from "@/components/resources/resources-client";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { readFileSync } from "fs";
import { join } from "path";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

interface Resource {
  id: string;
  category: string;
  categoryName: string;
  categoryIcon: string;
  name: string;
  url: string;
  description: string;
}

interface CategoryPageProps {
  params: Promise<{ category: string }>;
}

const DATE_MODIFIED = "2026-06-07";

// Long-tail SEO keywords per category
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Artificial-Intelligence": [
    "free AI tools",
    "AI chatbot free",
    "free image generator",
    "text generator AI",
    "AI writing assistant free",
    "ChatGPT alternative free",
    "free AI image generator",
    "AI code assistant free",
    "best free AI tools 2025",
    "open source AI tools",
  ],
  Educational: [
    "free online courses",
    "learn to code free",
    "programming tutorials free",
    "free certifications online",
    "online learning platforms free",
    "free educational resources",
    "self-study tools free",
    "free coding bootcamp",
    "best free learning sites",
    "free tech courses",
  ],
  Adblock: [
    "best ad blocker free",
    "privacy browser extension",
    "anti-tracking tools free",
    "block ads free",
    "ublock origin alternative",
    "browser privacy tools",
    "tracker blocker free",
    "free adblocker download",
    "privacy extensions chrome",
    "best free privacy tools",
  ],
  Linux: [
    "free Linux distro",
    "Linux download free",
    "open source OS",
    "best Linux for beginners",
    "Linux terminal tools free",
    "Ubuntu alternative free",
    "lightweight Linux distro",
    "free Linux software",
    "Linux system tools",
    "best free Linux apps",
  ],
  Misc: [
    "free online tools",
    "useful web tools free",
    "free utilities online",
    "best free software",
    "handy online tools",
    "free productivity tools",
    "daily useful tools",
    "free web utilities",
    "best free online apps",
    "free tool collection",
  ],
  Reading: [
    "free ebook sites",
    "read books online free",
    "free PDF books",
    "online library free",
    "digital reading platforms free",
    "free audiobooks online",
    "ebook download free",
    "best free book sites",
    "free academic papers",
    "open access books",
  ],
  Mobile: [
    "free Android apps",
    "open source Android apps",
    "best mobile apps free",
    "Android tools free",
    "mobile app store alternative",
    "FOSS Android apps",
    "free iOS apps",
    "best free phone apps",
    "mobile utility apps free",
    "free APK download",
  ],
  Storage: [
    "free cloud storage",
    "file hosting free",
    "backup solutions free",
    "free file sharing",
    "secure cloud storage free",
    "large file transfer free",
    "best free cloud drive",
    "free online backup",
    "free file hosting sites",
    "unlimited free storage",
  ],
  Gaming: [
    "free game engines",
    "game development tools free",
    "indie game resources free",
    "free assets for games",
    "open source games",
    "game mod tools free",
    "best free game dev tools",
    "free 3D game assets",
    "free game maker software",
    "indie dev resources",
  ],
  Music: [
    "free music production software",
    "audio editor free",
    "music streaming free",
    "open source audio tools",
    "DAW free download",
    "music download tools free",
    "best free music software",
    "free beat making software",
    "audio converter free",
    "free sound editing tools",
  ],
  Streaming: [
    "free video player",
    "media player download free",
    "streaming tools free",
    "video codec tools free",
    "live streaming software free",
    "IPTV tools free",
    "best free media player",
    "free screen recorder",
    "video converter free",
    "open source streaming",
  ],
  "Non-Eng": [
    "multilingual resources free",
    "non-English content tools",
    "language learning free",
    "international content platforms",
    "subtitle tools free",
    "free translation tools",
    "multilingual software free",
    "free language apps",
    "regional content access",
    "free dubbing tools",
  ],
  Downloading: [
    "free download manager",
    "torrent client free",
    "file downloader free",
    "direct download tools free",
    "multi-threaded downloader free",
    "best free download tool",
    "HTTP downloader free",
    "batch download free",
    "free IDM alternative",
    "download accelerator free",
  ],
  Torrenting: [
    "best torrent client free",
    "P2P file sharing free",
    "magnet link downloader free",
    "torrent tracker list",
    "open source torrent client",
    "seedbox tools free",
    "free BitTorrent client",
    "best free torrent app",
    "torrent search engine free",
    "private tracker tools",
  ],
};

// Build-time: read files directly (no fetch)
function loadJson<T>(filename: string): T | null {
  try {
    const filePath = join(process.cwd(), "public", "data", filename);
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getIndexData(): { categories: Category[] } | null {
  return loadJson("fmhy-index.json");
}

function getCategoryResources(categoryId: string): Resource[] {
  const data = loadJson<{ categories: Record<string, { resources: Resource[] }> }>("fmhy-resources.json");
  return data?.categories?.[categoryId]?.resources || [];
}

export async function generateStaticParams() {
  const indexData = getIndexData();
  return (
    indexData?.categories?.map((cat) => ({ category: cat.id })) || []
  );
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category } = await params;
  const indexData = getIndexData();
  const cat = indexData?.categories?.find((c) => c.id === category);

  if (!cat) {
    return constructMetadata({
      title: "Category Not Found | Resources | Craftisle",
      description: "This resource category does not exist.",
    });
  }

  const longTailKeywords = CATEGORY_KEYWORDS[cat.id] || [
    cat.name,
    "free resources",
    "free tools",
  ];

  return constructMetadata({
    title: `${cat.name} | Free ${cat.name} Resources | Craftisle`,
    description: `Discover ${cat.count} free ${cat.name.toLowerCase()} resources. ${cat.description}. All tools are curated, compliant, and free to use — no signup required.`,
    keywords: [
      cat.name,
      `free ${cat.name.toLowerCase()}`,
      `${cat.name.toLowerCase()} tools`,
      "free resources",
      "free tools",
      "open source",
      ...longTailKeywords,
    ],
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const indexData = getIndexData();
  const cat = indexData?.categories?.find((c) => c.id === category);

  if (!cat) {
    return (
      <section className="py-24 text-center">
        <h1 className="text-3xl font-bold">Category Not Found</h1>
        <p className="mt-4 text-muted-foreground">
          This resource category does not exist.
        </p>
        <a href="/directory">
          <button className="mt-8">Back to Directory</button>
        </a>
      </section>
    );
  }

  const resources = getCategoryResources(category);

  // JSON-LD: CollectionPage + BreadcrumbList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${cat.name} — Free ${cat.name} Resources`,
    "description": cat.description,
    "url": `https://craftisle.app/directory/${category}`,
    "dateModified": DATE_MODIFIED,
    "publisher": {
      "@type": "Organization",
      "name": "Craftisle",
      "url": "https://craftisle.app",
    },
    "numberOfItems": resources.length,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://craftisle.app",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Directory",
          "item": "https://craftisle.app/directory",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": cat.name,
          "item": `https://craftisle.app/directory/${category}`,
        },
      ],
    },
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4">
              Resources
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {cat.icon} {cat.name}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {cat.description}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {resources.length} free resources in this category
            </p>
          </div>

          {/* Resource List */}
          {resources.length > 0 ? (
            <ResourcesClient resources={resources} category={cat} />
          ) : (
            <p className="text-muted-foreground">No resources found in this category.</p>
          )}
        </div>
      </section>
    </>
  );
}
