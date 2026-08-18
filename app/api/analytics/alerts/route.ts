/**
 * GET /api/analytics/alerts?resolved=false
 * 返回活跃告警列表
 * POST /api/analytics/alerts — 标记告警为已处理
 */

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get("resolved") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const alerts = await prisma.alertEvent.findMany({
      where: { resolved },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        query: a.query,
        severity: a.severity,
        message: a.message,
        data: a.data,
        resolved: a.resolved,
        createdAt: a.createdAt.toISOString(),
        snapshotAt: a.snapshotAt.toISOString(),
      })),
      total: alerts.length,
      unresolvedCount: await prisma.alertEvent.count({ where: { resolved: false } }),
    });
  } catch (error: any) {
    console.error("[Analytics Alerts] Error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, resolved = true } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing alert id" }, { status: 400 });
    }

    await prisma.alertEvent.update({
      where: { id },
      data: { resolved },
    });

    return NextResponse.json({ success: true, id, resolved });
  } catch (error: any) {
    console.error("[Analytics Alerts] PATCH error:", error);
    return NextResponse.json({ error: error?.message || String(error) }, { status: 500 });
  }
}
