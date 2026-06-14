"use client";

import { useState } from "react";
import { Shuffle, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function randomizeCase(input: string): string {
  return input.split("").map((ch) => (Math.random() < 0.5 ? ch.toLowerCase() : ch.toUpperCase())).join("");
}

export default function StringRandomizeCaseTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const handleRandomize = () => {
    if (!input) { toast.warning("Enter text to randomize"); return; }
    try {
      setOutput(randomizeCase(input));
      toast.success("Case randomized");
    } catch { toast.error("Failed"); }
  };

  const copyToClipboard = async () => {
    if (!output) { toast.warning("Nothing to copy"); return; }
    try { await navigator.clipboard.writeText(output); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearAll = () => { setInput(""); setOutput(""); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleRandomize} className="gap-2">
          <Shuffle className="h-4 w-4" />
          Randomize Case
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
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter text to randomize case..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Randomized Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}>
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Randomized text will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
