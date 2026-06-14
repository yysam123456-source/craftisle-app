"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * JSON Formatter / Beautifier
 * Format and validate JSON
 */
export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);
  const [sortKeys, setSortKeys] = useState(false);

  const handleFormat = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      const formatted = JSON.stringify(json, sortKeys ? Object.keys(json).sort() : null, indent);
      setOutput(formatted);
    } catch {
      setOutput("❌ Invalid JSON format. Check syntax.");
    }
  };

  const handleMinify = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      const minified = JSON.stringify(json);
      setOutput(minified);
    } catch {
      setOutput("❌ Invalid JSON format. Check syntax.");
    }
  };

  return (
    <TextToolLayout
      title="JSON Formatter"
      description="Format, validate, and minify JSON"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleFormat}
      processLabel="Format"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Indent Size</label>
            <select
              value={indent}
              onChange={(e) => setIndent(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
              <option value={0}>Tab</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sortKeys}
              onChange={(e) => setSortKeys(e.target.checked)}
            />
            <span className="text-sm">Sort keys alphabetically</span>
          </label>

          <button
            onClick={handleMinify}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Minify JSON
          </button>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Paste JSON to format or validate.</p>
            <p>Use "Minify" to remove whitespace.</p>
          </div>
        </div>
      }
    />
  );
}
