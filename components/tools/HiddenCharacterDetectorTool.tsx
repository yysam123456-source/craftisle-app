"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

export default function HiddenCharacterDetectorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleDetect = () => {
    if (!input) {
      setOutput("");
      return;
    }

    const lines = input.split("\n");
    const results: string[] = [];

    lines.forEach((line, idx) => {
      const hiddenChars: string[] = [];
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const code = char.charCodeAt(0);
        // Check for hidden characters: zero-width space, BOM, etc.
        if (code === 0x200B || code === 0xFEFF || code === 0x200C || code === 0x200D || code === 0x2060) {
          hiddenChars.push(`U+${code.toString(16).toUpperCase()}`);
        }
      }

      if (hiddenChars.length > 0) {
        results.push(`Line ${idx + 1}: Found hidden characters: ${hiddenChars.join(", ")}`);
      }
    });

    if (results.length === 0) {
      setOutput("No hidden characters found.");
    } else {
      setOutput(results.join("\n"));
    }
  };

  return (
    <TextToolLayout
      title="Hidden Character Detector"
      description="Detect hidden characters in text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleDetect}
      processLabel="Detect"
      options={
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Detects zero-width space (U+200B), BOM (U+FEFF), ZWNJ (U+200C), ZWJ (U+200D), WJ (U+2060).
          </p>
        </div>
      }
    />
  );
}
