"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Find Incomplete CSV Records
 * Find rows with missing columns in CSV
 */
export default function FindIncompleteCsvTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [checkEmpty, setCheckEmpty] = useState(true);
  const [limit, setLimit] = useState(10);

  const handleFind = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        setOutput("❌ CSV must have at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, ""));
      const maxLength = Math.max(...lines.map(line => line.split(separator).length));
      
      const issues: string[] = [];

      lines.forEach((line, index) => {
        if (index === 0) return; // Skip header

        const cells = line.split(separator).map(cell => cell.trim().replace(/^"|"$/g, ""));
        
        // Check if row has fewer columns than max
        if (cells.length < maxLength) {
          issues.push(`Line ${index + 1}: Missing ${maxLength - cells.length} column(s) (has ${cells.length}, expected ${maxLength})`);
        }

        // Check for empty values if requested
        if (checkEmpty) {
          cells.forEach((cell, i) => {
            if (cell === "") {
              issues.push(`Line ${index + 1}, Column ${i + 1} (${headers[i] || "unknown"}): Empty value`);
            }
          });
        }

        // Limit issues displayed
        if (limit > 0 && issues.length >= limit) {
          issues.push(`... (showing first ${limit} issues)`);
          setOutput(issues.join("\n"));
          return;
        }
      });

      if (issues.length === 0) {
        setOutput("✓ CSV is complete (no missing columns or empty values)");
      } else {
        setOutput(issues.join("\n"));
      }
    } catch {
      setOutput("❌ Error checking CSV. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="Find Incomplete CSV Records"
      description="Find rows with missing columns or empty values in CSV"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleFind}
      processLabel="Find Issues"
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
              checked={checkEmpty}
              onChange={(e) => setCheckEmpty(e.target.checked)}
            />
            <span className="text-sm">Check for empty values</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Issue Limit (0 = no limit)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Math.max(0, parseInt(e.target.value, 10)))}
              min={0}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Finds rows with fewer columns than the maximum.</p>
            <p>Also checks for empty values if enabled.</p>
          </div>
        </div>
      }
    />
  );
}
