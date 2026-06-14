"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function RemoveDuplicateLinesTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const lines = input.split("\n");
    const unique = new Set<string>();
    const result: string[] = [];

    for (const line of lines) {
      const key = caseSensitive ? line : line.toLowerCase();
      if (!unique.has(key)) {
        unique.add(key);
        result.push(line);
      }
    }

    setOutput(result.join("\n"));
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Remove Duplicate Lines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (duplicate lines will be removed):</Label>
          <Textarea
            placeholder="apple&#10;banana&#10;apple&#10;cherry&#10;banana"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="caseSensitive"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="caseSensitive" className="text-sm font-normal">
            Case sensitive
          </Label>
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About removing duplicates:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Only the first occurrence of each line is kept</li>
            <li>Empty lines are preserved</li>
            <li>Use "Case sensitive" to treat uppercase and lowercase as different</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Remove Duplicates
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Unique lines:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
