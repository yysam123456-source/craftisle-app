#!/usr/bin/env node
/**
 * enrich-github-data.js
 * P0-2b: 批量补充 GitHub 元数据（stars, lastUpdated, license）
 *
 * 用法:
 *   node scripts/enrich-github-data.js [--source fmhy|awesome-selfhosted|free-for-dev|public-apis|all] [--limit N] [--dry-run]
 *
 * 逻辑:
 *   1. 读取 public/data/*.json 中的资源
 *   2. 从 url 字段中提取 github.com owner/repo
 *   3. 调用 GitHub API 获取 stars / pushed_at / license
 *   4. 将结果写回 JSON（新增 githubStars, githubLastUpdated, githubLicense 字段）
 *   5. 支持增量运行（跳过已有 githubStars 的资源）
 */

const fs = require("fs");
const path = require("path");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
  || args.find((a) => a.startsWith("--token="))?.split("=")[1]
  || null;

const DATA_DIR = path.join(process.cwd(), "public", "data");
// With token: 5000 req/h ≈ 800ms; Without: 60 req/h ≈ 1200ms + retry
const RATE_LIMIT_MS = GITHUB_TOKEN ? 800 : 1200;

const args = process.argv.slice(2);
const sourceArg = args.find((a) => a.startsWith("--source="))?.split("=")[1]
  || args[args.indexOf("--source") + 1]
  || "all";
const limitArg = parseInt(args.find((a) => a.startsWith("--limit="))?.split("=")[1]
  || args[args.indexOf("--limit") + 1]
  || "0", 10);
const dryRun = args.includes("--dry-run");

// ── GitHub URL 解析 ─────────────────────────────────
// GitHub 保留路径（非仓库页面）
const GITHUB_RESERVED_PATHS = new Set(["topics", "collections", "marketplace", "explore", "trending", "events", "sponsors", "settings", "notifications", "issues", "pulls", "watching", "stargazers", "followers", "following"]);

function extractGitHubRepo(resource) {
  // 辅助：从单个 URL 字符串中提取 owner/repo
  function parseUrl(urlStr) {
    if (!urlStr) return null;
    try {
      const u = new URL(urlStr);
      if (u.hostname !== "github.com" && u.hostname !== "www.github.com") return null;
      const parts = u.pathname.split("/").filter(Boolean);
      // 必须是 github.com/owner/repo 格式（2 级路径）
      if (parts.length < 2) return null;
      // 排除保留路径
      if (GITHUB_RESERVED_PATHS.has(parts[0])) return null;
      return `${parts[0]}/${parts[1]}`;
    } catch {
      return null;
    }
  }
  // 1. 先检查 githubUrl 字段（sync-fmhy.mjs 提取的）
  if (resource.githubUrl) {
    const repo = parseUrl(resource.githubUrl);
    if (repo) return repo;
  }
  // 2. 检查 url 字段
  let repo = parseUrl(resource.url);
  if (repo) return repo;
  // 3. 从 description 中提取 GitHub URL
  if (resource.description) {
    const matches = [...resource.description.matchAll(/https?:\/\/(?:www\.)?github\.com\/[^\s)"']+/gi)];
    for (const m of matches) {
      repo = parseUrl(m[0]);
      if (repo) return repo;
    }
  }
  return null;
}

// ── GitHub API 调用 ─────────────────────────────────
async function fetchGitHubMeta(repo) {
  const url = `https://api.github.com/repos/${repo}`;
  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Craftisle-Bot/1.0",
  };
  if (GITHUB_TOKEN) {
    headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  }
  const res = await fetch(url, { headers });
  if (res.status === 403) {
    console.warn(`  ⚠ Rate limited. Sleeping 60s...`);
    await new Promise((r) => setTimeout(r, 60000));
    return fetchGitHubMeta(repo); // retry
  }
  if (res.status === 404) {
    return null; // repo not found or private
  }
  if (!res.ok) {
    console.warn(`  ⚠ GitHub API error ${res.status} for ${repo}`);
    return null;
  }
  const data = await res.json();
  return {
    githubStars: data.stargazers_count,
    githubLastUpdated: data.pushed_at,
    githubLicense: data.license?.spdx_id || null,
  };
}

// ── 处理单个数据源 ─────────────────────────────────
async function processSource(sourceId) {
  const fileName = `${sourceId}-resources.json`;
  const filePath = path.join(DATA_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.log(`  Skipping ${sourceId}: file not found`);
    return 0;
  }

  console.log(`\n📦 Processing: ${sourceId}`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  // Collect resources to enrich
  const resources = [];
  if (sourceId === "fmhy") {
    for (const catData of Object.values(data.categories || {})) {
      for (const r of catData.resources || []) {
        if (r.url) resources.push(r);
      }
    }
  } else {
    for (const r of data.resources || []) {
      if (r.url) resources.push(r);
    }
  }

  console.log(`  Total resources: ${resources.length}`);

  // Filter: only those with GitHub URLs and not yet enriched
  const toEnrich = resources.filter((r) => {
    if (r.githubStars !== undefined) return false; // already enriched
    const repo = extractGitHubRepo(r);
    return !!repo;
  });

  console.log(`  Resources with GitHub URLs: ${toEnrich.length}`);

  const enriched = limitArg > 0 ? toEnrich.slice(0, limitArg) : toEnrich;
  let success = 0;
  let failed = 0;

  for (let i = 0; i < enriched.length; i++) {
    const r = enriched[i];
    const repo = extractGitHubRepo(r);
    if (!repo) continue;

    process.stdout.write(`  [${i + 1}/${enriched.length}] ${repo} ... `);

    if (dryRun) {
      console.log("DRY RUN (skipped)");
      continue;
    }

    try {
      const meta = await fetchGitHubMeta(repo);
      if (meta) {
        r.githubStars = meta.githubStars;
        r.githubLastUpdated = meta.githubLastUpdated;
        r.githubLicense = meta.githubLicense;
        console.log(`⭐ ${meta.githubStars}`);
        success++;
      } else {
        console.log("not found / private");
        failed++;
      }
    } catch (err) {
      console.log(`error: ${err.message}`);
      failed++;
    }

    // Rate limit
    if (i < enriched.length - 1) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  // Write back
  if (!dryRun && success > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`  ✅ Written ${success} enriched resources to ${fileName}`);
  }

  return success;
}

// ── Main ─────────────────────────────────────────
async function main() {
  console.log("🚀 GitHub Data Enrichment Script");
  console.log(`   Source: ${sourceArg}`);
  console.log(`   Limit: ${limitArg || "none"}`);
  console.log(`   Dry run: ${dryRun}`);

  const sources = sourceArg === "all"
    ? ["fmhy", "awesome-selfhosted", "free-for-dev", "public-apis"]
    : [sourceArg];

  let totalEnriched = 0;
  for (const src of sources) {
    totalEnriched += await processSource(src);
  }

  console.log(`\n🎉 Done! Total enriched: ${totalEnriched}`);
}

main().catch(console.error);
