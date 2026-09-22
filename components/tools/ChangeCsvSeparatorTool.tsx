"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";
import { normalizeLines, splitDelimitedLine } from "@/lib/csv-line";

/**
 * Change CSV Separator
 * Convert CSV from one separator to another
 *
 * 修了两处：① `<option value="\t">` 在 JSX 里是字面量反斜杠+t（不是制表符），
 * 选 Tab 会插入两个可见字符；② 朴素 split 会切坏带引号的字段。
 */
const SEPARATORS: { label: string; value: string }[] = [
  { label: "Comma (,)", value: "," },
  { label: "Semicolon (;)", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe (|)", value: "|" },
];

export default function ChangeCsvSeparatorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fromSep, setFromSep] = useState(",");
  const [toSep, setToSep] = useState(";");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = normalizeLines(input);

      const converted = lines.map((line) =>
        splitDelimitedLine(line, fromSep)
          .map((cell) =>
            // 只在目标分隔符真的会破坏字段时才加引号，保持输出可读
            toSep === "\t"
              ? cell
              : cell.includes(toSep) || cell.includes('"')
                ? `"${cell.replace(/"/g, '""')}"`
                : cell
          )
          .join(toSep)
      );

      setOutput(converted.join("\n"));
    } catch {
      setOutput("❌ Error changing separator");
    }
  };

  return (
    <TextToolLayout
      title="Change CSV Separator"
      description="Convert CSV from one separator to another"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Separator</label>
            <select
              value={fromSep}
              onChange={(e) => setFromSep(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {SEPARATORS.map((s) => (
                <option key={s.label} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Separator</label>
            <select
              value={toSep}
              onChange={(e) => setToSep(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {SEPARATORS.map((s) => (
                <option key={s.label} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      }
    />
  );
}
