"use client";

import { useState } from "react";
import { Languages, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function UnicodePage() {
  const [input, setInput] = useState("");

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const toUnicode = () => {
    const result = input.split('').map(char => {
      const code = char.charCodeAt(0).toString(16).toUpperCase();
      return "\\u" + ("0000" + code).slice(-4);
    }).join("");
    setInput(result);
    toast.success("Converted to Unicode");
  };

  const fromUnicode = () => {
    try {
      const result = input.replace(/\\u([0-9a-fA-F]{4})/g, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
      });
      setInput(result);
      toast.success("Restored from Unicode");
    } catch {
      toast.error("Parse failed, please check format");
    }
  };

  const clearAll = () => setInput("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
          <Languages className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Unicode Convert</h1>
          <p className="text-muted-foreground">
            Bidirectional Unicode Character Conversion
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Text Area</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)} disabled={!input}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={!input} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter plain text or Unicode escape (e.g., \u4F60\u597D)..."
              className="min-h-62.5 font-mono text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={toUnicode} size="lg" className="flex-1 gap-2">
            text &rarr; Unicode
          </Button>
          <Button onClick={fromUnicode} size="lg" variant="outline" className="flex-1 gap-2">
            Unicode &rarr; text
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2">
            <li>This tool supports standard Unicode escape format (`\uXXXX`).</li>
            <li><strong>text &rarr; Unicode:</strong> 将Textcharacter、charactersymbol(s)等convert to 16 进制 Unicode Encode。</li>
            <li><strong>Unicode &rarr; text:</strong> 将 `\uXXXX` Format的Stringrestore to readabletext。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
