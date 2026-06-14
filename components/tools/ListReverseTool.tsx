"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Reverse
 * Reverse the order of lines
 */
export default function ListReverseTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [preserveEmpty, setPreserveEmpty] = useState(false);

  const handleReverse = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let lines = input.split("\n");

    if (!preserveEmpty) {
      lines = lines.filter(line => line.trim() !== "");
    }

    const reversed = lines.reverse();
    setOutput(reversed.join("\n"));
  };

  return (
    <TextToolLayout
      title="Reverse Lines"
      description="Reverse the order of lines in text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleReverse}
      processLabel="Reverse"
      options={
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={preserveEmpty}
            onChange={(e) => setPreserveEmpty(e.target.checked)}
          />
          <span className="text-sm">Preserve empty lines</span>
        </label>
      }
    />
  );
}
