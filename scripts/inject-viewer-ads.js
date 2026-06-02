#!/usr/bin/env node
/**
 * Unified Ad Config Injector for Craftisle
 *
 * Reads NEXT_PUBLIC_ADSENSE_CLIENT from .env.local and injects it into
 * the viewer static site's index.html.
 *
 * Usage:
 *   node scripts/inject-viewer-ads.js
 *
 * This ensures ONE env var (NEXT_PUBLIC_ADSENSE_CLIENT) controls ads
 * across the entire Craftisle project:
 *   - craftisle.com (Next.js app)
 *   - viewer.craftisle.com (static viewer)
 */

const fs = require("fs");
const path = require("path");

const ENV_PATH = path.resolve(__dirname, "../.env.local");
const VIEWER_HTML_PATH = path.resolve(
  __dirname,
  "../../craftisle-viewer-temp/index.html"
);

function readEnvVar(key) {
  // 1. Try .env.local
  if (fs.existsSync(ENV_PATH)) {
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  // 2. Try process.env
  return process.env[key] || "";
}

function injectAdsenseClient() {
  const clientId = readEnvVar("NEXT_PUBLIC_ADSENSE_CLIENT");

  if (!clientId) {
    console.log("⚠️  NEXT_PUBLIC_ADSENSE_CLIENT not set in .env.local");
    console.log("   Ads will be DISABLED on all pages.");
    console.log("   Set it to your AdSense client ID (e.g., ca-pub-1234567890123456) to enable.");
  } else {
    console.log(`✅ Found NEXT_PUBLIC_ADSENSE_CLIENT: ${clientId}`);
  }

  if (!fs.existsSync(VIEWER_HTML_PATH)) {
    console.error(`❌ Viewer HTML not found: ${VIEWER_HTML_PATH}`);
    process.exit(1);
  }

  let html = fs.readFileSync(VIEWER_HTML_PATH, "utf-8");
  const original = html;

  // Replace all occurrences of {{ADSENSE_CLIENT}} with the actual client ID
  html = html.replace(/\{\{ADSENSE_CLIENT\}\}/g, clientId);

  if (html === original) {
    console.log("⚠️  No {{ADSENSE_CLIENT}} placeholders found in viewer HTML");
    console.log("   The viewer may already have been injected or the template changed.");
    return;
  }

  fs.writeFileSync(VIEWER_HTML_PATH, html, "utf-8");
  console.log(`✅ Injected AdSense client into viewer HTML`);
  console.log(`   File: ${VIEWER_HTML_PATH}`);

  if (!clientId) {
    console.log("\n📝 To enable ads, add this to craftisle-app/.env.local:");
    console.log("   NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-YOUR_CLIENT_ID");
    console.log("   Then re-run this script and deploy the viewer.");
  }
}

injectAdsenseClient();
