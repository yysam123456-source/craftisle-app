"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function JoinTool() {
  const [input, setInput] = useState("");
  const [separator, setSeparator] = useState(",");
  const [output, setOutput] = useState("");

  const handleJoin = () => {
    if (!input) {
      setOutput("");
      return;
    }

    const items = input.split("\n").filter(line => line.trim() !== "");
    const result = items.join(separator);
    setOutput(result);
  };

  return (
    <TextToolLayout
      title="Join Lines"
      description="Join multiple lines into one with a separator"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleJoin}
      processLabel="Join"
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
            Use \n for newline, \t for tab. Each line becomes an item.
          </p>
        </div>
      }
    />
  );
}
