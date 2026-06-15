#!/usr/bin/env node

/**
 * Update GitHub stars for resources with githubUrl
 * Reads fmhy-resources.json, fetches stars from GitHub API, writes back
 * 
 * Usage: node scripts/update-github-stars.mjs
 * Requires: GITHUB_TOKEN env variable (recommended for higher rate limit)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const CHECKPOINT_FILE = join(DATA_DIR, "github-stars-checkpoint.json");

// GitHub API token (from env or use unauthenticated with lower rate limit)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Rate limit: unauthenticated = 60 req/hour, authenticated = 5000 req/hour
const HEADERS = GITHUB_TOKEN
  ? { Authorization: `token ${GITHUB_TOKEN}`, "User-Agent": "craftisle-app" }
  : { "User-Agent": "craftisle-app" };

// Delay between requests (500ms for authenticated, 1000ms for unauthenticated)
const DELAY_MS = GITHUB_TOKEN ? 500 : 1000;

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
    
    if (resp.status === 403) {
      // Rate limited
      if (retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
        console.warn(`  ⚠️ Rate limited for ${repo}, waiting ${waitTime}ms...`);
        await new Promise((r) => setTimeout(r, waitTime));
        return fetchStars(repo, retryCount + 1);
      } else {
        console.warn(`  ⚠️ Rate limit exceeded for ${repo}, skipping...`);
        return null;
      }
    }
    
    if (resp.status === 404) {
      console.warn(`  ⚠️ Repository not found: ${repo}`);
      return null;
    }
    
    if (!resp.ok) {
      console.warn(`  ⚠️ Error fetching ${repo}: ${resp.status}`);
      return null;
    }
    
    const data = await resp.json();
    return data.stargazers_count || 0;
  } catch (err) {
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
  return { updated: 0, total: 0, lastUpdate: null };
}

function saveCheckpoint(checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function main() {
  console.log("🔄 Updating GitHub stars...\n");
  console.log(`  Using ${GITHUB_TOKEN ? "authenticated" : "unauthenticated"} mode`);
  console.log(`  Delay between requests: ${DELAY_MS}ms\n`);

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  
  // Load checkpoint
  const checkpoint = loadCheckpoint();
  
  let updated = checkpoint.updated || 0;
  let total = checkpoint.total || 0;
  let skipped = 0;
  let errors = 0;
  
  // Collect all resources with GitHub URLs
  const resourcesToUpdate = [];
  for (const [catId, catData] of Object.entries(data.categories)) {
    for (const resource of catData.resources) {
      const repo = parseGitHubUrl(resource.githubUrl || resource.url);
      if (repo) {
        resourcesToUpdate.push({ resource, repo });
      }
    }
  }
  
  console.log(`  📊 Total resources with GitHub URLs: ${resourcesToUpdate.length}\n`);
  
  // Process resources
  for (let i = total; i < resourcesToUpdate.length; i++) {
    const { resource, repo } = resourcesToUpdate[i];
    total++;
    
    // Skip if already has stars (incremental update)
    if (resource.githubStars !== undefined && resource.githubStars !== null) {
      skipped++;
      if (total % 100 === 0) {
        console.log(`  ⏭️  Skipped ${skipped} (already have stars), processed ${total}/${resourcesToUpdate.length}...`);
      }
      continue;
    }
    
    const stars = await fetchStars(repo);
    if (stars !== null) {
      resource.githubStars = stars;
      updated++;
      if (updated % 10 === 0) {
        console.log(`  ✓ ${updated} updated, ${total}/${resourcesToUpdate.length} processed...`);
      }
    } else {
      errors++;
    }
    
    // Save checkpoint every 50 resources
    if (total % 50 === 0) {
      saveCheckpoint({ updated, total, lastUpdate: new Date().toISOString() });
      
      // Also save progress to main file
      writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
    }
    
    // Rate limiting
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
  
  // Final save
  writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
  saveCheckpoint({ updated, total, lastUpdate: new Date().toISOString(), completed: true });
  
  console.log(`\n✅ Done!`);
  console.log(`   Updated: ${updated} resources with GitHub stars`);
  console.log(`   Skipped: ${skipped} (already had stars)`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total processed: ${total}/${resourcesToUpdate.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
