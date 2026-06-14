"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default function CheckLeapYearTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleProcess = () => {
    setError("");
    
    if (!input.trim()) {
      setError("Please enter one or more years (one per line)");
      setOutput("");
      return;
    }

    const years = input
      .split("\n")
      .map((year) => year.trim())
      .filter((year) => year !== "");

    const results = years.map((yearStr) => {
      if (!/^\d{1,4}$/.test(yearStr)) {
        return `${yearStr}: Invalid year`;
      }

      const year = Number(yearStr);
      return `${year} ${
        isLeapYear(year) ? "is a leap year." : "is not a leap year."
      }`;
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
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Check Leap Years
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Enter years (one per line):</label>
          <Textarea
            placeholder="2024&#10;2025&#10;2026&#10;2028"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[150px] font-mono"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Check Leap Years
          </Button>
          <Button onClick={handleClear} variant="outline">
            Clear
          </Button>
        </div>

        {output && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Results:</label>
            <div className="rounded-lg border bg-muted/50 p-4">
              <pre className="whitespace-pre-wrap text-sm">{output}</pre>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">
          <p className="font-medium mb-2">About Leap Years:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A leap year is divisible by 4</li>
            <li>But not divisible by 100 (unless also divisible by 400)</li>
            <li>Examples: 2024 ✓, 2100 ✗, 2000 ✓</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
