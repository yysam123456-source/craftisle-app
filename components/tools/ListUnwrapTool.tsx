"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * List Unwrap
 * Join lines with separator (alias for wrap tool unwrap mode)
 */
export default function ListUnwrapTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState(" ");

  const handleUnwrap = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const lines = input.split("\n").filter(line => line.trim() !== "");
    setOutput(lines.join(separator));
  };

  return (
    <TextToolLayout
      title="Unwrap Lines"
      description="Join lines with separator"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleUnwrap}
      processLabel="Unwrap"
      options={
        <div>
          <label className="block text-sm font-medium mb-2">Separator</label>
          <select
            value={separator}
            onChange={(e) => setSeparator(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value=" ">Space</option>
            <option value=",">Comma</option>
            <option value=", ">Comma + Space</option>
            <option value="\n">Newline</option>
          </select>
        </div>
      }
    />
  );
}
