"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * CSV Row to Column
 * Transpose CSV (swap rows and columns)
 */
export default function TransposeCsvTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delimiter, setDelimiter] = useState(",");

  const handleTranspose = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      const grid = lines.map(line => 
        line.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ""))
      );

      // Transpose
      const transposed: string[][] = [];
      for (let col = 0; col < grid[0].length; col++) {
        transposed.push(grid.map(row => row[col] || ""));
      }

      // Convert back to CSV
      const csv = transposed.map(row => row.join(delimiter)).join("\n");
      setOutput(csv);
    } catch {
      setOutput("❌ Error transposing CSV. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="Transpose CSV"
      description="Swap rows and columns in CSV data"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleTranspose}
      processLabel="Transpose"
      options={
        <div>
          <label className="block text-sm font-medium mb-2">Delimiter</label>
          <select
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="\t">Tab</option>
            <option value="|">Pipe (|)</option>
          </select>
        </div>
      }
    />
  );
}
