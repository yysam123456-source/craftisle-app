/**
 * GitHub Contents API 封装（用于 Vercel Cron 自动优化回写）
 * ───────────────────────────────────────────────
 * Vercel 运行时没有 git 二进制，因此用 GitHub Contents API 直接
 * GET 文件内容（含 blob sha）→ PUT 新内容（携带 sha 做乐观并发），
 * 一次调用即创建一个 commit，触发 Vercel 重建。
 *
 * 仅依赖全局 fetch，无额外依赖。token 来自 Vercel 环境变量 GITHUB_TOKEN
 * （一个有 repo 写权限的 PAT，由用户在 Vercel 添加；GSC 密钥仍只留在 Vercel，
 * 不跨平台复制）。
 */

const REPO = "yysam123456-source/craftisle-app";

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function getFile(
  token: string,
  path: string,
): Promise<{ content: string; sha: string }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: authHeaders(token),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GET ${path} 失败：HTTP ${res.status} ${body.slice(0, 300)}`);
  }
  const j = (await res.json()) as { content: string; sha: string };
  const content = Buffer.from(j.content, "base64").toString("utf8");
  return { content, sha: j.sha };
}

export async function commitFile(
  token: string,
  path: string,
  content: string,
  sha: string,
  message: string,
  branch = "main",
): Promise<{ ok: boolean; commitUrl?: string; error?: string }> {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: "PUT",
    headers: { ...authHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha,
      branch,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, error: `HTTP ${res.status} ${body.slice(0, 400)}` };
  }
  const j = (await res.json()) as { commit?: { html_url?: string } };
  return { ok: true, commitUrl: j.commit?.html_url };
}
