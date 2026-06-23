/**
 * 从 free-for-dev README.md 解析资源描述，批量写入 JSON 文件
 * 用法: node parse-readme.js
 */

const fs = require('fs');
const path = require('path');

const MD_FILE = path.join(__dirname, 'free-for-dev-raw.md');
const JSON_FILE = path.join(__dirname, '../../public/data/free-for-dev-resources.json');

function parseMarkdown(mdContent) {
  const lines = mdContent.split('\n');
  const resources = [];
  let currentCategory = '';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 提取 ## Category 标题
    const catMatch = trimmed.match(/^##\s+(.+)$/);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      i++;
      continue;
    }

    // 匹配资源行: * [name](url) 或 - [name](url)
    // 后面可能跟 " - description" 在同一行
    const resourceMatch = trimmed.match(/^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^\)]+)\)\s*(?:-\s*(.*))?$/);
    if (resourceMatch) {
      const name = resourceMatch[1].trim();
      const url = resourceMatch[2].trim();
      let description = (resourceMatch[3] || '').trim();

      // 收集子项（缩进的 * 行）= freeTier 详情
      const freeTierLines = [];
      let j = i + 1;
      while (j < lines.length) {
        const subLine = lines[j];
        // 子项以至少2个空格或1个tab开头，然后是 * 或 -
        if (/^\s+[-*]\s+/.test(subLine) && !/^\s*[-*]\s+\[/.test(subLine.trim())) {
          const subContent = subLine.replace(/^\s+[-*]\s+/, '').trim();
          if (subContent) freeTierLines.push(subContent);
          j++;
        } else if (subLine.trim() === '') {
          j++; // 跳过空行
        } else {
          break;
        }
      }

      // 如果 description 在子项收集完后仍为空，尝试取下一行非子项的描述
      if (!description) {
        let k = i + 1;
        while (k < j) {
          const maybeDesc = lines[k].trim();
          if (maybeDesc && !/^\s+[-*]\s+/.test(lines[k]) && !maybeDesc.startsWith('* [')) {
            description = maybeDesc.replace(/^[-*]\s+/, '').trim();
            break;
          }
          k++;
        }
      }

      const freeTier = freeTierLines.join('\n');

      resources.push({
        name,
        url,
        category: currentCategory,
        description,
        freeTier,
        id: `free-for-dev--${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`
      });

      i = j;
      continue;
    }

    i++;
  }

  return resources;
}

function buildId(name, url) {
  // 尝试从 url 生成 id，与 JSON 中的 id 格式匹配
  // JSON 中的 id 格式: free-for-dev--xxx
  // 先基于 name 生成
  const fromName = `free-for-dev--${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}`;
  return fromName;
}

function main() {
  console.log('Reading markdown...');
  const mdContent = fs.readFileSync(MD_FILE, 'utf8');
  
  console.log('Parsing markdown...');
  const parsed = parseMarkdown(mdContent);
  console.log(`Parsed ${parsed.length} resources from markdown`);

  console.log('Reading JSON...');
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const jsonResources = data.resources || [];
  console.log(`JSON has ${jsonResources.length} resources`);

  // 构建 JSON 资源的查找索引: id -> resource, name -> resource, url -> resource
  const byId = {}
  const byName = {};
  const byUrl = {};
  jsonResources.forEach(r => {
    byId[r.id] = r;
    byName[r.name?.toLowerCase()] = r;
    try {
      const u = new URL(r.url);
      const host = u.hostname.replace(/^www\./, '');
      byUrl[host] = r;
      byUrl[r.url] = r;
    } catch {}
  });

  let updated = 0;
  let matched = 0;
  let unmatched = [];

  parsed.forEach(p => {
    // 尝试匹配
    let target = byId[p.id] || byName[p.name.toLowerCase()];
    if (!target) {
      try {
        const u = new URL(p.url);
        const host = u.hostname.replace(/^www\./, '');
        target = byUrl[host] || byUrl[p.url];
      } catch {}
    }

    if (target) {
      matched++;
      let changed = false;
      if (p.description && (!target.description || target.description.length < p.description.length)) {
        target.description = p.description;
        changed = true;
      }
      if (p.freeTier && (!target.freeTier || target.freeTier.length < p.freeTier.length)) {
        target.freeTier = p.freeTier;
        changed = true;
      }
      if (changed) updated++;
    } else {
      unmatched.push(p.name);
    }
  });

  console.log(`Matched: ${matched}, Updated: ${updated}`);
  if (unmatched.length > 0) {
    console.log(`Unmatched (${unmatched.length}):`, unmatched.slice(0, 10).join(', '));
  }

  // 写回 JSON
  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Written to ${JSON_FILE}`);

  // 统计
  const stillNeed = data.resources.filter(r => !r.description || r.description.length < 10);
  console.log(`\nAfter update: ${data.resources.length - stillNeed.length} have descriptions, ${stillNeed.length} still need descriptions`);
}

main();
