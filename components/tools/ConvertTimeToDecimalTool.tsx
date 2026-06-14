"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function ConvertTimeToDecimalTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const timeToDecimal = (timeStr: string): string | null => {
    const trimmed = timeStr.trim();
    
    // Match HH:MM:SS or HH:MM
    const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    
    if (!match) return null;
    
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = match[3] ? parseInt(match[3], 10) : 0;
    
    if (minutes >= 60 || seconds >= 60) return null;
    
    const decimal = hours + (minutes / 60) + (seconds / 3600);
    return decimal.toFixed(6).replace(/\.?0+$/, "");
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
      const decimal = timeToDecimal(line);
      if (decimal === null) {
        return `${line} = Invalid format (use HH:MM or HH:MM:SS)`;
      }
      return `${line} = ${decimal}`;
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
        <CardTitle>Convert Time to Decimal</CardTitle>
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
            placeholder="01:30:00&#10;02:45&#10;08:00:30"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Conversion examples:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>01:30:00 → 1.5</li>
            <li>02:45 → 2.75</li>
            <li>08:00:30 → 8.008333</li>
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
