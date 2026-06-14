"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Time to Seconds Converter
 * Convert HH:MM:SS to seconds
 */
export default function TimeToSecondsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const results: string[] = [];

    input.split("\n").forEach((line, index) => {
      if (!line.trim()) {
        results.push("");
        return;
      }

      const timeArray = line.trim().split(":");
      
      if (timeArray.length > 3) {
        results.push(`❌ Line ${index + 1}: Time has more than 3 parts (HH:MM:SS)`);
        return;
      }

      // Validate each part is a number
      for (const part of timeArray) {
        if (!/^\d+$/.test(part)) {
          results.push(`❌ Line ${index + 1}: Invalid time part '${part}'`);
          return;
        }
      }

      // Calculate seconds
      const multipliers = [3600, 60, 1];
      let seconds = 0;
      
      for (let i = 0; i < timeArray.length; i++) {
        const normalizedIndex = i + (3 - timeArray.length);
        seconds += parseInt(timeArray[i], 10) * multipliers[normalizedIndex];
      }

      results.push(String(seconds));
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Time to Seconds Converter"
      description="Convert HH:MM:SS time format to seconds"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Input format:</strong> HH:MM:SS (or HH:MM, or MM:SS)</p>
          <p><strong>Examples:</strong></p>
          <ul className="list-disc pl-4">
            <li><code>01:30:00</code> → 5400</li>
            <li><code>30:00</code> → 1800</li>
            <li><code>90</code> → 90</li>
          </ul>
        </div>
      }
    />
  );
}
