#!/usr/bin/env node
/**
 * merge-selfhosted.mjs
 * 把 awesome-selfhosted 的真实描述合并进 generated-content/*.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const FMHY_FILE = join(DATA_DIR, 'fmhy-resources.json');
const ASH_FILE = join(DATA_DIR, 'awesome-selfhosted-resources.json');

function normalizeName(n) {
  return (n || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function main() {
  // 1. 加载 FMHY 映射：id -> {name, url}
  const fmhy = JSON.parse(readFileSync(FMHY_FILE, 'utf-8'));
  const idMap = {};
  for (const [catId, catData] of Object.entries(fmhy.categories || {})) {
    for (const r of (catData.resources || [])) {
      if (r.id) {
        idMap[r.id] = { name: r.name || '', url: r.url || '' };
      }
    }
  }
  console.log(`✓ FMHY mapping: ${Object.keys(idMap).length} resources`);

  // 2. 加载 awesome-selfhosted 数据
  const ash = JSON.parse(readFileSync(ASH_FILE, 'utf-8'));
  const ashResources = ash.resources || [];
  console.log(`✓ Awesome-Selfhosted: ${ashResources.length} resources`);

  // 3. 建立 awesome 的 name -> resource 映射
  const ashByName = {};
  for (const r of ashResources) {
    const norm = normalizeName(r.name || '');
    if (norm) ashByName[norm] = r;
    // 也建 url 映射
    if (r.url) {
      try {
        const host = new URL(r.url).hostname.replace(/^www\./, '');
        ashByName[host] = r;
      } catch {}
    }
  }

  // 4. 加载所有 generated-content
  const files = readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
  console.log(`✓ Generated content: ${files.length} files`);

  let matched = 0;
  for (const f of files) {
    const id = f.replace('.json', '');
    const filePath = join(GENERATED_DIR, f);
    const content = JSON.parse(readFileSync(filePath, 'utf-8'));

    const fmhyEntry = idMap[id];
    if (!fmhyEntry) continue;

    const normName = normalizeName(fmhyEntry.name || '');
    const url = fmhyEntry.url || '';
    let match = null;

    // 按名称匹配
    if (normName && ashByName[normName]) {
      match = ashByName[normName];
    }
    // 按 URL hostname 匹配
    if (!match && url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        if (ashByName[host]) match = ashByName[host];
      } catch {}
    }

    if (match) {
      matched++;
      // 合并描述
      if (match.description && match.description.length > 20 && content.introduction === '**') {
        content.introduction = match.description;
        content.description = match.description;
      }
      // 合并 license 信息
      if (match.license) {
        content.license = match.license;
      }
      if (match.language) {
        content.tech = match.language;
      }
      content.source = (content.source || '') + '+selfhosted';
      content.updatedAt = new Date().toISOString();
      writeFileSync(filePath, JSON.stringify(content, null, 2));
    }
  }

  console.log(`\n✅ Done! Matched: ${matched}/${files.length}`);
}

main();
