"use client";

import { useState } from "react";
import { BarChart3, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function countLines(text: string, emptyLines: boolean): number {
  const lines = emptyLines ? text.split("\n") : text.split("\n").filter(l => l.trim() !== "");
  return lines.length;
}

function countCharacters(text: string): number {
  return text.length;
}

function countSentences(text: string, delimiters: string): number {
  const chars = delimiters ? delimiters.split(",").map(s => s.trim()) : [".", "!", "?", "..."];
  const regex = new RegExp(`[${chars.join("")}]`, "g");
  return text.split(regex).filter(s => s.trim() !== "").length;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.trim() !== "").length;
}

function countParagraphs(text: string): number {
  return text.split(/\r?\n\s*\r?\n/).filter(p => p.trim() !== "").length;
}

function charFrequency(text: string): string {
  const freq: Record<string, number> = {};
  for (const ch of text) {
    if (ch === "\n" || ch === "\r" || ch === "\t") continue;
    freq[ch] = (freq[ch] || 0) + 1;
  }
  const total = Object.values(freq).reduce((a, b) => a + b, 0);
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([ch, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      const display = ch === " " ? "␣(space)" : ch;
      return `  ${display}: ${count} (${pct}%)`;
    })
    .join("\n");
}

function wordFrequency(text: string): string {
  const words = text.toLowerCase().split(/\s+|\.|,|!|\?|;|:|"|\(|\)/).filter(w => w.trim() !== "");
  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
  }
  const total = words.length;
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30)
    .map(([w, count]) => {
      const pct = ((count / total) * 100).toFixed(1);
      return `  ${w}: ${count} (${pct}%)`;
    })
    .join("\n");
}

export default function TextStatisticsTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [wordCount, setWordCount] = useState(true);
  const [charCount, setCharCount] = useState(false);
  const [sentenceDelimiters, setSentenceDelimiters] = useState("");

  const handleAnalyze = () => {
    if (!input) {
      toast.warning("Enter text to analyze");
      return;
    }
    try {
      const delims = sentenceDelimiters || ".,!,?,...";
      const lines = countLines(input, true);
      const chars = countCharacters(input);
      const sentences = countSentences(input, delims);
      const words = countWords(input);
      const paragraphs = countParagraphs(input);
      const charStats = charFrequency(input);
      const wordStats = wordFrequency(input);

      let result = `Text Statistics\n==================\n`;
      result += `Characters: ${chars}\n`;
      result += `Words: ${words}\n`;
      result += `Lines: ${lines}\n`;
      result += `Sentences: ${sentences}\n`;
      result += `Paragraphs: ${paragraphs}\n`;

      if (wordCount) {
        result += `\n\nWords Frequency\n==================\n${wordStats}`;
      }
      if (charCount) {
        result += `\n\nCharacters Frequency\n==================\n${charStats}`;
      }

      setOutput(result);
      toast.success("Analysis complete");
    } catch {
      toast.error("Analysis failed");
    }
  };

  const copyToClipboard = async () => {
    if (!output) { toast.warning("Nothing to copy"); return; }
    try { await navigator.clipboard.writeText(output); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearAll = () => { setInput(""); setOutput(""); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="wordCount" checked={wordCount} onCheckedChange={(v) => setWordCount(v as boolean)} />
            <Label htmlFor="wordCount" className="text-sm">Show word frequency</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="charCount" checked={charCount} onCheckedChange={(v) => setCharCount(v as boolean)} />
            <Label htmlFor="charCount" className="text-sm">Show character frequency</Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="delims" className="text-sm">Sentence delimiters (comma-separated)</Label>
            <input
              id="delims"
              value={sentenceDelimiters}
              onChange={(e) => setSentenceDelimiters(e.target.value)}
              placeholder=".,!,?,... (default)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleAnalyze} className="gap-2">
          <BarChart3 className="h-4 w-4" />
          Analyze
        </Button>
        <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive">
          <Eraser className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Input Text</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste text to analyze..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Statistics Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Statistics will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
