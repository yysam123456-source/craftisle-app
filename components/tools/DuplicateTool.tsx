"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function DuplicateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copies, setCopies] = useState("2");
  const [separator, setSeparator] = useState(" ");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter some text");
      setOutput("");
      return;
    }

    const lines = input.split("\n").filter(line => line.trim() !== "");
    const numCopies = parseInt(copies, 10);
    
    if (isNaN(numCopies) || numCopies < 1) {
      setError("Number of copies must be a positive integer");
      setOutput("");
      return;
    }

    const results = lines.map(line => {
      return Array(numCopies).fill(line).join(separator);
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
        <CardTitle>Duplicate Lines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter text (each line will be duplicated):</Label>
          <Textarea
            placeholder="Line 1&#10;Line 2&#10;Line 3"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Number of copies:</Label>
            <Input
              type="number"
              min="1"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Separator:</Label>
            <Input
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              placeholder=" "
              className="w-full"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Duplicate
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Duplicated:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
