"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Find Most Popular Items
 * Count and rank items in a list
 */
export default function FindMostPopularTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState("\n");
  const [sortBy, setSortBy] = useState<"count" | "alpha">("count");
  const [displayFormat, setDisplayFormat] = useState<"count" | "percentage" | "total">("count");
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [trimItems, setTrimItems] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);

  const handleAnalyze = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    let items: string[] = [];

    // Split input into items
    if (separator === "\n") {
      items = input.split("\n");
    } else if (separator === ",") {
      items = input.split(",");
    } else {
      items = input.split(separator);
    }

    // Trim items if requested
    if (trimItems) {
      items = items.map(item => item.trim());
    }

    // Remove empty items if requested
    if (removeEmpty) {
      items = items.filter(item => item !== "");
    }

    // Ignore case if requested
    let processedItems = items;
    if (ignoreCase) {
      processedItems = items.map(item => item.toLowerCase());
    }

    // Count items
    const counts: Record<string, number> = {};
    processedItems.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });

    // Calculate total
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

    // Sort items
    let sortedEntries = Object.entries(counts);
    
    if (sortBy === "count") {
      sortedEntries.sort((a, b) => b[1] - a[1]);
    } else {
      sortedEntries.sort((a, b) => a[0].localeCompare(b[0]));
    }

    // Format output
    const results = sortedEntries.map(([item, count]) => {
      switch (displayFormat) {
        case "count":
          return `${item}: ${count}`;
        case "percentage":
          const percentage = ((count / total) * 100).toFixed(2);
          return `${item}: ${count} (${percentage}%)`;
        case "total":
          return `${item}: ${count} (${count} / ${total})`;
      }
    });

    setOutput(results.join("\n"));
  };

  return (
    <TextToolLayout
      title="Find Most Popular Items"
      description="Count and rank items in a list"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleAnalyze}
      processLabel="Analyze"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="\n">Newline</option>
              <option value=",">Comma</option>
              <option value=" ">Space</option>
              <option value=";">Semicolon</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "count" | "alpha")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="count">Count (most popular first)</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Display Format</label>
            <select
              value={displayFormat}
              onChange={(e) => setDisplayFormat(e.target.value as "count" | "percentage" | "total")}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="count">Count only (Alice: 5)</option>
              <option value="percentage">With percentage (Alice: 5 (50%))</option>
              <option value="total">With total (Alice: 5 (5/10))</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
            />
            <span className="text-sm">Ignore case (Alice = alice)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={trimItems}
              onChange={(e) => setTrimItems(e.target.checked)}
            />
            <span className="text-sm">Trim whitespace</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={removeEmpty}
              onChange={(e) => setRemoveEmpty(e.target.checked)}
            />
            <span className="text-sm">Remove empty items</span>
          </label>
        </div>
      }
    />
  );
}
