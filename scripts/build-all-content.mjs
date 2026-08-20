#!/usr/bin/env node
/**
 * build-all-content.mjs
 * 
 * Only generates generated-content/*.json for resources that will actually
 * render a page — i.e. resources that are:
 *   1. In the handwritten-resources.json list (manually written, indexable), OR
 *   2. In the reviews/_manifest.json (have an AI review = rich content)
 * 
 * All other resources 302-redirect to their external URL and never read
 * a generated-content file. Generating files for them wastes disk space
 * and creates false impressions of "thin content" pages.
 * 
 * Previously this script generated ~29,000 files; now it generates ~80-100.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const OUTPUT_DIR = join(DATA_DIR, 'generated-content');

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 0. Build the "keep set" — IDs that should have content files ──────
function loadHandwrittenIds() {
  const p = join(DATA_DIR, 'handwritten-resources.json');
  if (!existsSync(p)) return new Set();
  const d = JSON.parse(readFileSync(p, 'utf8'));
  return new Set(d.ids || []);
}

function loadReviewedIds() {
  const p = join(DATA_DIR, 'reviews', '_manifest.json');
  if (!existsSync(p)) return new Set();
  const d = JSON.parse(readFileSync(p, 'utf8'));
  const ids = new Set();
  for (const entry of (d.reviews || [])) {
    if (entry.resourceId) ids.add(entry.resourceId);
  }
  return ids;
}

const KEEP_IDS = new Set([...loadHandwrittenIds(), ...loadReviewedIds()]);
console.log(`📋 Keep set: ${KEEP_IDS.size} IDs (handwritten + reviewed)`);

// 容错解析：数据源（尤其是 fmhy 等外部同步的大 JSON）偶发损坏，
// 单文件解析失败不应炸掉整站构建——跳过该源并告警，其余源照常生成。
function safeParseJson(file) {
  const p = join(DATA_DIR, file);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn(`⚠️  跳过损坏数据源 ${file}（JSON 解析失败：${e.message}）`);
    return null;
  }
}

// ── 1. Load data sources (only to find resources matching keep IDs) ──
function loadFmhy() {
  const d = safeParseJson('fmhy-resources.json');
  if (!d) return [];
  const out = [];
  for (const [catId, cat] of Object.entries(d.categories || {})) {
    for (const r of (cat.resources || [])) {
      if (!r.id || !r.name) continue;
      if (!KEEP_IDS.has(r.id)) continue; // ← KEY FILTER
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
  return out;
}

function loadSource(file, sourceId) {
  const d = safeParseJson(file);
  if (!d) return [];
  const out = [];
  for (const r of (d.resources || [])) {
    if (!r.id || !r.name) continue;
    if (!KEEP_IDS.has(r.id)) continue; // ← KEY FILTER
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
  return out;
}

console.log('📂 Loading data sources (filtered to keep set)...\n');
const [fmhy, ffd, ash, pa] = [
  loadFmhy(),
  loadSource('free-for-dev-resources.json', 'free-for-dev'),
  loadSource('awesome-selfhosted-resources.json', 'awesome-selfhosted'),
  loadSource('public-apis-resources.json', 'public-apis'),
];

const ALL = [...fmhy, ...ffd, ...ash, ...pa];
console.log(`\n📊 Resources to process: ${ALL.length} (FMHY=${fmhy.length}, FFD=${ffd.length}, ASH=${ash.length}, PA=${pa.length})`);

// ── 2. Generate content files only for keep-set resources ───────────
let generated = 0, skipped = 0, noDesc = 0;

for (const r of ALL) {
  const outPath = join(OUTPUT_DIR, `${r.id}.json`);
  if (existsSync(outPath)) { skipped++; continue; }

  // 取真实描述
  let introduction = '';
  const rawDesc = (r.description || '').trim();

  if (rawDesc && rawDesc !== '**' && rawDesc.length > 20) {
    introduction = rawDesc.slice(0, 300).trim();
    introduction = introduction.replace(/\*\*$/, '').trim();
    if (introduction.length < 20) introduction = '';
  }

  if (!introduction) {
    const srcMap = { fmhy: 'Free Media Heck', 'free-for-dev': 'Free for Developers', 'awesome-selfhosted': 'Awesome Self-Hosted', 'public-apis': 'Public APIs' };
    introduction = `${r.name} is listed in ${srcMap[r.source] || r.source}.`;
    noDesc++;
  }

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

  const pros = [];
  if (r.url && r.url.includes('github.com')) pros.push('Open-source on GitHub');
  if (r.license) pros.push(`Licensed under ${r.license}`);
  if (r.freeTier && r.freeTier.length > 10) pros.push('Has free tier');
  if (pros.length === 0) pros.push('Free to use');

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

// ── 3. Clean up dead files (not in keep set) ────────────────────────
let deleted = 0;
const existingFiles = readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
for (const f of existingFiles) {
  const id = f.replace('.json', '');
  if (!KEEP_IDS.has(id)) {
    unlinkSync(join(OUTPUT_DIR, f));
    deleted++;
  }
}

console.log(`\n📊 Done:`);
console.log(`  New files generated: ${generated}`);
console.log(`  Existing files skipped: ${skipped}`);
console.log(`  Dead files deleted: ${deleted}`);
console.log(`  Files remaining: ${existingFiles.length - deleted + generated}`);
console.log(`  Output: ${OUTPUT_DIR}`);
