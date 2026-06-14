"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Escape JSON
 * Escape special characters in JSON strings
 */
export default function EscapeJsonTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleEscape = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      // Escape JSON string (for use in JSON strings)
      const escaped = input
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
      
      setOutput(escaped);
    } catch {
      setOutput("❌ Error escaping JSON");
    }
  };

  return (
    <TextToolLayout
      title="Escape JSON"
      description="Escape special characters in JSON strings"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleEscape}
      processLabel="Escape"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Escapes: backslash, quotes, newline, carriage return, tab</p>
          <p>Use case: embedding strings in JSON</p>
        </div>
      }
    />
  );
}
