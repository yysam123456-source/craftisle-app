#!/usr/bin/env node
/**
 * build-home-blocks.mjs
 * 动态生成 Directory 首页的 10 个内容板块
 *
 * 数据来源（免费）：
 *   1. GitHub API        — star 数 & 上周 snapshot 对比得出 velocity
 *   2. HN Algolia API    — 过去 7 天工具被提及次数（完全免费，无需 token）
 *   3. alternatives*.json  — 付费工具替代关系（已有数据）
 *   4. fmhy-*-resources.json — 现有资源全量数据
 *
 * 输出：public/data/home-blocks.json
 * Cron：每周一 09:00（由 Vercel Cron 或 GitHub Actions 触发）
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const SNAPSHOT_FILE = join(DATA_DIR, "star-snapshot.json");
const BLOCKS_FILE = join(DATA_DIR, "home-blocks.json");

// ── GitHub API ───────────────────────────────────────────────────────────────────
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const GH_HEADERS = GITHUB_TOKEN
  ? { Authorization: `Bearer ${GITHUB_TOKEN}`, "User-Agent": "craftisle-app" }
  : { "User-Agent": "craftisle-app" };
const GH_DELAY_MS = GITHUB_TOKEN ? 200 : 1000; // 认证后更快

function parseGitHubUrl(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("github.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch { return null; }
}

async function fetchStars(repo, retries = 0) {
  try {
    const resp = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: GH_HEADERS,
    });
    if (resp.status === 403 && retries < 3) {
      const wait = Math.pow(2, retries) * 1000;
      console.warn(`  ⚠️  429 for ${repo}, retry in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
      return fetchStars(repo, retries + 1);
    }
    if (!resp.ok) return null;
    const data = await resp.json();
    return {
      stars: data.stargazers_count ?? 0,
      updated: data.updated_at ?? null,
    };
  } catch {
    return null;
  }
}

// ── HN Algolia API（免费，无需 token）───────────────────────────────────────────
async function fetchHNMentions(toolName, sinceUnix) {
  try {
    const q = encodeURIComponent(toolName);
    const url = `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&numericFilters=created_at_i>${sinceUnix}&hitsPerPage=20`;
    const resp = await fetch(url);
    if (!resp.ok) return 0;
    const data = await resp.json();
    return data.nbHits ?? 0;
  } catch {
    return 0;
  }
}

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

// ── Star Snapshot ────────────────────────────────────────────────────────────────
function loadSnapshot() {
  if (!existsSync(SNAPSHOT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(SNAPSHOT_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveSnapshot(snapshot) {
  writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
}

// ── 主逻辑 ──────────────────────────────────────────────────────────────────────
async function main() {
  const now = new Date();
  const oneWeekAgo = Math.floor(
    (Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000
  );

  console.log("📦 Loading all resources...");
  const allResources = loadAllResources();
  console.log(`   ✓ ${allResources.length} resources loaded`);

  // ── Step 1: 更新 GitHub Stars（仅更新有 githubUrl 的资源）──────────────────
  console.log("\n🔄 Updating GitHub stars...");
  const snapshot = loadSnapshot();
  const updatedSnapshot = {};

  // 只更新星星数 > 0 或上次有记录的工具（限制 API 调用次数）
  const needsUpdate = allResources.filter((r) => {
    const repo = parseGitHubUrl(r.githubUrl || r.url || "");
    if (!repo) return false;
    // 已有 stars 的，或者上次 snapshot 有记录的
    return (r.githubStars && r.githubStars > 0) || snapshot[repo];
  });

  console.log(`   Need to update: ${needsUpdate.length} repos`);

  for (const r of needsUpdate) {
    const repo = parseGitHubUrl(r.githubUrl || r.url || "");
    if (!repo) continue;
    const result = await fetchStars(repo);
    if (result) {
      r._currentStars = result.stars;
      r._lastUpdated = result.updated;
      updatedSnapshot[repo] = {
        stars: result.stars,
        timestamp: now.toISOString(),
      };
    } else {
      // 保留上次 snapshot
      if (snapshot[repo]) updatedSnapshot[repo] = snapshot[repo];
    }
    // 限速
    await new Promise((r) => setTimeout(r, GH_DELAY_MS));
  }

  // 把不需要更新的也从旧 snapshot 保留下来
  for (const [repo, val] of Object.entries(snapshot)) {
    if (!updatedSnapshot[repo]) updatedSnapshot[repo] = val;
  }
  saveSnapshot(updatedSnapshot);

  // ── Step 2: 计算 star velocity ──────────────────────────────────────────────
  // velocity = currentStars - stars from snapshot 2 weeks ago
  // （我们存的是上周的，所以直接用）
  // 如果没有上周数据，velocity = 0
  for (const r of allResources) {
    const repo = parseGitHubUrl(r.githubUrl || r.url || "");
    if (!repo) {
      r._velocity = 0;
      continue;
    }
    const current = r._currentStars ?? r.githubStars ?? 0;
    // 找上周的 snapshot（如果有的话）
    const lastWeek = snapshot[repo]?.stars ?? r.githubStars ?? 0;
    r._velocity = current - lastWeek;
    r._currentStars = current || r.githubStars || 0;
  }

  // ── Step 3: 获取 HN 提及次数（Top 50 工具）────────────────────────────────
  console.log("\n💬 Fetching HN mentions (top 50 by stars)...");
  const topByStars = [...allResources]
    .filter((r) => (r._currentStars ?? r.githubStars ?? 0) > 100)
    .sort((a, b) => (b._currentStars ?? 0) - (a._currentStars ?? 0))
    .slice(0, 50);

  for (const r of topByStars) {
    const mentions = await fetchHNMentions(r.name, oneWeekAgo);
    r._hnMentions = mentions;
    if (mentions > 0) {
      console.log(`   ${r.name}: ${mentions} HN mentions`);
    }
    await new Promise((r) => setTimeout(r, 300)); // 限速 HN API
  }

  // ── Step 4: 加载 alternatives 数据 ──────────────────────────────────────────
  console.log("\n🔗 Loading alternatives data...");
  const allAlternatives = loadAllAlternatives();
  console.log(`   ✓ ${allAlternatives.length} alternatives loaded`);

  // 统计每个付费工具被替代的次数
  const paidToolCount = {};
  for (const alt of allAlternatives) {
    const paid = alt.paidTool;
    if (!paid) continue;
    paidToolCount[paid] = (paidToolCount[paid] || 0) + (alt.freeAlternatives?.length || 1);
  }

  // ── Step 5: 生成 10 个板块 ─────────────────────────────────────────────────
  console.log("\n🧱 Generating 10 homepage blocks...");
  const blocks = [];

  // 辅助：查找资源 by name
  function findResource(name) {
    if (!name) return null;
    return (
      allResources.find(
        (r) => r.name?.toLowerCase() === name.toLowerCase()
      ) || null
    );
  }

  // Block 1: 🔥 This Week's Hottest（优先 velocity，没有则用 githubStars 排序）
  {
    const hottest = [...allResources]
      .filter((r) => {
        const s = r._currentStars ?? r.githubStars ?? 0;
        // 有 velocity 的优先，没有的按 stars 排
        return r._velocity > 0 || s > 0;
      })
      .sort((a, b) => {
        // 先按 velocity 排，再看 stars
        const va = a._velocity ?? 0;
        const vb = b._velocity ?? 0;
        if (va !== vb) return vb - va;
        return (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0);
      })
      .slice(0, 8);
    // 如果还是空的，就用 AI/tools 相关关键词兜底
    const finalHottest = hottest.length > 0 ? hottest :
      [...allResources]
        .filter((r) => {
          const text = `${r.name} ${(r.tags || []).join(" ")}`.toLowerCase();
          return ["ai", "llm", "code", "dev", "star"].some((k) => text.includes(k));
        })
        .slice(0, 8);
    blocks.push({
      id: "weekly-hottest",
      title: "🔥 This Week's Hottest",
      subtitle: `Based on GitHub activity (${now.toLocaleDateString()})`,
      type: "resource-list",
      resources: finalHottest.map((r) => resourceSummary(r)),
      sortOrder: 1,
    });
    console.log(`   Block 1 "Hottest": ${finalHottest.length} items`);
  }

  // Block 2: 💬 Most Discussed on HN
  {
    const hnHot = [...allResources]
      .filter((r) => (r._hnMentions ?? 0) > 0)
      .sort((a, b) => (b._hnMentions ?? 0) - (a._hnMentions ?? 0))
      .slice(0, 8);
    blocks.push({
      id: "hn-discussed",
      title: "💬 HN Community Favorites",
      subtitle: "Most mentioned on Hacker News this week",
      type: "resource-list",
      resourceIds: hnHot.map((r) => r.id),
      sortOrder: 2,
    });
    console.log(`   Block 2 "HN": ${hnHot.length} items`);
  }

  // Block 3: 🆚 Most Compared（被找替代最多的付费工具）
  {
    const mostCompared = Object.entries(paidToolCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const comparisonItems = mostCompared.map(([paidTool, count]) => {
      const alt = allAlternatives.find((a) => a.paidTool === paidTool);
      const freeName = alt?.freeAlternatives?.[0] || null;
      const freeResource = freeName ? findResource(freeName) : null;
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
    const freeAltResources = [];
    for (const alt of allAlternatives) {
      const freeName = alt.freeAlternatives?.[0];
      if (!freeName) continue;
      // 模糊匹配：忽略大小写，忽略特殊字符
      const findR = allResources.find((r) =>
        r.name?.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        freeName.toLowerCase().replace(/[^a-z0-9]/g, "")
      ) || allResources.find((r) =>
        r.name?.toLowerCase().includes(freeName.toLowerCase().split(" ")[0])
      );
      if (findR) freeAltResources.push(findR);
    }
    // 去重
    const seen2 = new Set();
    const uniqueFree = freeAltResources.filter((r) => {
      if (seen2.has(r.id)) return false;
      seen2.add(r.id);
      return true;
    });
    const bestFree = uniqueFree
      .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
      .slice(0, 8);
    // 兜底：如果还是空的，直接取 isFree 的资源按 stars 排
    const finalBestFree = bestFree.length > 0 ? bestFree :
      [...allResources]
        .filter((r) => r.isFree)
        .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
        .slice(0, 8);
    blocks.push({
      id: "best-free-alternatives",
      title: "🏆 Best Free Alternatives",
      subtitle: "Top-rated free alternatives to popular paid tools",
      type: "resource-list",
      resources: finalBestFree.map((r) => resourceSummary(r)),
      sortOrder: 4,
    });
    console.log(`   Block 4 "Best Free Alts": ${finalBestFree.length} items`);
  }

  // Block 5: ⭐ Rising Stars（star 数 500~50000 之间，velocity 最高）
  {
    const rising = [...allResources]
      .filter((r) => {
        const s = r._currentStars ?? r.githubStars ?? 0;
        return s >= 500 && s <= 50000 && r._velocity > 0;
      })
      .sort((a, b) => b._velocity - a._velocity)
      .slice(0, 8);
    blocks.push({
      id: "rising-stars",
      title: "⭐ Rising Stars",
      subtitle: "High-growth open-source tools to watch",
      type: "resource-list",
      resourceIds: rising.map((r) => r.id),
      sortOrder: 5,
    });
    console.log(`   Block 5 "Rising Stars": ${rising.length} items`);
  }

  // Block 6: 🤖 AI Coding Tools（关键词匹配 + 按 stars 排序）
  {
    const aiKeywords = [
      "ai", "llm", "gpt", "claude", "cursor", "copilot", "code",
      "coding", "agent", "chatgpt", "openai", "anthropic", "deepseek",
      "windsurf", "devin", "aider", "continue", "cody", "tabnine",
    ];
    const aiTools = allResources.filter((r) => {
      const text = `${r.name} ${(r.tags || []).join(" ")} ${(r.categoryName || "")}`.toLowerCase();
      return aiKeywords.some((kw) => text.includes(kw));
    });
    const topAI = aiTools
      .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
      .slice(0, 8);
    blocks.push({
      id: "ai-coding-tools",
      title: "🤖 AI Coding Tools",
      subtitle: "The best AI-powered developer tools, ranked by community",
      type: "resource-list",
      resourceIds: topAI.map((r) => r.id),
      sortOrder: 6,
    });
    console.log(`   Block 6 "AI Tools": ${topAI.length} items`);
  }

  // Block 7: 🎨 Design & Creative Tools
  {
    const designKeywords = [
      "design", "ui", "ux", "figma", "sketch", "paint", "draw",
      "illustration", "graphic", "vector", "photo", "image", "video edit",
      "animation", "3d", "blender", "photoshop", "canva",
    ];
    const designTools = allResources.filter((r) => {
      const text = `${r.name} ${(r.tags || []).join(" ")} ${(r.categoryName || "")}`.toLowerCase();
      return designKeywords.some((kw) => text.includes(kw));
    });
    const topDesign = designTools
      .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
      .slice(0, 8);
    blocks.push({
      id: "design-tools",
      title: "🎨 Design & Creative",
      subtitle: "Top open-source design and creative tools",
      type: "resource-list",
      resourceIds: topDesign.map((r) => r.id),
      sortOrder: 7,
    });
    console.log(`   Block 7 "Design": ${topDesign.length} items`);
  }

  // Block 8: 📝 Productivity Tools
  {
    const prodKeywords = [
      "productivity", "note", "task", "todo", "calendar", "markdown",
      "document", "wiki", "knowledge", "notion", "obsidian", "logseq",
      "project management", "kanban", "trello", "asana", "monday",
    ];
    const prodTools = allResources.filter((r) => {
      const text = `${r.name} ${(r.tags || []).join(" ")} ${(r.categoryName || "")}`.toLowerCase();
      return prodKeywords.some((kw) => text.includes(kw));
    });
    const topProd = prodTools
      .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
      .slice(0, 8);
    blocks.push({
      id: "productivity-tools",
      title: "📝 Productivity Picks",
      subtitle: "Tools to organize your work and life",
      type: "resource-list",
      resourceIds: topProd.map((r) => r.id),
      sortOrder: 8,
    });
    console.log(`   Block 8 "Productivity": ${topProd.length} items`);
  }

  // Block 9: 🔧 Developer Tools & Self-hosted
  {
    const devKeywords = [
      "cli", "api", "database", "self-host", "docker", "kubernetes",
      "monitor", "log", "devops", "ci/cd", "pipeline", "git", "terminal",
      "shell", "bash", "zsh", "IDE", "editor", "vim", "emacs",
    ];
    const devTools = allResources.filter((r) => {
      const text = `${r.name} ${(r.tags || []).join(" ")} ${(r.categoryName || "")}`.toLowerCase();
      return devKeywords.some((kw) => text.includes(kw)) || r.isSelfHosted;
    });
    const topDev = devTools
      .sort((a, b) => (b._currentStars ?? b.githubStars ?? 0) - (a._currentStars ?? a.githubStars ?? 0))
      .slice(0, 8);
    blocks.push({
      id: "dev-tools",
      title: "🔧 Developer Tools",
      subtitle: "Self-hosted and developer-first tools",
      type: "resource-list",
      resourceIds: topDev.map((r) => r.id),
      sortOrder: 9,
    });
    console.log(`   Block 9 "Dev Tools": ${topDev.length} items`);
  }

  // Block 10: 🆕 Newly Added
  {
    const newlyAdded = [...allResources]
      .filter((r) => r.dateAdded)
      .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
      .slice(0, 8);
    blocks.push({
      id: "newly-added",
      title: "🆕 Newly Added",
      subtitle: "Fresh tools just added to Craftisle",
      type: "resource-list",
      resourceIds: newlyAdded.map((r) => r.id),
      sortOrder: 10,
    });
    console.log(`   Block 10 "Newly Added": ${newlyAdded.length} items`);
  }

  // ── Step 6: 写入 home-blocks.json ───────────────────────────────────────────
  // 为每个板块附加资源的简要数据（避免前端额外请求）
  function resourceSummary(r) {
    if (!r) return null;
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      url: r.url,
      category: r.category,
      categoryName: r.categoryName || r.category,
      githubStars: r._currentStars ?? r.githubStars ?? 0,
      icon: r.icon || null,
      isFree: !!r.isFree,
      isOpenSource: !!r.isOpenSource,
      tags: r.tags || [],
    };
  }

  const output = {
    lastUpdated: now.toISOString(),
    totalResources: allResources.length,
    blocks: blocks.filter((b) => {
      const count = b.resourceIds?.length || b.comparisons?.length || 0;
      return count > 0;
    }).map((b) => {
      // 附加资源数据
      if (b.resourceIds) {
        b.resources = b.resourceIds.map((id) => resourceSummary(allResources.find((r) => r.id === id))).filter(Boolean);
        delete b.resourceIds; // 前端直接用 resources
      }
      if (b.comparisons) {
        b.comparisons = b.comparisons.map((c) => ({
          ...c,
          freeResource: c.freeAlternativeId ? resourceSummary(findResource(c.freeAlternativeName)) : null,
        }));
      }
      return b;
    }),
  };
  writeFileSync(BLOCKS_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ home-blocks.json written (${output.blocks.length} blocks)`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
