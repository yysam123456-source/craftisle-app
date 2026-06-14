"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Slug Generator
 * Convert text to URL-friendly slug
 */
export default function SlugGeneratorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [separator, setSeparator] = useState("-");
  const [lowercase, setLowercase] = useState(true);

  const handleGenerate = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    try {
      let slug = input;

      // Convert to lowercase if needed
      if (lowercase) {
        slug = slug.toLowerCase();
      }

      // Replace non-alphanumeric characters with separator
      slug = slug.replace(/[^a-z0-9]+/gi, separator);

      // Remove leading/trailing separators
      slug = slug.replace(new RegExp(`^${separator}+|${separator}+$`, "g"), "");

      setOutput(slug);
    } catch {
      setOutput("❌ Error generating slug.");
    }
  };

  return (
    <TextToolLayout
      title="Slug Generator"
      description="Convert text to URL-friendly slug"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleGenerate}
      processLabel="Generate Slug"
      options={
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Separator</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="-">Hyphen (-)</option>
              <option value="_">Underscore (_)</option>
              <option value=".">Dot (.)</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={lowercase}
              onChange={(e) => setLowercase(e.target.checked)}
            />
            <span className="text-sm">Convert to lowercase</span>
          </label>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Converts text to URL-friendly slug format.</p>
            <p>Removes special characters, replaces spaces with separator.</p>
          </div>
        </div>
      }
    />
  );
}
