#!/usr/bin/env node
/**
 * import-freefordev-to-content.mjs
 * 把 free-for-dev 数据转换成 generated-content/*.json
 * 使用 freeTier 字段作为 pricing/description
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'public', 'data');
const GENERATED_DIR = join(DATA_DIR, 'generated-content');
const FFD_FILE = join(DATA_DIR, 'free-for-dev-resources.json');

function main() {
  console.log('📦 Importing free-for-dev resources to generated-content...\n');

  if (!existsSync(FFD_FILE)) {
    console.error('❌ free-for-dev-resources.json not found.');
    process.exit(1);
  }

  const ffd = JSON.parse(readFileSync(FFD_FILE, 'utf-8'));
  const resources = ffd.resources || [];
  console.log(`✓ Loaded ${resources.length} resources`);

  let imported = 0;
  let skipped = 0;

  for (const r of resources) {
    if (!r.id || !r.name) {
      skipped++;
      continue;
    }

    // 使用 freeTier 作为 description（如果 description 为空）
    const desc = (r.description || '').trim() || (r.freeTier ? r.freeTier.slice(0, 200) : '').trim();
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
      pricing: 'Free Tier',
      freeTier: r.freeTier || '',
      category: r.category || '',
      tags: r.tags || [],
      pros: [],
      cons: [],
      useCases: [],
      alternatives: [],
      similarAlternatives: [],
      source: 'free-for-dev',
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
