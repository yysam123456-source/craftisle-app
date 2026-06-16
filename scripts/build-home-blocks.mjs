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

// ── 判断资源是否合法（过滤垃圾数据）────────────────────────────────────
function isGoodResource(r) {
  const n = r?.name || "";
  if (n.length < 2) return false;
  if (n.startsWith("◄") || /Back to Wiki/i.test(n)) return false;
  if (/^[=\-—_]{2,}$/.test(n)) return false;
  if (/^\s*$/.test(n)) return false;
  // 过滤 FMHY 的导航条目（如 "◄◄ Back to Wiki Index"）
  if (/wiki\s*index/i.test(n)) return false;
  if (/^===/.test(n)) return false;
  return true;
}

// ── 加载资源 ───────────────────────────────────────────────────────────────────
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
              if (!isGoodResource(r)) continue;
              items.push({ ...r, _categoryName: catName, categoryName: catName });
            }
          }
        }
      } else {
        // 其他文件：顶层 resources 数组  
        items = (data.resources || []).filter(isGoodResource);
      }

      for (const r of items) {
        r._sourceFile = f;
        resources.push(r);
      }
      console.log(`   ✓ ${f}: ${items.length} resources (after filter)`);
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
function cleanDescription(desc) {
  if (!desc) return "";
  let cleaned = desc.replace(/^\*\*\s*-\s*/, "").trim();
  cleaned = cleaned.replace(/\s*\/\s*\[[^\]]+\]\([^)]+\)\s*/g, " ");
  cleaned = cleaned.replace(/\s{2,}/g, " ").trim();
  if (cleaned.length < 3) return desc.slice(0, 100);  // 清理后太短，保留原始前100字
  return cleaned;
}

