"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Sum Numbers
 * Extract and sum all numbers in text
 */
export default function SumTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState("\\s+");

  const handleSum = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      // Split by separator and extract numbers
      const parts = input.split(new RegExp(separator));
      const numbers = parts
        .map(part => parseFloat(part.replace(/,/g, "")))
        .filter(n => !isNaN(n));

      if (numbers.length === 0) {
        setOutput("❌ No numbers found in input.");
        return;
      }

      const sum = numbers.reduce((a, b) => a + b, 0);
      const count = numbers.length;
      const average = sum / count;

      const result = [
        `Sum: ${sum}`,
        `Count: ${count}`,
        `Average: ${average.toFixed(2)}`,
        ``,
        "Numbers found:",
        ...numbers.map((n, i) => `  ${i + 1}. ${n}`)
      ].join("\n");

      setOutput(result);
    } catch {
      setOutput("❌ Error calculating sum.");
    }
  };

  return (
    <TextToolLayout
      title="Sum Numbers"
      description="Extract and sum all numbers in text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSum}
      processLabel="Calculate Sum"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number Separator (Regex)</label>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
            />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Finds all numbers in text and calculates sum.</p>
            <p>Separator is a regex pattern (default: \s+ = whitespace).</p>
          </div>
        </div>
      }
    />
  );
}
