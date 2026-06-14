"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Time to Decimal Converter
 * Convert HH:MM:SS to decimal hours
 */
export default function TimeToDecimalTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const results: string[] = [];

    input.split("\n").forEach(line => {
      if (!line.trim()) {
        results.push("");
        return;
      }

      const timeStr = line.trim();
      
      // Parse time (support : and . as separators)
      const parts = timeStr.split(/[:.]/);
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;

      // Convert to decimal hours
      const decimalTime = hours + minutes / 60 + seconds / 3600;
      results.push(decimalTime.toFixed(decimalPlaces));
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Time to Decimal Converter"
      description="Convert HH:MM:SS time to decimal hours"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div>
          <label className="block text-sm font-medium mb-2">Decimal Places</label>
          <select
            value={decimalPlaces}
            onChange={(e) => setDecimalPlaces(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
      }
    />
  );
}
