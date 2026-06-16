#!/usr/bin/env node

/**
 * Update GitHub stars for resources with githubUrl
 * ⭐ 增量更新：只更新最近变更的资源 + checkpoint 续跑
 * ⭐ 每次只跑一批（防止超时），下次从上次断点继续
 * 
 * Usage: node scripts/update-github-stars.mjs
 * Requires: GITHUB_TOKEN env variable (recommended for higher rate limit)
 * Cron: 每次只处理 BATCH_SIZE 个，多次运行覆盖全部
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const CHECKPOINT_FILE = join(DATA_DIR, "github-stars-checkpoint.json");

// GitHub API token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// ⭐ 每次只处理这么多资源（防止 GitHub Actions 超时）
// GitHub Actions timeout-minutes: 30，按 500ms/个 算，约能处理 3600 个
// 保守一点，每次处理 2000 个
const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 2000;

// Authenticated: 5000 req/hour → ~1.4 req/s → 700ms delay safe
// Unauthenticated: 60 req/hour → ~0.017 req/s → 60000ms delay
const DELAY_MS = GITHUB_TOKEN ? 700 : 60000;

const HEADERS = GITHUB_TOKEN
  ? { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "craftisle-app" }
  : { "User-Agent": "craftisle-app" };

function parseGitHubUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

async function fetchStars(repo, retryCount = 0) {
  const url = `https://api.github.com/repos/${repo}`;
  try {
    const resp = await fetch(url, { headers: HEADERS });
    
    // Rate limited — wait and retry
    if (resp.status === 403) {
      if (retryCount < 5) {
        const resetTime = parseInt(resp.headers.get("x-ratelimit-reset") || "0") * 1000;
        const waitMs = Math.max(resetTime - Date.now(), 60000); // at least 60s
        console.warn(`  ⚠️ Rate limited for ${repo}, waiting ${Math.round(waitMs/1000)}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        return fetchStars(repo, retryCount + 1);
      } else {
        console.warn(`  ⚠️ Rate limit exceeded for ${repo}, skipping...`);
        return null;
      }
    }
    
    if (resp.status === 404) {
      return null; // repo not found, skip permanently
    }
    
    if (!resp.ok) {
      console.warn(`  ⚠️ Error fetching ${repo}: ${resp.status}`);
      return null;
    }
    
    const data = await resp.json();
    return data.stargazers_count || 0;
  } catch (err) {
    if (retryCount < 3) {
      await new Promise((r) => setTimeout(r, 2000));
      return fetchStars(repo, retryCount + 1);
    }
    console.warn(`  ⚠️ Error fetching ${repo}: ${err.message}`);
    return null;
  }
}

function loadCheckpoint() {
  try {
    if (existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf-8"));
    }
  } catch {
    // Ignore errors
  }
  return { 
    updated: 0, 
    total: 0, 
    lastUpdate: null,
    completed: false,
    // ⭐ 新增：记录上次处理到的索引位置
    currentIndex: 0,
    // ⭐ 新增：记录总资源数（用于判断是否需要重新扫描）
    totalWithGitHubUrl: 0,
  };
}

function saveCheckpoint(checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function main() {
  console.log("🔄 Updating GitHub stars (incremental + batch)...\n");
  console.log(`  Batch size: ${BATCH_SIZE}`);
  console.log(`  Delay: ${DELAY_MS}ms between requests`);
  console.log(`  Using ${GITHUB_TOKEN ? "authenticated (5000 req/h)" : "unauthenticated (60 req/h)"} mode\n`);

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  
  // Collect all resources with GitHub URLs
  const resourcesToUpdate = [];
  for (const [catId, catData] of Object.entries(data.categories)) {
    if (!catData || !Array.isArray(catData.resources)) continue;
    for (const resource of catData.resources) {
      const repo = parseGitHubUrl(resource.githubUrl || resource.url);
      if (repo) {
        resourcesToUpdate.push({ resource, repo });
      }
    }
  }
  
  console.log(`  📊 Total resources with GitHub URLs: ${resourcesToUpdate.length}\n`);
  
  // Load checkpoint
  const checkpoint = loadCheckpoint();
  
  // ⭐ 如果总资源数变了（新增了资源），从头开始
  let startIndex = 0;
  if (checkpoint.totalWithGitHubUrl === resourcesToUpdate.length) {
    startIndex = checkpoint.currentIndex || 0;
    console.log(`  📍 Resuming from index ${startIndex} (checkpoint)\n`);
  } else {
    console.log(`  🔄 Total count changed, starting from beginning\n`);
    checkpoint.updated = 0;
    checkpoint.total = 0;
    checkpoint.currentIndex = 0;
  }
  
  let updated = checkpoint.updated || 0;
  let processed = startIndex;
  let skipped = 0;
  let errors = 0;
  
  // ⭐ 只处理 BATCH_SIZE 个（防止超时）
  const endIndex = Math.min(startIndex + BATCH_SIZE, resourcesToUpdate.length);
  
  console.log(`  🔨 Processing indices ${startIndex} ~ ${endIndex - 1} (of ${resourcesToUpdate.length} total)...\n`);
  
  for (let i = startIndex; i < endIndex; i++) {
    const { resource, repo } = resourcesToUpdate[i];
    processed = i + 1;
    
    // Skip if already has stars (incremental update)
    if (resource.githubStars !== undefined && resource.githubStars !== null) {
      skipped++;
      continue;
    }
    
    const stars = await fetchStars(repo);
    if (stars !== null) {
      resource.githubStars = stars;
      updated++;
      if (updated % 50 === 0) {
        console.log(`  ✓ ${updated} updated, ${processed}/${resourcesToUpdate.length} processed...`);
      }
    } else {
      // ⭐ 即使获取失败也设置一个标记，避免下次重复请求同一个 404 repo
      resource.githubStars = 0;
      errors++;
    }
    
    // Save checkpoint every 100 resources
    if (processed % 100 === 0) {
      saveCheckpoint({ 
        ...checkpoint, 
        updated, 
        total: processed, 
        currentIndex: processed,
        lastUpdate: new Date().toISOString(),
        totalWithGitHubUrl: resourcesToUpdate.length,
      });
      
      // Also save progress to main file
      writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
      console.log(`  💾 Checkpoint saved at index ${processed}/${resourcesToUpdate.length}`);
    }
    
    // Rate limiting
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  
  // Final save
  writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
  const isComplete = endIndex >= resourcesToUpdate.length;
  saveCheckpoint({ 
    updated, 
    total: processed, 
    currentIndex: processed,
    lastUpdate: new Date().toISOString(),
    totalWithGitHubUrl: resourcesToUpdate.length,
    completed: isComplete,
  });
  
  console.log(`\n${isComplete ? "✅ Complete!" : "⏭️ Batch complete, will resume next run"}`);
  console.log(`   Updated: ${updated} resources with GitHub stars`);
  console.log(`   Skipped: ${skipped} (already had stars)`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Progress: ${processed}/${resourcesToUpdate.length}`);
  if (!isComplete) {
    console.log(`   ▶️  Next run will resume from index ${processed}`);
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
