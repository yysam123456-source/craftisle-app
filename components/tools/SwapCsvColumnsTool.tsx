"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Swap CSV Columns
 * Swap two columns in CSV data
 */
export default function SwapCsvColumnsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [column1, setColumn1] = useState(1);
  const [column2, setColumn2] = useState(2);

  const handleSwap = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      const result = lines.map(line => {
        const cells = line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, ""));
        
        if (cells.length < Math.max(column1, column2)) {
          return line; // Skip rows with insufficient columns
        }

        // Swap columns (convert to 0-based index)
        const idx1 = column1 - 1;
        const idx2 = column2 - 1;
        const temp = cells[idx1];
        cells[idx1] = cells[idx2];
        cells[idx2] = temp;
        
        return cells.join(separator);
      });

      setOutput(result.join("\n"));
    } catch {
      setOutput("❌ Error swapping columns. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="Swap CSV Columns"
      description="Swap two columns in CSV data"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSwap}
      processLabel="Swap Columns"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Column 1 Index (1-based)</label>
              <input
                type="number"
                value={column1}
                onChange={(e) => setColumn1(Math.max(1, parseInt(e.target.value, 10)))}
                min={1}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Column 2 Index (1-based)</label>
              <input
                type="number"
                value={column2}
                onChange={(e) => setColumn2(Math.max(1, parseInt(e.target.value, 10)))}
                min={1}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Swaps two columns by their 1-based index.</p>
            <p>Example: Column 1 = 1, Column 2 = 3 swaps first and third columns.</p>
          </div>
        </div>
      }
    />
  );
}
