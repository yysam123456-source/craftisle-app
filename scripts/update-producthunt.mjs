#!/usr/bin/env node

/**
 * Update Product Hunt data
 * Fetches daily top products from Product Hunt API
 * Filters for free/Open Source tools, merges into fmhy-resources.json
 * 
 * Usage: node scripts/update-producthunt.mjs
 * Requires: PRODUCTHUNT_API_KEY env variable
 */

import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readJsonSafe, writeJsonAtomic } from "./lib/data-io.mjs";

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

  // ⚠️ 这里曾与 sync-fmhy 一样是裸 JSON.parse —— 两个 job 读同一文件、都无 try/catch，
  // 文件一坏就双双失败，连带 push-all 被 skipped，整条日更管道停摆。
  // 现在：读坏则**跳过本次 ProductHunt 合并并正常退出**（不写坏文件、不 fail 掉整个 pipeline），
  // 等 sync-fmhy 全量重建出合法文件后，下一次运行自然恢复。
  const read = readJsonSafe(RESOURCES_FILE);
  if (!read.ok) {
    console.warn(
      `⚠️ fmhy-resources.json 不可用（${read.reason}）→ 本次跳过 ProductHunt 合并，` +
        `等 sync-fmhy 重建后自动恢复。`
    );
    return;
  }
  const data = read.data;
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

  writeJsonAtomic(RESOURCES_FILE, data);
  console.log(`\n✅ Done! Added ${added} new products from Product Hunt.`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
