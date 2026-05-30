"use client";

import { useState } from "react";
import { Braces, Copy, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function HtmlEscapePage() {
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

  const escapeHtml = () => {
    const div = document.createElement('div');
    div.textContent = input;
    setInput(div.innerHTML);
    toast.success("Escape successful");
  };

  const unescapeHtml = () => {
    const div = document.createElement('div');
    div.innerHTML = input;
    setInput(div.textContent || "");
    toast.success("Unescape successful");
  };

  const clearAll = () => setInput("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 shadow-lg">
          <Braces className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HTML Escape</h1>
          <p className="text-muted-foreground">
            Encode and decode HTML entity characters
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Input/Output Text</CardTitle>
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
              placeholder="Enter HTML code or escaped string to process..."
              className="min-h-[250px] font-mono text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={escapeHtml} size="lg" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" />
            HTML Escape (Escape)
          </Button>
          <Button onClick={unescapeHtml} size="lg" variant="outline" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" />
            HTML Unescape
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> What is HTML Escaping?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>HTML Escape是将 HTML 预留characterConvert为 HTML 实体。例如，将 `&lt;` Convert为 `&amp;lt;`。</p>
            <p>This is commonly used to safely display code snippets on web pages, preventing the browser from parsing them as actual HTML tags, or to prevent XSS attacks.</p>
            <p className="font-mono bg-muted p-2 rounded-md inline-block">
              &lt; &rarr; &amp;lt;<br />
              &gt; &rarr; &amp;gt;<br />
              &amp; &rarr; &amp;amp;<br />
              " &rarr; &amp;quot;
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
