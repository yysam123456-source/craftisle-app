/**
 * GA4 Custom Event Tracking Utility
 * 
 * Usage:
 *   trackEvent("resource_click", { resource_id: "fmhy-123", resource_name: "Vercel" });
 *   trackEvent("favorite_toggle", { resource_id: "fmhy-123", action: "add" });
 *   trackEvent("external_link", { url: "https://example.com", source_page: "/directory" });
 */

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

type EventParams = Record<string, string | number | boolean | undefined>;

function gtagAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function";
}

export function trackEvent(eventName: string, params?: EventParams): void {
  if (!gtagAvailable()) return;
  window.gtag("event", eventName, params);
}

// Predefined events for consistency
export function trackResourceClick(resourceId: string, resourceName: string, source?: string) {
  trackEvent("resource_click", {
    resource_id: resourceId,
    resource_name: resourceName,
    source: source || "",
  });
}

export function trackExternalLink(url: string, sourcePage: string) {
  trackEvent("external_link", {
    url,
    source_page: sourcePage,
  });
}

export function trackFavoriteToggle(resourceId: string, action: "add" | "remove") {
  trackEvent("favorite_toggle", {
    resource_id: resourceId,
    action,
  });
}

export function trackSearch(query: string, resultsCount: number) {
  trackEvent("search", {
    search_term: query,
    results_count: resultsCount,
  });
}

export function trackCategoryView(categoryId: string, categoryName: string) {
  trackEvent("category_view", {
    category_id: categoryId,
    category_name: categoryName,
  });
}

export function trackSourceSwitch(sourceId: string, sourceName: string) {
  trackEvent("source_switch", {
    source_id: sourceId,
    source_name: sourceName,
  });
}

export function trackBlogView(slug: string, title: string) {
  trackEvent("blog_view", {
    slug,
    title,
  });
}
