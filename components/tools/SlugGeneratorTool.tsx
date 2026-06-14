"use client";

import { useState } from "react";
import { Link, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function toSlug(input: string, caseSensitive: boolean): string {
  return (!caseSensitive ? input.toLowerCase() : input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function SlugGeneratorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);

  const handleGenerate = () => {
    if (!input) { toast.warning("Enter text to generate slug"); return; }
    try {
      const result = input
        .split("\n")
        .map((line) => (line.trim() === "" ? "" : toSlug(line, caseSensitive)))
        .join("\n");
      setOutput(result);
      toast.success("Slug(s) generated");
    } catch { toast.error("Generation failed"); }
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
        <CardContent>
          <div className="flex items-center space-x-2">
            <Checkbox id="caseSensitive" checked={caseSensitive} onCheckedChange={(v: any) => setCaseSensitive(v)} />
            <Label htmlFor="caseSensitive" className="text-sm">Case sensitive (preserve uppercase)</Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleGenerate} className="gap-2">
          <Link className="h-4 w-4" />
          Generate Slug
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
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter text to convert to slug..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Slug Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Slug will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
