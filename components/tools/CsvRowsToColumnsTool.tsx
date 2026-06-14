"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * CSV Rows to Columns
 * Convert CSV rows to columns (transpose with options)
 */
export default function CsvRowsToColumnsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [fillEmpty, setFillEmpty] = useState(true);
  const [fillValue, setFillValue] = useState("");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      const result = lines.map(line => 
        line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, ""))
      );

      // Transpose
      const transposed: string[][] = [];
      const maxCols = Math.max(...result.map(row => row.length));
      
      for (let col = 0; col < maxCols; col++) {
        transposed.push(result.map(row => row[col] || (fillEmpty ? "" : fillValue)));
      }

      // Convert back to CSV
      const csv = transposed.map(row => row.join(separator)).join("\n");
      setOutput(csv);
    } catch {
      setOutput("❌ Error converting CSV. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="CSV Rows to Columns"
      description="Convert CSV rows to columns (transpose)"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fillEmpty}
              onChange={(e) => setFillEmpty(e.target.checked)}
            />
            <span className="text-sm">Fill empty values</span>
          </label>

          {!fillEmpty && (
            <div>
              <label className="block text-sm font-medium mb-2">Fill Value</label>
              <input
                type="text"
                value={fillValue}
                onChange={(e) => setFillValue(e.target.value)}
                placeholder="e.g., N/A"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Converts rows to columns (transpose).</p>
            <p>Optionally fill missing values.</p>
          </div>
        </div>
      }
    />
  );
}