function resourceSummary(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    description: cleanDescription(r.description),
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

// ── 按关键词匹配资源（改进版：要求关键词在 name 中，或 tags/category 中至少匹配2个）───
function matchByKeywords(resources, keywords) {
  const lowerKeywords = keywords.map((k) => k.toLowerCase());
  return resources.filter((r) => {
    const nameText = (r.name || "").toLowerCase();
    const tagsText = (r.tags || []).join(" ").toLowerCase();
    const catText = (r.categoryName || "").toLowerCase();
    const fullText = `${nameText} ${tagsText} ${catText}`;
    
    // 至少匹配一个关键词
    const matchedKeywords = lowerKeywords.filter((k) => fullText.includes(k));
    if (matchedKeywords.length === 0) return false;
    
    // 如果有 name 匹配，直接通过；否则需要至少匹配2个关键词
    const nameMatch = lowerKeywords.some((k) => nameText.includes(k));
    if (nameMatch) return true;
    return matchedKeywords.length >= 2;
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
  const usedIds = new Set(); // 跟踪已使用的资源 ID，避免跨 block 重复

  // 辅助：过滤掉已使用的资源
  function excludeUsed(arr) {
    return arr.filter((r) => !usedIds.has(r.id));
  }

  // 辅助：记录使用的资源 ID
  function markUsed(arr) {
    arr.forEach((r) => usedIds.add(r.id));
  }

  // 辅助：随机取 n 个  
  function pickRandom(arr, n) {
    const filtered = excludeUsed(arr);
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  // 辅助：按 stars 排序取前 n 个（没有 stars 则按名称排序）
  function pickTopByStars(arr, n) {
    const filtered = excludeUsed(arr);
    return [...filtered]
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
    let hottest = excludeUsed(allResources);
    if (hottest[0]?.dateAdded) {
      hottest.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (hasStars) {
      hottest = pickTopByStars(allResources, hottest.length);
    }
    hottest = hottest.slice(0, 8);
    markUsed(hottest);

    blocks.push({
      id: "weekly-hottest",
      title: "🔥 This Week's Hottest",
      subtitle: hasStars
        ? `Top tools by GitHub stars (${now.toLocaleDateString()})`
        : "Fresh picks from our directory",
      type: "resource-list",
      resources: hottest.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/weekly-hottest",
      sortOrder: 1,
    });
    console.log(`   Block 1 "Hottest": ${hottest.length} items`);
  }

  // Block 2: 🆚 Most Compared（被找替代最多的付费工具）  
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
      viewAllLink: "/directory/compare",
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

    // 在资源中匹配这些名称（排除已使用的）
    const freeAltResources = [];
    for (const name of freeAltNames) {
      const found = excludeUsed(allResources).find(
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
    markUsed(bestFree);

    blocks.push({
      id: "best-free-alternatives",
      title: "🏆 Best Free Alternatives",
      subtitle: "Top-rated free alternatives to popular paid tools",
      type: "resource-list",
      resources: bestFree.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/best-free-alternatives",
      sortOrder: 4,
    });
    console.log(`   Block 4 "Best Free Alts": ${bestFree.length} items`);
  }

  // Block 5: ⭐ Rising Stars（排除已使用的，或按 stars 排）  
  {
    const rising = hasStars
      ? pickTopByStars(allResources, 8)
      : pickRandom(allResources, 8);
    markUsed(rising);

    blocks.push({
      id: "rising-stars",
      title: "⭐ Rising Stars",
      subtitle: hasStars
        ? "Tools gaining GitHub stars fast"
        : "Tools you should check out this week",
      type: "resource-list",
      resources: rising.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/rising-stars",
      sortOrder: 5,
    });
    console.log(`   Block 5 "Rising Stars": ${rising.length} items`);
  }

  // Block 6: 🤖 AI Coding Tools  
  {
    const aiTools = matchByKeywords(excludeUsed(allResources), [
      "ai", "llm", "gpt", "claude", "cursor", "code", "copilot", "coding",
    ]).slice(0, 8);
    markUsed(aiTools);
    blocks.push({
      id: "ai-coding-tools",
      title: "🤖 AI Coding Tools",
      subtitle: "The best AI-powered developer tools",
      type: "resource-list",
      resources: aiTools.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/ai-coding-tools",
      sortOrder: 6,
    });
    console.log(`   Block 6 "AI Tools": ${aiTools.length} items`);
  }

  // Block 7: 🎨 Design & Creative  
  {
    // FMHY 数据里传统设计工具太少，直接用常见开源设计工具列表
    const knownDesignTools = [
      "Figma", "Sketch", "Adobe XD", "Inkscape", "GIMP", "Krita", "Blender", "Penpot", "Gravit Designer", "Canva",
      "Scribus", "Darktable", "RawTherapee", "Invision", "Marvel", "Framer", "Principle", "Origami", "Figma Community", "Coolors",
      "Paletton", "Material Design", "Ant Design", "Bootstrap", "Tailwind CSS", "DaisyUI", "Heroicons", "Feather Icons", "Unsplash", "Pexels",
    ];
    
    // 在 allResources 中模糊匹配这些名称（排除已使用的）
    let designTools = [];
    for (const name of knownDesignTools) {
      const found = excludeUsed(allResources).find((r) => (r.name || "").toLowerCase().includes(name.toLowerCase()));
      if (found && !designTools.some(d => d.id === found.id)) {
        designTools.push(found);
      }
    }
    
    // 如果匹配太少，fallback 到关键词匹配（但排除 AI 工具）
    if (designTools.length < 4) {
      const fallback = excludeUsed(allResources).filter((r) => {
        const n = (r.name || "").toLowerCase();
        const c = (r.categoryName || "").toLowerCase();
        const hasDesign = n.includes("design") || n.includes("figma") || n.includes("sketch") || c.includes("design") || c.includes("graphic");
        const isAI = n.includes("ai") || n.includes("gpt") || n.includes("llm") || n.includes("video") || n.includes("comfy");
        return hasDesign && !isAI;
      }).slice(0, 8);
      designTools.push(...fallback.filter(f => !designTools.some(d => d.id === f.id)));
    }
    
    designTools = designTools.slice(0, 8);
    markUsed(designTools);
    
    blocks.push({
      id: "design-tools",
      title: "🎨 Design & Creative",
      subtitle: "Top open-source design and creative tools",
      type: "resource-list",
      resources: designTools.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/design-tools",
      sortOrder: 7,
    });
    console.log(`   Block 7 "Design": ${designTools.length} items`);
  }

  // Block 8: 📝 Productivity Picks  
  {
    const prodTools = matchByKeywords(excludeUsed(allResources), [
      "productivity", "note", "task", "calendar", "markdown", "todo", "project", "wiki",
    ]).slice(0, 8);
    markUsed(prodTools);
    blocks.push({
      id: "productivity-tools",
      title: "📝 Productivity Picks",
      subtitle: "Tools to organize your work and life",
      type: "resource-list",
      resources: prodTools.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/productivity-tools",
      sortOrder: 8,
    });
    console.log(`   Block 8 "Productivity": ${prodTools.length} items`);
  }

  // Block 9: 🔧 Developer Tools  
  {
    const devTools = matchByKeywords(excludeUsed(allResources), [
      "docker", "kubernetes", "api", "database", "self-hosted", "devops", "cli", "terminal",
    ]).slice(0, 8);
    markUsed(devTools);
    blocks.push({
      id: "dev-tools",
      title: "🔧 Developer Tools",
      subtitle: "Self-hosted and developer-first tools",
      type: "resource-list",
      resources: devTools.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/dev-tools",
      sortOrder: 9,
    });
    console.log(`   Block 9 "Dev Tools": ${devTools.length} items`);
  }

  // Block 10: 🆕 Newly Added  
  {
    let newlyAdded = excludeUsed(allResources);
    // 优先用 dateAdded 排序
    if (newlyAdded[0]?.dateAdded) {
      newlyAdded.sort((a, b) => {
        const da = new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
        if (da !== 0) return da;
        // dateAdded 相同时，按 id 降序（假设新添加的 id 更大）
        return (b.id || "").localeCompare(a.id || "");
      });
    } else {
      // 没有 dateAdded，按 id 降序
      newlyAdded.sort((a, b) => (b.id || "").localeCompare(a.id || ""));
    }
    newlyAdded = newlyAdded.slice(0, 8);
    markUsed(newlyAdded);

    blocks.push({
      id: "newly-added",
      title: "🆕 Newly Added",
      subtitle: "Fresh tools just added to Craftisle",
      type: "resource-list",
      resources: newlyAdded.map((r) => resourceSummary(r)),
      viewAllLink: "/directory/best/newly-added",
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
