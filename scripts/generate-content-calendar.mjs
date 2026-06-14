#!/usr/bin/env node

/**
 * Content Calendar Automation
 * 
 * Generates weekly content based on the content calendar strategy:
 * W1: Tool Review Blog (Top 3 AI tools deep review)
 * W2: How-To Guide (Developer productivity tools comparison)
 * W3: Resource Roundup (This week's new free resources)
 * W4: SEO Landing Page (long-tail keyword topic page)
 * 
 * Usage: node scripts/generate-content-calendar.mjs
 * Schedule: weekly via GitHub Actions (Monday 9AM Beijing time)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const BLOG_DIR = join(__dirname, "..", "app", "(marketing)", "blog");

// Get current week number (W1-W4)
function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const weekNum = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000)) % 4;
  return weekNum; // 0=W1, 1=W2, 2=W3, 3=W4
}

// Load FMHY resources
function loadResources() {
  const filePath = join(DATA_DIR, "fmhy-resources.json");
  if (!existsSync(filePath)) return [];
  const data = JSON.parse(readFileSync(filePath, "utf-8"));
  return Object.values(data.categories).flatMap((cat) => cat.resources || []);
}

// W1: Tool Review Blog (Top 3 AI tools)
function generateToolReview(resources) {
  const aiTools = resources
    .filter((r) => r.category === "Artificial-Intelligence" || r.categoryName?.includes("AI"))
    .sort((a, b) => (b.githubStars || 0) - (a.githubStars || 0))
    .slice(0, 3);

  const slug = `best-free-ai-tools-${new Date().getFullYear()}`;
  const title = `Best Free AI Tools in ${new Date().getFullYear()}`;
  const content = `---
title: "${title}"
description: "Deep review of the top 3 free AI tools, including features, pros & cons, and alternatives."
date: ${new Date().toISOString().split("T")[0]}
slug: "${slug}"
---

# ${title}

## Introduction

This is an automated weekly review of the best free AI tools...

## Top 3 AI Tools

${aiTools.map((t, i) => `### ${i + 1}. ${t.name}

- URL: ${t.url}
- GitHub Stars: ${t.githubStars || "N/A"}
- Description: ${t.description || "No description"}

**Pros:**
- Free to use
- Open source (if applicable)

**Cons:**
- Limited features (if applicable)

**Best For:**
${t.categoryName || "General use"}

---

`).join("\n")}

## Conclusion

...
`;

  return { slug, title, content, type: "review" };
}

// W2: How-To Guide
function generateHowToGuide(resources) {
  const devTools = resources
    .filter((r) => r.category === "Development" || r.categoryName?.includes("Dev"))
    .slice(0, 5);

  const slug = `developer-tools-starter-pack`;
  const title = "Developer Tools Starter Pack: 10 Free Tools to Boost Productivity";
  const content = `# ${title}\n\n...\n`;

  return { slug, title, content, type: "guide" };
}

// W3: Resource Roundup
function generateResourceRoundup(resources) {
  const thisWeek = resources
    .filter((r) => {
      if (!r.dateAdded) return false;
      const added = new Date(r.dateAdded);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return added >= weekAgo;
    })
    .slice(0, 10);

  const slug = `weekly-roundup-${new Date().toISOString().slice(0, 10)}`;
  const title = `This Week in Free Tools: ${thisWeek.length} New Resources Added`;
  const content = `# ${title}\n\n...\n`;

  return { slug, title, content, type: "roundup" };
}

// W4: SEO Landing Page
function generateSEOLandingPage(resources) {
  const slug = `free-alternatives-to-paid-tools`;
  const title = "Free Alternatives to Popular Paid Tools";
  const content = `# ${title}\n\n...\n`;

  return { slug, title, content, type: "landing" };
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Content Calendar Automation...\n");

  const weekNum = getWeekNumber();
  const resources = loadResources();
  console.log(`  📅 Week ${weekNum + 1} (W${weekNum + 1})`);
  console.log(`  📊 Total resources: ${resources.length}`);

  let result;
  switch (weekNum) {
    case 0:
      result = generateToolReview(resources);
      break;
    case 1:
      result = generateHowToGuide(resources);
      break;
    case 2:
      result = generateResourceRoundup(resources);
      break;
    case 3:
      result = generateSEOLandingPage(resources);
      break;
  }

  console.log(`\n✅ Generated: ${result.title}`);
  console.log(`   Type: ${result.type}`);
  console.log(`   Slug: ${result.slug}`);
  console.log(`\n📝 Content preview (first 200 chars):`);
  console.log(result.content.slice(0, 200) + "...");

  // Write to file
  const outDir = join(BLOG_DIR, result.type === "review" ? "review" : "guides", result.slug);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  writeFileSync(join(outDir, "page.mdx"), result.content);
  console.log(`\n💾 Written to: ${outDir}/page.mdx`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
