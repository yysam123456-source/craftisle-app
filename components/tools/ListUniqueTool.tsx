"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Find Unique
 * Extract unique lines from a list
 */
export default function ListUniqueTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [count, setCount] = useState(false);

  const handleFindUnique = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const lines = input.split("\n");
    const seen = new Map<string, number>();

    lines.forEach(line => {
      const key = caseSensitive ? line : line.toLowerCase();
      seen.set(key, (seen.get(key) || 0) + 1);
    });

    const unique = Array.from(seen.entries())
      .filter(([, count]) => count === 1)
      .map(([key]) => {
        // Find original case
        if (caseSensitive) return key;
        const original = lines.find(l => l.toLowerCase() === key);
        return original || key;
      });

    if (count) {
      setOutput(`${unique.length} unique lines found (appeared exactly once)`);
    } else {
      setOutput(unique.join("\n"));
    }
  };

  return (
    <TextToolLayout
      title="Find Unique Lines"
      description="Extract lines that appear exactly once"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleFindUnique}
      processLabel="Find Unique"
      options={
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            <span className="text-sm">Case-sensitive comparison</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={count}
              onChange={(e) => setCount(e.target.checked)}
            />
            <span className="text-sm">Count only (don't show lines)</span>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>This tool finds lines that appear <strong>exactly once</strong>.</p>
            <p>Lines that appear multiple times are excluded.</p>
          </div>
        </div>
      }
    />
  );
}
