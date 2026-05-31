// build.mjs — 将 @flyfish-group/file-viewer-web 的 viewer/ 静态站点复制到 public/
import { rm, cp, mkdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PUBLIC = resolve(ROOT, 'public');
const SRC = resolve(ROOT, 'node_modules/@flyfish-group/file-viewer-web/viewer');

try { await rm(PUBLIC, { recursive: true, force: true }); } catch {}
await mkdir(PUBLIC, { recursive: true });
await cp(SRC, PUBLIC, { recursive: true });
console.log('✅ Build complete: public/ ready for Cloudflare Pages');
console.log('Contents:', (await (await import('fs')).readdirSync(PUBLIC)).join(', '));
