#!/usr/bin/env node
/**
 * import-selfhosted-to-content.mjs
 * 把 awesome-selfhosted 数据直接转换成 generated-content/*.json
 * 不依赖匹配 FMHY，直接用 awesome-selfhosted 的 id
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const ASH_FILE = join(DATA_DIR, 'awesome-selfhosted-resources.json');

function main() {
  console.log('📦 Importing awesome-selfhosted resources to generated-content...\n');

  if (!existsSync(ASH_FILE)) {
    console.error('❌ awesome-selfhosted-resources.json not found.');
    process.exit(1);
  }

  const ash = JSON.parse(readFileSync(ASH_FILE, 'utf-8'));
  const resources = ash.resources || [];
  console.log(`✓ Loaded ${resources.length} resources`);

  let imported = 0;
  let skipped = 0;

  for (const r of resources) {
    if (!r.id || !r.name) {
      skipped++;
      continue;
    }

    const desc = r.description || '';
    // 只导入有真实描述的资源
    if (!desc || desc === '**' || desc.length < 20) {
      skipped++;
      continue;
    }

    const content = {
      id: r.id,
      name: r.name,
      introduction: desc,
      description: desc,
      url: r.url || '',
      pricing: r.isFree ? 'Free' : 'Unknown',
      license: r.license || '',
      tech: r.language || '',
      category: r.category || '',
      tags: r.tags || [],
      pros: [],
      cons: [],
      useCases: r.description ? [r.description] : [],
      alternatives: [],
      similarAlternatives: [],
      source: 'awesome-selfhosted',
      updatedAt: new Date().toISOString()
    };

    const outPath = join(GENERATED_DIR, `${r.id}.json`);
    writeFileSync(outPath, JSON.stringify(content, null, 2));
    imported++;
  }

  console.log(`\n✅ Done! Imported: ${imported}, Skipped: ${skipped}`);
  console.log(`   Output: ${GENERATED_DIR}`);
}

main();
