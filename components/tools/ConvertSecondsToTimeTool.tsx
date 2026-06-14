"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ConvertSecondsToTimeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter one or more seconds values (one per line)");
      setOutput("");
      return;
    }

    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const results = lines.map((line) => {
      const seconds = parseFloat(line);
      if (isNaN(seconds) || seconds < 0) {
        return `${line} = Invalid input`;
      }

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);

      const parts: string[] = [];
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${secs}s`);

      return `${seconds}s = ${parts.join(" ")}`;
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
        <CardTitle>Convert Seconds to Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter seconds (one per line):</Label>
          <Textarea
            placeholder="3661&#10;7200&#10;59&#10;86400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          Conversion: 3661s = 1h 1m 1s
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Convert
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
