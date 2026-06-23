/**
 * 从 free-for-dev README 解析描述，按 URL 域名匹配写入 JSON
 * 用法: node enrich-from-readme.js
 */

const fs = require('fs');
const path = require('path');
const url = require('url');

const MD_FILE = path.join(__dirname, 'free-for-dev-raw.md');
const JSON_FILE = path.join(__dirname, '../../public/data/free-for-dev-resources.json');

function normalizeUrl(u) {
  try {
    // 去掉协议头和 www.
    return u.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
  } catch {
    return u.toLowerCase();
  }
}

function parseMarkdown(mdContent) {
  const lines = mdContent.split('\n');
  const resources = [];
  let currentCategory = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 提取 ## Category
    const catMatch = trimmed.match(/^##\s+(.+)$/);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      i++;
      continue;
    }

    // 匹配资源行: * [name](url)  - description
    const resMatch = trimmed.match(/^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^\)]+)\)\s*(?:-\s*(.*))?$/);
    if (resMatch) {
      const name = resMatch[1].trim();
      const resourceUrl = resMatch[2].trim();
      let description = (resMatch[3] || '').trim();

      // 收集子项（缩进的 * 行）
      const freeTierLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const sub = lines[j];
        if (/^\s+[-*]\s+/.test(sub) && !/^\s*[-*]\s+\[/.test(sub.trim())) {
          const content = sub.replace(/^\s+[-*]\s+/, '').trim();
          if (content) freeTierLines.push(content);
          j++;
        } else if (sub.trim() === '') {
          j++;
        } else {
          break;
        }
      }

      // 如果 description 为空，尝试从子项后的非缩进行获取
      if (!description) {
        let k = i + 1;
        while (k < j) {
          const maybe = lines[k].trim();
          if (maybe && !/^\s+/.test(lines[k]) && !maybe.startsWith('* [') && !maybe.startsWith('- [')) {
            description = maybe.replace(/^[-*]\s+/, '').trim();
            break;
          }
          k++;
        }
      }

      resources.push({
        name,
        url: resourceUrl,
        urlKey: normalizeUrl(resourceUrl),
        category: currentCategory,
        description,
        freeTier: freeTierLines.join('\n')
      });

      i = j;
      continue;
    }

    i++;
  }

  return resources;
}

function main() {
  console.log('Reading markdown...');
  const mdContent = fs.readFileSync(MD_FILE, 'utf8');
  console.log('Parsing markdown...');
  const parsed = parseMarkdown(mdContent);
  console.log(`Parsed ${parsed.length} resources from markdown`);

  console.log('Reading JSON...');
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const resources = data.resources || [];
  console.log(`JSON has ${resources.length} resources`);

  // 构建 URL 索引（用于匹配）
  const byUrlKey = {};
  resources.forEach((r, idx) => {
    if (!r.url) return;
    const key = normalizeUrl(r.url);
    byUrlKey[key] = idx;
    // 也索引去掉末尾斜杠的
    const keyNoSlash = key.replace(/\/+$/, '');
    if (keyNoSlash !== key) byUrlKey[keyNoSlash] = idx;
  });

  let updated = 0;
  let matched = 0;
  const unmatched = [];

  parsed.forEach(p => {
    const idx = byUrlKey[p.urlKey] ?? byUrlKey[p.urlKey.replace(/\/+$/, '')];
    if (idx !== undefined) {
      matched++;
      let changed = false;
      if (p.description && (!resources[idx].description || resources[idx].description.length < p.description.length)) {
        resources[idx].description = p.description;
        changed = true;
      }
      if (p.freeTier && (!resources[idx].freeTier || resources[idx].freeTier.length < p.freeTier.length)) {
        resources[idx].freeTier = p.freeTier;
        changed = true;
      }
      if (changed) updated++;
    } else {
      unmatched.push(p.name + ' | ' + p.url);
    }
  });

  console.log(`Matched: ${matched}, Updated: ${updated}`);
  if (unmatched.length > 0 && unmatched.length <= 20) {
    console.log(`Unmatched (${unmatched.length}):`, unmatched.join('\n  '));
  } else if (unmatched.length > 20) {
    console.log(`Unmatched: ${unmatched.length} (too many to show)`);
  }

  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Written to ${JSON_FILE}`);

  const stillNeed = resources.filter(r => !r.description || r.description.trim().length < 10);
  console.log(`\nResult: ${resources.length - stillNeed.length} have descriptions, ${stillNeed.length} still need`);
  if (stillNeed.length > 0 && stillNeed.length <= 30) {
    console.log('Still need:', stillNeed.map(r => r.id + ': ' + (r.url || 'no url')).join('\n  '));
  }
}

main();
