"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConvertUnixToDateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"unix-to-date" | "date-to-unix">("unix-to-date");
  const [useLocalTime, setUseLocalTime] = useState(false);
  const [withLabel, setWithLabel] = useState(true);

  const computeUnixToDate = (timestamp: string, local: boolean): string => {
    if (!/^\d+$/.test(timestamp.trim())) {
      return `${timestamp} = Invalid timestamp`;
    }

    const ts = parseInt(timestamp.trim(), 10);
    const date = new Date(ts * 1000);

    if (isNaN(date.getTime())) {
      return `${timestamp} = Invalid timestamp`;
    }

    if (local) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } else {
      const iso = date.toISOString();
      const formatted = iso.replace("T", " ").replace("Z", "");
      return withLabel ? `${formatted} UTC` : formatted;
    }
  };

  const computeDateToUnix = (dateStr: string, local: boolean): string => {
    try {
      const trimmed = dateStr.trim();
      let date: Date;

      if (local) {
        date = new Date(trimmed);
      } else {
        // Assume UTC if no timezone specified
        if (trimmed.includes("+") || trimmed.includes("-") || trimmed.endsWith("Z")) {
          date = new Date(trimmed);
        } else {
          date = new Date(trimmed + "Z");
        }
      }

      const unix = Math.floor(date.getTime() / 1000);
      return isNaN(unix) ? `${dateStr} = Invalid date` : `${dateStr} = ${unix}`;
    } catch {
      return `${dateStr} = Invalid date`;
    }
  };

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter one or more timestamps/dates (one per line)");
      setOutput("");
      return;
    }

    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const results = lines.map((line) => {
      if (mode === "unix-to-date") {
        return computeUnixToDate(line, useLocalTime);
      } else {
        return computeDateToUnix(line, useLocalTime);
      }
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
        <CardTitle>Unix Timestamp Converter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={mode} onValueChange={(v) => setMode(v as "unix-to-date" | "date-to-unix")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="unix-to-date">Unix → Date</TabsTrigger>
            <TabsTrigger value="date-to-unix">Date → Unix</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-2">
          <Label>
            {mode === "unix-to-date" ? "Enter Unix timestamps (one per line):" : "Enter dates (one per line):"}
          </Label>
          <Textarea
            placeholder={mode === "unix-to-date" ? "0\n1721287227\n2147483647" : "2024-07-18 10:00:27\n2025-01-01 00:00:00"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="space-y-3 rounded-lg bg-muted/30 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useLocalTime"
              checked={useLocalTime}
              onChange={(e) => setUseLocalTime(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="useLocalTime" className="text-sm font-normal">
              Use local timezone
            </Label>
          </div>

          {mode === "unix-to-date" && !useLocalTime && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="withLabel"
                checked={withLabel}
                onChange={(e) => setWithLabel(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="withLabel" className="text-sm font-normal">
                Add "UTC" label to output
              </Label>
            </div>
          )}
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
