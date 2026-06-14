"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Days to Hours Converter
 * Convert days to hours
 */
export default function DaysToHoursTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
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
      const days = parseFloat(parts[0]);

      if (isNaN(days)) {
        results.push(`❌ Invalid: ${line}`);
        return;
      }

      const hours = days * 24;
      results.push(addLabel ? `${hours} hours` : `${hours}`);
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Days to Hours Converter"
      description="Convert days to hours"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={addLabel}
            onChange={(e) => setAddLabel(e.target.checked)}
          />
          <span className="text-sm">Add 'hours' label to output</span>
        </label>
      }
    />
  );
}
