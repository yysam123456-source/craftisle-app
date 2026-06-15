#!/usr/bin/env node

/**
 * AI Content Generation Script
 * Generates structured content for resources (AI or mock mode)
 * 
 * Usage:
 *   node scripts/ai-generate-content.mjs [--mock] [--limit 50] [--all]
 * 
 * Modes:
 *   - Default: uses OpenAI API (requires OPENAI_API_KEY)
 *   - --mock: generates mock content (no API key needed)
 *   - --all: processes all resources without rich info
 *   - --limit N: only process N resources (default: 20)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const RESOURCES_FILE = join(DATA_DIR, "fmhy-resources.json");
const OUTPUT_DIR = join(DATA_DIR, "generated-content");

// Parse CLI args
const args = process.argv.slice(2);
const mockMode = args.includes("--mock");
const allMode = args.includes("--all");
const limitArg = args.find(a => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 20;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/**
 * Generate content using OpenAI API
 */
async function generateWithAI(resource) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set. Use --mock for testing.");
  }

  const prompt = `
Generate structured content for a free online tool in JSON format.

Tool: ${resource.name}
Category: ${resource.categoryName || "Unknown"}
Description: ${resource.description || "No description"}
GitHub Stars: ${resource.githubStars || "N/A"}
License: ${resource.githubLicense || "N/A"}

Output JSON with these fields:
{
  "introduction": "100-200 word introduction",
  "features": ["feature 1", "feature 2", "feature 3"],
  "useCases": ["use case 1", "use case 2", "use case 3"],
  "alternatives": [{"name": "alt 1", "reason": "reason"}],
  "pricing": {"type": "free|freemium|paid", "description": "..."},
  "pros": ["pro 1", "pro 2", "pro 3"],
  "cons": ["con 1", "con 2"],
  "quickStart": ["step 1", "step 2", "step 3"]
}

Output ONLY valid JSON, no markdown.
`;

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!resp.ok) {
    throw new Error(`OpenAI API error: ${resp.status}`);
  }

  const data = await resp.json();
  const content = JSON.parse(data.choices[0].message.content);
  
  return {
    ...content,
    generatedAt: new Date().toISOString(),
    source: "ai",
    version: 1,
  };
}

/**
 * Generate mock content (for testing without API key)
 */
function generateMockContent(resource) {
  const name = resource.name || "Tool";
  const category = resource.categoryName || "tool";
  
  return {
    introduction: `${name} is a popular free tool in the ${category} category. It provides users with a free, accessible solution that can be used directly in the browser without installation. The tool is well-regarded in the community and offers a clean, intuitive interface.`,
    features: [
      `Easy to use with intuitive interface`,
      `Free to use with no registration required`,
      `Regular updates with new features`,
      `Active community support`,
    ],
    useCases: [
      `Personal projects and prototyping`,
      `Learning and skill development`,
      `Small team collaboration`,
    ],
    alternatives: [
      { name: `${name} Alternative 1`, reason: `Similar features with different approach` },
      { name: `${name} Alternative 2`, reason: `Open source alternative` },
    ],
    pricing: {
      type: "free",
      description: `100% free to use, no credit card required`,
    },
    pros: [
      `Completely free to use`,
      `No registration required`,
      `Clean and intuitive interface`,
    ],
    cons: [
      `Limited advanced features`,
      `Requires internet connection`,
    ],
    quickStart: [
      `Visit the official website`,
      `Start using immediately in browser`,
      `Check documentation for advanced tips`,
    ],
    generatedAt: new Date().toISOString(),
    source: "fmhy",
    version: 1,
  };
}

/**
 * Main function
 */
async function main() {
  console.log("🔄 Generating AI content for resources...\n");
  console.log(`  Mode: ${mockMode ? "MOCK (no API key needed)" : "AI (requires OPENAI_API_KEY)"}`);
  console.log(`  Limit: ${limit} resources\n`);

  if (!existsSync(RESOURCES_FILE)) {
    console.error("❌ fmhy-resources.json not found. Run sync-fmhy first.");
    process.exit(1);
  }

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const data = JSON.parse(readFileSync(RESOURCES_FILE, "utf-8"));
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  // Collect all resources
  const allResources = [];
  for (const [catId, catData] of Object.entries(data.categories)) {
    for (const resource of catData.resources) {
      allResources.push(resource);
    }
  }

  // Filter: only process resources without generated content
  const toProcess = allResources.filter(resource => {
    const outputPath = join(OUTPUT_DIR, `${resource.id}.json`);
    if (existsSync(outputPath)) {
      skipped++;
      return false;
    }
    return true;
  });

  console.log(`  Total resources: ${allResources.length}`);
  console.log(`  Already have content: ${skipped}`);
  console.log(`  To process: ${Math.min(toProcess.length, limit)}\n`);

  // Process limited number
  const batch = toProcess.slice(0, limit);

  for (const resource of batch) {
    try {
      console.log(`  Generating: ${resource.name}...`);
        
      let content;
      if (mockMode) {
        content = generateMockContent(resource);
      } else {
        content = await generateWithAI(resource);
      }
        
      // Save to file
      const outputPath = join(OUTPUT_DIR, `${resource.id}.json`);
      writeFileSync(outputPath, JSON.stringify(content, null, 2));
        
      processed++;
      console.log(`    ✓ Saved to ${outputPath}`);
        
      // Rate limit: 500ms between requests (for AI mode)
      if (!mockMode) {
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      errors++;
      console.warn(`    ⚠ Error: ${err.message}`);
    }
  }

  console.log(`\n✅ Done!`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
