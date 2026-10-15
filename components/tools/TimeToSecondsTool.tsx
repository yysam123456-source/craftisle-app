"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Time to Seconds Converter
 *
 * 🔴 2026-10-15（DEBT-12 收敛）：原本有两条线 —— 裸名 id 走冒号格式，
 * `convert-time-to-seconds` 支持 `1h 30m 45s` / `90m` / `3600s` 这类带单位写法。
 * Bing Suggest 实测裸名线需求是 convert 线的 2.0 倍 ⇒ 保留裸名 URL，
 * 但把对方的解析能力并进来，否则收敛等于功能倒退。
 * 同时保留 TextToolLayout（共享组件，与站内其余工具一致）。
 */
export default function TimeToSecondsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  /**
   * 返回 null 表示无法识别。支持四种写法：
   *   HH:MM:SS / MM:SS / 纯数字秒
   *   1h 30m 45s / 2h / 90m / 3600s（带单位，可任意组合，缺省位不补）
   *
   * 🔴 两段冒号按 MM:SS 处理，不按 HH:MM。
   * 原实现把 `30:00` 算成 108000 秒（当成 30 小时），但写 `30:00` 的人
   * 几乎总是指 30 分 0 秒。三段形式保持严格 HH:MM:SS。
   */
  const parseTimeToSeconds = (timeStr: string): number | null => {
    const t = timeStr.trim();

    // 带单位写法：1h 30m 45s / 90m / 2h 15m
    if (/\d\s*[hms]\b/i.test(t)) {
      const h = t.match(/(\d+)\s*h/i);
      const m = t.match(/(\d+)\s*m/i);
      const s = t.match(/(\d+)\s*s/i);
      if (!h && !m && !s) return null;
      return (
        (h ? parseInt(h[1], 10) * 3600 : 0) +
        (m ? parseInt(m[1], 10) * 60 : 0) +
        (s ? parseInt(s[1], 10) : 0)
      );
    }

    // 三段 = HH:MM:SS（小时位可超 99，例如 100:00:00）
    const colon = t.match(/^(\d{1,3}):([0-5]?\d):([0-5]?\d)$/);
    if (colon) {
      return (
        parseInt(colon[1], 10) * 3600 +
        parseInt(colon[2], 10) * 60 +
        parseInt(colon[3], 10)
      );
    }

    // 两段 = MM:SS（两位都必须 < 60，否则不是有效时间）
    const ms = t.match(/^([0-5]?\d):([0-5]?\d)$/);
    if (ms) return parseInt(ms[1], 10) * 60 + parseInt(ms[2], 10);

    if (/^\d+$/.test(t)) return parseInt(t, 10);

    return null;
  };

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const results: string[] = [];

    input.split("\n").forEach((line, index) => {
      if (!line.trim()) {
        results.push("");
        return;
      }

      const seconds = parseTimeToSeconds(line);

      if (seconds === null) {
        results.push(
          `❌ Line ${index + 1}: cannot read "${line.trim()}" — use 01:30:45, 90m, or 1h 30m 45s`,
        );
        return;
      }

      results.push(String(seconds));
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Time to Seconds Converter"
      description="Convert HH:MM:SS, minutes, or 1h 30m 45s to seconds"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Accepted formats:</strong></p>
          <ul className="list-disc pl-4">
            <li><code>01:30:45</code> → 5445</li>
            <li><code>30:00</code> → 1800 <em>(mm:ss)</em></li>
            <li><code>90</code> → 90</li>
            <li><code>1h 30m 45s</code> → 5445</li>
            <li><code>90m</code> → 5400</li>
            <li><code>2h</code> → 7200</li>
          </ul>
        </div>
      }
    />
  );
}
