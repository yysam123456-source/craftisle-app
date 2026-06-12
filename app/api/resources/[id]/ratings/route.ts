import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/resources/[id]/ratings
 * 给资源评分
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { value } = body;
    
    // 验证评分值
    if (!value || value < 1 || value > 5) {
      return NextResponse.json(
        { error: "Invalid rating value (must be 1-5)" },
        { status: 400 }
      );
    }
    
    // TODO: 检查资源是否存在
    // TODO: 创建或更新评分 (prisma.rating.upsert)
    // TODO: 更新资源的平均评分
    
    return NextResponse.json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/resources/[id]/ratings
 * 删除我的评分
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // TODO: 删除评分 (prisma.rating.delete)
    // TODO: 更新资源的平均评分
    
    return NextResponse.json({ message: "Rating deleted successfully" });
  } catch (error) {
    console.error("Error deleting rating:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
