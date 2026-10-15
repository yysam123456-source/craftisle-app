"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Time to Decimal Converter
 * Convert HH:MM:SS to decimal hours
 *
 * 🔴 2026-10-15（DEBT-12 收敛）：与 convert-time-to-decimal 合并。
 * 保留本组件的 TextToolLayout 与可调小数位数，补上原实现缺失的范围校验 ——
 * 原代码 `parseInt(parts[1], 10) || 0` 会把 `01:99:00` 静默算成 2.65 小时
 * 而不是报错，那不是转换，是错误答案。
 */
export default function TimeToDecimalTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  /** 返回小数小时数；无法识别或越界时返回 null */
  const timeToDecimal = (timeStr: string): number | null => {
    const t = timeStr.trim();

    // 支持 : 与 . 作分隔符（Excel 的 1.5 表示 1 时 30 分，是常见写法）
    const m = t.match(/^(\d{1,3})[:.](\d{1,2})(?:[:.](\d{1,2}))?$/);
    if (!m) return null;

    const hours = parseInt(m[1], 10);
    const minutes = parseInt(m[2], 10);
    const seconds = m[3] ? parseInt(m[3], 10) : 0;

    // 分位与秒位必须 < 60，否则不是有效时间
    if (minutes >= 60 || seconds >= 60) return null;

    return hours + minutes / 60 + seconds / 3600;
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

      const decimal = timeToDecimal(line);

      if (decimal === null) {
        results.push(
          `❌ Line ${index + 1}: cannot read "${line.trim()}" — use HH:MM or HH:MM:SS`,
        );
        return;
      }

      results.push(decimal.toFixed(decimalPlaces));
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Time to Decimal Converter"
      description="Convert HH:MM:SS to decimal hours"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Decimal Places</label>
            <select
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p><strong>Examples (2 decimals):</strong></p>
            <ul className="list-disc pl-4">
              <li><code>01:30:00</code> → 1.50</li>
              <li><code>02:45</code> → 2.75</li>
              <li><code>08:00:30</code> → 8.01</li>
              <li><code>1.5</code> → 1.50 <em>(Excel style)</em></li>
            </ul>
          </div>
        </div>
      }
    />
  );
}
