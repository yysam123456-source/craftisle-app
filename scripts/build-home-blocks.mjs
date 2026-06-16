#!/usr/bin/env node
/**
 * build-home-blocks.mjs
 * 动态生成 Directory 首页的 10 个内容板块
 *
 * 数据来源（纯本地，无需 API 调用）：
 *   1. fmhy-resources.json    — 全量资源数据
 *   2. alternatives-batch*.json — 替代品数据
 *   3. star-snapshot.json      — GitHub Stars 数据（可选，有则用，无则 fallback）
 *
 * 输出：public/data/home-blocks.json
 * Cron：每周一 09:00（由 GitHub Actions 或 Vercel Cron 触发）
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const SNAPSHOT_FILE = join(DATA_DIR, "star-snapshot.json");
const BLOCKS_FILE = join(DATA_DIR, "home-blocks.json");

// ── 加载资源 ────────────────────────────────────────────────────────────────────
function loadAllResources() {
  const resources = [];
  const files = [
    "fmhy-resources.json",
    "free-for-dev-resources.json",
    "public-apis-resources.json",
    "awesome-selfhosted-resources.json",
  ];
  for (const f of files) {
    const fp = join(DATA_DIR, f);
    if (!existsSync(fp)) continue;
    try {
      const data = JSON.parse(readFileSync(fp, "utf-8"));
      let items = [];

      if (f.endsWith("fmhy-resources.json")) {
        // FMHY 格式：categories 是 object，每个值是 dict，resources 在 dict.resources 里
        const cats = data.categories || {};
        for (const [catName, catData] of Object.entries(cats)) {
          if (catData && Array.isArray(catData.resources)) {
            for (const r of catData.resources) {
              items.push({ ...r, _categoryName: catName, categoryName: catName });
            }
          }
        }
      } else {
        // 其他文件：顶层 resources 数组  
        items = data.resources || [];
      }

      for (const r of items) {
        r._sourceFile = f;
        resources.push(r);
      }
      console.log(`   ✓ ${f}: ${items.length} resources`);
    } catch (e) {
      console.warn(`  ⚠️  Failed to load ${f}:`, e.message);
    }
  }
  // 去重（保留第一个）  
  const seen = new Set();
  return resources.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
}

// ── 加载 star snapshot（可选）──────────────────────────────────────────────────
function loadSnapshot() {
  if (!existsSync(SNAPSHOT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));
  } catch {
    return {};
  }
}

// ── 加载 alternatives ────────────────────────────────────────────────────────────
function loadAllAlternatives() {
  const alternatives = [];
  for (let i = 1; i <= 30; i++) {
    const fp = join(DATA_DIR, `alternatives-batch${i}.json`);
    if (!existsSync(fp)) continue;
    try {
      const data = JSON.parse(readFileSync(fp, "utf-8"));
      if (Array.isArray(data)) alternatives.push(...data);
    } catch (e) {
      // ignore
    }
  }
  return alternatives;
}

// ── 资源摘要（写入 JSON）───────────────────────────────────────────────────────
function resourceSummary(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    url: r.url,
    category: r.category,
    categoryName: r.categoryName || r.category,
    githubStars: r.githubStars ?? r._currentStars ?? 0,
    icon: r.icon || null,
    isFree: !!r.isFree,
    isOpenSource: !!r.isOpenSource,
    tags: r.tags || [],
  };
}

// ── 按关键词匹配资源 ──────────────────────────────────────────────────────────
function matchByKeywords(resources, keywords) {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return resources.filter((r) => {
    const text = `${r.name} ${(r.tags || []).join(" ")} ${(r.categoryName || "")}`.toLowerCase();
    return lowerKeywords.some((k) => text.includes(k));
  });
}

// ── 主函数 ──────────────────────────────────────────────────────────────────────
function main() {
  const now = new Date();

  console.log("🏗️  Building homepage blocks...");
  console.log(`   Data dir: ${DATA_DIR}`);

  // Step 1: 加载所有资源  
  console.log("\n📦 Loading all resources...");
  const allResources = loadAllResources();
  console.log(`   ✓ ${allResources.length} resources loaded`);

  // Step 2: 加载 star snapshot（可选，用于排序优化）  
  console.log("\n⭐ Loading star snapshot (optional)...");
  const snapshot = loadSnapshot();
  const hasStars = Object.keys(snapshot).length > 0;
  console.log(`   ${hasStars ? "✓" : "⚠️ "} Snapshot: ${Object.keys(snapshot).length} entries`);

  // 把 snapshot 数据附加到资源上  
  if (hasStars) {
    for (const r of allResources) {
      const repo = extractRepoFromUrl(r.githubUrl || r.url || "");
      if (repo && snapshot[repo]) {
        r._currentStars = snapshot[repo].stars ?? 0;
      }
    }
  }

  // Step 3: 加载 alternatives 数据  
  console.log("\n🔗 Loading alternatives data...");
  const allAlternatives = loadAllAlternatives();
  console.log(`   ✓ ${allAlternatives.length} alternatives loaded`);

  // 统计每个付费工具被替代的次数  
  const paidToolCount = {};
  for (const alt of allAlternatives) {
    const paid = alt.paidTool;
    if (!paid) continue;
    paidToolCount[paid] = (paidToolCount[paid] || 0) + (alt.alternatives?.length || 1);
  }

  // ── Step 4: 生成 10 个板块 ──────────────────────────────────────────────
  console.log("\n🧱 Generating 10 homepage blocks...");
  const blocks = [];

  // 辅助：随机取 n 个  
  function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  // 辅助：按 stars 排序取前 n 个（没有 stars 则按名称排序）  
  function pickTopByStars(arr, n) {
    return [...arr]
      .sort((a, b) => {
        const sa = a._currentStars ?? a.githubStars ?? 0;
        const sb = b._currentStars ?? b.githubStars ?? 0;
        if (sb !== sa) return sb - sa;
        return (a.name || "").localeCompare(b.name || "");
      })
      .slice(0, n);
  }

  // Block 1: 🔥 Weekly Hottest（最新添加的，或按 stars 排）  
  {
    // 优先用 dateAdded 排序，没有则用 stars，都没有则随机  
    let hottest = [...allResources];
    if (hottest[0]?.dateAdded) {
      hottest.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (hasStars) {
      hottest = pickTopByStars(hottest, hottest.length);
    }
    hottest = hottest.slice(0, 8);

    blocks.push({
      id: "weekly-hottest",
      title: "🔥 This Week's Hottest",
      subtitle: hasStars
        ? `Top tools by GitHub stars (${now.toLocaleDateString()})`
        : "Fresh picks from our directory",
      type: "resource-list",
      resources: hottest.map((r) => resourceSummary(r)),
      sortOrder: 1,
    });
    console.log(`   Block 1 "Hottest": ${hottest.length} items`);
  }

  // Block 2: 💬 HN Community Favorites（暂时用 stars 最高的替代，或随机）  
  {
    // 暂时用"stars 最高的工具"代替（等 HN API 集成后再改）  
    const hnHot = hasStars
      ? pickTopByStars(allResources, 8)
      : pickRandom(allResources, 8);

    blocks.push({
      id: "hn-discussed",
      title: "💬 Community Favorites",
      subtitle: hasStars
        ? "Top tools by GitHub stars — loved by developers"
        : "Hand-picked tools our community loves",
      type: "resource-list",
      resources: hnHot.map((r) => resourceSummary(r)),
      sortOrder: 2,
    });
    console.log(`   Block 2 "Community Favorites": ${hnHot.length} items`);
  }

  // Block 3: 🆚 Most Compared（被找替代最多的付费工具）  
  {
    const mostCompared = Object.entries(paidToolCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const comparisonItems = mostCompared.map(([paidTool, count]) => {
      const alt = allAlternatives.find((a) => a.paidTool === paidTool);
      const firstAlt = alt?.alternatives?.[0];
      const freeName = firstAlt?.name || null;
      // 模糊匹配免费工具资源  
      let freeResource = null;
      if (freeName) {
        freeResource = allResources.find(
          (r) =>
            r.name?.toLowerCase().includes(freeName.toLowerCase().split(" ")[0]) ||
            freeName.toLowerCase().includes((r.name || "").toLowerCase().split(" ")[0])
        ) || null;
      }
      return {
        paidTool,
        freeAlternativeId: freeResource?.id || null,
        freeAlternativeName: freeName,
        count,
      };
    });

    blocks.push({
      id: "most-compared",
      title: "🆚 Most Compared",
      subtitle: "Paid tools people most want alternatives for",
      type: "comparison-list",
      comparisons: comparisonItems,
      sortOrder: 3,
    });
    console.log(`   Block 3 "Most Compared": ${comparisonItems.length} items`);
  }

  // Block 4: 🏆 Best Free Alternatives（替代品中 star 最高的免费工具）  
  {
    // 从 alternatives 数据中提取免费工具名称，然后匹配资源  
    const freeAltNames = new Set();
    for (const alt of allAlternatives) {
      for (const altItem of alt.alternatives || []) {
        if (altItem.name) freeAltNames.add(altItem.name);
      }
    }

    // 在资源中匹配这些名称  
    const freeAltResources = [];
    for (const name of freeAltNames) {
      const found = allResources.find(
        (r) =>
          r.name?.toLowerCase().includes(name.toLowerCase().split(" ")[0]) ||
          name.toLowerCase().includes((r.name || "").toLowerCase().split(" ")[0])
      );
      if (found && !freeAltResources.some((r) => r.id === found.id)) {
        freeAltResources.push(found);
      }
    }

    const bestFree = hasStars
      ? pickTopByStars(freeAltResources, 8)
      : freeAltResources.slice(0, 8);

    blocks.push({
      id: "best-free-alternatives",
      title: "🏆 Best Free Alternatives",
      subtitle: "Top-rated free alternatives to popular paid tools",
      type: "resource-list",
      resources: bestFree.map((r) => resourceSummary(r)),
      sortOrder: 4,
    });
    console.log(`   Block 4 "Best Free Alts": ${bestFree.length} items`);
  }

  // Block 5: ⭐ Rising Stars（随机取 8 个，或按 stars 排）  
  {
    const rising = hasStars
      ? pickTopByStars(allResources, 8)
      : pickRandom(allResources, 8);

    blocks.push({
      id: "rising-stars",
      title: "⭐ Rising Stars",
      subtitle: hasStars
        ? "Tools gaining GitHub stars fast"
        : "Tools you should check out this week",
      type: "resource-list",
      resources: rising.map((r) => resourceSummary(r)),
      sortOrder: 5,
    });
    console.log(`   Block 5 "Rising Stars": ${rising.length} items`);
  }

  // Block 6: 🤖 AI Coding Tools  
  {
    const aiTools = matchByKeywords(allResources, [
      "ai", "llm", "gpt", "claude", "cursor", "code", "copilot", "coding",
    ]).slice(0, 8);
    blocks.push({
      id: "ai-coding-tools",
      title: "🤖 AI Coding Tools",
      subtitle: "The best AI-powered developer tools",
      type: "resource-list",
      resources: aiTools.map((r) => resourceSummary(r)),
      sortOrder: 6,
    });
    console.log(`   Block 6 "AI Tools": ${aiTools.length} items`);
  }

  // Block 7: 🎨 Design & Creative  
  {
    const designTools = matchByKeywords(allResources, [
      "design", "figma", "sketch", "ui", "ux", "graphic", "photo", "video", "art",
    ]).slice(0, 8);
    blocks.push({
      id: "design-tools",
      title: "🎨 Design & Creative",
      subtitle: "Top open-source design and creative tools",
      type: "resource-list",
      resources: designTools.map((r) => resourceSummary(r)),
      sortOrder: 7,
    });
    console.log(`   Block 7 "Design": ${designTools.length} items`);
  }

  // Block 8: 📝 Productivity Picks  
  {
    const prodTools = matchByKeywords(allResources, [
      "productivity", "note", "task", "calendar", "markdown", "todo", "project", "wiki",
    ]).slice(0, 8);
    blocks.push({
      id: "productivity-tools",
      title: "📝 Productivity Picks",
      subtitle: "Tools to organize your work and life",
      type: "resource-list",
      resources: prodTools.map((r) => resourceSummary(r)),
      sortOrder: 8,
    });
    console.log(`   Block 8 "Productivity": ${prodTools.length} items`);
  }

  // Block 9: 🔧 Developer Tools  
  {
    const devTools = matchByKeywords(allResources, [
      "docker", "kubernetes", "api", "database", "self-hosted", "devops", "cli", "terminal",
    ]).slice(0, 8);
    blocks.push({
      id: "dev-tools",
      title: "🔧 Developer Tools",
      subtitle: "Self-hosted and developer-first tools",
      type: "resource-list",
      resources: devTools.map((r) => resourceSummary(r)),
      sortOrder: 9,
    });
    console.log(`   Block 9 "Dev Tools": ${devTools.length} items`);
  }

  // Block 10: 🆕 Newly Added  
  {
    let newlyAdded = [...allResources];
    if (newlyAdded[0]?.dateAdded) {
      newlyAdded.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else {
      newlyAdded = pickRandom(newlyAdded, newlyAdded.length);
    }
    newlyAdded = newlyAdded.slice(0, 8);

    blocks.push({
      id: "newly-added",
      title: "🆕 Newly Added",
      subtitle: "Fresh tools just added to Craftisle",
      type: "resource-list",
      resources: newlyAdded.map((r) => resourceSummary(r)),
      sortOrder: 10,
    });
    console.log(`   Block 10 "Newly Added": ${newlyAdded.length} items`);
  }

  // ── Step 5: 写入 home-blocks.json ────────────────────────────────────────────
  const output = {
    lastUpdated: now.toISOString(),
    totalResources: allResources.length,
    blocks: blocks.filter((b) => {
      const count = b.resources?.length || b.comparisons?.length || 0;
      return count > 0;
    }),
  };

  writeFileSync(BLOCKS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ home-blocks.json written (${output.blocks.length} blocks)`);
  console.log(`   File: ${BLOCKS_FILE}`);
}

/**
 * 从 URL 中提取 GitHub repo 路径（辅助函数）
 */
function extractRepoFromUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

main();
