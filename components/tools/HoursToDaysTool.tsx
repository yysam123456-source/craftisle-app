"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Hours to Days Converter
 * Convert hours to days
 */
export default function HoursToDaysTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [accuracy, setAccuracy] = useState(6);
  const [addLabel, setAddLabel] = useState(false);

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

      const parts = line.trim().split(/\s+/);
      const hours = parseFloat(parts[0]);

      if (isNaN(hours)) {
        results.push(`❌ Invalid: ${line}`);
        return;
      }

      const days = (hours / 24).toFixed(accuracy);
      results.push(addLabel ? `${days} days` : days);
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Hours to Days Converter"
      description="Convert hours to days"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Decimal Accuracy</label>
            <select
              value={accuracy}
              onChange={(e) => setAccuracy(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={0}>0 (whole days)</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={addLabel}
              onChange={(e) => setAddLabel(e.target.checked)}
            />
            <span className="text-sm">Add 'days' label to output</span>
          </label>
        </div>
      }
    />
  );
}
