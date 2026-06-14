"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Text Compare
 * Compare two texts and show differences
 */
export default function TextCompareTool() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"word" | "char">("word");

  const compareTexts = (text1: string, text2: string, byWord: boolean): string => {
    const items1 = byWord ? text1.split(/(\s+)/) : text1.split("");
    const items2 = byWord ? text2.split(/(\s+)/) : text2.split("");

    const diffs: string[] = [];
    const maxLen = Math.max(items1.length, items2.length);

    for (let i = 0; i < maxLen; i++) {
      if (i >= items1.length) {
        diffs.push(`+ ${items2[i]}`);
      } else if (i >= items2.length) {
        diffs.push(`- ${items1[i]}`);
      } else if (items1[i] !== items2[i]) {
        diffs.push(`- ${items1[i]}`);
        diffs.push(`+ ${items2[i]}`);
      } else {
        diffs.push(`  ${items1[i]}`);
      }
    }

    return diffs.join("\n");
  };

  const handleCompare = () => {
    if (!input1.trim() && !input2.trim()) {
      setOutput("");
      return;
    }

    try {
      const diff = compareTexts(input1, input2, mode === "word");
      setOutput(diff);
    } catch {
      setOutput("❌ Error comparing texts.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Text Compare</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare two texts and show differences</p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium mb-2">Comparison Mode</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "word"}
              onChange={() => setMode("word")}
            />
            <span>Word level</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "char"}
              onChange={() => setMode("char")}
            />
            <span>Character level</span>
          </label>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleCompare} className="gap-2">
          Compare Texts
        </Button>
        <Button
          variant="outline"
          onClick={() => { setInput1(""); setInput2(""); }}
          className="gap-2"
        >
          Clear Both
        </Button>
      </div>

      {/* Input/Output */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input 1 */}
        <div className="space-y-4">
          <h3 className="font-medium">Original Text</h3>
          <textarea
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            placeholder="Paste original text here..."
            className="w-full min-h-[200px] font-mono resize-none border rounded-md p-3"
          />
        </div>

        {/* Input 2 */}
        <div className="space-y-4">
          <h3 className="font-medium">Modified Text</h3>
          <textarea
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            placeholder="Paste modified text here..."
            className="w-full min-h-[200px] font-mono resize-none border rounded-md p-3"
          />
        </div>
      </div>

      {/* Output */}
      {output && (
        <div className="space-y-4">
          <h3 className="font-medium">Differences</h3>
          <pre className="whitespace-pre-wrap bg-muted/50 p-4 rounded-md text-sm font-mono">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
