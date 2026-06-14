"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Stringify JSON
 * Convert JavaScript objects to JSON string
 */
export default function StringifyJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState(2);

  const handleStringify = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      // Evaluate as JavaScript object (safe in browser)
      const obj = new Function(`return ${input}`)();
      const json = JSON.stringify(obj, null, indent);
      setOutput(json);
    } catch {
      setOutput("❌ Invalid JavaScript object format. Use valid JS syntax (e.g., {name: 'Alice', age: 25})");
    }
  };

  return (
    <TextToolLayout
      title="Stringify JSON"
      description="Convert JavaScript objects to JSON string"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleStringify}
      processLabel="Stringify"
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Input: Valid JavaScript object</p>
            <p>Example: `{`{name: 'Alice', age: 25}`}`</p>
          </div>
        </div>
      }
    />
  );
}
