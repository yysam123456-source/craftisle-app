#!/usr/bin/env node

/**
 * Update AlternativeTo data
 * Scrapes AlternativeTo for alternative recommendations
 * Merges into lib/alternatives.ts ALTERNATIVES_MAP
 * 
 * Usage: node scripts/update-alternativeto.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");

// AlternativeTo top paid tools to track
const PAAID_TOOLS = [
  "slack",
  "notion",
  "evernote",
  "zoom",
  "trello",
  "asana",
  "jira",
  "monday",
  "salesforce",
  "hubspot",
  "dropbox",
  "googledrive",
  "figma",
  "adobe-creative-cloud",
  "microsoft-office",
];

async function scrapeAlternatives(paidToolSlug) {
  const url = `https://alternativeto.com/${paidToolSlug}/about/`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CraftisleBot/1.0)" },
    });
    if (!resp.ok) return [];
    
    const html = await resp.text();
    // Extract alternative names from HTML (simple regex, may need updating)
    const matches = [...html.matchAll(/<a[^>]+href="\/([^"]+)\/"[^>]*>([^<]+)<\/a>/g)];
    return matches.slice(0, 10).map((m) => ({
      slug: m[1],
      name: m[2],
    }));
  } catch {
    return [];
  }
}

async function main() {
  console.log("🔄 Updating AlternativeTo data...\n");
  
  // This script updates the alternatives data
  // For now, just log that it ran (full implementation requires HTML parsing)
  console.log("  ℹ️ AlternativeTo scraper: needs HTML parser (cheerio)");
  console.log("  ℹ️ For now, alternatives data is maintained manually in lib/alternatives.ts");
  console.log("\n✅ Done (no-op).");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
