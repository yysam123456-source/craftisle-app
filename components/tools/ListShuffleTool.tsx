"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Shuffle
 * Randomize the order of lines in text
 */
export default function ListShuffleTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [preserveEmpty, setPreserveEmpty] = useState(false);

  const handleShuffle = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let lines = input.split("\n");

    if (!preserveEmpty) {
      lines = lines.filter(line => line.trim() !== "");
    }

    // Fisher-Yates shuffle
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }

    setOutput(lines.join("\n"));
  };

  return (
    <TextToolLayout
      title="Shuffle Lines"
      description="Randomize the order of lines in text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleShuffle}
      processLabel="Shuffle"
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
