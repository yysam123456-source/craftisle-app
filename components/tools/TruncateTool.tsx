"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function TruncateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [length, setLength] = useState("100");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const numLength = parseInt(length, 10);
    
    if (isNaN(numLength) || numLength < 1) {
      setError("Truncation length must be a positive integer");
      setOutput("");
      return;
    }

    let result = input;
    if (result.length > numLength) {
      result = result.slice(0, numLength) + "...";
    }
    
    setOutput(result);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Truncate Text</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (will be truncated):</Label>
          <Textarea
            placeholder="This is a long text that will be truncated..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Max length:</Label>
          <Input
            type="number"
            min="1"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About truncation:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Keeps only first N characters</li>
            <li>Adds "..." if text exceeds length</li>
            <li>Default length is 100 characters</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Truncate
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Truncated:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
