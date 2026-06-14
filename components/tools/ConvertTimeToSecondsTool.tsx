"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ConvertTimeToSecondsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const parseTimeToSeconds = (timeStr: string): number | null => {
    const trimmed = timeStr.trim();
    
    // Match patterns like: 1h 30m 45s, 1:30:45, 90m, 3600s
    const hourMatch = trimmed.match(/(\d+)h/);
    const minuteMatch = trimmed.match(/(\d+)m/);
    const secondMatch = trimmed.match(/(\d+)s/);
    
    // Also support HH:MM:SS format
    const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
    
    if (colonMatch) {
      const hours = parseInt(colonMatch[1], 10);
      const minutes = parseInt(colonMatch[2], 10);
      const seconds = parseInt(colonMatch[3], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    
    if (hourMatch || minuteMatch || secondMatch) {
      let total = 0;
      if (hourMatch) total += parseInt(hourMatch[1], 10) * 3600;
      if (minuteMatch) total += parseInt(minuteMatch[1], 10) * 60;
      if (secondMatch) total += parseInt(secondMatch[1], 10);
      return total;
    }
    
    return null;
  };

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter one or more time values (one per line)");
      setOutput("");
      return;
    }

    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const results = lines.map((line) => {
      const seconds = parseTimeToSeconds(line);
      if (seconds === null) {
        return `${line} = Invalid format (use: 1h 30m 45s or HH:MM:SS)`;
      }
      return `${line} = ${seconds}s`;
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
        <CardTitle>Convert Time to Seconds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter time (one per line):</Label>
          <Textarea
            placeholder="1h 30m 45s&#10;01:30:45&#10;90m&#10;3661s"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Supported formats:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>1h 30m 45s (hours, minutes, seconds)</li>
            <li>01:30:45 (HH:MM:SS)</li>
            <li>90m (just minutes)</li>
            <li>3600s (just seconds)</li>
          </ul>
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
