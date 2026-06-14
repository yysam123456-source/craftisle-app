"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function RotateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [positions, setPositions] = useState("1");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const text = input;
    const numPositions = parseInt(positions, 10);
    
    if (isNaN(numPositions) || numPositions < 1) {
      setError("Number of positions must be a positive integer");
      setOutput("");
      return;
    }

    const rotated = text.slice(numPositions) + text.slice(0, numPositions);
    setOutput(rotated);
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rotate Text</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (will be rotated):</Label>
          <Textarea
            placeholder="Hello World"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] font-mono"
          />
        </div>

        <div className="space-y-2">
          <Label>Positions to rotate:</Label>
          <Input
            type="number"
            min="1"
            value={positions}
            onChange={(e) => setPositions(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">About rotation:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Moves first N characters to the end</li>
            <li>Example: "Hello" with 2 positions → "lloHe"</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Rotate
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Rotated:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
