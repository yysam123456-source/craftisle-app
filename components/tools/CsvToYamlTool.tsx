"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";
import YAML from "js-yaml";

/**
 * CSV to YAML Converter
 * Convert CSV data to YAML format
 */
export default function CsvToYamlTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);

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

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
      const rows = lines.slice(1);

      const data = rows.map(row => {
        const cells = row.split(",").map(cell => cell.trim().replace(/^"|"$/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((header, i) => {
          obj[header] = cells[i] || "";
        });
        return obj;
      });

      const yaml = YAML.dump({ data }, { indent: indent });
      setOutput(yaml);
    } catch {
      setOutput("❌ Error converting CSV to YAML");
    }
  };

  return (
    <TextToolLayout
      title="CSV to YAML Converter"
      description="Convert CSV data to YAML format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div>
          <label className="block text-sm font-medium mb-2">Indent Size</label>
          <select
            value={indent}
            onChange={(e) => setIndent(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        </div>
      }
    />
  );
}
