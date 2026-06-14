"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * CSV to JSON Converter
 * Convert CSV data to JSON format
 */
export default function CsvToJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [arrayFormat, setArrayFormat] = useState(false);
  const [delimiter, setDelimiter] = useState(",");

  const handleConvert = () => {
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

      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1);

      if (arrayFormat) {
        // Array of arrays format
        const json = [headers, ...rows.map(row => 
          row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ""))
        )];
        setOutput(JSON.stringify(json, null, 2));
      } else {
        // Array of objects format
        const json = rows.map(row => {
          const cells = row.split(delimiter).map(cell => cell.trim().replace(/^"|"$/g, ""));
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = cells[i] || "";
          });
          return obj;
        });
        setOutput(JSON.stringify(json, null, 2));
      }
    } catch {
      setOutput("❌ Error parsing CSV. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="CSV to JSON Converter"
      description="Convert CSV data to JSON format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={arrayFormat}
              onChange={(e) => setArrayFormat(e.target.checked)}
            />
            <span className="text-sm">Array format (instead of objects)</span>
          </label>

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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p><strong>Input format:</strong></p>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
{`Name,Age,City
Alice,25,NYC
Bob,30,LA`}
            </pre>
          </div>
        </div>
      }
    />
  );
}
