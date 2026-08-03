/**
 * Google Search Console API 客户端
 * 
 * 使用 Service Account 认证，从 GSC 拉取搜索表现数据。
 * 如果未配置 GSC 凭证，优雅降级返回空数据。
 */

const SITE_URL = "https://craftisle.com";

// 从环境变量读取 Service Account 配置
const CLIENT_EMAIL = process.env.GSC_SERVICE_ACCOUNT_EMAIL || "";
const PRIVATE_KEY = (process.env.GSC_SERVICE_ACCOUNT_KEY || "").replace(/\\n/g, "\n");
const IS_CONFIGURED = !!(CLIENT_EMAIL && PRIVATE_KEY);

interface GscQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscResponse {
  rows?: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

/**
 * 获取 Service Account JWT Token (RS256)
 */
async function getAccessToken(): Promise<string> {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  
  const now = Math.floor(Date.now() / 1000);
  const claim = Buffer.from(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  })).toString("base64url");

  // Node.js 原生 crypto 签名（避免额外依赖）
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const signature = sign.sign(PRIVATE_KEY, "base64url");
  const jwt = `${header}.${claim}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC auth failed: ${res.status} ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

/**
 * 从 GSC 拉取指定日期范围的搜索表现数据
 */
export async function fetchGscData(
  startDate: string, // "2026-07-01"
  endDate: string,   // "2026-07-31"
  rowLimit = 500,
): Promise<{ queries: GscQueryRow[]; configured: boolean }> {
  if (!IS_CONFIGURED) {
    console.log("[GSC] No credentials configured — returning empty data");
    return { queries: [], configured: false };
  }

  try {
    const token = await getAccessToken();
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(`sc-domain:${SITE_URL.replace("https://", "")}`)}/searchAnalytics/query`;

    const body = {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit,
      aggregationType: "auto",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GSC query failed: ${res.status} ${err}`);
    }

    const data = await res.json() as GscResponse;
    const queries: GscQueryRow[] = (data.rows || []).map(row => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    console.log(`[GSC] Fetched ${queries.length} queries (${startDate} → ${endDate})`);
    return { queries, configured: true };
  } catch (error) {
    console.error("[GSC] Fetch error:", error);
    // 不抛异常，返回空数据让系统继续工作
    return { queries: [], configured: true };
  }
}

/**
 * 判断是否为非品牌词（不含 "craftisle" 或 "craft isle"）
 */
export function isNonBrandQuery(query: string): boolean {
  const lower = query.toLowerCase();
  return !lower.includes("craftisle") && !lower.includes("craft isle");
}

/**
 * 判断搜索词类型：tools | directory | blog | other
 */
export function classifyQueryType(query: string): "tools" | "directory" | "blog" | "other" {
  const lower = query.toLowerCase();
  // 工具类关键词模式
  if (/\b(online|free|tool|convert|generator|maker|creator|editor|download)\b/.test(lower)) {
    return "tools";
  }
  // 目录类关键词模式
  if (/\b(best|top|alternative|review|list|directory|software|apps|website|open.source)\b/.test(lower)) {
    return "directory";
  }
  // 教程类关键词模式
  if (/\b(how|tutorial|guide|tips|vs|compare|learn)\b/.test(lower)) {
    return "blog";
  }
  return "other";
}

export { IS_CONFIGURED as isGscConfigured };
