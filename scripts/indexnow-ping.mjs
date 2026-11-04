/**
 * IndexNow：内容变更时主动通知参与的搜索引擎。
 *
 * 官方定义（indexnow.org）："a simple ping so that search engines know that a URL
 * and its content has been added, updated, or deleted"，只用于让引擎优先抓取。
 * 🔴 边界（必须诚实）：
 *   · 支持方仅 Microsoft Bing / Naver / Seznam.cz / Yandex / Yep，**Google 不参与**；
 *   · 只承诺「即时通知」，**不承诺索引或排名**；页面质量差提交再快也没用；
 *   · 因此它只是一条辅助发现通道，不能当增长动作，也不写入曝光回读台账。
 *
 * 用法：
 *   node scripts/indexnow-ping.mjs               # dryRun，只打印将要提交的 URL
 *   node scripts/indexnow-ping.mjs --apply       # 真正 POST 到 api.indexnow.org
 *   INDEXNOW_DAYS=7 node ... --apply             # 只提交最近 N 天有真实改动的 URL
 *   INDEXNOW_URLS="https://... ,https://..." node ... --apply   # 显式指定 URL
 *
 * 时间源：data/content-lastmod.json（由 sync-content-lastmod.mjs 从台账生成），
 * 与 sitemap 的 lastModified 同一份真实日期，避免「全站同时提交」的噪声。
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const KEY = "1288c88560eae6cf8ee09a65102986e2";
const HOST = "craftisle.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";
const APPLY = process.argv.includes("--apply");
const DAYS = Number(process.env.INDEXNOW_DAYS ?? 7);
const DATA = resolve(process.cwd(), "data", "content-lastmod.json");

function collectUrls() {
  const explicit = process.env.INDEXNOW_URLS;
  if (explicit) {
    return explicit.split(",").map((s) => s.trim()).filter((s) => s.startsWith(`https://${HOST}/`));
  }
  if (!existsSync(DATA)) {
    console.error("[indexnow] 缺 data/content-lastmod.json —— 请先跑 scripts/sync-content-lastmod.mjs");
    return [];
  }
  const { urls } = JSON.parse(readFileSync(DATA, "utf-8"));
  const cutoff = Date.now() - DAYS * 86_400_000;
  return Object.entries(urls ?? {})
    .filter(([url, iso]) => url.startsWith(`https://${HOST}/`) && new Date(iso).getTime() >= cutoff)
    .map(([url]) => url);
}

const urlList = [...new Set(collectUrls())].sort();
console.log(`[indexnow] ${APPLY ? "APPLY" : "dryRun"} · 最近 ${DAYS} 天真实改动 ${urlList.length} 条 URL`);
for (const u of urlList.slice(0, 10)) console.log(`  ${u}`);
if (urlList.length > 10) console.log(`  … 其余 ${urlList.length - 10} 条`);

if (!APPLY) {
  console.log("[indexnow] dryRun 未发送。加 --apply 才真正 POST。");
  process.exit(0);
}
if (urlList.length === 0) {
  console.log("[indexnow] 无近期真实改动 ⇒ 不提交（避免无意义 ping）");
  process.exit(0);
}

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList,
});

try {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  // IndexNow 返回 200/202 都表示「已接收」，不代表已索引
  const ok = res.status === 200 || res.status === 202;
  console.log(`[indexnow] HTTP ${res.status} ${ok ? "(已接收；不代表索引)" : "(失败)"}`);
  if (!ok) console.log((await res.text()).slice(0, 500));
  if (!ok) process.exitCode = 1;
} catch (e) {
  // 静默 catch 会把「通知没发出」伪装成成功：必须显式报错
  console.error(`[indexnow] 请求失败：${e instanceof Error ? e.message : String(e)}`);
  process.exitCode = 1;
}
