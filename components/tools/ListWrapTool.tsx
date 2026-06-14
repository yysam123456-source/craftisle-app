"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Wrap / Unwrap
 * Wrap long lines or unwrap short lines
 */
export default function ListWrapTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"wrap" | "unwrap">("wrap");
  const [width, setWidth] = useState(80);
  const [separator, setSeparator] = useState(" ");

  const handleProcess = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    if (mode === "wrap") {
      // Wrap: break long lines at width
      const lines = input.split("\n");
      const wrapped: string[] = [];

      lines.forEach(line => {
        if (line.length <= width) {
          wrapped.push(line);
        } else {
          let remaining = line;
          while (remaining.length > width) {
            // Try to break at separator
            let breakIndex = remaining.lastIndexOf(separator, width);
            if (breakIndex === -1 || breakIndex < width / 2) {
              breakIndex = width;
            }
            wrapped.push(remaining.substring(0, breakIndex).trim());
            remaining = remaining.substring(breakIndex).trim();
          }
          if (remaining) {
            wrapped.push(remaining);
          }
        }
      });

      setOutput(wrapped.join("\n"));
    } else {
      // Unwrap: join lines with separator
      const lines = input.split("\n").filter(line => line.trim() !== "");
      setOutput(lines.join(separator));
    }
  };

  return (
    <TextToolLayout
      title="Wrap / Unwrap Lines"
      description="Wrap long lines or unwrap short lines"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleProcess}
      processLabel={mode === "wrap" ? "Wrap" : "Unwrap"}
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="wrap-mode"
                  checked={mode === "wrap"}
                  onChange={() => setMode("wrap")}
                />
                <span>Wrap (break long lines)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="wrap-mode"
                  checked={mode === "unwrap"}
                  onChange={() => setMode("unwrap")}
                />
                <span>Unwrap (join lines)</span>
              </label>
            </div>
          </div>

          {mode === "wrap" && (
            <div>
              <label className="block text-sm font-medium mb-2">Wrap Width</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Math.max(10, parseInt(e.target.value, 10)))}
                min={10}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value=" ">Space</option>
              <option value=",">Comma</option>
              <option value=", ">Comma + Space</option>
              <option value="\n">Newline</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
