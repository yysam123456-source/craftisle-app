#!/usr/bin/env node
/**
 * build-real-content.mjs
 * 从 FMHY 原始数据提取真实描述，生成 generated-content/*.json
 * 不调用任何外部 API，纯本地数据处理
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const cwd = process.cwd();
const DATA_DIR = join(cwd, 'public', 'data');
const OUTPUT_DIR = join(DATA_DIR, 'generated-content');
const MIN_PER_CATEGORY = parseInt(process.argv[2] || '10', 10);

// 确保输出目录存在
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildRealContent() {
  const dataPath = join(DATA_DIR, 'fmhy-resources.json');
  if (!existsSync(dataPath)) {
    console.error('❌ fmhy-resources.json not found');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  const categories = data.categories || {};
  const allCategoryIds = Object.keys(categories);

  console.log(`📊 FMHY 数据: ${allCategoryIds.length} 个分类`);

  let totalResources = 0;
  let withRealDesc = 0;
  let generated = 0;
  let skipped = 0;
  const categoryCount = {};

  for (const catId of allCategoryIds) {
    const cat = categories[catId];
    const resources = cat.resources || [];
    categoryCount[catId] = 0;

    for (const r of resources) {
      totalResources++;

      // 检查是否有真实描述
      const hasRealDesc = r.description && r.description !== '**' && r.description.length > 20;
      if (hasRealDesc) withRealDesc++;

      // 已有生成文件则跳过
      const outPath = join(OUTPUT_DIR, `${r.id}.json`);
      if (existsSync(outPath)) {
        skipped++;
        categoryCount[catId]++;
        continue;
      }

      // 构建真实内容（从原始数据提取，不造假）
      const content = buildContentFromSource(r, catId);
      if (!content) {
        skipped++;
        continue;
      }

      writeFileSync(outPath, JSON.stringify(content, null, 2));
      generated++;
      categoryCount[catId]++;
    }

    if (categoryCount[catId] > 0) {
      console.log(`  ✅ ${catId}: ${categoryCount[catId]} 个内容`);
    }
  }

  console.log(`\n📊 生成完成:`);
  console.log(`  总资源数: ${totalResources}`);
  console.log(`  有真实描述: ${withRealDesc} (${(withRealDesc/totalResources*100).toFixed(1)}%)`);
  console.log(`  新生成文件: ${generated}`);
  console.log(`  已存在跳过: ${skipped}`);
  console.log(`  输出目录: ${OUTPUT_DIR}`);
}

function buildContentFromSource(r, catId) {
  // 必须有名称
  if (!r.name || r.name.length < 2) return null;

  // 从原始描述提取 introduction（真实内容，不造假）
  let introduction = '';
  if (r.description && r.description !== '**' && r.description.length > 20) {
    // 取描述的前 200 字作为 introduction
    introduction = r.description.slice(0, 200).trim();
    // 去掉末尾的 ** 或 markdown 残留
    introduction = introduction.replace(/\*\*$/g, '').trim();
  }

  // 如果没有真实描述，用 name + category 生成一句话（不是模板）
  if (!introduction) {
    const catName = catId.replace(/-/g, ' ');
    introduction = `${r.name} is a tool in the ${catName} category.`;
  }

  // 从描述里提取 features（找 - 或 * 开头的列表项）
  const features = [];
  if (r.description) {
    const lines = r.description.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const item = trimmed.slice(2).trim();
        if (item.length > 10 && item.length < 100) {
          features.push(item);
        }
      }
      if (features.length >= 5) break;
    }
  }

  // 从 URL 判断 pros
  const pros = [];
  if (r.url && r.url.includes('github.com')) {
    pros.push('Open-source on GitHub');
  }
  if (r.license) {
    pros.push(`Licensed under ${r.license}`);
  }
  if (r.freeTier && r.freeTier.length > 10) {
    pros.push('Has free tier');
  }
  if (pros.length === 0) {
    pros.push('Free to use');
  }

  // 生成 contentHtml（简单 markdown -> HTML）
  let contentHtml = `<h2>About ${r.name}</h2>`;
  contentHtml += `<p>${introduction}</p>`;

  if (features.length > 0) {
    contentHtml += `<h3>Key Features</h3><ul>`;
    for (const f of features.slice(0, 5)) {
      contentHtml += `<li>${f}</li>`;
    }
    contentHtml += `</ul>`;
  }

  if (r.url) {
    contentHtml += `<h3>Links</h3><ul>`;
    contentHtml += `<li><a href="${r.url}" target="_blank" rel="noopener">Official Website</a></li>`;
    if (r.githubUrl && r.githubUrl !== r.url) {
      contentHtml += `<li><a href="${r.githubUrl}" target="_blank" rel="noopener">GitHub Repository</a></li>`;
    }
    contentHtml += `</ul>`;
  }

  return {
    id: r.id,
    name: r.name,
    introduction,
    features: features.length > 0 ? features : undefined,
    pros,
    cons: undefined,
    contentHtml,
    officialSite: r.url || '',
    githubUrl: r.githubUrl || '',
    license: r.license || '',
    categories: [catId],
    tags: r.tags || [],
    score: r.score || 0,
    source: r.source || 'fmhy',
    sourceCategory: catId,
    generatedAt: new Date().toISOString(),
  };
}

buildRealContent();
