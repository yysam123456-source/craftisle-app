#!/usr/bin/env node

/**
 * Fetch tutorials for resources
 * Scrapes GitHub README, official docs, YouTube for tutorials
 * 
 * Usage: node scripts/fetch-tutorials.mjs
 * Output: public/data/tutorials.json
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const TUTORIALS_FILE = join(DATA_DIR, "tutorials.json");

// YouTube API key (optional, for better results)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

async function fetchGitHubReadme(githubUrl) {
  if (!githubUrl || !githubUrl.includes("github.com")) return null;
  
  const repo = githubUrl.replace("https://github.com/", "").replace(/\/$/, "");
  const readmeUrl = `https://raw.githubusercontent.com/${repo}/main/README.md`;
  
  try {
    const resp = await fetch(readmeUrl);
    if (!resp.ok) return null;
    const text = await resp.text();
    return {
      type: "github-readme",
      url: readmeUrl,
      title: `${repo} README`,
      description: text.slice(0, 500) + "...",
    };
  } catch {
    return null;
  }
}

async function fetchYouTubeTutorials(resourceName) {
  if (!YOUTUBE_API_KEY) return [];
  
  const query = `${resourceName} tutorial`;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`;
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.items?.slice(0, 3).map(item => ({
      type: "youtube",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.default?.url,
    })) || [];
  } catch {
    return [];
  }
}

async function main() {
  console.log("🎓 Fetching tutorials for resources...\n");
  
  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found.");
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  const tutorials = {};
  let processed = 0;
  const maxResources = 50; // Limit to first 50 resources
  
  for (const [catId, catData] of Object.entries(data.categories)) {
    for (const resource of catData.resources) {
      if (processed >= maxResources) break;
      processed++;
      
      const tutorialsList = [];
      
      // Fetch GitHub README
      const githubTutorial = await fetchGitHubReadme(resource.githubUrl || resource.url);
      if (githubTutorial) tutorialsList.push(githubTutorial);
      
      // Fetch YouTube tutorials (if API key is set)
      if (YOUTUBE_API_KEY) {
        const youtubeTutorials = await fetchYouTubeTutorials(resource.name);
        tutorialsList.push(...youtubeTutorials);
      }
      
      if (tutorialsList.length > 0) {
        tutorials[resource.id] = tutorialsList;
      }
      
      if (processed % 10 === 0) {
        console.log(`  ✓ ${processed}/${maxResources} processed...`);
      }
      
      // Rate limit: wait 500ms between requests
      await new Promise((r) => setTimeout(r, 500));
    }
    if (processed >= maxResources) break;
  }
  
  writeFileSync(TUTORIALS_FILE, JSON.stringify(tutorials, null, 2));
  console.log(`\n✅ Done! Fetched tutorials for ${Object.keys(tutorials).length} resources.`);
  console.log(`📁 Saved to ${TUTORIALS_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
