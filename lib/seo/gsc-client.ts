/**
 * Google Search Console API 客户端
 *
 * 使用 Service Account 认证，从 GSC 拉取搜索表现数据。
 * 设计目标：错误必须「可见」，不能静默吞掉 —— 否则定时抓取断流无人知晓。
 */

const SITE_URL = "https://craftisle.com";

// 从环境变量读取 Service Account 配置
const CLIENT_EMAIL = process.env.GSC_SERVICE_ACCOUNT_EMAIL || "";
const PRIVATE_KEY = (process.env.GSC_SERVICE_ACCOUNT_KEY || "").replace(/\\n/g, "\n");
const IS_CONFIGURED = !!(CLIENT_EMAIL && PRIVATE_KEY);

// 模块级可观测性状态（供 cron / summary 读取）
let _lastError: string | null = null;
let _lastSuccessAt: string | null = null;

export function getGscStatus() {
  return {
    configured: IS_CONFIGURED,
    lastError: _lastError,
    lastSuccessAt: _lastSuccessAt,
  };
}

interface GscRow {
  query: string;
  country: string; // "global" 或 GSC 国家代码（如 us / gbr）
  page?: string;   // 当 dimensions 包含 "page" 时填入页面 URL；否则 undefined
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
 * 通用拉取：支持任意 GSC 维度组合（query / country / device / page）。
 * 返回 rows（已展开 country），并暴露错误，绝不静默吞掉。
 */
export async function fetchGscPerformance(
  startDate: string,
  endDate: string,
  dimensions: string[],
  rowLimit = 5000,
): Promise<{ rows: GscRow[]; configured: boolean; error?: string }> {
  if (!IS_CONFIGURED) {
    console.log("[GSC] No credentials configured — returning empty data");
    return { rows: [], configured: false };
  }

  try {
    const token = await getAccessToken();
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(`sc-domain:${SITE_URL.replace("https://", "")}`)}/searchAnalytics/query`;

    const body = {
      startDate,
      endDate,
      dimensions,
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
      throw new Error(`GSC query failed (${dimensions.join(",")}): ${res.status} ${err}`);
    }

    const data = await res.json() as GscResponse;
    const rows: GscRow[] = (data.rows || []).map((row) => {
      const base = {
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
      };
      // 按 dimensions 顺序把对应 key 映射到具名字段
      if (dimensions.includes("country") && dimensions.includes("page")) {
        return { ...base, country: row.keys[1] || "global", page: row.keys[2] };
      } else if (dimensions.includes("page")) {
        return { ...base, country: "global", page: row.keys[1] };
      } else if (dimensions.includes("country")) {
        return { ...base, country: row.keys[1] || "global" };
      }
      return { ...base, country: "global" };
    });

    _lastSuccessAt = new Date().toISOString();
    _lastError = null;
    console.log(`[GSC] Fetched ${rows.length} rows (${dimensions.join(",")} ${startDate} → ${endDate})`);
    return { rows, configured: true };
  } catch (error: any) {
    _lastError = String(error?.message || error);
    console.error("[GSC] Fetch error:", error);
    // 返回错误而非静默空数据，让调用方记录并告警
    return { rows: [], configured: IS_CONFIGURED, error: _lastError };
  }
}

/**
 * 兼容旧调用：仅按 query 维度拉取（country 固定 global）。
 */
export async function fetchGscData(
  startDate: string,
  endDate: string,
  rowLimit = 500,
): Promise<{ queries: GscRow[]; configured: boolean; error?: string }> {
  const r = await fetchGscPerformance(startDate, endDate, ["query"], rowLimit);
  return { queries: r.rows, configured: r.configured, error: r.error };
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
  if (/\b(online|free|tool|convert|generator|maker|creator|editor|download)\b/.test(lower)) {
    return "tools";
  }
  if (/\b(best|top|alternative|review|list|directory|software|apps|website|open.source)\b/.test(lower)) {
    return "directory";
  }
  if (/\b(how|tutorial|guide|tips|vs|compare|learn)\b/.test(lower)) {
    return "blog";
  }
  return "other";
}

export function isGscConfigured(): boolean {
  return IS_CONFIGURED;
}
