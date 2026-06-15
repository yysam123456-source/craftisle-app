#!/usr/bin/env node

/**
 * Scrape Awesome Lists data
 * Fetches awesome-selfhosted data from GitHub
 * 
 * Usage: node scripts/scrape-awesome-lists.mjs
 * Requires: no API key (uses raw GitHub content)
 */

import { writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const OUTPUT_FILE = join(DATA_DIR, "awesome-selfhosted-resources.json");

// Awesome-Selfhosted GitHub repo
const AWESOME_SELFHOSTED_URL = "https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md";

async function scrapeAwesomeSelfhosted() {
  console.log("🔄 Scraping Awesome-Selfhosted...\n");
  
  try {
    const resp = await fetch(AWESOME_SELFHOSTED_URL);
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    
    const markdown = await resp.text();
    console.log(`  ✓ Fetched README.md (${(markdown.length / 1024).toFixed(1)} KB)`);
    
    // Parse markdown to extract resources
    const resources = [];
    const lines = markdown.split("\n");
    
    let currentCategory = "";
    for (const line of lines) {
      // Category headings (## or ###)
      if (line.startsWith("## ") || line.startsWith("### ")) {
        currentCategory = line.replace(/^#+\s+/, "").trim();
        continue;
      }
      
      // Resource links: - [Name](url) - Description
      const match = line.match(/^-\s+\[([^\]]+)\]\(([^\)]+)\)\s*-\s*(.+)$/);
      if (match) {
        const [, name, url, description] = match;
        resources.push({
          name,
          url,
          description: description.trim(),
          category: currentCategory,
        });
      }
    }
    
    console.log(`  ✓ Parsed ${resources.length} resources`);
    
    // Save to JSON file
    const data = {
      updatedAt: new Date().toISOString(),
      count: resources.length,
      resources,
    };
    
    writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`\n✅ Done! Saved ${resources.length} resources to ${OUTPUT_FILE}`);
    
    return resources.length;
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    return 0;
  }
}

async function main() {
  await scrapeAwesomeSelfhosted();
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
