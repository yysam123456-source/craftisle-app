#!/usr/bin/env node

/**
 * Update AlternativeTo data
 * Scrapes AlternativeTo for alternative recommendations
 * Merges into public/data/alternatives.json
 * 
 * Usage: node scripts/update-alternativeto.mjs
 * Requires: no API key (uses web scraping with cheerio)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const OUTPUT_FILE = join(DATA_DIR, "alternatives.json");

// Paid tools to track (from lib/alternatives.ts ALTERNATIVES_MAP keys)
const PAID_TOOLS = [
  "Slack", "Notion", "Evernote", "Zoom", "Trello",
  "Asana", "Jira", "Monday.com", "Salesforce", "HubSpot",
  "Dropbox", "Google Drive", "Figma", "Adobe Creative Cloud",
  "Microsoft Office", "Photoshop", "Illustrator", "VS Code",
  "IntelliJ IDEA", "Docker", "AWS", "Firebase",
];

/**
 * Scrape AlternativeTo for a paid tool
 * Fetches the "/about/" page which lists alternatives
 */
async function scrapeAlternatives(paidToolName) {
  const slug = paidToolName.toLowerCase().replace(/\s+/g, "-");
  const url = `https://alternativeto.com/${slug}/about/`;
  
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CraftisleBot/1.0)",
        "Accept": "text/html",
      },
    });
      
    if (!resp.ok) {
      console.warn(`  ⚠ ${paidToolName}: HTTP ${resp.status}`);
      return [];
    }
      
    const html = await resp.text();
    const $ = cheerio.load(html);
      
    const alternatives = [];
      
    // AlternativeTo's HTML structure:
    // - App cards are in <a> tags with href="/app-name/"
    // - App names are in headings or text
    // We look for app links in the "Alternatives" section
      
    $('a[href*="/"]').each((i, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/^\/([^/]+)\/$/);
      if (!match) return;
        
      const altSlug = match[1];
      // Skip non-app pages
      if (["about", "reviews", "comments", "features"].includes(altSlug)) return;
        
      const text = $(el).text().trim();
      if (text.length < 2 || text.length > 50) return;
        
      if (!alternatives.find(a => a.slug === altSlug)) {
        alternatives.push({
          slug: altSlug,
          name: text,
        });
      }
    });
      
    // Limit to top 10
    return alternatives.slice(0, 10);
      
  } catch (err) {
    console.warn(`  ⚠ ${paidToolName}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log("🔄 Updating AlternativeTo data...\n");
    
  const result = {};
  let totalAlts = 0;
    
  for (const tool of PAID_TOOLS) {
    console.log(`  Fetching alternatives for: ${tool}`);
    const alts = await scrapeAlternatives(tool);
      
    if (alts.length > 0) {
      result[tool] = alts;
      totalAlts += alts.length;
      console.log(`    ✓ Found ${alts.length} alternatives`);
    }
      
    // Rate limiting: 2 req/sec
    await new Promise(r => setTimeout(r, 500));
  }
    
  // Save to JSON file
  writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`\n✅ Done! Saved ${totalAlts} alternatives for ${Object.keys(result).length} paid tools to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
