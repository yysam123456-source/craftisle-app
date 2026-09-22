"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";
import { encodeDelimitedField, normalizeLines, splitDelimitedLine } from "@/lib/csv-line";

/**
 * CSV to TSV Converter
 * Convert CSV to TSV (Tab-Separated Values)
 *
 * 此前用 `line.split(",")` + 去首尾引号，遇到 `"Smith, John",42` 会切成两列，
 * 而界面却写着 "Handles quoted values correctly" —— 文案与行为不符。
 * 现改为 RFC 4180 风格解析（lib/csv-line.ts），并顺带正确处理 CRLF 输入。
 */
export default function CsvToTsvTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = normalizeLines(input);

      if (lines.length === 0) {
        setOutput("❌ Empty input");
        return;
      }

      const tsv = lines.map((line) =>
        splitDelimitedLine(line, ",")
          .map((cell) => encodeDelimitedField(cell, "\t"))
          .join("\t")
      );

      setOutput(tsv.join("\n"));
    } catch {
      setOutput("❌ Error converting CSV to TSV");
    }
  };

  return (
    <TextToolLayout
      title="CSV to TSV Converter"
      description="Convert CSV (Comma-Separated) to TSV (Tab-Separated)"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Input:</strong> CSV with comma separator</p>
          <p><strong>Output:</strong> TSV with tab separator</p>
          <p>Handles quoted values correctly.</p>
        </div>
      }
    />
  );
}
