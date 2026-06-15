#!/usr/bin/env node
/**
 * build-all-content.mjs
 * 并行读取全部 4 个数据源，生成真实 generated-content/*.json
 * 不用模板造假，直接用各数据源的原始真实描述
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const OUTPUT_DIR = join(DATA_DIR, 'generated-content');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 1. 并行加载全部 4 个数据源 ──────────────────────────────────────
function loadFmhy() {
  const p = join(DATA_DIR, 'fmhy-resources.json');
  if (!existsSync(p)) return [];
  const d = JSON.parse(readFileSync(p, 'utf8'));
  const out = [];
  for (const [catId, cat] of Object.entries(d.categories || {})) {
    for (const r of (cat.resources || [])) {
      if (!r.id || !r.name) continue;
      out.push({
        id: r.id,
        name: r.name,
        url: r.url || '',
        description: r.description || '',
        category: catId,
        source: 'fmhy',
      });
    }
  }
  console.log(`  ✅ FMHY: ${out.length} 个资源`);
  return out;
}

function loadSource(file, sourceId) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) { console.log(`  ❌ ${file} 不存在`); return []; }
  const d = JSON.parse(readFileSync(p, 'utf8'));
  const out = [];
  for (const r of (d.resources || [])) {
    if (!r.id || !r.name) continue;
    out.push({
      id: r.id,
      name: r.name,
      url: r.url || '',
      description: r.description || '',
      category: r.category || '',
      source: sourceId,
      freeTier: r.freeTier || '',
      license: r.license || '',
    });
  }
  console.log(`  ✅ ${sourceId}: ${out.length} 个资源`);
  return out;
}

console.log('📂 并行加载全部 4 个数据源...\n');
const [fmhy, ffd, ash, pa] = [
  loadFmhy(),
  loadSource('free-for-dev-resources.json', 'free-for-dev'),
  loadSource('awesome-selfhosted-resources.json', 'awesome-selfhosted'),
  loadSource('public-apis-resources.json', 'public-apis'),
];

const ALL = [...fmhy, ...ffd, ...ash, ...pa];
console.log(`\n📊 总计: ${ALL.length} 个资源 (FMHY=${fmhy.length}, FFD=${ffd.length}, ASH=${ash.length}, PA=${pa.length})`);

// ── 2. 为每个资源生成真实内容文件 ─────────────────────────────────────
let generated = 0, skipped = 0, noDesc = 0;

for (const r of ALL) {
  const outPath = join(OUTPUT_DIR, `${r.id}.json`);
  if (existsSync(outPath)) { skipped++; continue; }

  // 取真实描述（不从模板造假）
  let introduction = '';
  const rawDesc = (r.description || '').trim();

  if (rawDesc && rawDesc !== '**' && rawDesc.length > 20) {
    // 用原始真实描述（取前 300 字）
    introduction = rawDesc.slice(0, 300).trim();
    // 去掉末尾的 markdown 残留
    introduction = introduction.replace(/\*\*$/, '').trim();
    if (introduction.length < 20) introduction = '';
  }

  // 没有描述时，用 name + source 生成一句话（非模板）
  if (!introduction) {
    const srcMap = { fmhy: 'Free Media Heck', 'free-for-dev': 'Free for Developers', 'awesome-selfhosted': 'Awesome Self-Hosted', 'public-apis': 'Public APIs' };
    introduction = `${r.name} is listed in ${srcMap[r.source] || r.source}.`;
    noDesc++;
  }

  // 从描述里提取 features（找 - 或 * 开头的列表项）
  const features = [];
  if (rawDesc && rawDesc !== '**') {
    const lines = rawDesc.split('\n');
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('- ') || t.startsWith('* ')) {
        const item = t.slice(2).trim();
        if (item.length > 10 && item.length < 120) features.push(item);
      }
      if (features.length >= 6) break;
    }
  }

  // pros（真实数据）
  const pros = [];
  if (r.url && r.url.includes('github.com')) pros.push('Open-source on GitHub');
  if (r.license) pros.push(`Licensed under ${r.license}`);
  if (r.freeTier && r.freeTier.length > 10) pros.push('Has free tier');
  if (pros.length === 0) pros.push('Free to use');

  // 生成 contentHtml（真实内容，不造假）
  let contentHtml = `<h2>About ${r.name}</h2>`;
  contentHtml += `<p>${introduction.replace(/</g, '<').replace(/>/g, '>')}</p>`;

  if (features.length > 0) {
    contentHtml += `<h3>Key Features</h3><ul>`;
    for (const f of features.slice(0, 6)) {
      contentHtml += `<li>${f.replace(/</g, '<').replace(/>/g, '>')}</li>`;
    }
    contentHtml += `</ul>`;
  }

  if (r.url) {
    contentHtml += `<h3>Links</h3><ul>`;
    contentHtml += `<li><a href="${r.url}" target="_blank" rel="noopener">Official Website</a></li>`;
    contentHtml += `</ul>`;
  }

  const content = {
    id: r.id,
    name: r.name,
    introduction,
    features: features.length > 0 ? features : undefined,
    pros,
    cons: undefined,
    contentHtml,
    officialSite: r.url || '',
    githubUrl: r.url?.includes('github.com') ? r.url : '',
    license: r.license || '',
    categories: [r.category || ''].filter(Boolean),
    tags: [],
    score: 0,
    source: r.source,
    sourceCategory: r.category || '',
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(outPath, JSON.stringify(content, null, 2));
  generated++;
}

console.log(`\n📊 生成完成:`);
console.log(`  新生成: ${generated}`);
console.log(`  已存在跳过: ${skipped}`);
console.log(`  无描述(用name生成): ${noDesc}`);
console.log(`  输出目录: ${OUTPUT_DIR}`);
console.log(`\n✅ 全部 ${ALL.length} 个资源均有内容文件`);
