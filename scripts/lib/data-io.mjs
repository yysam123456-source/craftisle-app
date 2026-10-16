/**
 * 数据文件读写的安全封装。
 *
 * 为什么需要它（2026-09-22 事故复盘）：
 *   `public/data/fmhy-resources.json`（6.2MB）被写坏了一次，结果整条日更管道死掉：
 *     - sync-fmhy.mjs / update-producthunt.mjs 都 `JSON.parse(readFileSync(...))` 且**无 try/catch**
 *       ⇒ 文件一坏，两个 job 每次都在第一步抛错，**永远无法自愈**；
 *     - 它们挂了 → workflow 里 `push-all` 被 skipped → 5 个 job 的产出全部不推送；
 *     - 站点侧 `lib/fmhy-data.ts` 又有 `catch { return [] }` ⇒ 静默降级、零告警。
 *
 * 两道防线：
 *   1. readJsonSafe —— 读坏了不抛错，返回 ok=false 让调用方降级为「全量重建」，打破死锁；
 *   2. writeJsonAtomic —— 先写临时文件再 rename。6MB 的原地 writeFileSync 一旦被
 *      step timeout / 取消 / 并发运行打断，就会留下半截文件；rename 在 POSIX 与
 *      Windows（MoveFileEx with REPLACE_EXISTING）上都是原子替换，写入方不可能留下残缺文件。
 */
import { existsSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "fs";
import { dirname, join } from "path";

/**
 * 安全读取 JSON。任何失败都不抛错，而是返回 { ok:false, data:null, reason }。
 * @param {string} filePath
 * @returns {{ ok: true, data: any, reason?: string, bytes?: number }
 *          | { ok: false, data: null, reason: string, bytes?: number }}
 */
export function readJsonSafe(filePath) {
  if (!existsSync(filePath)) {
    return { ok: false, data: null, reason: "文件不存在" };
  }

  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    return { ok: false, data: null, reason: `读取失败: ${e.message}` };
  }

  try {
    return { ok: true, data: JSON.parse(raw), bytes: raw.length };
  } catch (e) {
    return {
      ok: false,
      data: null,
      reason: `JSON 解析失败: ${e.message}`,
      bytes: raw.length,
    };
  }
}

/**
 * 原子写入 JSON。先写 `<path>.tmp-<pid>` 再 rename 覆盖目标，
 * 因此目标文件在任意时刻要么是旧的完整内容、要么是新的完整内容，不会是半截。
 * @param {string} filePath
 * @param {any} data
 * @param {{ pretty?: boolean }} [opts]
 * @returns {number} 写入字节数
 */
export function writeJsonAtomic(filePath, data, opts = {}) {
  const { pretty = true } = opts;
  const text = JSON.stringify(data, null, pretty ? 2 : 0);
  const tmp = join(dirname(filePath), `.${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}.tmp`);

  try {
    writeFileSync(tmp, text);
    renameSync(tmp, filePath);
  } catch (e) {
    // 失败时清掉临时文件，别在 public/ 里留垃圾（public 会被整目录部署）
    try {
      if (existsSync(tmp)) unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
  return Buffer.byteLength(text);
}

/**
 * 原子写入**原始文本**（不做 JSON.stringify）。
 *
 * 为什么需要它：有的调用方拿到的已经是端点返回的原始响应文本
 * （如 longtail-gap 的 GSC 分片缓存，单个150KB+）。直接
 * `writeFileSync(file, text)` 被 timeout 打断时会留半截 JSON，
 * 下次 `JSON.parse` 在 try 里只记一条 warn ⇒ **静默少一个分片**，
 * 而报告里的「N/N 分片成功」照样显示为正常。
 *
 * 2026-09-22 的 6.2MB 文件写坏事故 + 管道静默死 5 周，就是同一类问题。
 *
 * @param {string} filePath
 * @param {string} text
 * @returns {number} 写入字节数
 */
export function writeTextAtomic(filePath, text) {
  const tmp = join(
    dirname(filePath),
    `.${Date.now()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}.tmp`
  );
  try {
    writeFileSync(tmp, text);
    renameSync(tmp, filePath);
  } catch (e) {
    try {
      if (existsSync(tmp)) unlinkSync(tmp);
    } catch {
      /* ignore */
    }
    throw e;
  }
  return Buffer.byteLength(text);
}

/**
 * 校验一组数据文件的 JSON 合法性，供 CI 门禁使用。
 * 任一文件非法即返回非空数组（调用方据此 fail 出声），避免「坏文件静默上线」。
 * @param {Array<{ path: string, label?: string }>} files
 * @returns {Array<{ path: string, reason: string, bytes?: number }>}
 */
export function findInvalidJsonFiles(files) {
  const bad = [];
  for (const f of files) {
    const r = readJsonSafe(f.path);
    if (!r.ok && r.reason !== "文件不存在") {
      bad.push({ path: f.path, reason: r.reason, bytes: r.bytes });
    }
  }
  return bad;
}
