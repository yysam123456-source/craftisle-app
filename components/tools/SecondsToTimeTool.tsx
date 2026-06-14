"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Seconds to Time Converter
 * Convert seconds to HH:MM:SS format
 */
export default function SecondsToTimeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [padZeros, setPadZeros] = useState(true);

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

      const seconds = line.trim();

      if (!/^\d+$/.test(seconds)) {
        results.push(`❌ Invalid: ${line}`);
        return;
      }

      const secs = parseInt(seconds, 10);
      const hours = Math.floor(secs / 3600);
      const minutes = Math.floor((secs % 3600) / 60);
      const sec = secs % 60;

      if (padZeros) {
        results.push(
          [hours, minutes, sec]
            .map(unit => String(unit).padStart(2, "0"))
            .join(":")
        );
      } else {
        results.push([hours, minutes, sec].join(":"));
      }
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Seconds to Time Converter"
      description="Convert seconds to HH:MM:SS time format"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={padZeros}
            onChange={(e) => setPadZeros(e.target.checked)}
          />
          <span className="text-sm">Pad with zeros (00:05:30 instead of 0:5:30)</span>
        </label>
      }
    />
  );
}
