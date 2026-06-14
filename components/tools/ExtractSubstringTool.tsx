"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function ExtractSubstringTool() {
  const [input, setInput] = useState("");
  const [start, setStart] = useState("0");
  const [end, setEnd] = useState("");
  const [output, setOutput] = useState("");

  const handleExtract = () => {
    if (!input) {
      setOutput("");
      return;
    }

    const s = parseInt(start);
    const e = end ? parseInt(end) : input.length;

    if (isNaN(s) || isNaN(e)) {
      setOutput("Error: Please enter valid numbers for start and end");
      return;
    }

    if (s < 0 || e > input.length || s >= e) {
      setOutput("Error: Invalid range (start must be < end, both within string length)");
      return;
    }

    setOutput(input.substring(s, e));
  };

  return (
    <TextToolLayout
      title="Extract Substring"
      description="Extract a substring from text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleExtract}
      processLabel="Extract"
      options={
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Start Index</label>
            <input
              type="number"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              min={0}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">End Index (optional, defaults to end)</label>
            <input
              type="number"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={0}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Index starts at 0. Leave "End Index" empty to extract to the end.
          </p>
        </div>
      }
    />
  );
}
