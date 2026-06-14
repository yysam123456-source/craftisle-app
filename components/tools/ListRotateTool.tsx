"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Rotate
 * Rotate lines in text (move first N lines to end)
 */
export default function ListRotateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [positions, setPositions] = useState(1);
  const [preserveEmpty, setPreserveEmpty] = useState(false);

  const handleRotate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let lines = input.split("\n");

    if (!preserveEmpty) {
      lines = lines.filter(line => line.trim() !== "");
    }

    if (lines.length === 0) {
      setOutput("");
      return;
    }

    // Rotate: move first N lines to end
    const rotateBy = positions % lines.length;
    const rotated = [...lines.slice(rotateBy), ...lines.slice(0, rotateBy)];
    
    setOutput(rotated.join("\n"));
  };

  return (
    <TextToolLayout
      title="Rotate Lines"
      description="Rotate lines in text (move first N lines to end)"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleRotate}
      processLabel="Rotate"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rotate by (positions)</label>
            <input
              type="number"
              value={positions}
              onChange={(e) => setPositions(Math.max(1, parseInt(e.target.value, 10)))}
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

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Example: "a b c" with rotate=1 → "b c a"</p>
          </div>
        </div>
      }
    />
  );
}
