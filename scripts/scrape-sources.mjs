#!/usr/bin/env node
/**
 * scrape-sources.mjs
 * Scrape awesome-selfhosted and free-for-dev data
 * This script is called by GitHub Actions job "update-awesome-lists"
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');

async function main() {
  console.log('📦 Scraping awesome-selfhosted and free-for-dev data...\n');

  // 1. Scrape awesome-selfhosted
  console.log('📊 Fetching awesome-selfhosted...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/awesome-selfhosted/awesome-selfhosted/master/README.md');
    if (res.ok) {
      const readme = await res.text();
      // Parse resources from README
      const resources = parseAwesomeSelfhosted(readme);
      writeFileSync(
        join(DATA_DIR, 'awesome-selfhosted-resources.json'),
        JSON.stringify({ resources, updatedAt: new Date().toISOString() }, null, 2)
      );
      console.log(`✅ Awesome-selfhosted: ${resources.length} resources`);
    }
  } catch (e) {
    console.log(`⚠️  Awesome-selfhosted fetch failed: ${e.message}`);
  }

  // 2. Scrape free-for-dev
  console.log('\n📊 Fetching free-for-dev...');
  try {
    const res = await fetch('https://raw.githubusercontent.com/ripienaar/free-for-dev/main/README.md');
    if (res.ok) {
      const readme = await res.text();
      const resources = parseFreeForDev(readme);
      writeFileSync(
        join(DATA_DIR, 'free-for-dev-resources.json'),
        JSON.stringify({ resources, updatedAt: new Date().toISOString() }, null, 2)
      );
      console.log(`✅ Free-for-dev: ${resources.length} resources`);
    }
  } catch (e) {
    console.log(`⚠️  Free-for-dev fetch failed: ${e.message}`);
  }

  console.log('\n✅ Done!');
}

function parseAwesomeSelfhosted(md) {
  // Simple parser: extract resource links from markdown
  const resources = [];
  const lines = md.split('\n');
  let currentCategory = '';
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
    }
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match && line.includes('- ')) {
      resources.push({
        name: match[1],
        url: match[2],
        category: currentCategory,
        id: `awesome-selfhosted--${match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
    }
  }
  
  return resources;
}

function parseFreeForDev(md) {
  const resources = [];
  const lines = md.split('\n');
  let currentCategory = '';
  
  for (const line of lines) {
    if (line.startsWith('## ')) {
      currentCategory = line.replace('## ', '').trim();
    }
    const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match && line.includes('- ')) {
      resources.push({
        name: match[1],
        url: match[2],
        category: currentCategory,
        id: `free-for-dev--${match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      });
    }
  }
  
  return resources;
}

main().catch(console.error);
