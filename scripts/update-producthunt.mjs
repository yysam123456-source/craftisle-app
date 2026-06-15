#!/usr/bin/env node

/**
 * Update Product Hunt data
 * Fetches daily top products from Product Hunt API
 * Filters for free/Open Source tools, merges into fmhy-resources.json
 * 
 * Usage: node scripts/update-producthunt.mjs
 * Requires: PRODUCTHUNT_API_KEY env variable
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");

const PRODUCTHUNT_API_KEY = process.env.PRODUCTHUNT_API_KEY || "";

async function fetchTopProducts() {
  if (!PRODUCTHUNT_API_KEY) {
    console.log("⚠ No PRODUCTHUNT_API_KEY, skipping Product Hunt update");
    return [];
  }

  const query = `
    query {
      posts(order: VOTES, first: 20) {
        edges {
          node {
            id
            name
            tagline
            description
            url
            votesCount
            website
            thumbnail {
              url
            }
          }
        }
      }
    }
  `;

  try {
    const resp = await fetch("https://api.producthunt.com/v2/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PRODUCTHUNT_API_KEY}`,
        "User-Agent": "craftisle-app",
      },
      body: JSON.stringify({ query }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`❌ Product Hunt API error: ${resp.status}`, text);
      return [];
    }

    const data = await resp.json();
    if (data.errors) {
      console.error("❌ GraphQL errors:", data.errors);
      return [];
    }

    const posts = data.data?.posts?.edges?.map((e) => e.node) || [];
    console.log(`  ✓ Fetched ${posts.length} products from Product Hunt`);
    return posts;
  } catch (err) {
    console.error(`  ❌ Product Hunt fetch error:`, err.message);
    return [];
  }
}

function isFreeTool(product) {
  const text = `${product.name} ${product.tagline} ${product.description}`.toLowerCase();
  const paidKeywords = ["paid", "premium", "subscription", "$", "pricing"];
  const freeKeywords = ["free", "open source", "oss", "self-hosted", "github"];
  
  const hasPaid = paidKeywords.some((k) => text.includes(k));
  const hasFree = freeKeywords.some((k) => text.includes(k));
  
  // Include if explicitly free/open source, or no paid keywords
  return hasFree || !hasPaid;
}

async function main() {
  console.log("🚀 Updating Product Hunt data...\n");

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  const products = await fetchTopProducts();

  if (products.length === 0) {
    console.log("  ⚠ No products fetched, skipping update.");
    return;
  }

  let added = 0;
  const existingUrls = new Set();

  // Collect all existing URLs
  for (const catData of Object.values(data.categories)) {
    for (const r of catData.resources) {
      existingUrls.add(r.url);
    }
  }

  for (const product of products) {
    if (!isFreeTool(product)) continue;
    if (existingUrls.has(product.website || product.url)) continue;

    // Add to "Artificial-Intelligence" or "Misc" category
    const targetCat = data.categories["Artificial-Intelligence"] || data.categories["Misc"];
    if (!targetCat) continue;

    targetCat.resources.push({
      id: `ph-${product.id}`,
      category: "Artificial-Intelligence",
      categoryName: "Artificial Intelligence",
      categoryIcon: "🤖",
      name: product.name,
      url: product.website || product.url,
      description: product.tagline || product.description || "",
      dateAdded: new Date().toISOString().split("T")[0],
      source: "producthunt",
    });

    targetCat.count = targetCat.resources.length;
    added++;
  }

  writeFileSync(RESOURCES_FILE, JSON.stringify(data, null, 2));
  console.log(`\n✅ Done! Added ${added} new products from Product Hunt.`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
