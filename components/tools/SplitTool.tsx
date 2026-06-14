"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function SplitTool() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState(" ");
  const [output, setOutput] = useState("");

  const handleSplit = () => {
    if (!input) {
      setOutput("");
      return;
    }

    const items = input.split(separator);
    setOutput(items.join("\n"));
  };

  return (
    <TextToolLayout
      title="Split Text"
      description="Split text into multiple lines by separator"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleSplit}
      processLabel="Split"
      options={
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Separator</label>
            <input
              type="text"
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder="e.g., comma, space, newline"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use \n for newline, \t for tab. Text will be split into lines.
          </p>
        </div>
      }
    />
  );
}
