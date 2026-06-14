"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Stringify JSON Tool
 * Convert JavaScript objects to JSON strings
 */
export default function StringifyJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentType, setIndentType] = useState<"space" | "tab">("space");
  const [spacesCount, setSpacesCount] = useState(2);
  const [escapeHtml, setEscapeHtml] = useState(false);

  const handleStringify = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      // Safely evaluate the input as JavaScript
      // Using Function constructor to avoid eval() issues
      const parsed = new Function(`return (${input})`)();

      const indent = indentType === "tab" ? "\t" : " ".repeat(spacesCount);
      let result = JSON.stringify(parsed, null, indent);

      if (escapeHtml) {
        result = result
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      setOutput(result);
    } catch {
      setOutput(
        "❌ Invalid JavaScript object/array. Check syntax. Example: {name: 'John', age: 30}"
      );
    }
  };

  return (
    <TextToolLayout
      title="Stringify JSON"
      description="Convert JavaScript objects to JSON strings"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleStringify}
      processLabel="Stringify"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Indent Type
            </label>
            <select
              value={indentType}
              onChange={(e) =>
                setIndentType(e.target.value as "space" | "tab")
              }
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="space">Spaces</option>
              <option value="tab">Tab</option>
            </select>
          </div>

          {indentType === "space" && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Spaces Count
              </label>
              <select
                value={spacesCount}
                onChange={(e) => setSpacesCount(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={escapeHtml}
              onChange={(e) => setEscapeHtml(e.target.checked)}
            />
            <span className="text-sm">Escape HTML entities</span>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Input: JavaScript object/array (not JSON).</p>
            <p>Example: <code>{`{name: 'John', age: 30}`}</code></p>
            <p>Output: Valid JSON string.</p>
          </div>
        </div>
      }
    />
  );
}
