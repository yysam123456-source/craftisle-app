"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * ROT13 Cipher
 * Apply ROT13 cipher to text
 */
export default function Rot13Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleProcess = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      const result = input.split("").map(char => {
        const code = char.charCodeAt(0);
        // Uppercase A-Z
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        }
        // Lowercase a-z
        if (code >= 97 && code <= 122) {
          return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        }
        return char;
      }).join("");
      
      setOutput(result);
    } catch {
      setOutput("❌ Error applying ROT13.");
    }
  };

  return (
    <TextToolLayout
      title="ROT13 Cipher"
      description="Apply ROT13 cipher to text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleProcess}
      processLabel="Apply ROT13"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>ROT13 is a simple letter substitution cipher.</p>
          <p>Applying it twice returns the original text.</p>
        </div>
      }
    />
  );
}
