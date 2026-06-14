"use client";

import { useState } from "react";
import { Repeat, Copy, Eraser, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

function reverseString(str: string): string {
  return str.split("").reverse().join("");
}

export default function StringReverseTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [multiLine, setMultiLine] = useState(false);
  const [emptyItems, setEmptyItems] = useState(false);
  const [trim, setTrim] = useState(false);

  const handleReverse = () => {
    if (!input) {
      toast.warning("Enter text to reverse");
      return;
    }
    try {
      let array: string[] = multiLine ? input.split("\n") : [input];

      if (emptyItems) {
        array = array.filter(Boolean);
      }
      if (trim) {
        array = array.map((line) => line.trim());
      }

      const result = array.map((element) => reverseString(element)).join("\n");
      setOutput(result);
      toast.success("Text reversed");
    } catch {
      toast.error("Failed to reverse text");
    }
  };

  const copyToClipboard = async () => {
    if (!output) {
      toast.warning("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const swapInputOutput = () => {
    setInput(output);
    setOutput("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiLine"
              checked={multiLine}
              onCheckedChange={(v) => setMultiLine(v as boolean)}
            />
            <Label htmlFor="multiLine" className="text-sm">
              Reverse each line independently
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emptyItems"
              checked={emptyItems}
              onCheckedChange={(v) => setEmptyItems(v as boolean)}
            />
            <Label htmlFor="emptyItems" className="text-sm">
              Remove empty lines
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="trim"
              checked={trim}
              onCheckedChange={(v) => setTrim(v as boolean)}
            />
            <Label htmlFor="trim" className="text-sm">
              Trim whitespace from each line
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={handleReverse} className="gap-2">
          <Repeat className="h-4 w-4" />
          Reverse
        </Button>
        <Button variant="outline" onClick={swapInputOutput} className="gap-2">
          <ArrowRightLeft className="h-4 w-4 rotate-90" />
          Swap
        </Button>
        <Button
          variant="ghost"
          onClick={clearAll}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <Eraser className="h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Input Text</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to reverse..."
                className="h-full min-h-75 font-mono resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Reversed Result</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={copyToClipboard}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea
                value={output}
                readOnly
                placeholder="Reversed text will appear here..."
                className="h-full min-h-75 font-mono resize-none bg-muted/50"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
