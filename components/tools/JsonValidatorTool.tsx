"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * JSON Validator
 * Validate JSON format
 */
export default function JsonValidatorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleValidate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const json = JSON.parse(input);
      const type = Array.isArray(json) ? "array" : typeof json;
      const size = JSON.stringify(json).length;
      
      let info = "✓ Valid JSON\n\n";
      info += `Type: ${type}\n`;
      info += `Size: ${size} characters\n`;
      
      if (type === "object") {
        const keys = Object.keys(json);
        info += `Keys: ${keys.length}\n`;
        if (keys.length > 0 && keys.length <= 10) {
          info += `Properties: ${keys.join(", ")}\n`;
        }
      } else if (type === "array") {
        info += `Items: ${json.length}\n`;
      }
      
      setOutput(info);
    } catch (e) {
      const error = e as Error;
      setOutput(`❌ Invalid JSON\n\nError: ${error.message}`);
    }
  };

  return (
    <TextToolLayout
      title="JSON Validator"
      description="Validate JSON format and show info"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleValidate}
      processLabel="Validate"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p>Paste JSON to validate.</p>
          <p>Shows type, size, and structure info.</p>
        </div>
      }
    />
  );
}
