#!/usr/bin/env node

/**
 * AI Content Translation Script
 * Translates generated content to 14 languages
 * 
 * Usage:
 *   node scripts/ai-translate-content.mjs [--mock] [--limit 50] [--lang zh-CN]
 * 
 * Languages: en, zh-CN, zh-TW, ja, de, fr, es, pt, ru, ko, vi, th, id, tr
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "public", "data");
const CONTENT_DIR = join(DATA_DIR, "generated-content");

const LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'ja', 'de', 'fr', 'es', 'pt', 'ru', 'ko', 'vi', 'th', 'id', 'tr'];

// Parse CLI args
const args = process.argv.slice(2);
const mockMode = args.includes("--mock");
const langArg = args.find(a => a.startsWith("--lang="));
const targetLang = langArg ? langArg.split("=")[1] : null;
const limitArg = args.find(a => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : 20;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

/**
 * Translate content using OpenAI API
 */
async function translateWithAI(content, targetLang) {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set. Use --mock for testing.");
  }

  const langNames = {
    'en': 'English', 'zh-CN': 'Simplified Chinese', 'zh-TW': 'Traditional Chinese',
    'ja': 'Japanese', 'de': 'German', 'fr': 'French', 'es': 'Spanish',
    'pt': 'Portuguese', 'ru': 'Russian', 'ko': 'Korean', 'vi': 'Vietnamese',
    'th': 'Thai', 'id': 'Indonesian', 'tr': 'Turkish',
  };

  const prompt = `
Translate the following JSON content to ${langNames[targetLang] || targetLang}.

IMPORTANT: Do NOT do literal translation. Rewrite the content to match ${langNames[targetLang]} users' reading habits and search keywords.

Input (English JSON):
${JSON.stringify(content, null, 2)}

Output: Same JSON structure, but translated/rewritten for ${langNames[targetLang]} users.
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
  return JSON.parse(data.choices[0].message.content);
}

/**
 * Generate mock translation (for testing without API key)
 */
function generateMockTranslation(content, targetLang) {
  const langPrefix = {
    'zh-CN': '[中文] ', 'zh-TW': '[繁體] ', 'ja': '[日本語] ',
    'de': '[DE] ', 'fr': '[FR] ', 'es': '[ES] ',
  };

  const prefix = langPrefix[targetLang] || `[${targetLang}] `;

  return {
    ...content,
    introduction: `${prefix}${content.introduction}`,
    features: content.features.map(f => `${prefix}${f}`),
    useCases: content.useCases.map(u => `${prefix}${u}`),
    alternatives: content.alternatives.map(a => ({
      name: `${prefix}${a.name}`,
      reason: `${prefix}${a.reason}`,
    })),
    pricing: {
      ...content.pricing,
      description: `${prefix}${content.pricing.description}`,
    },
    pros: content.pros.map(p => `${prefix}${p}`),
    cons: content.cons.map(c => `${prefix}${c}`),
    quickStart: content.quickStart.map(q => `${prefix}${q}`),
    generatedAt: new Date().toISOString(),
    source: "fmhy",
    version: content.version,
  };
}

/**
 * Main function
 */
async function main() {
  console.log("🌍 Translating AI content to multiple languages...\n");
  console.log(`  Mode: ${mockMode ? "MOCK (no API key needed)" : "AI (requires OPENAI_API_KEY)"}`);
  console.log(`  Target language: ${targetLang || "all 14 languages"}\n`);

  if (!existsSync(CONTENT_DIR)) {
    console.error("❌ No generated content found. Run ai:generate-content first.");
    process.exit(1);
  }

  // Get list of resources with generated content
  const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith(".json"));
  console.log(`  Found ${files.length} resources with generated content`);
  console.log(`  Will translate ${Math.min(files.length, limit)} resources\n`);

  const langs = targetLang ? [targetLang] : LANGUAGES.filter(l => l !== 'en'); // Skip English (source)
  let totalTranslated = 0;

  for (const file of files.slice(0, limit)) {
    const resourceId = file.replace(".json", "");
    const content = JSON.parse(readFileSync(join(CONTENT_DIR, file), "utf-8"));

    for (const lang of langs) {
      const outputDir = join(CONTENT_DIR, lang);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      const outputPath = join(outputDir, `${resourceId}.json`);
      if (existsSync(outputPath)) {
        continue; // Skip if already translated
      }

      try {
        let translated;
        if (mockMode) {
          translated = generateMockTranslation(content, lang);
        } else {
          translated = await translateWithAI(content, lang);
        }

        writeFileSync(outputPath, JSON.stringify(translated, null, 2));
        totalTranslated++;
      } catch (err) {
        console.warn(`  ⚠ Error translating ${resourceId} to ${lang}: ${err.message}`);
      }
    }

    console.log(`  ✓ Translated ${resourceId} to ${langs.length} languages`);
  }

  console.log(`\n✅ Done! Total translations: ${totalTranslated}`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
