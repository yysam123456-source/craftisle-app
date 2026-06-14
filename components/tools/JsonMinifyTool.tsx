"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * JSON Minifier
 * Minify JSON by removing whitespace
 */
export default function JsonMinifyTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleMinify = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      const minified = JSON.stringify(json);
      setOutput(minified);
    } catch {
      setOutput("❌ Invalid JSON format");
    }
  };

  return (
    <TextToolLayout
      title="JSON Minifier"
      description="Minify JSON by removing whitespace"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleMinify}
      processLabel="Minify"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Paste JSON to minify.</p>
          <p>Removes all unnecessary whitespace.</p>
          <p>Use "JSON Formatter" tool to format/minify with options.</p>
        </div>
      }
    />
  );
}
