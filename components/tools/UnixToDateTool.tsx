"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Unix Timestamp to Date Converter
 * Convert Unix timestamps to human-readable dates
 */
export default function UnixToDateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"unix-to-date" | "date-to-unix">("unix-to-date");
  const [useLocalTime, setUseLocalTime] = useState(false);
  const [withLabel, setWithLabel] = useState(true);

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const lines = input.split("\n").map(line => line.trim()).filter(line => line);
    const results: string[] = [];

    if (mode === "unix-to-date") {
      lines.forEach(line => {
        if (!/^\d+$/.test(line)) {
          results.push(`❌ Invalid: ${line}`);
          return;
        }

        const timestamp = parseInt(line, 10);
        const date = new Date(timestamp * 1000);

        if (isNaN(date.getTime())) {
          results.push(`❌ Invalid timestamp: ${line}`);
          return;
        }

        if (useLocalTime) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          const seconds = String(date.getSeconds()).padStart(2, "0");
          results.push(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}`);
        } else {
          const iso = date.toISOString().replace("T", " ").replace("Z", "");
          results.push(withLabel ? `${iso} UTC` : iso);
        }
      });
    } else {
      // Date to Unix
      lines.forEach(line => {
        try {
          const date = new Date(line + (line.includes("Z") || line.includes("+") ? "" : "Z"));
          if (isNaN(date.getTime())) {
            results.push(`❌ Invalid date: ${line}`);
            return;
          }
          const unix = Math.floor(date.getTime() / 1000);
          results.push(String(unix));
        } catch {
          results.push(`❌ Invalid date: ${line}`);
        }
      });
    }

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Unix Timestamp Converter"
      description="Convert between Unix timestamps and human-readable dates"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel={mode === "unix-to-date" ? "Unix → Date" : "Date → Unix"}
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Conversion Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "unix-to-date"}
                  onChange={() => setMode("unix-to-date")}
                />
                <span>Unix → Date</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "date-to-unix"}
                  onChange={() => setMode("date-to-unix")}
                />
                <span>Date → Unix</span>
              </label>
            </div>
          </div>

          {mode === "unix-to-date" && (
            <div>
              <label className="block text-sm font-medium mb-2">Time Zone</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tz"
                    checked={!useLocalTime}
                    onChange={() => setUseLocalTime(false)}
                  />
                  <span>UTC</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tz"
                    checked={useLocalTime}
                    onChange={() => setUseLocalTime(true)}
                  />
                  <span>Local Time</span>
                </label>
              </div>
            </div>
          )}

          {mode === "unix-to-date" && !useLocalTime && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={withLabel}
                onChange={(e) => setWithLabel(e.target.checked)}
              />
              <span className="text-sm">Add UTC label to output</span>
            </label>
          )}
        </div>
      }
    />
  );
}
