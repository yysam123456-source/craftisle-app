import { NextResponse } from "next/server";
import { spawn } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Vercel Cron: 每周一触发此路由
 * 
 * 两种模式：
 *   1. 本地/CI：直接运行脚本（同步等待完成）
 *   2. Vercel Serverless：脚本超过 10s 会 timeout，建议用 GitHub Actions 代替
 * 
 * 推荐：在 Vercel 环境变量设置 CRON_SECRET，然后：
 *   GET /api/cron/update-home-blocks?secret=<CRON_SECRET>
 */

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // 鉴权（生产环境必须设置 CRON_SECRET）
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 在 Vercel Serverless 环境中，脚本可能超时
  // 这里用 Promise.race 设置 9s 超时，超时则返回"已触发"但不保证完成
  const scriptPath = join(__dirname, "../../../../scripts/build-home-blocks.mjs");

  try {
    const result = await Promise.race([
      runScript(scriptPath),
      new Promise<"timeout">((resolve) =>
        setTimeout(() => resolve("timeout"), 9000)
      ),
    ]);

    if (result === "timeout") {
      return NextResponse.json({
        success: true,
        message: "Script started (may continue after response)",
        note: "For reliable weekly updates, use GitHub Actions instead of Vercel Cron",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Home blocks rebuilt successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("node", [scriptPath], {
      env: { ...process.env },
      stdio: "inherit",
    });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Script exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}
