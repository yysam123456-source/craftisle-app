import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/resources/[id]/favorite
 * 收藏资源（Phase 3 准备 - 暂未实现认证）
 */
export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  // TODO: Phase 3 实现时添加认证检查
  return NextResponse.json({
    message: "Phase 3 - Favorite API endpoint (not yet implemented)",
    resourceId: params.id,
    action: "added",
  });
}

/**
 * DELETE /api/resources/[id]/favorite
 * 取消收藏资源
 */
export async function DELETE(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  return NextResponse.json({
    message: "Phase 3 - Delete favorite API endpoint (not yet implemented)",
    resourceId: params.id,
    action: "removed",
  });
}
