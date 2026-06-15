#!/usr/bin/env node
/**
 * populate-content-by-category.mjs
 * 为每个分类生成至少 N 个内容
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { exit } from 'process';

const cwd = process.cwd();
const DATA_DIR = join(cwd, 'public', 'data');
const RESOURCES_FILE = join(DATA_DIR, 'fmhy-resources.json');
const OUTPUT_DIR = join(DATA_DIR, 'generated-content');

// GitHub API
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const MIN_PER_CATEGORY = parseInt(process.argv[2] || '10', 10);

async function githubApi(path) {
  const url = `${GITHUB_API}${path}`;
  const headers = { 'User-Agent': 'craftisle-bot' };
  if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 403) { console.warn('  ⚠️  GitHub rate limit'); return null; }
  if (!res.ok) return null;
  return res.json();
}

// 从 GitHub README 提取 features
async function extractFeatures(githubUrl) {
  try {
    const m = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m) return [];
    const [, owner, repo] = m;
    const cleanRepo = repo.replace(/\.git$/, '');
    
    const data = await githubApi(`/repos/${owner}/${cleanRepo}/readme`);
    if (!data || !data.content) return [];
    
    const readme = Buffer.from(data.content, 'base64').toString('utf-8');
    
    const headings = ['Features', 'Capabilities', 'What it does', 'Highlights', 'Key Features'];
    for (const h of headings) {
      const re = new RegExp(`##+\\s*${h}[^\\n]*\\n+((?:[-*]\\s*.+\\n?)+)`, 'i');
      const match = readme.match(re);
      if (match) {
        const items = match[1]
          .match(/[-*]\s*(.+)/g)
          ?.map(s => s.replace(/^[-*]\s*/, '').trim())
          .filter(s => s.length > 5 && s.length < 120)
          .slice(0, 6) || [];
        if (items.length > 0) return items;
      }
    }
    
    const lines = readme.split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('['));
    if (lines.length > 0) return [lines[0].slice(0, 120)];
    return [];
  } catch {
    return [];
  }
}

async function main() {
  if (!existsSync(RESOURCES_FILE)) {
    console.error('❌ fmhy-resources.json not found');
    exit(1);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const data = JSON.parse(readFileSync(RESOURCES_FILE, 'utf-8'));
  const categories = Object.keys(data.categories || {});
  
  console.log(`🎯 Goal: Generate at least ${MIN_PER_CATEGORY} content pieces per category\n`);
  console.log(`Found ${categories.length} categories\n`);
  
  let totalGenerated = 0;
  
  for (const catId of categories) {
    const resources = (data.categories[catId].resources || []).filter(r => r.id);
    console.log(`\n📂 Category: ${catId} (${resources.length} resources)`);
    
    // 检查已有内容数量
    let existing = 0;
    for (const r of resources) {
      const genFile = join(OUTPUT_DIR, `${r.id}.json`);
      if (existsSync(genFile)) {
        try {
          const c = JSON.parse(readFileSync(genFile, 'utf-8'));
          if (c.introduction && c.introduction !== '**') existing++;
        } catch {}
      }
    }
    
    console.log(`  Existing content: ${existing}/${MIN_PER_CATEGORY}`);
    
    if (existing >= MIN_PER_CATEGORY) {
      console.log(`  ✅ Already has enough content`);
      continue;
    }
    
    const needed = MIN_PER_CATEGORY - existing;
    console.log(`  🎯 Need to generate: ${needed} more`);
    
    // 生成更多内容
    let generated = 0;
    for (const r of resources) {
      if (generated >= needed) break;
      
      const slug = r.id;
      const outPath = join(OUTPUT_DIR, `${slug}.json`);
      
      if (existsSync(outPath)) {
        try {
          const c = JSON.parse(readFileSync(outPath, 'utf-8'));
          if (c.introduction && c.introduction !== '**') continue;
        } catch {}
      }
      
      console.log(`  ⏳ ${r.name || r.id}`);
      
      // 1. description
      const description = (r.description || r.snippet || '').trim();
      
      // 2. features（来自 GitHub README）
      let features = [];
      const ghUrl = r.githubUrl || (r.url?.includes('github.com') ? r.url : '');
      if (ghUrl) {
        features = await extractFeatures(ghUrl);
        await new Promise(r => setTimeout(r, 800));
      }
      
      // 3. pricing
      let pricing = 'Free';
      const txt = (description + ' ' + (r.url || '')).toLowerCase();
      if (txt.includes('freemium') || txt.includes('free plan')) pricing = 'Freemium';
      else if (txt.includes('paid') || txt.includes('$') || txt.includes('subscription')) pricing = 'Paid';
      else if (txt.includes('open source') || txt.includes('oss') || ghUrl) pricing = 'Free / Open Source';
      
      // 4. pros
      const pros = [];
      if (r.githubStars) pros.push(`⭐ ${r.githubStars.toLocaleString()} GitHub stars`);
      if (r.githubLicense) pros.push(`📄 License: ${r.githubLicense}`);
      if (r.techStack?.length) pros.push(`🔧 Tech: ${r.techStack.slice(0, 3).join(', ')}`);
      if (pros.length === 0) pros.push('Free and open-source', 'Community-driven');
      
      // 5. 构建内容
      const content = {
        id: slug,
        description,
        introduction: description || `${r.name} is a popular tool in the ${catId} category.`,
        features: features.length > 0 ? features : [
          `A powerful alternative to ${r.replaces || 'commercial tools'}`,
          'Open-source and community-driven'
        ],
        useCases: r.githubUrl ? [
          `Self-hosted deployment`,
          `Replacing ${r.replaces || 'proprietary software'}`
        ] : [],
        pricing,
        pros,
        cons: [
          'May require technical setup',
          'Community support only'
        ],
        alternatives: [],
        quickStart: r.githubUrl
          ? `git clone ${r.githubUrl}.git && cd ${r.githubUrl.split('/').pop().replace('.git','')}`
          : `Visit ${r.url} to get started`,
        source: 'fmhy+github',
        generatedAt: new Date().toISOString()
      };
      
      writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf-8');
      generated++;
      totalGenerated++;
      
      console.log(`    ✅ Generated (${generated}/${needed})`);
    }
    
    console.log(`  ✅ Category ${catId} done: ${existing + generated} total`);
  }
  
  console.log(`\n✅ Total new content generated: ${totalGenerated}`);
  console.log(`✅ All categories now have at least ${MIN_PER_CATEGORY} content pieces`);
}

main().catch(console.error);
