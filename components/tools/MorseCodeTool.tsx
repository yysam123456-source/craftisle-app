"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

const morseMap: Record<string, string> = {
  "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
  "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
  "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
  "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
  "Y": "-.--", "Z": "--..", "0": "-----", "1": ".----", "2": "..---",
  "3": "...--", "4": "....-", "5": ".....", "6": "-....", "7": "--...",
  "8": "---..", "9": "----.", " ": "/"
};

const reverseMorseMap: Record<string, string> = {};
Object.entries(morseMap).forEach(([char, code]) => {
  reverseMorseMap[code] = char;
});

export default function MorseCodeTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"to" | "from">("to");
  const [output, setOutput] = useState("");

  const handleConvert = () => {
    if (!input) {
      setOutput("");
      return;
    }

    if (mode === "to") {
      // Text to Morse
      const result = input.toUpperCase().split("").map(char => {
        return morseMap[char] || char;
      }).join(" ");
      setOutput(result);
    } else {
      // Morse to Text
      const result = input.trim().split(/\s+/).map(code => {
        return reverseMorseMap[code] || code;
      }).join("");
      setOutput(result);
    }
  };

  return (
    <TextToolLayout
      title="Morse Code Converter"
      description="Convert text to Morse code or Morse code to text"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleConvert}
      processLabel={mode === "to" ? "To Morse" : "From Morse"}
      options={
        <div className="space-y-3">
          <label className="text-sm font-medium">Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "to"}
                onChange={() => setMode("to")}
              />
              Text → Morse
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={mode === "from"}
                onChange={() => setMode("from")}
              />
              Morse → Text
            </label>
          </div>
        </div>
      }
    />
  );
}
