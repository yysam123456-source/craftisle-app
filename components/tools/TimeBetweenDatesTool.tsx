"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

export default function TimeBetweenDatesTool() {
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");

  const handleProcess = () => {
    setError("");
    
    if (!date1.trim() || !date2.trim()) {
      setError("Please enter both dates");
      setOutput("");
      return;
    }

    try {
      const d1 = new Date(date1);
      const d2 = new Date(date2);
      
      if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
        setError("Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY");
        setOutput("");
        return;
      }
      
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.abs((d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()));
      const diffYears = Math.abs(d2.getFullYear() - d1.getFullYear());
      
      const results = [
        `Date 1: ${d1.toLocaleDateString()}`,
        `Date 2: ${d2.toLocaleDateString()}`,
        ``,
        `Difference:`,
        `  ${diffDays} days`,
        `  ${diffWeeks} weeks`,
        `  ${diffMonths} months`,
        `  ${diffYears} years`,
        ``,
        `Total: ${diffDays} days (${(diffMs / (1000 * 60 * 60 * 24)).toFixed(2)} days)`,
      ].join("\n");
      
      setOutput(results);
    } catch {
      setError("Error calculating date difference");
      setOutput("");
    }
  };

  const handleClear = () => {
    setDate1("");
    setDate2("");
    setOutput("");
    setError("");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Time Between Dates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Start date:</Label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label>End date:</Label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleProcess} className="flex-1">
            Calculate Difference
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
