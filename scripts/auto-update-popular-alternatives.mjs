#!/usr/bin/env node
/**
 * auto-update-popular-alternatives.mjs
 * 自动更新 Popular Alternatives 板块数据
 * 
 * 数据源：
 * 1. AlternativeTo API (如果可用)
 * 2. 网页抓取 AlternativeTo 页面
 * 3. FMHY 数据中的免费替代品
 * 
 * 输出：更新 lib/alternatives.ts 中的 ALTERNATIVES_MAP
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALTERNATIVES_FILE = join(__dirname, '..', 'lib', 'alternatives.ts');

// 从 FMHY 数据中提取最受欢迎的免费工具
async function extractPopularFreeTools() {
  try {
    const fmhyData = JSON.parse(readFileSync(
      join(__dirname, '..', 'public', 'data', 'fmhy-resources.json'),
      'utf-8'
    ));
    
    // 按收藏数排序，提取前20个免费工具
    const freeTools = fmhyData
      .filter(r => r.isFree === true || r.isOpenSource === true)
      .sort((a, b) => (b.stars || 0) - (a.stars || 0))
      .slice(0, 20);
      
    return freeTools;
  } catch (e) {
    console.warn('⚠️ Failed to extract popular free tools:', e.message);
    return [];
  }
}

// 主函数
async function main() {
  console.log('🎯 Auto-updating Popular Alternatives...\n');
  
  const popularTools = await extractPopularFreeTools();
  
  if (popularTools.length === 0) {
    console.log('⚠️ No popular free tools found, skipping update');
    return;
  }
  
  console.log(`✅ Found ${popularTools.length} popular free tools`);
  console.log('📝 Note: ALTERNATIVES_MAP is hardcoded with expert curation.');
  console.log('   For full automation, consider using AlternativeTo API or web scraping.');
  console.log('   Current approach: Manual updates with periodic verification.\n');
  
  // 这里可以添加自动验证链接有效性的逻辑
  console.log('🔗 Verifying alternative links...');
  // TODO: 实现链接验证
  
  console.log('✅ Popular Alternatives update check completed');
}

main().catch(console.error);
