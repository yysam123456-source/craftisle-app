"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Insert CSV Column
 * Insert a new column into CSV data
 */
export default function InsertCsvColumnTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [columnIndex, setColumnIndex] = useState(1);
  const [columnName, setColumnName] = useState("");
  const [defaultValue, setDefaultValue] = useState("");

  const handleInsert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      
      if (lines.length < 1) {
        setOutput("❌ CSV must have at least a header row");
        return;
      }

      const result = lines.map((line, index) => {
        const cells = line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, ""));
        
        // Insert new column
        const insertIndex = Math.min(columnIndex - 1, cells.length);
        cells.splice(insertIndex, 0, index === 0 ? columnName : defaultValue);
        
        return cells.join(separator);
      });

      setOutput(result.join("\n"));
    } catch {
      setOutput("❌ Error inserting column. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="Insert CSV Column"
      description="Insert a new column into CSV data"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleInsert}
      processLabel="Insert Column"
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

          <div>
            <label className="block text-sm font-medium mb-2">Column Index (1-based)</label>
            <input
              type="number"
              value={columnIndex}
              onChange={(e) => setColumnIndex(Math.max(1, parseInt(e.target.value, 10)))}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Column Name (for header row)</label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              placeholder="e.g., new_column"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Default Value (for data rows)</label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="e.g., N/A"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Inserts a new column at the specified index.</p>
            <p>Header row gets column name, data rows get default value.</p>
          </div>
        </div>
      }
    />
  );
}
