"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function CrontabGuruTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  // Simplified cron explanation without external library
  const explainCron = (expr: string): string => {
    const parts = expr.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      return `Invalid: Cron expression must have 5 fields (minute hour day month day-of-week)`;
    }
    
    const [minute, hour, day, month, dayOfWeek] = parts;
    
    const explain: string[] = [];
    
    // Minute
    if (minute === "*") {
      explain.push("every minute");
    } else if (minute.startsWith("*/")) {
      explain.push(`every ${minute.slice(2)} minutes`);
    } else {
      explain.push(`at minute ${minute}`);
    }
    
    // Hour
    if (hour === "*") {
      explain.push("every hour");
    } else if (hour.startsWith("*/")) {
      explain.push(`every ${hour.slice(2)} hours`);
    } else {
      explain.push(`at hour ${hour}`);
    }
    
    // Day
    if (day === "*") {
      explain.push("every day");
    } else {
      explain.push(`on day ${day}`);
    }
    
    // Month
    if (month === "*") {
      explain.push("every month");
    } else {
      explain.push(`in month ${month}`);
    }
    
    // Day of week
    if (dayOfWeek === "*") {
      explain.push("every day of week");
    } else {
      const dowNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dowValues = dayOfWeek.split(",");
      const dowExplained = dowValues.map(d => {
        const num = parseInt(d, 10);
        return isNaN(num) ? d : dowNames[num] || d;
      }).join(", ");
      explain.push(`on ${dowExplained}`);
    }
    
    return explain.join(", ");
  };

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter one or more cron expressions (one per line)");
      setOutput("");
      return;
    }

    const lines = input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line !== "");

    const results = lines.map((line) => {
      return `${line} → ${explainCron(line)}`;
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
        <CardTitle>Crontab Guru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Cron expression (one per line):</Label>
          <Textarea
            placeholder="* * * * *&#10;*/5 * * * *&#10;0 12 1 * *&#10;35 16 * * 0-5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Cron format:</p>
          <code className="text-xs">minute hour day month day-of-week</code>
          <p className="mt-2 text-xs">Example: <code>0 12 * * 1</code> = At 12:00 PM, every Monday</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Explain
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <Label>Explanation:</Label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
