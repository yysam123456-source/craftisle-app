/**
 * category-domains.ts
 * 将 14 个 FMHY 原始分类归并为 4 个领域分组，方便用户导航。
 */
import type { Category } from "./fmhy-data";

export interface DomainGroup {
  id: string;
  name: string;
  icon: string;
  description: string;
  categoryIds: string[];
  totalResources: number;
}

/**
 * Domain groupings for FMHY categories.
 *
 *   1. 🧠 AI & Learning   → AI Tools, Education, Reading
 *   2. 🛡️ Privacy & OS    → Ad Blocking, Linux, Storage
 *   3. 🎮 Media & Fun     → Gaming, Music, Streaming, Mobile
 *   4. 🔧 Downloads & More → Downloading, Torrenting, Non-English, Misc
 */
const DOMAIN_DEFINITIONS: Omit<DomainGroup, "totalResources">[] = [
  {
    id: "ai-learning",
    name: "AI & Learning",
    icon: "🧠",
    description: "AI tools, educational platforms, and reading resources — everything you need to learn and create.",
    categoryIds: ["Artificial-Intelligence", "Educational", "Reading"],
  },
  {
    id: "privacy-os",
    name: "Privacy & Open Source",
    icon: "🛡️",
    description: "Ad blockers, Linux tools, and cloud storage — take control of your digital life.",
    categoryIds: ["Adblock", "Linux", "Storage"],
  },
  {
    id: "media-fun",
    name: "Media & Entertainment",
    icon: "🎮",
    description: "Gaming, music, streaming, and mobile apps — the best free entertainment tools.",
    categoryIds: ["Gaming", "Music", "Streaming", "Mobile"],
  },
  {
    id: "downloads-more",
    name: "Downloads & More",
    icon: "🔧",
    description: "Download tools, torrent clients, international resources, and miscellaneous utilities.",
    categoryIds: ["Downloading", "Torrenting", "Non-Eng", "Misc"],
  },
];

/**
 * Build domain groups from category data (computes totalResources per group).
 */
export function getDomainGroups(categories: Category[]): DomainGroup[] {
  return DOMAIN_DEFINITIONS.map((def) => {
    const totalResources = def.categoryIds.reduce((sum, catId) => {
      const cat = categories.find((c) => c.id === catId);
      return sum + (cat?.count || 0);
    }, 0);
    return { ...def, totalResources };
  });
}

/**
 * Get a human-readable domain name for a category ID.
 */
export function getDomainForCategory(categoryId: string): string | null {
  for (const def of DOMAIN_DEFINITIONS) {
    if (def.categoryIds.includes(categoryId)) return def.name;
  }
  return null;
}
