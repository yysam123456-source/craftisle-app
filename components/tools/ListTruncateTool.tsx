"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Truncate
 * Keep first N lines or remove first N lines
 */
export default function ListTruncateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [position, setPosition] = useState<"keep" | "remove">("keep");
  const [count, setCount] = useState(5);
  const [preserveEmpty, setPreserveEmpty] = useState(false);

  const handleTruncate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let lines = input.split("\n");

    if (!preserveEmpty) {
      lines = lines.filter(line => line.trim() !== "");
    }

    let result: string[];
    
    if (position === "keep") {
      result = lines.slice(0, count);
    } else {
      result = lines.slice(count);
    }

    setOutput(result.join("\n"));
  };

  return (
    <TextToolLayout
      title="Truncate Lines"
      description="Keep or remove first N lines"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleTruncate}
      processLabel="Truncate"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="position"
                  checked={position === "keep"}
                  onChange={() => setPosition("keep")}
                />
                <span>Keep first N lines</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="position"
                  checked={position === "remove"}
                  onChange={() => setPosition("remove")}
                />
                <span>Remove first N lines</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Number of Lines</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10)))}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preserveEmpty}
              onChange={(e) => setPreserveEmpty(e.target.checked)}
            />
            <span className="text-sm">Preserve empty lines</span>
          </label>
        </div>
      }
    />
  );
}
