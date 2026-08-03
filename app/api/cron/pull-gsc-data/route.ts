/**
 * Vercel Cron: 每周一 06:00 UTC 自动从 GSC 拉取搜索表现数据
 * GET /api/cron/pull-gsc-data
 */
import { NextResponse } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET || "";

function isAuthorized(request: Request): boolean {
  if (request.headers.get("x-vercel-cron")) return true;
  const { searchParams } = new URL(request.url);
  return !!(CRON_SECRET && searchParams.get("secret") === CRON_SECRET);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // GSC 数据拉取逻辑（Phase 2 实现）
  return NextResponse.json({
    success: true,
    message: "Cron endpoint active. GSC pull logic to be enabled after DB migration.",
    timestamp: new Date().toISOString(),
  });
}
