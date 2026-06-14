"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function TextReplacerTool() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(true);
  const [output, setOutput] = useState("");

  const handleReplace = () => {
    if (!input) {
      setOutput("");
      return;
    }

    if (!search) {
      setOutput(input);
      return;
    }

    let result;
    if (caseSensitive) {
      result = input.split(search).join(replace);
    } else {
      // Case-insensitive replace
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      result = input.replace(regex, replace);
    }

    setOutput(result);
  };

  return (
    <TextToolLayout
      title="Text Replacer"
      description="Find and replace text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleReplace}
      processLabel="Replace"
      options={
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Search For</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Text to find"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Replace With</label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replacement text"
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            Case sensitive
          </label>
        </div>
      }
    />
  );
}
