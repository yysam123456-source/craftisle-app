"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Truncate Clock Time
 * Truncate time to hours only or hours+minutes
 */
export default function TruncateClockTimeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [onlyHours, setOnlyHours] = useState(false);
  const [showZero, setShowZero] = useState(false);
  const [padZeros, setPadZeros] = useState(true);

  const handleTruncate = () => {
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

      const timeArray = line.trim().split(":");
      
      if (timeArray.length > 3) {
        results.push(`❌ Invalid: ${line} (too many parts)`);
        return;
      }

      // Validate each part is a number
      for (const part of timeArray) {
        if (!/^\d+$/.test(part)) {
          results.push(`❌ Invalid: ${line}`);
          return;
        }
      }

      // Truncate
      let truncated: string[];
      
      if (onlyHours) {
        truncated = timeArray.slice(0, 1);
      } else {
        truncated = timeArray.slice(0, 2);
      }

      // Add zero if requested
      if (showZero) {
        if (onlyHours) {
          truncated.push("0");
        } else {
          truncated.push("0", "0");
        }
      }

      // Pad with zeros if requested
      if (padZeros) {
        results.push(
          truncated
            .map(unit => String(unit).padStart(2, "0"))
            .join(":")
        );
      } else {
        results.push(truncated.join(":"));
      }
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Truncate Clock Time"
      description="Truncate time to hours only or hours+minutes"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleTruncate}
      processLabel="Truncate"
      options={
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyHours}
              onChange={(e) => setOnlyHours(e.target.checked)}
            />
            <span className="text-sm">Keep hours only (truncate minutes and seconds)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showZero}
              onChange={(e) => setShowZero(e.target.checked)}
            />
            <span className="text-sm">Show zero values (add :00 for truncated parts)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={padZeros}
              onChange={(e) => setPadZeros(e.target.checked)}
            />
            <span className="text-sm">Pad with zeros (01:30 instead of 1:30)</span>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p><strong>Examples:</strong></p>
            <ul className="list-disc pl-4">
              <li><code>14:35:20</code> → <code>14:35</code> (keep hours+mins)</li>
              <li><code>14:35:20</code> → <code>14</code> (hours only)</li>
            </ul>
          </div>
        </div>
      }
    />
  );
}
