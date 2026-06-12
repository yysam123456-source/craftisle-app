import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/resources/[id]/ratings
 * 给资源评分（Phase 3 准备 - 暂未实现认证）
 */
export async function POST(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  // TODO: Phase 3 实现时添加认证检查
  const body = await request.json();
  const { value } = body;
  
  if (!value || value < 1 || value > 5) {
    return NextResponse.json(
      { error: "Invalid rating value (must be 1-5)" },
      { status: 400 }
    );
  }
  
  return NextResponse.json({
    message: "Phase 3 - Rating API endpoint (not yet implemented)",
    resourceId: params.id,
    value,
  });
}

/**
 * DELETE /api/resources/[id]/ratings
 * 删除我的评分
 */
export async function DELETE(
  request: NextRequest,
  context: any
) {
  const { params } = context;
  return NextResponse.json({
    message: "Phase 3 - Delete rating API endpoint (not yet implemented)",
    resourceId: params.id,
  });
}
