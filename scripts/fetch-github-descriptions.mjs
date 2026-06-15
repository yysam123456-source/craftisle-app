#!/usr/bin/env node
/**
 * fetch-github-descriptions.mjs
 * 用 GitHub API 获取资源描述（从 README 提取）
 * 不依赖网页抓取，更可靠
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const FMHY_FILE = join(DATA_DIR, 'fmhy-resources.json');

// 从 README 提取描述
function extractDescriptionFromReadme(readme) {
  if (!readme) return null;
  
  // 找第一个有意义的段落（>30 字符，<500 字符）
  const lines = readme.split('\n');
  let inCodeBlock = false;
  let description = '';
  
  for (const line of lines) {
    // 跳过代码块
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    
    // 跳过标题、图片、链接定义
    if (line.startsWith('#') || line.startsWith('![') || line.match(/^\[[^\]]+\]:/)) continue;
    
    // 找有内容的行
    const clean = line.replace(/[[]([^\]]+)[\]][^)]+\)/g, '$1') // 去掉链接
      .replace(/[*_`]/g, '') // 去掉粗体/斜体
      .trim();
      
    if (clean.length > 30 && clean.length < 500) {
      description = clean;
      break;
    }
  }
  
  return description || null;
}

async function fetchGithubDescription(githubUrl, GITHUB_TOKEN) {
  if (!githubUrl || !githubUrl.includes('github.com')) return null;
  
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  
  const owner = match[1];
  const repo = match[2].replace('.git', '');
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/readme`;
  
  try {
    const headers = { 'Accept': 'application/vnd.github.v3.raw' };
    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      
    const res = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
      
    const readme = await res.text();
    return extractDescriptionFromReadme(readme);
  } catch {
    return null;
  }
}

async function main() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
  const limit = parseInt(process.argv[2] || '50', 10);
  
  console.log(`Fetching GitHub descriptions (limit: ${limit})...\n`);
  
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
  
  let fetched = 0;
  let updated = 0;
  
  for (let i = 0; i < Math.min(limit, resources.length); i++) {
    const r = resources[i];
    if (!r.id) continue;
      
    // 找 GitHub URL
    let githubUrl = r.githubUrl || '';
    if (!githubUrl && r.url && r.url.includes('github.com')) {
      githubUrl = r.url;
    }
    if (!githubUrl) continue;
      
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
    const desc = await fetchGithubDescription(githubUrl, GITHUB_TOKEN);
      
    if (desc) {
      fetched++;
      console.log(`✅ ${desc.slice(0, 60)}...`);
        
      const content = existsSync(genFile) ? JSON.parse(readFileSync(genFile, 'utf-8')) : { id: r.id };
      if (!content.introduction || content.introduction === '**') {
        content.introduction = desc;
        content.description = desc;
        content.source = (content.source || '') + '+github-api';
        content.updatedAt = new Date().toISOString();
        writeFileSync(genFile, JSON.stringify(content, null, 2));
        updated++;
      }
    } else {
      console.log('⚠️  no description');
    }
      
    // 限速：GitHub API 免费额度 5000次/小时
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(`\n✅ Done! Fetched: ${fetched}, Updated: ${updated}`);
}

main().catch(console.error);
