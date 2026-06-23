/**
 * 极简可靠版：从 free-for-dev README 提取描述并写入 JSON
 * 用法: node simple-enrich.js
 */

const fs = require('fs');
const path = require('path');

const MD_FILE = path.join(__dirname, 'free-for-dev-raw.md');
const JSON_FILE = path.join(__dirname, '../../public/data/free-for-dev-resources.json');

function norm(u) {
  try {
    return u.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function main() {
  // 1. 解析 markdown
  const md = fs.readFileSync(MD_FILE, 'utf8');
  const lines = md.split('\n');
  const mdList = [];

  for (const line of lines) {
    const t = line.trim();
    const m = t.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/);
    if (!m) continue;
    const name = m[1].trim();
    const url = m[2].trim();
    // 描述 = ")" 之后，去掉开头的 " - " 或 " — "
    const rest = t.slice(t.indexOf(url) + url.length);
    let desc = rest.replace(/^[\s\-–—]+/, '').trim();
    mdList.push({ name, url, key: norm(url), desc });
  }
  console.log('[1] Markdown 解析到:', mdList.length, '个资源');

  // 2. 读 JSON
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  const resources = data.resources || [];
  console.log('[2] JSON 资源数:', resources.length);

  // 3. 构建 URL 索引
  const byKey = {};
  resources.forEach((r, idx) => {
    if (!r.url) return;
    const k = norm(r.url);
    byKey[k] = idx;
  });
  console.log('[3] URL 索引数:', Object.keys(byKey).length);

  // 4. 匹配并写入
  let hit = 0, upd = 0;
  const noMatch = [];
  mdList.forEach(p => {
    const idx = byKey[p.key];
    if (idx === undefined) { noMatch.push(p.name + ' | ' + p.url); return; }
    hit++;
    let ch = false;
    if (p.desc && (!resources[idx].description || resources[idx].description.length < p.desc.length)) {
      resources[idx].description = p.desc;
      ch = true;
    }
    if (ch) upd++;
  });
  console.log('[4] 匹配:', hit, '  更新:', upd, '  未匹配:', noMatch.length);

  fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('[5] 已写入:', JSON_FILE);

  const still = resources.filter(r => !r.description || r.description.trim().length < 10);
  console.log('\n✅ 完成:', resources.length - still.length, '有描述,', still.length, '仍缺失');
  if (still.length > 0 && still.length <= 30) {
    console.log('仍缺失:');
    still.forEach(r => console.log('  ' + r.id + ' | ' + r.name + ' | ' + r.url));
  }
}

main();
