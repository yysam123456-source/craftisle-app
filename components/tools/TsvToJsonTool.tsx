"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * TSV to JSON Converter
 * Convert TSV (Tab-Separated Values) to JSON
 */
export default function TsvToJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [arrayFormat, setArrayFormat] = useState(false);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      
      if (lines.length < 2) {
        setOutput("❌ TSV must have at least a header row and one data row");
        return;
      }

      const headers = lines[0].split("\t").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1);

      if (arrayFormat) {
        // Array of arrays format
        const json = [headers, ...rows.map(row => 
          row.split("\t").map(cell => cell.trim().replace(/^"|"$/g, ""))
        )];
        setOutput(JSON.stringify(json, null, 2));
      } else {
        // Array of objects format
        const json = rows.map(row => {
          const cells = row.split("\t").map(cell => cell.trim().replace(/^"|"$/g, ""));
          const obj: Record<string, string> = {};
          headers.forEach((header, i) => {
            obj[header] = cells[i] || "";
          });
          return obj;
        });
        setOutput(JSON.stringify(json, null, 2));
      }
    } catch {
      setOutput("❌ Error parsing TSV. Check format.");
    }
  };

  return (
    <TextToolLayout
      title="TSV to JSON Converter"
      description="Convert TSV (Tab-Separated Values) to JSON format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={arrayFormat}
            onChange={(e) => setArrayFormat(e.target.checked)}
          />
          <span className="text-sm">Array format (instead of objects)</span>
        </label>
      }
    />
  );
}
