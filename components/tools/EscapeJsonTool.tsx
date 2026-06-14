"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Escape JSON Tool
 * Escape or unescape JSON strings
 */
export default function EscapeJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"escape" | "unescape">("escape");
  const [wrapInQuotes, setWrapInQuotes] = useState(true);

  const handleProcess = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      if (mode === "escape") {
        // Escape: convert string to JSON-encoded string
        const escaped = JSON.stringify(input);
        if (!wrapInQuotes) {
          // Remove surrounding quotes
          setOutput(escaped.slice(1, -1));
        } else {
          setOutput(escaped);
        }
      } else {
        // Unescape: parse JSON string to get original
        // Input should be a JSON string (with quotes)
        let parsed;
        try {
          parsed = JSON.parse(input);
        } catch {
          // If input is not a valid JSON string, try to unescape manually
          setOutput("❌ Invalid JSON string. Input must be a valid JSON string (with quotes).");
          return;
        }
        setOutput(String(parsed));
      }
    } catch {
      setOutput("❌ Error processing input.");
    }
  };

  return (
    <TextToolLayout
      title="Escape JSON"
      description="Escape or unescape JSON strings"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleProcess}
      processLabel={mode === "escape" ? "Escape" : "Unescape"}
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <select
              value={mode}
              onChange={(e) =>
                setMode(e.target.value as "escape" | "unescape")
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="escape">Escape (string → JSON)</option>
              <option value="unescape">Unescape (JSON → string)</option>
            </select>
          </div>

          {mode === "escape" && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={wrapInQuotes}
                onChange={(e) => setWrapInQuotes(e.target.checked)}
              />
              <span className="text-sm">Wrap in quotes (")</span>
            </label>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Escape:</strong> Convert text to JSON string (e.g.,{" "}
              <code>Hello &quot;world&quot;</code> →{" "}
              <code>&quot;Hello \\&quot;world\\&quot;&quot;</code>)
            </p>
            <p>
              <strong>Unescape:</strong> Convert JSON string to text (e.g.,{" "}
              <code>&quot;Hello \\&quot;world\\&quot;&quot;</code> →{" "}
              <code>Hello &quot;world&quot;</code>)
            </p>
          </div>
        </div>
      }
    />
  );
}
