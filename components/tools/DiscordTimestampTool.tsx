"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function DiscordTimestampTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const generateDiscordTimestamp = (date: Date, format: string): string => {
    const unix = Math.floor(date.getTime() / 1000);
    const formats: Record<string, string> = {
      "t": `<t:${unix}:t>`,  // Short time
      "T": `<t:${unix}:T>`,  // Long time
      "d": `<t:${unix}:d>`,  // Short date
      "D": `<t:${unix}:D>`,  // Long date
      "f": `<t:${unix}:f>`,  // Short date/time
      "F": `<t:${unix}:F>`,  // Long date/time
      "R": `<t:${unix}:R>`,  // Relative
    };
    return formats[format] || `<t:${unix}:f>`;
  };

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter a date/time");
      setOutput("");
      return;
    }

    try {
      const date = new Date(input);
      if (isNaN(date.getTime())) {
        setError("Invalid date format. Use YYYY-MM-DD HH:MM:SS or similar");
        setOutput("");
        return;
      }

      const results = [
        "Discord Timestamp Formats:",
        "",
        `Short time: ${generateDiscordTimestamp(date, "t")}`,
        `Long time: ${generateDiscordTimestamp(date, "T")}`,
        `Short date: ${generateDiscordTimestamp(date, "d")}`,
        `Long date: ${generateDiscordTimestamp(date, "D")}`,
        `Short date/time: ${generateDiscordTimestamp(date, "f")}`,
        `Long date/time: ${generateDiscordTimestamp(date, "F")}`,
        `Relative: ${generateDiscordTimestamp(date, "R")}`,
        "",
        `Unix timestamp: ${Math.floor(date.getTime() / 1000)}`,
      ].join("\n");

      setOutput(results);
    } catch {
      setError("Error processing date");
      setOutput("");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  const handleExample = () => {
    const now = new Date();
    setInput(now.toISOString().slice(0, 19).replace("T", " "));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Discord Timestamp Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Enter date/time:</Label>
          <Textarea
            placeholder="2024-07-18 10:00:27"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[100px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Discord format:</p>
          <code className="text-xs">{'<t:unix_timestamp:f>'}</code>
          <p className="mt-2 text-xs">Discord will display the timestamp in the user's local timezone.</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Generate
          </Button>
          <Button onClick={handleExample} variant="outline">
            Now
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Discord Timestamps:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
