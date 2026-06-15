#!/usr/bin/env node
/**
 * scrape-resource-descriptions.mjs
 * 从资源官网抓取真实描述
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const FMHY_FILE = join(DATA_DIR, 'fmhy-resources.json');

function extractDescription(html) {
  // 方法1: meta name="description"
  const m1 = html.match(/<meta\s+name\s*=\s*["']description["'][^>]*\s+content\s*=\s*["']([^"']{20,}?)["']/i);
  if (m1 && m1[1]) return m1[1].trim();
  
  // 方法2: meta property="og:description"
  const m2 = html.match(/<meta\s+property\s*=\s*["']og:description["'][^>]*\s+content\s*=\s*["']([^"']{20,}?)["']/i);
  if (m2 && m2[1]) return m2[1].trim();
  
  // 方法3: 取<body>第一段文字
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const text = bodyMatch[1]
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    const sentences = text.split(/(?:[.!?。！？]\s+|<\/p>|<\/div>)/);
    for (const s of sentences) {
      const cleaned = s.trim();
      if (cleaned.length > 30 && cleaned.length < 300) return cleaned;
    }
  }
  
  return null;
}

async function scrapeResource(url, maxTime = 8000) {
  if (!url || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), maxTime);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CraftisleBot/1.0)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    return extractDescription(html);
  } catch (e) {
    return null;
  }
}

async function main() {
  const limit = parseInt(process.argv[2] || '10', 10);
  console.log(`Scraping resource descriptions (limit: ${limit})...\n`);
  
  if (!existsSync(FMHY_FILE)) {
    console.error('fmhy-resources.json not found.');
    process.exit(1);
  }
  
  const data = JSON.parse(readFileSync(FMHY_FILE, 'utf-8'));
  const resources = [];
  for (const [catId, catData] of Object.entries(data.categories || {})) {
    for (const r of (catData.resources || [])) {
      if (r.id) resources.push(r);
    }
  }
  
  console.log(`Total resources: ${resources.length}\n`);
    
  let scraped = 0, updated = 0;
    
  for (let i = 0; i < Math.min(limit, resources.length); i++) {
    const r = resources[i];
    if (!r.url || !r.id) continue;
      
    // 检查是否已有真实描述
    const genFile = join(GENERATED_DIR, `${r.id}.json`);
    let hasReal = false;
    if (existsSync(genFile)) {
      try {
        const c = JSON.parse(readFileSync(genFile, 'utf-8'));
        if (c.introduction && c.introduction !== '**') hasReal = true;
      } catch {}
    }
    if (hasReal) continue;
      
    process.stdout.write(`  [${i+1}/${limit}] ${r.name || r.id}... `);
    const desc = await scrapeResource(r.url);
      
    if (desc) {
      scraped++;
      console.log(`✅ ${desc.slice(0, 60)}...`);
      const content = existsSync(genFile) ? JSON.parse(readFileSync(genFile, 'utf-8')) : { id: r.id };
      if (!content.introduction || content.introduction === '**') {
        content.introduction = desc;
        content.description = desc;
        content.source = (content.source || '') + '+scrape';
        content.updatedAt = new Date().toISOString();
        writeFileSync(genFile, JSON.stringify(content, null, 2));
        updated++;
      }
    } else {
      console.log('⚠️  no description');
    }
      
    await new Promise(r => setTimeout(r, 1000));
  }
    
  console.log(`\n✅ Done! Scraped: ${scraped}, Updated: ${updated}`);
}

main().catch(console.error);
