#!/usr/bin/env node

/**
 * Sync FMHY data from the source GitHub wiki.
 *
 * Usage: node scripts/sync-fmhy.mjs
 * Schedule: .github/workflows/sync-data.yml (weekly Monday + manual)
 *
 * This script:
 * 1. Fetches the latest wiki pages from FMHY wiki
 * 2. Parses resources from wiki markdown
 * 3. Generates updated fmhy-resources.json, fmhy-index.json, fmhy-hot.json
 * 4. Reports whether changes were detected
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// ── FMHY data source ──────────────────────────────────────
// FMHY wiki 原始 markdown现在托管在 fmhy/edit 仓库的 main 分支 docs/ 目录下
const FMHY_REPO = "fmhy/edit";
const WIKI_BASE = `https://raw.githubusercontent.com/${FMHY_REPO}/main/docs`;

// docs/ 目录下的 markdown 文件（从 fmhy/edit api/routes/single-page.ts 中获取）
const WIKI_PAGES = [
  "ai.md",
  "privacy.md",
  "mobile.md",
  "audio.md",
  "beginners-guide.md",
  "developer-tools.md",
  "downloading.md",
  "educational.md",
  "file-tools.md",
  "gaming-tools.md",
  "gaming.md",
  "image-tools.md",
  "internet-tools.md",
  "linux-macos.md",
  "misc.md",
  "non-english.md",
  "reading.md",
  "social-media-tools.md",
  "storage.md",
  "system-tools.md",
  "text-tools.md",
  "torrenting.md",
  "unsafe.md",
  "video-tools.md",
  "video.md",
];

// 新的文件名 → 分类 ID 映射
const CATEGORY_MAP = {
  "ai.md": "Artificial-Intelligence",
  "privacy.md": "Adblock",
  "mobile.md": "Mobile",
  "audio.md": "Misc",
  "beginners-guide.md": "Misc",
  "developer-tools.md": "Misc",
  "downloading.md": "Downloading",
  "educational.md": "Reading",
  "file-tools.md": "Misc",
  "gaming-tools.md": "Gaming",
  "gaming.md": "Gaming",
  "image-tools.md": "Misc",
  "internet-tools.md": "Misc",
  "linux-macos.md": "Linux",
  "misc.md": "Misc",
  "non-english.md": "Misc",
  "reading.md": "Reading",
  "social-media-tools.md": "Misc",
  "storage.md": "Storage",
  "system-tools.md": "Misc",
  "text-tools.md": "Misc",
  "torrenting.md": "Downloading",
  "unsafe.md": "Misc",
  "video-tools.md": "Misc",
  "video.md": "Misc",
};

/**
 * Fetch a wiki page from raw.githubusercontent.com
 */
async function fetchWikiPage(pageName) {
  // pageName 现在是 "ai.md" 格式
  const url = `${WIKI_BASE}/${pageName}`;
  console.log(`  Fetching: ${pageName} ...`);
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    console.warn(`  ⚠ Failed to fetch ${pageName}: ${res.status}`);
    return null;
  }
  return res.text();
}

/**
 * Parse resources from FMHY wiki markdown (new format: fmhy/edit main branch docs/).
 *
 * Expected format in markdown:
 *   - ⭐ **[Resource Name](https://resource-url.com)** - Description with [GitHub](https://github.com/owner/repo) link
 *   - or: * [Resource Name](https://...) - description
 *
 * We extract:
 *   1. The main resource link (first markdown link in the line)
 *   2. ALL GitHub repo links (github.com/owner/repo) from the entire line
 *   3. Store the first GitHub repo URL as `githubUrl` for enrichment
 */
// ── Global ID counter to ensure uniqueness across all categories ──
let GLOBAL_ID_COUNTER = 0;
function nextGlobalId(categoryId) {
  GLOBAL_ID_COUNTER++;
  return `${categoryId.toLowerCase()}-${String(GLOBAL_ID_COUNTER).padStart(5, "0")}`;
}

