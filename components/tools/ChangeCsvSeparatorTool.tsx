"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Change CSV Separator
 * Convert CSV from one separator to another
 */
export default function ChangeCsvSeparatorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fromSep, setFromSep] = useState(",");
  const [toSep, setToSep] = useState(";");

  const handleConvert = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const lines = input.split("\n").filter(line => line.trim());
      
      const converted = lines.map(line => {
        return line.split(fromSep).map(cell => cell.trim().replace(/^"|"$/g, "")).join(toSep);
      });

      setOutput(converted.join("\n"));
    } catch {
      setOutput("❌ Error changing separator");
    }
  };

  return (
    <TextToolLayout
      title="Change CSV Separator"
      description="Convert CSV from one separator to another"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel="Convert"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">From Separator</label>
            <select
              value={fromSep}
              onChange={(e) => setFromSep(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Separator</label>
            <select
              value={toSep}
              onChange={(e) => setToSep(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
              <option value="|">Pipe (|)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
