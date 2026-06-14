"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function CheckLeapYearTool() {
  const [year, setYear] = useState<string>("");
  const [result, setResult] = useState<{ isLeap: boolean; year: number } | null>(null);

  const checkLeapYear = (year: number): boolean => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  const handleCheck = () => {
    const yearNum = parseInt(year);
    if (isNaN(yearNum)) return;
    setResult({
      isLeap: checkLeapYear(yearNum),
      year: yearNum,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Check Leap Year</h1>
      
      <Card className="p-6">
        <div className="mb-4">
          <Label htmlFor="year">Enter Year</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="year"
              type="number"
              placeholder="e.g., 2024"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            />
            <Button onClick={handleCheck}>Check</Button>
          </div>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${result.isLeap ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"}`}>
            <p className="text-lg font-semibold">
              {result.year} is {result.isLeap ? "a leap year" : "not a leap year"}
            </p>
            <p className="text-sm mt-2 text-muted-foreground">
              {result.isLeap
                ? `${result.year} has 366 days (February has 29 days)`
                : `${result.year} has 365 days (February has 28 days)`}
            </p>
          </div>
        )}

        <div className="mt-6 text-sm text-muted-foreground">
          <h3 className="font-semibold mb-2">Leap Year Rules:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>A year is a leap year if it is divisible by 4</li>
            <li>However, if it is divisible by 100, it is NOT a leap year (unless...)</li>
            <li>If it is also divisible by 400, then it IS a leap year</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
