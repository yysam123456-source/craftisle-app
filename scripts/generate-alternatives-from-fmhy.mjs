#!/usr/bin/env node

/**
 * Generate alternatives mapping from FMHY data
 * Instead of scraping AlternativeTo (which blocks bots),
 * we analyze FMHY data to find free alternatives to popular paid tools.
 * 
 * Usage: node scripts/generate-alternatives-from-fmhy.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const OUTPUT_FILE = join(DATA_DIR, "alternatives-generated.json");

// Popular paid tools and their keywords to match in FMHY
const PAID_TOOLS = [
  { name: "Slack", keywords: ["chat", "messaging", "team communication", "collaboration"] },
  { name: "Notion", keywords: ["notes", "wiki", "knowledge base", "documentation"] },
  { name: "Evernote", keywords: ["notes", "note-taking"] },
  { name: "Zoom", keywords: ["video call", "meeting", "video conference"] },
  { name: "Trello", keywords: ["kanban", "project management", "task board"] },
  { name: "Asana", keywords: ["project management", "task management"] },
  { name: "Jira", keywords: ["issue tracking", "project management", "agile"] },
  { name: "Dropbox", keywords: ["file storage", "cloud storage", "file sync"] },
  { name: "Google Drive", keywords: ["cloud storage", "file storage"] },
  { name: "Figma", keywords: ["design", "ui", "ux", "prototyping"] },
  { name: "Adobe Creative Cloud", keywords: ["design", "photo editing", "video editing"] },
  { name: "Photoshop", keywords: ["photo editing", "image editing"] },
  { name: "VS Code", keywords: ["code editor", "ide", "development"] },
  { name: "Docker", keywords: ["container", "containerization"] },
  { name: "AWS", keywords: ["cloud", "hosting", "serverless"] },
];

async function main() {
  console.log("🔄 Generating alternatives mapping from FMHY data...\n");

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  const allResources = [];
  
  // Flatten all resources
  for (const catData of Object.values(data.categories)) {
    allResources.push(...catData.resources);
  }

  console.log(`  📊 Total resources in FMHY: ${allResources.length}\n`);

  const alternativesMap = {};

  for (const paidTool of PAID_TOOLS) {
    console.log(`  🔍 Finding alternatives for: ${paidTool.name}`);

    // Find free/open-source resources that match the keywords
    const alternatives = allResources.filter(r => {
      if (!r.isFree && !r.isOpenSource) return false;
      
      const text = `${r.name} ${r.description}`.toLowerCase();
      return paidTool.keywords.some(kw => text.includes(kw));
    });

    if (alternatives.length > 0) {
      alternativesMap[paidTool.name] = alternatives.slice(0, 10).map(r => ({
        name: r.name,
        url: r.url,
        description: r.description?.slice(0, 100) || "",
        isFree: r.isFree || false,
        isOpenSource: r.isOpenSource || false,
      }));

      console.log(`    ✓ Found ${alternatives.length} alternatives`);
    } else {
      console.log(`    ⚠ No alternatives found`);
    }
  }

  // Save to JSON file
  writeFileSync(OUTPUT_FILE, JSON.stringify(alternativesMap, null, 2));
  
  const totalAlts = Object.values(alternativesMap).reduce((sum, alts) => sum + alts.length, 0);
  console.log(`\n✅ Done! Generated ${totalAlts} alternatives for ${Object.keys(alternativesMap).length} paid tools.`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
