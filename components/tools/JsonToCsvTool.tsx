"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * JSON to CSV Converter
 * Convert JSON data to CSV format
 */
export default function JsonToCsvTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [delimiter, setDelimiter] = useState(",");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      let data: any[] = [];

      if (Array.isArray(json)) {
        if (json.length === 0) {
          setOutput("❌ Empty array");
          return;
        }

        // Check if it's an array of arrays
        if (Array.isArray(json[0])) {
          // First row as headers
          const headers = json[0];
          const rows = json.slice(1);
          const csvRows = [
            headers.join(delimiter),
            ...rows.map(row => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(delimiter))
          ];
          setOutput(csvRows.join("\n"));
          return;
        }

        // Array of objects
        data = json;
      } else if (typeof json === "object") {
        // Single object - wrap in array
        data = [json];
      } else {
        setOutput("❌ JSON must be an array or object");
        return;
      }

      // Get all unique keys
      const allKeys = new Set<string>();
      data.forEach(obj => {
        Object.keys(obj).forEach(key => allKeys.add(key));
      });
      const headers = Array.from(allKeys);

      // Build CSV
      const csvRows = [
        headers.join(delimiter),
        ...data.map(obj =>
          headers.map(header => {
            const val = obj[header];
            if (val === null || val === undefined) return "";
            if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
            return String(val);
          }).join(delimiter)
        )
      ];

      setOutput(csvRows.join("\n"));
    } catch {
      setOutput("❌ Invalid JSON format");
    }
  };

  return (
    <TextToolLayout
      title="JSON to CSV Converter"
      description="Convert JSON data to CSV format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
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
            <p><strong>Input format:</strong> JSON array of objects</p>
            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
{`[
  {"name": "Alice", "age": 25},
  {"name": "Bob", "age": 30}
]`}
            </pre>
          </div>
        </div>
      }
    />
  );
}
