"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Eraser, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface TextToolLayoutProps {
  title: string;
  description?: string;
  input: string;
  output: string;
  onInputChange: (value: string) => void;
  onProcess: () => void;
  processLabel: string;
  options?: ReactNode;
  children?: ReactNode;
}

export function TextToolLayout({
  title,
  description,
  input,
  output,
  onInputChange,
  onProcess,
  processLabel,
  options,
  children,
}: TextToolLayoutProps) {
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
    onInputChange("");
  };

  const swapInputOutput = () => {
    onInputChange(output);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        {description && (
          <p className="text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>

      {/* Options */}
      {options && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Options</CardTitle>
          </CardHeader>
          <CardContent>{options}</CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Button onClick={onProcess} className="gap-2">
          {processLabel}
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

      {/* Input/Output */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Input</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[200px]">
              <Textarea
                value={input}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder="Enter text here..."
                className="h-full min-h-[200px] font-mono resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Output</CardTitle>
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
            <CardContent className="flex-1 min-h-[200px]">
              <Textarea
                value={output}
                readOnly
                placeholder="Result will appear here..."
                className="h-full min-h-[200px] font-mono resize-none bg-muted/50"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom children */}
      {children}
    </div>
  );
}
