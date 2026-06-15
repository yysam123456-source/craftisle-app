#!/usr/bin/env node
/**
 * test-automation-pipeline.mjs
 * 测试所有自动化脚本，生成详细报告
 * 
 * 使用方法：node scripts/test-automation-pipeline.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');

// 测试配置
const TEST_CONFIG = {
  timeout: 60000, // 60秒超时
  scripts: [
    {
      name: 'FMHY Data Sync',
      script: 'scripts/sync-fmhy.mjs',
      command: 'node scripts/sync-fmhy.mjs',
      expectedOutput: '✅',
      critical: true
    },
    {
      name: 'Populate Content by Category',
      script: 'scripts/populate-content-by-category.mjs',
      command: 'node scripts/populate-content-by-category.mjs 5',
      expectedOutput: '✅',
      critical: false
    },
    {
      name: 'Update GitHub Stars',
      script: 'scripts/update-github-stars.mjs',
      command: 'npm run update:github-stars',
      expectedOutput: '✅',
      critical: false,
      timeout: 120000 // 2分钟
    }
  ]
};

// 执行命令并捕获输出
function runCommand(command, timeout = 60000) {
  try {
    const output = execSync(command, {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message 
    };
  }
}

// 检查文件是否更新
function checkFileUpdated(filePath, referenceTime) {
  try {
    const stats = require('fs').statSync(filePath);
    return stats.mtime > referenceTime;
  } catch {
    return false;
  }
}

// 主测试函数
async function testAutomationPipeline() {
  console.log('🧪 Testing Automation Pipeline\n');
  console.log('='.repeat(60));
  
  const results = [];
  const startTime = new Date();
  
  // 测试每个脚本
  for (const config of TEST_CONFIG.scripts) {
    console.log(`\n📋 Testing: ${config.name}`);
    console.log('-'.repeat(40));
    
    const scriptPath = join(ROOT_DIR, config.script);
    if (!existsSync(scriptPath)) {
      console.log(`❌ Script not found: ${config.script}`);
      results.push({
        name: config.name,
        status: 'FAILED',
        reason: 'Script not found',
        critical: config.critical
      });
      continue;
    }
    
    console.log(`⏳ Running: ${config.command}`);
    const result = runCommand(config.command, config.timeout || TEST_CONFIG.timeout);
    
    if (result.success) {
      console.log(`✅ ${config.name}: PASSED`);
      results.push({
        name: config.name,
        status: 'PASSED',
        output: result.output.slice(0, 200) // 前200个字符
      });
    } else {
      console.log(`❌ ${config.name}: FAILED`);
      console.log(`   Reason: ${result.error || 'Unknown error'}`);
      results.push({
        name: config.name,
        status: 'FAILED',
        reason: result.error || 'Unknown error',
        critical: config.critical
      });
    }
  }
  
  // 生成报告
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n\n📊 Automation Pipeline Test Report');
  console.log('='.repeat(60));
  console.log(`⏰ Test Duration: ${duration.toFixed(2)}s`);
  console.log(`📅 Test Time: ${startTime.toISOString()}`);
  console.log('');
  
  // 统计
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const criticalFailed = results.filter(r => r.status === 'FAILED' && r.critical).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`🔥 Critical Failed: ${criticalFailed}`);
  console.log('');
  
  // 详细结果
  console.log('📋 Detailed Results:');
  console.log('-'.repeat(40));
  for (const result of results) {
    const icon = result.status === 'PASSED' ? '✅' : '❌';
    const critical = result.critical ? ' [CRITICAL]' : '';
    console.log(`${icon} ${result.name}${critical}`);
    if (result.status === 'FAILED') {
      console.log(`   └── Reason: ${result.reason}`);
    }
  }
  
  // 建议
  console.log('\n\n💡 Recommendations:');
  console.log('-'.repeat(40));
  if (criticalFailed > 0) {
    console.log('🔥 CRITICAL: Some critical automation scripts failed!');
    console.log('   Please fix them before deploying to production.');
  } else if (failed > 0) {
    console.log('⚠️ WARNING: Some non-critical scripts failed.');
    console.log('   Consider fixing them to improve automation coverage.');
  } else {
    console.log('🎉 All automation scripts passed!');
    console.log('   Your automation pipeline is ready for production.');
  }
  
  console.log('\n' + '='.repeat(60));
  
  // 返回退出码
  process.exit(criticalFailed > 0 ? 1 : 0);
}

// 运行测试
testAutomationPipeline().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});
