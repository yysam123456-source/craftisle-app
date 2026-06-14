"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eraser } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [count, setCount] = useState(1);
  const [output, setOutput] = useState("");

  const generatePassword = () => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let chars = "";
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;

    if (chars.length === 0) {
      setOutput("Error: Please select at least one character type");
      return;
    }

    const passwords: string[] = [];
    for (let c = 0; c < count; c++) {
      let pwd: string = "";
      for (let i = 0; i < length; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      passwords.push(pwd);
    }

    setOutput(passwords.join("\n"));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Length</label>
            <input
              type="number"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value) || 16)}
              min={4}
              max={128}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              min={1}
              max={20}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Character Types</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} />
              Uppercase
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} />
              Lowercase
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} />
              Numbers
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} />
              Symbols
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={generatePassword} className="gap-2">
            Generate Password
          </Button>
          {output && (
            <Button variant="outline" size="icon" onClick={handleCopy}>
              <Copy className="h-4 w-4" />
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
