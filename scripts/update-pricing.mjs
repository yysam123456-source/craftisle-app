#!/usr/bin/env node

/**
 * Update pricing data for resources
 * Fetches resource websites to detect pricing model
 * Outputs: public/data/pricing.json
 * 
 * Usage: node scripts/update-pricing.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const OUTPUT_FILE = join(DATA_DIR, "pricing.json");

// Common pricing keywords
const PRICING_KEYWORDS = [
  "pricing", "plans", "subscribe", "trial", "free trial",
  "get started", "sign up", "register", "pricing-plans",
];
const FREE_KEYWORDS = ["100% free", "completely free", "no credit card", "free forever"];
const PAID_KEYWORDS = ["starting at $", "from $", "/month", "/year", "paid plan"];

/**
 * Detect pricing model from website content
 */
function detectPricingModel(html, url) {
  const lower = html.toLowerCase();
  
  // Check for free indicators
  const isFree = FREE_KEYWORDS.some(kw => lower.includes(kw));
  if (isFree) return "free";
    
  // Check for paid indicators
  const isPaid = PAID_KEYWORDS.some(kw => lower.includes(kw));
  if (isPaid) return "freemium"; // Assume freemium if paid keywords found
    
  // Check for pricing page link
  const hasPricingLink = PRICING_KEYWORDS.some(kw => lower.includes(kw));
  if (hasPricingLink) return "unknown"; // Has pricing page but can't determine
    
  return "free"; // Default: assume free (it's a free resource directory)
}

/**
 * Try to fetch pricing page for a resource
 */
async function fetchPricing(resource) {
  const url = resource.url;
  if (!url) return "unknown";
    
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CraftisleBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
      
    if (!resp.ok) return "unknown";
      
    const html = await resp.text();
    const model = detectPricingModel(html, url);
      
    return model;
  } catch {
    return "unknown";
  }
}

async function main() {
  console.log("🔄 Updating pricing data...\n");
    
  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }
    
  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  const pricingData = {};
  let updated = 0;
  let total = 0;
    
  // Only process top resources (by GitHub stars or description length)
  const allResources = [];
  for (const [catId, catData] of Object.entries(data.categories)) {
    for (const resource of catData.resources) {
      allResources.push(resource);
    }
  }
    
  // Sort by "likelihood of having pricing page" (has website, not pure open source)
  const candidates = allResources
    .filter(r => r.url && !r.isOpenSource)
    .slice(0, 100); // Limit to 100 to avoid excessive requests
    
  console.log(`  Scanning ${candidates.length} resources for pricing info...\n`);
    
  for (const resource of candidates) {
    total++;
    console.log(`  Checking: ${resource.name}`);
      
    const model = await fetchPricing(resource);
    if (model !== "unknown") {
      pricingData[resource.id] = {
        resourceName: resource.name,
        pricingModel: model,
        lastChecked: new Date().toISOString(),
      };
      updated++;
    }
      
    // Rate limit: 2 req/sec
    await new Promise(r => setTimeout(r, 500));
  }
    
  writeFileSync(OUTPUT_FILE, JSON.stringify(pricingData, null, 2));
  console.log(`\n✅ Done! Updated pricing for ${updated}/${total} resources.`);
  console.log(`   Saved to: ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
