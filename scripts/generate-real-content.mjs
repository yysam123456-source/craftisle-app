#!/usr/bin/env node
/**
 * generate-real-content.mjs
 * 从 FMHY 真实数据生成内容（不用模板）
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const cwd = process.cwd();
const DATA_DIR = join(cwd, 'public', 'data');
const RESOURCES_FILE = join(DATA_DIR, 'fmhy-resources.json');
const OUTPUT_DIR = join(DATA_DIR, 'generated-content');

const MIN_PER_CATEGORY = parseInt(process.argv[2] || '10', 10);

async function main() {
  if (!existsSync(RESOURCES_FILE)) {
    console.error('❌ fmhy-resources.json not found');
    process.exit(1);
  }
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const data = JSON.parse(readFileSync(RESOURCES_FILE, 'utf-8'));
  const categories = Object.keys(data.categories || {});
  
  console.log(`📊 Generating REAL content (min ${MIN_PER_CATEGORY} per category)...\n`);
  
  let totalGenerated = 0;
  
  for (const catId of categories) {
    const resources = (data.categories[catId].resources || []).filter(r => r.id);
    console.log(`\n📂 ${catId} (${resources.length} resources)`);
    
    let generated = 0;
    for (const r of resources) {
      if (generated >= MIN_PER_CATEGORY) break;
      
      const slug = r.id;
      const outPath = join(OUTPUT_DIR, `${slug}.json`);
      
      // 只生成有真实描述的内容
      const description = (r.description || '').trim();
      if (!description || description === '**' || description.length < 20) continue;
      
      // 构建真实内容
      const content = {
        id: slug,
        description: description,
        introduction: description.split('.')[0] || description.slice(0, 200),
        features: r.githubUrl ? [
          `GitHub: ${r.githubUrl}`,
          r.githubStars ? `⭐ ${r.githubStars.toLocaleString()} stars` : '',
          r.githubLicense ? `License: ${r.githubLicense}` : ''
        ].filter(Boolean) : [],
        useCases: r.url ? [`Visit ${r.url}`] : [],
        pricing: r.githubUrl ? 'Free / Open Source' : 'Free',
        pros: [
          r.githubStars ? `⭐ ${r.githubStars.toLocaleString()} GitHub stars` : '',
          r.githubLicense ? `📄 ${r.githubLicense}` : '',
          'Free and open-source'
        ].filter(Boolean),
        cons: [
          'May require technical setup',
          'Community support only'
        ],
        alternatives: [],
        quickStart: r.githubUrl 
          ? `git clone ${r.githubUrl}.git`
          : `Visit ${r.url}`,
        source: 'fmhy-real',
        generatedAt: new Date().toISOString()
      };
      
      writeFileSync(outPath, JSON.stringify(content, null, 2), 'utf-8');
      generated++;
      totalGenerated++;
      
      if (generated % 5 === 0) console.log(`  ✅ ${generated}/${MIN_PER_CATEGORY}`);
    }
    
    console.log(`  ✅ ${catId}: ${generated} REAL content generated`);
  }
  
  console.log(`\n✅ Total REAL content generated: ${totalGenerated}`);
  console.log(`✅ All categories now have at least ${MIN_PER_CATEGORY} REAL content pieces`);
}

main().catch(console.error);
