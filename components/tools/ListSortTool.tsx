"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Sort
 * Sort lines alphabetically or numerically
 */
export default function ListSortTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [sortBy, setSortBy] = useState<"alpha" | "numeric" | "length">("alpha");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  const handleSort = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let lines = input.split("\n").filter(line => line.trim() !== "");

    if (removeDuplicates) {
      lines = [...new Set(lines)];
    }

    lines.sort((a, b) => {
      let aVal = a;
      let bVal = b;

      if (ignoreCase) {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      let comparison = 0;

      if (sortBy === "alpha") {
        comparison = aVal.localeCompare(bVal);
      } else if (sortBy === "numeric") {
        const aNum = parseFloat(a);
        const bNum = parseFloat(b);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum;
        } else {
          comparison = aVal.localeCompare(bVal);
        }
      } else if (sortBy === "length") {
        comparison = a.length - b.length;
      }

      return direction === "asc" ? comparison : -comparison;
    });

    setOutput(lines.join("\n"));
  };

  return (
    <TextToolLayout
      title="Sort Lines"
      description="Sort lines alphabetically, numerically, or by length"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSort}
      processLabel="Sort"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sort Direction</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === "asc"}
                  onChange={() => setDirection("asc")}
                />
                <span>Ascending (A→Z)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="direction"
                  checked={direction === "desc"}
                  onChange={() => setDirection("desc")}
                />
                <span>Descending (Z→A)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "alpha" | "numeric" | "length")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="alpha">Alphabetical</option>
              <option value="numeric">Numeric (if parseable)</option>
              <option value="length">String Length</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            <span className="text-sm">Ignore case (A=a)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
            />
            <span className="text-sm">Remove duplicates</span>
          </label>
        </div>
      }
    />
  );
}
