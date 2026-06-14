"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Leap Year Checker
 * Check if a year is a leap year
 */
export default function LeapYearTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleCheck = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const results = input.split("\n").map(line => {
      if (!line.trim()) return "";

      const yearStr = line.trim();

      if (!/^\d+$/.test(yearStr)) {
        return `❌ Invalid: ${yearStr} (not a number)`;
      }

      const year = parseInt(yearStr, 10);

      // Leap year rules:
      // 1. Divisible by 4
      // 2. But not divisible by 100, unless also divisible by 400
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

      return `${year}: ${isLeap ? "✓ Leap year" : "✗ Not a leap year"}`;
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Leap Year Checker"
      description="Check if years are leap years"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleCheck}
      processLabel="Check"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Leap year rules:</strong></p>
          <ul className="list-disc pl-4">
            <li>Divisible by 4</li>
            <li>But not divisible by 100 (unless also divisible by 400)</li>
          </ul>
          <p><strong>Examples:</strong></p>
          <ul className="list-disc pl-4">
            <li>2000: Leap year (divisible by 400)</li>
            <li>1900: Not a leap year (divisible by 100 but not 400)</li>
            <li>2024: Leap year (divisible by 4, not by 100)</li>
          </ul>
        </div>
      }
    />
  );
}
