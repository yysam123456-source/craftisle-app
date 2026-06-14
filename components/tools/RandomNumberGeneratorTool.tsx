"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eraser } from "lucide-react";
import { toast } from "sonner";

export default function RandomNumberGeneratorTool() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("1");
  const [unique, setUnique] = useState(false);
  const [output, setOutput] = useState("");

  const handleGenerate = () => {
    const mn = parseInt(min);
    const mx = parseInt(max);
    const cnt = parseInt(count);

    if (isNaN(mn) || isNaN(mx) || isNaN(cnt) || cnt <= 0) {
      setOutput("Error: Please enter valid numbers");
      return;
    }

    if (mn > mx) {
      setOutput("Error: Min must be less than or equal to Max");
      return;
    }

    if (unique && cnt > (mx - mn + 1)) {
      setOutput(`Error: Cannot generate ${cnt} unique numbers in range [${mn}, ${mx}]`);
      return;
    }

    const nums: number[] = [];
    if (unique) {
      const pool: number[] = [];
      for (let i = mn; i <= mx; i++) pool.push(i);
      for (let i = 0; i < cnt; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        nums.push(pool.splice(idx, 1)[0]);
      }
    } else {
      for (let i = 0; i < cnt; i++) {
        nums.push(Math.floor(Math.random() * (mx - mn + 1)) + mn);
      }
    }

    setOutput(nums.join("\n"));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied!");
  };

  const handleClear = () => {
    setOutput("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Random Number Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Min</label>
            <input
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Max</label>
            <input
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="unique"
            checked={unique}
            onChange={(e) => setUnique(e.target.checked)}
          />
          <label htmlFor="unique" className="text-sm">Unique numbers only</label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerate} className="gap-2">
            Generate
          </Button>
          {output && (
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {output && (
            <Button variant="outline" size="icon" onClick={handleClear}>
              <Eraser className="h-4 w-4" />
            </Button>
          )}
        </div>

        {output && (
          <div>
            <label className="text-sm font-medium mb-2 block">Output</label>
            <pre className="p-3 bg-muted rounded-md overflow-auto whitespace-pre-wrap text-sm">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
