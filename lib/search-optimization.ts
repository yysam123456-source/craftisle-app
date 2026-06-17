/**
 * Search optimization utilities
 * Task keyword mapping + query expansion + result ranking
 */

/**
 * Task keyword mapping
 * Each task maps to a set of related keywords for search expansion
 */
export const TASK_KEYWORDS: Record<string, string[]> = {
  // Video & media
  "download": ["download", "downloader", "youtube", "tiktok", "twitch", "video", "audio", "stream"],
  "video editing": ["video", "editing", "editor", "cut", "trim", "montage", "effect", "render"],
  "background removal": ["background", "remove", "removal", "transparent", "png", "image", "photo"],
  "convert": ["convert", "converter", "transcode", "pdf", "word", "video", "audio", "format"],

  // AI & productivity
  "ai chat": ["ai", "chat", "gpt", "claude", "gemini", "llm", "free", "assistant", "chatbot"],
  "design": ["design", "photoshop", "illustrator", "figma", "canva", "graphic", "ui", "ux"],
  "productivity": ["productivity", "notion", "task", "manager", "note", "todo", "calendar"],

  // Entertainment
  "anime": ["anime", "manga", "manhwa", "stream", "watch", "read", "free"],
  "game": ["game", "emulator", "rom", "free", "pc", "android", "switch", "playstation"],

  // Privacy & security
  "adblock": ["adblock", "ads", "blocker", "ublock", "privacy", "tracker", "filter"],
  "vpn": ["vpn", "proxy", "privacy", "anonymous", "encrypt", "tor", "browse"],

  // Development & self-hosting
  "self-hosted": ["self-hosted", "homelab", "server", "docker", "cloud", "nas", "media", "vpn"],
  "development": ["development", "coding", "ide", "api", "database", "deploy", "git", "docker"],

  // Language mapping (Chinese → English keywords)
  "下载": ["download", "downloader", "youtube", "video"],
  "剪辑": ["video", "editing", "editor", "cut"],
  "去除背景": ["background", "remove", "transparent"],
  "转换": ["convert", "converter", "format"],
  "AI": ["ai", "chat", "gpt", "claude", "llm"],
  "设计": ["design", "photoshop", "figma", "graphic"],
  "动漫": ["anime", "manga", "stream", "watch"],
  "游戏": ["game", "emulator", "free"],
  "广告": ["adblock", "ads", "blocker"],
  "自建": ["self-hosted", "homelab", "server", "docker"],
};

/**
 * Expand search query with related keywords
 * @param query - Original search query
 * @returns Expanded keywords array
 */
export function expandQuery(query: string): string[] {
  const normalized = query.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const expanded = new Set<string>();

  // Add original words
  for (const word of words) {
    expanded.add(word);
  }

  // Expand with task keywords
  for (const word of words) {
    for (const [task, keywords] of Object.entries(TASK_KEYWORDS)) {
      if (task.includes(word) || word.includes(task)) {
        for (const kw of keywords) {
          expanded.add(kw);
        }
      }
    }
  }

  // Fuzzy match: if query contains part of a task, expand
  for (const [task, keywords] of Object.entries(TASK_KEYWORDS)) {
    if (normalized.includes(task) || task.includes(normalized)) {
      for (const kw of keywords) {
        expanded.add(kw);
      }
    }
  }

  return Array.from(expanded);
}

/**
 * Calculate relevance score for a resource
 * @param resource - Resource object with name, description, category
 * @param queryWords - Expanded query keywords
 * @returns Relevance score (higher = more relevant)
 */
export function calculateRelevance(
  resource: { name: string; description: string; category?: string },
  queryWords: string[]
): number {
  let score = 0;
  const nameLower = (resource.name || "").toLowerCase();
  const descLower = (resource.description || "").toLowerCase();
  const catLower = (resource.category || "").toLowerCase();

  for (const word of queryWords) {
    const wordLower = word.toLowerCase();

    // Exact match in name → weight 10
    if (nameLower.includes(wordLower)) {
      score += 10;
      // Boost if match at start of name
      if (nameLower.startsWith(wordLower)) {
        score += 5;
      }
    }

    // Exact match in description → weight 5
    if (descLower.includes(wordLower)) {
      score += 5;
    }

    // Exact match in category → weight 3
    if (catLower.includes(wordLower)) {
      score += 3;
    }
  }

  // Boost if multiple query words match
  const matchedWords = queryWords.filter(
    w => nameLower.includes(w.toLowerCase()) || descLower.includes(w.toLowerCase())
  );
  if (matchedWords.length > 1) {
    score *= 1 + (matchedWords.length - 1) * 0.2; // 20% boost per extra match
  }

  return score;
}

/**
 * Sort search results by relevance
 * @param resources - Array of resources
 * @param query - Original search query
 * @returns Sorted resources (highest relevance first)
 */
export function sortByRelevance<T extends { name: string; description: string; category?: string }>(
  resources: T[],
  query: string
): T[] {
  const expanded = expandQuery(query);

  return resources
    .map(res => ({
      resource: res,
      score: calculateRelevance(res, expanded),
    }))
    .filter(item => item.score > 0) // Only return relevant results
    .sort((a, b) => b.score - a.score)
    .map(item => item.resource);
}
