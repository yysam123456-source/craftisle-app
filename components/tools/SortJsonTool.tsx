"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Sort JSON Tool
 * Sort JSON keys alphabetically
 */
export default function SortJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [mode, setMode] = useState<"key" | "value">("key");

  const handleSort = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const parsed = JSON.parse(input);

      if (mode === "key") {
        if (Array.isArray(parsed)) {
          if (parsed.length === 0) {
            setOutput("❌ Array is empty");
            return;
          }
          const sorted = parsed.map((item) =>
            typeof item === "object" && item !== null
              ? sortObject(item, order)
              : item
          );
          setOutput(JSON.stringify(sorted, null, 2));
        } else if (typeof parsed === "object" && parsed !== null) {
          setOutput(JSON.stringify(sortObject(parsed, order), null, 2));
        } else {
          setOutput("❌ Input must be a JSON object or array of objects");
        }
      } else {
        setOutput(
          "❌ Value mode requires array input with key specification (not implemented in this version)"
        );
      }
    } catch {
      setOutput("❌ Invalid JSON format. Check syntax.");
    }
  };

  const sortObject = (
    obj: Record<string, unknown>,
    sortOrder: "asc" | "desc"
  ): Record<string, unknown> => {
    const sortedKeys = Object.keys(obj).sort((a, b) => {
      const cmp = a.localeCompare(b);
      return sortOrder === "asc" ? cmp : -cmp;
    });
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) result[key] = obj[key];
    return result;
  };

  return (
    <TextToolLayout
      title="Sort JSON"
      description="Sort JSON keys alphabetically"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSort}
      processLabel="Sort"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sort Order</label>
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="asc">Ascending (A-Z)</option>
              <option value="desc">Descending (Z-A)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as "key" | "value")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="key">By Key (sort object keys)</option>
              <option value="value" disabled>
                By Value (requires key selection)
              </option>
            </select>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Sorts JSON object keys alphabetically.</p>
            <p>Works with objects and arrays of objects.</p>
          </div>
        </div>
      }
    />
  );
}
