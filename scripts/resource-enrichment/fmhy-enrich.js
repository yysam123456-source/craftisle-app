/**
 * FMHY 模板化描述替换脚本
 * 策略：爬取资源官网的 meta description 或第一段可见文本
 * 仅替换模板化描述（包含 "An AI-powered tool" 等模板）
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const DATA_FILE = path.join(__dirname, '../../public/data/fmhy-resources.json');
const CHECKPOINT = path.join(__dirname, 'fmhy-enrich-checkpoint.json');

// 模板化描述的特征
const TEMPLATE_PATTERNS = [
  'An AI-powered tool that helps with',
  'AI-powered',
  'helps with',
  'Useful for automating',
  'A tool that helps',
];

function isTemplateDesc(desc) {
  if (!desc) return true;
  return TEMPLATE_PATTERNS.some(p => desc.includes(p));
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}

function fetchMetaDesc(url) {
  return new Promise((resolve) => {
    const timeout = 8000;
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;

    const req = client.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CraftisleBot/1.0; +https://craftisle.com)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      rejectUnauthorized: false,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return resolve(fetchMetaDesc(next));
      }

      if (res.statusCode !== 200) {
        return resolve(null);
      }

      let data = '';
      let total = 0;
      const MAX = 200 * 1024; // 200KB

      res.on('data', (chunk) => {
        data += chunk.toString();
        total += chunk.length;
        if (total > MAX) {
          req.destroy();
        }
      });

      res.on('end', () => {
        resolve(extractDesc(data));
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => resolve(null));
  });
}

function extractDesc(html) {
  // 尝试 meta description
  const metaPatterns = [
    /<meta\s+name=["']description["']\s+content=["']([^"']{20,300})["']/i,
    /<meta\s+content=["']([^"']{20,300})["']\s+name=["']description["']/i,
    /<meta\s+property=["']og:description["']\s+content=["']([^"']{20,300})["']/i,
  ];

  for (const re of metaPatterns) {
    const m = html.match(re);
    if (m && m[1].trim().length >= 20) {
      return cleanText(m[1]);
    }
  }

  // 回退：第一段可见文本
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > 30) {
    return cleaned.slice(0, 200).trim();
  }

  return null;
}

function cleanText(s) {
  return s.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const allResources = [];
  Object.values(data.categories).forEach(cat => {
    (cat.resources || []).forEach(r => allResources.push(r));
  });

  console.log(`[main] Total FMHY resources: ${allResources.length}`);

  // 找出模板化描述
  const needUpdate = allResources.filter(r => isTemplateDesc(r.description));
  console.log(`[main] Template/empty descriptions to replace: ${needUpdate.length}`);

  if (needUpdate.length === 0) {
    console.log('[main] No template descriptions found, all done!');
    return;
  }

  // 加载 checkpoint
  let checkpoint = { updated: 0, failed: 0, done: [] };
  if (fs.existsSync(CHECKPOINT)) {
    checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT, 'utf8'));
    console.log(`[main] Resuming from checkpoint: updated=${checkpoint.updated}, failed=${checkpoint.failed}`);
  }

  const toProcess = needUpdate.filter(r => !checkpoint.done.includes(r.id));
  console.log(`[main] Remaining to process: ${toProcess.length}`);

  const BATCH = 30;
  const CONCURRENCY = 5;
  let idx = 0;

  async function processBatch() {
    const batch = toProcess.slice(idx, idx + BATCH);
    if (batch.length === 0) return;

    console.log(`\n[batch] Processing ${idx + 1}–${idx + batch.length} of ${toProcess.length}...`);
    idx += batch.length;

    const results = [];
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const chunk = batch.slice(i, i + CONCURRENCY);
      const promises = chunk.map(r =>
        fetchMetaDesc(r.url)
          .then(desc => ({ id: r.id, url: r.url, desc, ok: !!desc }))
          .catch(() => ({ id: r.id, url: r.url, desc: null, ok: false }))
      );
      const settled = await Promise.all(promises);
      results.push(...settled);

      const progress = settled.filter(s => s.ok).length;
      console.log(`  chunk ${Math.floor(i / CONCURRENCY) + 1}: ${progress}/${settled.length} got description`);
    }

    // 应用结果
    results.forEach(({ id, desc, ok }) => {
      if (!ok || !desc) {
        checkpoint.failed++;
        return;
      }
      // 找到资源并更新
      for (const cat of Object.values(data.categories)) {
        const rr = (cat.resources || []).find(rr => rr.id === id);
        if (rr) {
          rr.description = desc;
          checkpoint.updated++;
          break;
        }
      }
      checkpoint.done.push(id);
    });

    // 保存 checkpoint + 写回 JSON
    fs.writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2));
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[batch] ✅ Saved. Total updated: ${checkpoint.updated}, failed: ${checkpoint.failed}`);
  }

  while (idx < toProcess.length) {
    await processBatch();
    if (idx < toProcess.length) {
      console.log('  Waiting 3s before next batch...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log(`\n✅ All done! Updated: ${checkpoint.updated}, Failed: ${checkpoint.failed}`);
  console.log('Checkpoint saved to:', CHECKPOINT);
}

main().catch(e => console.error('Fatal:', e.message));
