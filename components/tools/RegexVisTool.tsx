"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function RegexVisTool() {
  const [pattern, setPattern] = useState<string>("");
  const [flags, setFlags] = useState<string>("g");
  const [testString, setTestString] = useState<string>("");
  const [matches, setMatches] = useState<RegExpMatchArray[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pattern || !testString) {
      setMatches([]);
      setError(null);
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const allMatches: RegExpMatchArray[] = [];
      let match: RegExpMatchArray | null;
      
      if (flags.includes("g")) {
        const regexGlobal = new RegExp(pattern, flags);
        while ((match = regexGlobal.exec(testString)) != null) {
          allMatches.push({ ...match });
          if (!match[0]) regexGlobal.lastIndex++; // Avoid infinite loop
        }
      } else {
        match = testString.match(regex);
        if (match) allMatches.push(match);
      }
      
      setMatches(allMatches);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setMatches([]);
    }
  }, [pattern, flags, testString]);

  const highlightMatches = (text: string): React.ReactNode => {
    if (matches.length === 0) return <span>{text}</span>;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, i) => {
      const start = match.index || 0;
      if (start > lastIndex) {
        parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, start)}</span>);
      }
      parts.push(
        <span
          key={`match-${i}`}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {match[0]}
        </span>
      );
      lastIndex = start + match[0].length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="text-last">{text.slice(lastIndex)}</span>);
    }

    return <span>{parts}</span>;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Regex Visualizer</h1>
      
      <Card className="p-6 space-y-4">
        <div>
          <Label htmlFor="pattern">Regex Pattern</Label>
          <div className="flex gap-2 mt-2">
            <span className="text-lg font-mono self-center">/</span>
            <Input
              id="pattern"
              type="text"
              placeholder="e.g., (\w+)"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="font-mono"
            />
            <span className="text-lg font-mono self-center">/</span>
            <Input
              type="text"
              placeholder="flags"
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              className="font-mono w-20"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="test-string">Test String</Label>
          <Input
            id="test-string"
            type="text"
            placeholder="Enter text to test against"
            value={testString}
            onChange={(e) => setTestString(e.target.value)}
            className="mt-2"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg text-red-700 dark:text-red-300">
            <p className="font-mono text-sm">{error}</p>
          </div>
        )}

        {testString && (
          <div>
            <Label>Highlighted Matches</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm">
              {highlightMatches(testString)}
            </div>
          </div>
        )}

        {matches.length > 0 && (
          <div>
            <Label>Match Results ({matches.length} match{matches.length !== 1 ? "es" : ""})</Label>
            <div className="mt-2 space-y-2">
              {matches.map((match, i) => (
                <div key={i} className="p-2 bg-muted rounded font-mono text-sm">
                  <span className="text-muted-foreground">Match {i + 1}:</span> {match[0]}
                  {match.length > 1 && (
                    <span className="text-muted-foreground ml-2">
                      (groups: {match.slice(1).join(", ")})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
