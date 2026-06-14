"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * CSV to TSV Converter
 * Convert CSV to TSV (Tab-Separated Values)
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
      const lines = input.split("\n").filter(line => line.trim());
      
      if (lines.length === 0) {
        setOutput("❌ Empty input");
        return;
      }

      const tsv = lines.map(line => {
        return line.split(",").map(cell => cell.trim().replace(/^"|"$/g, "")).join("\t");
      });

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
