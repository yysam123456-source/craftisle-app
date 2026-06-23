/**
 * 从 free-for-dev README 解析所有资源描述，强制写入 JSON
 * 用法: node force-enrich.js
 */

const fs = require('fs');
const path = require('path');

const MD_FILE = path.join(__dirname, 'free-for-dev-raw.md');
const JSON_FILE = path.join(__dirname, '../../public/data/free-for-dev-resources.json');

function normalizeUrl(u) {
  try {
    return u.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase().replace(/\/+$/, '');
  } catch {
    return u.toLowerCase().replace(/\/+$/, '');
  }
}

function parseAll(raw) {
  const lines = raw.split('\n');
  const results = [];
  let cat = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    // 分类标题
    const cm = t.match(/^##\s+(.+)$/);
    if (cm) { cat = cm[1].trim(); i++; continue; }

    // 资源行: 任意缩进 + "* [name](url)" 
    // 描述分隔符可能是 - 或 — 或 –
    const rm = t.match(/^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (rm) {
      const name = rm[1].trim();
      const url = rm[2].trim();
      
      // 提取描述：找第一个 - 或 — 或 – 后面的内容
      const afterUrl = t.slice(t.indexOf(url) + url.length);
      let desc = '';
      const dashMatch = afterUrl.match(/^\s+[\-–—]\s+(.*)/);
      if (dashMatch) {
        desc = dashMatch[1].trim();
      }

      // 收集子项（更深缩进的行）
      const subLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const sub = lines[j];
        if (/^\s+[-*]\s+/.test(sub) && !sub.includes('](')) {
          subLines.push(sub.replace(/^\s+[-*]\s+/, '').trim());
          j++;
        } else if (sub.trim() === '') {
          j++;
        } else {
          break;
        }
      }

      const freeTier = subLines.join('\n');

      results.push({ name, url, urlKey: normalizeUrl(url), cat, desc, freeTier });
      i = j;
      continue;
    }

    i++;
  }
  return results;
}

function main() {
  console.log('[1/4] 读取 markdown...');
  const raw = fs.readFileSync(MD_FILE, 'utf8');
  console.log('  大小:', raw.length, '字节');

  console.log('[2/4] 解析资源列表...');
  const parsed = parseAll(raw);
  console.log('  解析到:', parsed.length, '个资源');

  // 调试：输出前5个和 Azure 段落的几个
  console.log('\n  样本（前5个）:');
  parsed.slice(0, 5).forEach(r => {
    console.log(`    ${r.name} | ${r.url} | desc=${r.desc.slice(0,50)}...`);
  });
  const azureItems = parsed.filter(r => r.url.includes('azure.microsoft.com'));
  console.log(`\n  Azure 相关资源（${azureItems.length}个）:`);
  azureItems.slice(0, 8).forEach(r => {
    console.log(`    ${r.name} | desc=${r.desc.slice(0,60)}`);
  });

  console.log('\n[3/4] 读取 JSON...');
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const resources = data.resources || [];
  console.log('  JSON 资源数:', resources.length);

  // 构建 URL 索引
  const byUrl = {};
  resources.forEach((r, idx) => {
    if (!r.url) return;
    const key = normalizeUrl(r.url);
    byUrl[key] = idx;
  });
  console.log('  URL 索引数:', Object.keys(byUrl).length);

  // 匹配并写入
  let matched = 0, updated = 0, fail = [];
  parsed.forEach(p => {
    const idx = byUrl[p.urlKey];
    if (idx !== undefined) {
      matched++;
      let changed = false;
      if (p.desc && (!resources[idx].description || resources[idx].description.length < p.desc.length)) {
        resources[idx].description = p.desc;
        changed = true;
      }
      if (p.freeTier && (!resources[idx].freeTier || resources[idx].freeTier.length < p.freeTier.length)) {
        resources[idx].freeTier = p.freeTier;
        changed = true;
      }
      if (changed) updated++;
    } else {
      fail.push(p.name + ' | ' + p.url);
    }
  });

  console.log(`\n[4/4] 结果: 匹配=${matched}, 更新=${updated}, 未匹配=${fail.length}`);
  if (fail.length > 0 && fail.length <= 20) {
    console.log('  未匹配:');
    fail.forEach(f => console.log('    ' + f));
  }

  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('\n  已写入:', JSON_FILE);

  const still = resources.filter(r => !r.description || r.description.trim().length < 10);
  console.log(`\n✅ 完成: ${resources.length - still.length} 有描述, ${still.length} 仍缺失`);
  if (still.length > 0 && still.length <= 30) {
    console.log('  仍缺失:');
    still.forEach(r => console.log('    ' + r.id + ' | ' + r.name + ' | ' + r.url));
  }
}

main();
