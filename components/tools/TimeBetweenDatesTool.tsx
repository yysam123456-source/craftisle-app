"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Time Between Dates Calculator
 * Calculate duration between two dates
 */
export default function TimeBetweenDatesTool() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState("");
  const [unit, setUnit] = useState<"auto" | "days" | "hours" | "minutes" | "seconds">("auto");

  const handleCalculate = () => {
    if (!startDate.trim() || !endDate.trim()) {
      setResult("❌ Please enter both dates");
      return;
    }

    try {
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T00:00:00");

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        setResult("❌ Invalid date format. Use YYYY-MM-DD");
        return;
      }

      const diffMs = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffSeconds = Math.floor(diffMs / 1000);

      let output = "";

      if (unit === "auto") {
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        const days = diffDays % 30;

        const parts: string[] = [];
        if (years > 0) parts.push(`${years} year${years > 1 ? "s" : ""}`);
        if (months > 0) parts.push(`${months} month${months > 1 ? "s" : ""}`);
        if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);

        output = parts.length > 0 ? parts.join(", ") : "0 days";
      } else {
        switch (unit) {
          case "days":
            output = `${diffDays} days`;
            break;
          case "hours":
            output = `${diffHours} hours`;
            break;
          case "minutes":
            output = `${diffMinutes} minutes`;
            break;
          case "seconds":
            output = `${diffSeconds} seconds`;
            break;
        }
      }

      setResult(output);
    } catch {
      setResult("❌ Error calculating time difference");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Time Between Dates</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Calculate the duration between two dates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Output Unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "auto" | "days" | "hours" | "minutes" | "seconds")}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="auto">Auto (Years, Months, Days)</option>
          <option value="days">Days</option>
          <option value="hours">Hours</option>
          <option value="minutes">Minutes</option>
          <option value="seconds">Seconds</option>
        </select>
      </div>

      <button
        onClick={handleCalculate}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Calculate
      </button>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h3 className="font-medium mb-2">Result:</h3>
          <p className="text-lg">{result}</p>
        </div>
      )}
    </div>
  );
}
