"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function ArithmeticSequenceTool() {
  const [start, setStart] = useState("1");
  const [diff, setDiff] = useState("1");
  const [count, setCount] = useState("10");
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    const s = parseInt(start);
    const d = parseInt(diff);
    const n = parseInt(count);

    if (isNaN(s) || isNaN(d) || isNaN(n) || n <= 0) {
      setOutput("Error: Please enter valid numbers (count must be positive)");
      return;
    }

    const seq: number[] = [];
    for (let i = 0; i < n; i++) {
      seq.push(s + i * d);
    }

    setOutput(seq.join("\n"));
  };

  return (
    <TextToolLayout
      title="Arithmetic Sequence Generator"
      description="Generate arithmetic sequence"
      input={[start, diff, count].join("\n")}
      output={output}
      onInputChange={() => {}}
      onProcess={handleGenerate}
      processLabel="Generate"
      options={
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Start Value</label>
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Common Difference</label>
            <input
              type="number"
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      }
    />
  );
}
