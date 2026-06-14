"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Sort JSON Keys
 * Sort keys in JSON objects alphabetically
 */
export default function SortJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [recursive, setRecursive] = useState(true);

  const sortKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => sortKeys(item));
    }

    if (typeof obj === "object" && obj !== null) {
      const sorted: Record<string, any> = {};
      Object.keys(obj).sort().forEach(key => {
        sorted[key] = sortKeys(obj[key]);
      });
      return sorted;
    }

    return obj;
  };

  const handleSort = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      const sorted = recursive ? sortKeys(json) : json;
      setOutput(JSON.stringify(sorted, null, 2));
    } catch {
      setOutput("❌ Invalid JSON format");
    }
  };

  return (
    <TextToolLayout
      title="Sort JSON Keys"
      description="Sort keys in JSON objects alphabetically"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSort}
      processLabel="Sort Keys"
      options={
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={recursive}
            onChange={(e) => setRecursive(e.target.checked)}
          />
          <span className="text-sm">Recursive (sort nested objects too)</span>
        </label>
      }
    />
  );
}
