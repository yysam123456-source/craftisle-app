"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function WrapTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [lineLength, setLineLength] = useState("80");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const length = parseInt(lineLength, 10);
    if (isNaN(length) || length < 1) {
      setError("Line length must be a positive integer");
      setOutput("");
      return;
    }

    const words = input.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      if (currentLine === "") {
        currentLine = word;
      } else if (`${currentLine} ${word}`.length <= length) {
        currentLine = `${currentLine} ${word}`;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine !== "") {
      lines.push(currentLine);
    }

    setOutput(lines.join("\n"));
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Wrap Text</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (will be wrapped to specified line length):</Label>
          <Textarea
            placeholder="This is a long text that will be wrapped to multiple lines based on the specified line length."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Line length:</Label>
          <Input
            type="number"
            min="1"
            value={lineLength}
            onChange={(e) => setLineLength(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About text wrapping:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Text is wrapped at word boundaries</li>
            <li>Default line length is 80 characters</li>
            <li>Long words (exceeding line length) are kept as-is</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Wrap
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Wrapped:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
