import { useState } from "react";
import { Languages, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function UnicodeTool() {
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
            <li><strong>text &rarr; Unicode:</strong> Convert text characters or character symbols to hexadecimal Unicode encoding.</li>
            <li><strong>Unicode &rarr; text:</strong> Restore strings in `\uXXXX` format to readable text.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
