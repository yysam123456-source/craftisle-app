"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Duplicate
 * Duplicate lines in text N times
 */
export default function ListDuplicateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copies, setCopies] = useState(2);
  const [concatenate, setConcatenate] = useState(true);
  const [reverse, setReverse] = useState(false);
  const [separator, setSeparator] = useState("\n");

  const handleDuplicate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n");
      let result: string[] = [];

      if (concatenate) {
        // Concatenate: original + copies
        result = [...lines];
        for (let i = 1; i < copies; i++) {
          if (reverse) {
            result = [...result, ...lines.reverse()];
          } else {
            result = [...result, ...lines];
          }
        }
      } else {
        // Interleave: original, copy, original, copy, ...
        const copiesArray = reverse ? [...lines].reverse() : lines;
        const maxLength = Math.max(lines.length, copiesArray.length * (copies - 1));
        
        for (let i = 0; i < maxLength; i++) {
          if (i < lines.length) result.push(lines[i]);
          for (let c = 0; c < copies - 1; c++) {
            if (i < copiesArray.length) result.push(copiesArray[i]);
          }
        }
      }

      setOutput(result.join(separator));
    } catch {
      setOutput("❌ Error duplicating lines. Check input and settings.");
    }
  };

  return (
    <TextToolLayout
      title="Duplicate Lines"
      description="Duplicate lines in text N times"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleDuplicate}
      processLabel="Duplicate"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Number of Copies</label>
            <input
              type="number"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10)))}
              min={1}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={concatenate}
              onChange={(e) => setConcatenate(e.target.checked)}
            />
            <span className="text-sm">Concatenate (Original + Copies + Copies)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={reverse}
              onChange={(e) => setReverse(e.target.checked)}
            />
            <span className="text-sm">Reverse copies</span>
          </label>

          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="\n">Newline</option>
              <option value=",">Comma</option>
              <option value=" ">Space</option>
              <option value=";">Semicolon</option>
            </select>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p><strong>Concatenate mode:</strong> Original + Copies + Copies</p>
            <p><strong>Interleave mode:</strong> Original, Copy, Original, Copy, ...</p>
          </div>
        </div>
      }
    />
  );
}
