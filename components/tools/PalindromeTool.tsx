"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function PalindromeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const isPalindrome = (text: string): boolean => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleaned === cleaned.split("").reverse().join("");
  };

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const lines = input.split("\n").filter(line => line.trim() !== "");
    const results = lines.map(line => {
      const result = isPalindrome(line);
      return `${line} → ${result ? "✅ Palindrome" : "❌ Not a palindrome"}`;
    });

    setOutput(results.join("\n"));
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Check Palindrome</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (one per line):</Label>
          <Textarea
            placeholder="racecar&#10;hello&#10;madam"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About palindromes:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A palindrome reads the same forwards and backwards</li>
            <li>Case-insensitive (ignores case)</li>
            <li>Ignores non-alphanumeric characters</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Check
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Results:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
