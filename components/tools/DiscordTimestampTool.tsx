"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Discord Timestamp Generator
 * Generate Discord timestamp strings from dates
 */
export default function DiscordTimestampTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<string>("F");
  const [enforceUTC, setEnforceUTC] = useState(true);

  const formatOptions: { value: string; label: string; example: string }[] = [
    { value: "t", label: "Short Time", example: "16:20" },
    { value: "T", label: "Long Time", example: "16:20:30" },
    { value: "d", label: "Short Date", example: "20/04/2021" },
    { value: "D", label: "Long Date", example: "20 April 2021" },
    { value: "f", label: "Short DateTime", example: "20 April 2021 16:20" },
    { value: "F", label: "Long DateTime", example: "Tuesday, 20 April 2021 16:20" },
    { value: "R", label: "Relative Time", example: "2 months ago" },
  ];

  const handleGenerate = () => {
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

      const raw = line.trim();
      const date = enforceUTC ? new Date(raw + "Z") : new Date(raw);

      if (isNaN(date.getTime())) {
        results.push(`❌ Invalid: ${line}`);
        return;
      }

      const unix = Math.floor(date.getTime() / 1000);
      results.push(`<t:${unix}:${format}>`);
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Discord Timestamp Generator"
      description="Generate Discord timestamp strings from dates"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleGenerate}
      processLabel="Generate"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Timestamp Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {formatOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} - {opt.example}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enforceUTC}
              onChange={(e) => setEnforceUTC(e.target.checked)}
            />
            <span className="text-sm">Treat input as UTC (add Z suffix)</span>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Input format: YYYY-MM-DD HH:mm:ss</p>
            <p>Example: 2024-07-18 10:00:00</p>
          </div>
        </div>
      }
    />
  );
}
