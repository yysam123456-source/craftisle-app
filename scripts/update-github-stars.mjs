#!/usr/bin/env node

/**
 * Update GitHub stars for resources with githubUrl
 * Reads fmhy-resources.json, fetches stars from GitHub API, writes back
 * 
 * Usage: node scripts/update-github-stars.mjs
 * Requires: GITHUB_TOKEN env variable
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");

// GitHub API token (from env or use unauthenticated with lower rate limit)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

// Rate limit: unauthenticated = 60 req/hour, authenticated = 5000 req/hour
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
    if (resp.status === 403) {
      if (retryCount < 3) {
        const waitTime = Math.pow(2, retryCount) * 1000; // 指数退避
        console.warn(`  ⚠️ Rate limited, waiting ${waitTime}ms...`);
        await new Promise((r) => setTimeout(r, waitTime));
        return fetchStars(repo, retryCount + 1);
      } else {
        console.warn(`  ⚠️ Rate limit exceeded for ${repo}, skipping...`);
        return null;
      }
    }
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.stargazers_count || 0;
  } catch {
    return null;
  }
}

async function main() {
  console.log("🔄 Updating GitHub stars...\n");

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  let updated = 0;
  let total = 0;

  for (const [catId, catData] of Object.entries(data.categories)) {
    for (const resource of catData.resources) {
      const repo = parseGitHubUrl(resource.githubUrl || resource.url);
      if (!repo) continue;
      total++;

      const stars = await fetchStars(repo);
      if (stars !== null) {
        resource.githubStars = stars;
        updated++;
        if (updated % 10 === 0) console.log(`  ✓ ${updated}/${total} updated...`);
      }

      // Rate limit: max ~2 req/sec to be safe
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Done! Updated ${updated} resources with GitHub stars.`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
