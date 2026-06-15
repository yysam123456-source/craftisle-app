#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const FMHY_FILE = join(DATA_DIR, 'fmhy-resources.json');

// 加载 AlternativeTo 数据
function loadAllAlternatives() {
  const files = [];
  for (let i = 1; i <= 40; i++) {
    const file = join(DATA_DIR, `alternatives-batch${i}.json`);
    if (existsSync(file)) {
      try {
        const data = JSON.parse(readFileSync(file, 'utf-8'));
        if (Array.isArray(data)) files.push(...data);
      } catch {}
    }
  }
  return files;
}

// 加载 FMHY 数据，建立 id → {name, url} 映射
function loadFmhyMapping() {
  if (!existsSync(FMHY_FILE)) return {};
  const data = JSON.parse(readFileSync(FMHY_FILE, 'utf-8'));
  const mapping = {};
  for (const [catId, catData] of Object.entries(data.categories || {})) {
    for (const resource of (catData.resources || [])) {
      if (resource.id) {
        mapping[resource.id] = {
          name: resource.name || '',
          url: resource.url || '',
          hostname: (resource.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')
        };
      }
    }
  }
  return mapping;
}

// 加载已生成的内容
function loadGeneratedContent() {
  const result = {};
  if (!existsSync(GENERATED_DIR)) return result;
  const entries = readdirSync(GENERATED_DIR).filter(f => f.endsWith('.json'));
  for (const f of entries) {
    const id = f.replace('.json', '');
    try {
      result[id] = JSON.parse(readFileSync(join(GENERATED_DIR, f), 'utf-8'));
    } catch {}
  }
  return result;
}

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function main() {
  console.log('📊 Loading AlternativeTo data...');
  const altData = loadAllAlternatives();
  console.log(`  Loaded ${altData.length} AlternativeTo entries`);

  console.log('📊 Loading FMHY mapping...');
  const fmhyMap = loadFmhyMapping();
  console.log(`  Loaded ${Object.keys(fmhyMap).length} FMHY mappings`);

  console.log('📊 Loading generated content...');
  const generated = loadGeneratedContent();
  const genIds = Object.keys(generated);
  console.log(`  Loaded ${genIds.length} generated content files`);

  let matched = 0;
  let updated = 0;

  for (const [id, content] of Object.entries(generated)) {
    const fmhy = fmhyMap[id];
    if (!fmhy) continue;

    const resourceName = fmhy.name || id.replace(/-/g, ' ');
    const normName = normalizeName(resourceName);
    const resourceHostname = fmhy.hostname || '';

    let match = null;
    for (const alt of altData) {
      const altTool = alt.paidTool || alt.name || '';
      const altNorm = normalizeName(altTool);
      const altUrl = alt.paidToolUrl || alt.url || '';
      const altHostname = altUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // 匹配：名称相似 或 hostname 相同
      if (altNorm && normName && (altNorm.includes(normName) || normName.includes(altNorm))) {
        match = alt;
        break;
      }
      if (resourceHostname && altHostname && resourceHostname === altHostname) {
        match = alt;
        break;
      }
    }

    if (match) {
      matched++;
      if (match.description && match.description.length > 30) {
        content.introduction = match.description;
      }
      if (match.tagline) {
        content.tagline = match.tagline;
      }
      if (match.pricing) {
        content.pricing = match.pricing;
      }
      if (match.painPoints && Array.isArray(match.painPoints) && match.painPoints.length > 0) {
        content.useCases = match.painPoints.map(p => p.problem || p);
      }
      if (match.alternatives && Array.isArray(match.alternatives) && match.alternatives.length > 0) {
        content.alternatives = match.alternatives.map(a => ({
          name: a.name || '',
          url: a.url || '',
          reason: a.reason || ''
        }));
        content.similarAlternatives = match.alternatives.map(a => a.name || '');
      }
      if (match.alternatives && match.alternatives[0] && match.alternatives[0].pros) {
        content.pros = match.alternatives[0].pros;
      }
      if (match.alternatives && match.alternatives[0] && match.alternatives[0].cons) {
        content.cons = match.alternatives[0].cons;
      }

      content.source = 'fmhy+github+alternativeto';
      content.updatedAt = new Date().toISOString();
      updated++;
    }
  }

  for (const [id, content] of Object.entries(generated)) {
    writeFileSync(
      join(GENERATED_DIR, `${id}.json`),
      JSON.stringify(content, null, 2)
    );
  }

  console.log(`\n✅ Done!`);
  console.log(`  Matched: ${matched}/${genIds.length}`);
  console.log(`  Updated: ${updated}`);
}

main();
