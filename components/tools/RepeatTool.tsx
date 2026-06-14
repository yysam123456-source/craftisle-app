"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function RepeatTool() {
  const [input, setInput] = useState("");
  const [count, setCount] = useState("3");
  const [separator, setSeparator] = useState("");
  const [output, setOutput] = useState("");

  const handleRepeat = () => {
    if (!input) {
      setOutput("");
      return;
    }

    const n = parseInt(count);
    if (isNaN(n) || n <= 0) {
      setOutput("Error: Please enter a valid positive number");
      return;
    }

    const result: string[] = [];
    for (let i = 0; i < n; i++) {
      result.push(input);
    }

    setOutput(result.join(separator));
  };

  return (
    <TextToolLayout
      title="Repeat Text"
      description="Repeat text multiple times"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleRepeat}
      processLabel="Repeat"
      options={
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Repeat Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min={1}
              max={1000}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Separator (optional)</label>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder="e.g., comma, newline"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      }
    />
  );
}
