import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/users/me
 * 获取当前登录用户的个人信息（Phase 3 准备 - 暂未实现认证）
 */
export async function GET(request: NextRequest) {
  // TODO: Phase 3 实现时添加认证检查
  // const session = await getServerSession();
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  return NextResponse.json({
    message: "Phase 3 - User API endpoint (not yet implemented)",
    user: null,
  });
}

/**
 * PATCH /api/users/me
 * 更新当前登录用户的个人信息
 */
export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    message: "Phase 3 - Update user API endpoint (not yet implemented)",
  });
}
