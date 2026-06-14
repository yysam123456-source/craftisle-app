"use client";

import { useState } from "react";
import { TextToolLayout } from "./TextToolLayout";

/**
 * Cron Parser / Crontab Guru
 * Parse and explain cron expressions
 */
export default function CrontabGuruTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const parseCron = (expression: string): string => {
    const parts = expression.trim().split(/\s+/);

    if (parts.length !== 5) {
      return "❌ Invalid cron format. Expected: minute hour day month weekday";
    }

    const [minute, hour, day, month, weekday] = parts;

    const explain = (field: string, name: string): string => {
      if (field === "*") return `Every ${name}`;
      if (field.includes(",")) return `${name} in [${field}]`;
      if (field.includes("-")) return `${name} from ${field.replace("-", " to ")}`;
      if (field.includes("/")) {
        const [start, interval] = field.split("/");
        return `Every ${interval} ${name}${start && start !== "*" ? ` starting at ${start}` : ""}`;
      }
      return `${name} = ${field}`;
    };

    const explanations = [
      explain(minute, "minute"),
      explain(hour, "hour"),
      explain(day, "day"),
      explain(month, "month"),
      explain(weekday, "weekday"),
    ];

    // Common patterns
    let common = "";
    if (expression === "* * * * *") common = "→ Runs every minute";
    else if (expression === "0 * * * *") common = "→ Runs every hour";
    else if (expression === "0 0 * * *") common = "→ Runs daily at midnight";
    else if (expression === "0 0 * * 0") common = "→ Runs weekly on Sunday at midnight";
    else if (expression === "0 0 1 * *") common = "→ Runs monthly on the 1st at midnight";

    return [`Cron: ${expression}`, ...explanations.map((e, i) => `  ${["Minute", "Hour", "Day", "Month", "Weekday"][i]}: ${e}`), common].filter(Boolean).join("\n");
  };

  const handleParse = () => {
    if (!input.trim()) {
      setOutput("");
      return;
    }

    const results = input.split("\n").map(line => {
      if (!line.trim()) return "";
      return parseCron(line);
    });

    setOutput(results.join("\n\n"));
  };

  return (
    <TextToolLayout
      title="Cron Expression Parser"
      description="Parse and explain cron expressions"
      input={input}
      output={output}
      onInputChange={setInput}
      onProcess={handleParse}
      processLabel="Parse"
      options={
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p><strong>Format:</strong> minute hour day month weekday</p>
          <p><strong>Examples:</strong></p>
          <ul className="list-disc pl-4">
            <li><code>* * * * *</code> - Every minute</li>
            <li><code>0 * * * *</code> - Every hour</li>
            <li><code>0 0 * * *</code> - Daily at midnight</li>
            <li><code>*/15 * * * *</code> - Every 15 minutes</li>
            <li><code>0 9-17 * * 1-5</code> - Every hour 9-17, weekdays</li>
          </ul>
        </div>
      }
    />
  );
}