function parseResources(markdown, categoryId) {
  const resources = [];
  const lines = markdown.split("\n");
  let currentSubcategory = "";

  // GitHub 保留路径（非仓库页面）
  const GITHUB_RESERVED = new Set([
    "topics", "collections", "marketplace", "explore", "trending",
    "events", "sponsors", "settings", "notifications", "issues",
    "pulls", "watching", "stargazers", "followers", "following",
    "wiki", "blob", "tree", "raw", "organizations",
  ]);

  function extractGitHubRepo(lineText) {
    // 找所有 github.com 的 markdown 链接
    const mdLinks = [...lineText.matchAll(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)/gi)];
    for (const m of mdLinks) {
      const url = m[2];
      try {
        const u = new URL(url);
        if (u.hostname !== "github.com" && u.hostname !== "www.github.com") continue;
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length < 2) continue;
        if (GITHUB_RESERVED.has(parts[0])) continue;
        // 必须是 owner/repo 格式（2 级路径）
        return `${parts[0]}/${parts[1]}`;
      } catch {}
    }
    // 也检查纯文本 URL（不在 markdown 链接里）
    const plainUrls = [...lineText.matchAll(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/gi)];
    for (const m of plainUrls) {
      const url = m[0].replace(/[),.]$/, ""); // 去尾标点
      try {
        const u = new URL(url);
        if (u.hostname !== "github.com" && u.hostname !== "www.github.com") continue;
        const parts = u.pathname.split("/").filter(Boolean);
        if (parts.length < 2) continue;
        if (GITHUB_RESERVED.has(parts[0])) continue;
        return `${parts[0]}/${parts[1]}`;
      } catch {}
    }
    return null;
  }

  for (const line of lines) {
    // 跳过空行、标题行、分隔符
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("---")) continue;

    // 尝试提取 markdown 链接
    const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (!linkMatch) {
      // 可能是子分类标题（粗体）
      if (trimmed.startsWith("*") && !trimmed.includes("](")) {
        currentSubcategory = trimmed.replace(/[*_`]/g, "").trim();
      }
      continue;
    }

    let name = linkMatch[1].replace(/\*\*/g, "").trim();
    const url = linkMatch[2].trim();

    // Skip non-http links and internal anchors
    if (!url.startsWith("http")) continue;
    if (name.startsWith("⭐") || name.startsWith("▸")) {
      name = name.replace(/^[⭐▸]\s*/, "").trim();
    }

    // Extract description after the link
    const afterLink = line.substring(line.indexOf(")") + 1).trim();
    const description =
      afterLink.replace(/^[-–—]\s*/, "").trim() || currentSubcategory;

    // 🔑 提取 GitHub 仓库链接
    const githubRepo = extractGitHubRepo(line);

    idCounter++;
    const resource = {
      id: nextGlobalId(categoryId),
      category: categoryId,
      categoryName: categoryId.replace(/-/g, " "),
      categoryIcon: "📦",
      name,
      url,
      description: description || `${name} — Free online tool`,
      dateAdded: new Date().toISOString().split("T")[0],
    };
    if (githubRepo) {
      resource.githubUrl = `https://github.com/${githubRepo}`;
    }
    resources.push(resource);
  }

  return resources;
}

/**
 * Build categories index from resources data
 */
function buildIndex(categoriesData) {
  const categories = [];
  for (const [id, catData] of Object.entries(categoriesData)) {
    categories.push({
      id,
      name: catData.nameZh || id.replace(/-/g, " "),
      description: catData.description || "Free resources",
      icon: catData.icon || "📦",
      count: catData.count || catData.resources.length,
    });
  }
  return { categories };
}

/**
 * Build hot resources from popular entries
 */
function buildHot(categoriesData) {
  const all = [];
  for (const [, catData] of Object.entries(categoriesData)) {
    all.push(...(catData.resources || []));
  }
  // Sort by popularity (or random if no data)
  const sorted = all.sort((a, b) => {
    return (b.popularity || 0) - (a.popularity || 0);
  });
  return {
    generatedAt: new Date().toISOString(),
    resources: sorted.slice(0, 50),
  };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Syncing FMHY data...\n");

  // Read existing data for comparison
  let existingData = null;
  const resourcesPath = join(DATA_DIR, "fmhy-resources.json");
  if (existsSync(resourcesPath)) {
    existingData = JSON.parse(readFileSync(resourcesPath, "utf-8"));
    console.log(
      `📦 Existing data: ${existingData.totalResources} resources across ${
        Object.keys(existingData.categories).length
      } categories`
    );
  }

  // Fetch and parse all wiki pages
  const categoriesData = {};
  let totalResources = 0;

  for (const page of WIKI_PAGES) {
    const categoryId = CATEGORY_MAP[page] || "Misc";
    const markdown = await fetchWikiPage(page);

    if (!markdown) {
      // Use existing data for this category if fetch fails
      if (existingData?.categories[categoryId]) {
        console.log(`  ↪ Using existing data for ${categoryId}`);
        categoriesData[categoryId] = existingData.categories[categoryId];
        totalResources += categoriesData[categoryId].resources.length;
      }
      continue;
    }

    const resources = parseResources(markdown, categoryId);
    if (resources.length === 0) {
      console.log(`  ⚠ No resources parsed from ${page}, using existing data`);
      if (existingData?.categories[categoryId]) {
        categoriesData[categoryId] = existingData.categories[categoryId];
        totalResources += categoriesData[categoryId].resources.length;
      }
      continue;
    }

    // Merge with existing resources if category already has data
    if (!categoriesData[categoryId]) {
      categoriesData[categoryId] = {
        nameZh: categoryId.replace(/-/g, " "),
        description: `${categoryId} resources`,
        icon: "📦",
        count: resources.length,
        resources,
      };
    } else {
      // Merge: add new resources, avoid duplicates by URL
      const existingUrls = new Set(
        categoriesData[categoryId].resources.map((r) => r.url)
      );
      const newResources = resources.filter(
        (r) => !existingUrls.has(r.url)
      );
      categoriesData[categoryId].resources.push(...newResources);
      categoriesData[categoryId].count =
        categoriesData[categoryId].resources.length;
    }

    totalResources += resources.length;
    console.log(`  ✅ ${page}: ${resources.length} resources`);
  }

  // Build output data
  const outputData = {
    generatedAt: new Date().toISOString(),
    totalResources,
    categories: categoriesData,
  };

  // Compare with existing to detect changes
  const oldJson = existingData
    ? JSON.stringify(existingData, null, 2)
    : "";
  const newJson = JSON.stringify(outputData, null, 2);
  const hasChanges = oldJson !== newJson;

  if (!hasChanges) {
    console.log("\n✅ No changes detected. Data is up to date.");
    return;
  }

  // Write files
  writeFileSync(resourcesPath, newJson);
  console.log(`\n📝 Written: fmhy-resources.json (${totalResources} resources)`);

  // Generate index
  const indexData = buildIndex(categoriesData);
  writeFileSync(
    join(DATA_DIR, "fmhy-index.json"),
    JSON.stringify(indexData, null, 2)
  );
  console.log(`📝 Written: fmhy-index.json`);

  // Generate hot list
  const hotData = buildHot(categoriesData);
  writeFileSync(
    join(DATA_DIR, "fmhy-hot.json"),
    JSON.stringify(hotData, null, 2)
  );
  console.log(`📝 Written: fmhy-hot.json`);

  // Write category h2 index
  const h2Data = { categories: indexData.categories };
  writeFileSync(
    join(DATA_DIR, "fmhy-category-h2.json"),
    JSON.stringify(h2Data, null, 2)
  );
  console.log(`📝 Written: fmhy-category-h2.json`);

  const addedCount = totalResources - (existingData?.totalResources || 0);
  console.log(
    `\n🔁 Changes: ${
      addedCount >= 0 ? "+" : ""
    }${addedCount} resources`
  );
}

main().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
