"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * JSON Comparison
 * Compare two JSON objects and show differences
 */
export default function JsonComparisonTool() {
  const [input1, setInput1] = useState("");
  const [input2, setInput2] = useState("");
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState<"text" | "json">("text");

  const findDifferences = (obj1: any, obj2: any, path: string[] = []): string[] => {
    const differences: string[] = [];
    const processPath = (p: string[]): string => p.length ? p.join('.') : 'root';

    // Compare all keys in obj1
    for (const key in obj1) {
      const currentPath = [...path, key];

      if (!(key in obj2)) {
        differences.push(`${processPath(currentPath)}: Missing in second JSON`);
        continue;
      }

      const value1 = obj1[key];
      const value2 = obj2[key];

      if (typeof value1 === 'object' && value1 !== null && typeof value2 === 'object' && value2 !== null) {
        differences.push(...findDifferences(value1, value2, currentPath));
      } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        differences.push(`${processPath(currentPath)}: Mismatch: ${JSON.stringify(value1)} != ${JSON.stringify(value2)}`);
      }
    }

    // Check for keys in obj2 that don't exist in obj1
    for (const key in obj2) {
      if (!(key in obj1)) {
        const currentPath = [...path, key];
        differences.push(`${processPath(currentPath)}: Missing in first JSON`);
      }
    }

    return differences;
  };

  const handleCompare = () => {
    if (!input1.trim() && !input2.trim()) {
      setOutput("");
      return;
    }

    try {
      const json1 = input1.trim() ? JSON.parse(input1) : {};
      const json2 = input2.trim() ? JSON.parse(input2) : {};

      const differences = findDifferences(json1, json2);

      if (differences.length === 0) {
        setOutput("✓ No differences found");
      } else if (format === "json") {
        const diffs: Record<string, string> = {};
        differences.forEach(diff => {
          const parts = diff.split(': ');
          if (parts.length >= 2) {
            diffs[parts[0]] = parts.slice(1).join(': ');
          }
        });
        setOutput(JSON.stringify(diffs, null, 2));
      } else {
        setOutput(differences.join("\n"));
      }
    } catch {
      setOutput("❌ Invalid JSON format in one or both inputs");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">JSON Comparison</h1>
        <p className="text-gray-600 dark:text-gray-400">Compare two JSON objects and show differences</p>
      </div>

      {/* Options */}
      <div>
        <label className="block text-sm font-medium mb-2">Output Format</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === "text"}
              onChange={() => setFormat("text")}
            />
            <span>Text (human-readable)</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="format"
              checked={format === "json"}
              onChange={() => setFormat("json")}
            />
            <span>JSON (structured)</span>
          </label>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleCompare} className="gap-2">
          Compare JSONs
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
          <h3 className="font-medium">First JSON</h3>
          <textarea
            value={input1}
            onChange={(e) => setInput1(e.target.value)}
            placeholder="Paste first JSON here..."
            className="w-full min-h-[200px] font-mono resize-none border rounded-md p-3"
          />
        </div>

        {/* Input 2 */}
        <div className="space-y-4">
          <h3 className="font-medium">Second JSON</h3>
          <textarea
            value={input2}
            onChange={(e) => setInput2(e.target.value)}
            placeholder="Paste second JSON here..."
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
