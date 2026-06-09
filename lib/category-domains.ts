/**
 * category-domains.ts
 * Groups all 216 categories from 4 data sources into 12 unified domains.
 */
import type { Category } from "./fmhy-data";
import { DOMAINS, getDomainForCategoryId } from "./unified-categories";

export interface DomainGroup {
  id: string;
  name: string;
  icon: string;
  description: string;
  categoryIds: string[];
  totalResources: number;
}

/**
 * Build domain groups from ALL categories (not just FMHY).
 * Each category is assigned to a domain via CATEGORY_DOMAIN_MAP.
 */
export function getDomainGroups(categories: Category[]): DomainGroup[] {
  // Build category lookup for resource counts
  const catMap = new Map<string, Category>();
  for (const cat of categories) {
    catMap.set(cat.id, cat);
  }

  return DOMAINS.map((domain) => {
    const domainCategories = categories.filter(
      (c) => getDomainForCategoryId(c.id) === domain.id,
    );
    const categoryIds = domainCategories.map((c) => c.id);
    const totalResources = domainCategories.reduce(
      (sum, c) => sum + (c.count || 0),
      0,
    );

    return {
      id: domain.id,
      name: domain.name,
      icon: domain.icon,
      description: domain.description,
      categoryIds,
      totalResources,
    };
  }).filter((g) => g.categoryIds.length > 0);
}

/**
 * Get a human-readable domain name for a category ID.
 */
export function getDomainForCategory(categoryId: string): string | null {
  const did = getDomainForCategoryId(categoryId);
  const domain = DOMAINS.find((d) => d.id === did);
  return domain?.name || null;
}
