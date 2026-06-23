#!/usr/bin/env python3
"""
FMHY 模板化描述替换脚本
- 爬取资源官网的 meta description
- 仅替换模板化/空描述
- 支持断点续传（checkpoint.json）
"""

import json, os, re, time, random
import requests
from bs4 import BeautifulSoup

DATA_FILE = os.path.join(os.path.dirname(__file__), '../../public/data/fmhy-resources.json')
CHECKPOINT = os.path.join(os.path.dirname(__file__), 'fmhy-enrich-checkpoint.json')
TEMPLATE_PATTERNS = ['An AI-powered tool', 'AI-powered', 'helps with', 'Useful for']

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; CraftisleBot/1.0; +https://craftisle.com)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)
SESSION.timeout = 10

def is_template(desc):
    if not desc or not desc.strip():
        return True
    return any(p in desc for p in TEMPLATE_PATTERNS)

def fetch_meta_desc(url):
    try:
        resp = SESSION.get(url, timeout=10, allow_redirects=True, verify=False)
        if resp.status_code != 200:
            return None
        html = resp.text[:300*1024]  # 最多300KB
        soup = BeautifulSoup(html, 'lxml')

        # 尝试 meta description
        for attr, val in [('name', 'description'), ('property', 'og:description'), ('name', 'twitter:description')]:
            tag = soup.find('meta', attrs={attr: val})
            if tag and tag.get('content', '').strip():
                content = tag['content'].strip()
                if len(content) >= 20:
                    return clean_text(content)

        # 回退：第一段可见文本
        for selector in ['p', 'article', 'section', 'main', 'div.content', 'div.description']:
            el = soup.select_one(selector)
            if el:
                text = el.get_text(strip=True)[:300]
                if len(text) >= 30:
                    return clean_text(text)

        return None
    except Exception as e:
        return None

def clean_text(s):
    return re.sub(r'\s+', ' ', s).strip()

def load_checkpoint():
    if os.path.exists(CHECKPOINT):
        return json.load(open(CHECKPOINT, 'r', encoding='utf-8'))
    return {'updated': 0, 'failed': 0, 'done': [], 'skipped': []}

def save_checkpoint(cp):
    json.dump(cp, open(CHECKPOINT, 'w', encoding='utf-8'), indent=2, ensure_ascii=False)

def main():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_resources = []
    for cat in data.get('categories', {}).values():
        all_resources.extend(cat.get('resources', []))

    print(f'[main] Total FMHY resources: {len(all_resources)}')

    need = [r for r in all_resources if is_template(r.get('description', ''))]
    print(f'[main] Template/empty descriptions to replace: {len(need)}')

    if len(need) == 0:
        print('[main] No template descriptions found, all done!')
        return

    cp = load_checkpoint()
    to_process = [r for r in need if r['id'] not in cp['done'] and r['id'] not in cp['skipped']]
    print(f'[main] Remaining to process: {len(to_process)}')
    print(f'[main] Checkpoint: updated={cp["updated"]}, failed={cp["failed"]}')

    BATCH = 50
    idx = 0

    while idx < len(to_process):
        batch = to_process[idx:idx+BATCH]
        idx += len(batch)
        print(f'\n[batch] Processing {idx-len(batch)+1}-{idx} of {len(to_process)}...')

        for r in batch:
            desc = fetch_meta_desc(r['url'])
            if desc and len(desc) >= 20:
                # 找到并更新
                for cat in data.get('categories', {}).values():
                    rr = [x for x in cat.get('resources', []) if x['id'] == r['id']]
                    if rr:
                        rr[0]['description'] = desc
                        cp['updated'] += 1
                        cp['done'].append(r['id'])
                        print(f'  ✅ {r["name"][:40]}: {desc[:60]}...')
                        break
            else:
                cp['failed'] += 1
                cp['skipped'].append(r['id'])
                print(f'  ❌ {r["name"][:40]}: no description found')

        # 每批结束后保存
        save_checkpoint(cp)
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f'[batch] ✅ Saved. Total updated: {cp["updated"]}, failed: {cp["failed"]}')

        if idx < len(to_process):
            wait = random.uniform(2, 4)
            print(f'  Waiting {wait:.1f}s before next batch...')
            time.sleep(wait)

    print(f'\n✅ All done! Updated: {cp["updated"]}, Failed: {cp["failed"]}')
    print(f'Checkpoint saved to: {CHECKPOINT}')

if __name__ == '__main__':
    main()
