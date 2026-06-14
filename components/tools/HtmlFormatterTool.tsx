import React, { useState } from "react";
import { DynamicMonacoEditor } from "./MonacoEditorDynamic";
import { html_beautify } from "js-beautify";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCode, Copy, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function HtmlFormatterTool() {
  const { theme } = useTheme();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indentSize, setIndentSize] = useState("2");
  const [wrapLineLength, setWrapLineLength] = useState("80");

  const handleFormat = () => {
    if (!input.trim()) return;
    try {
      const formatted = html_beautify(input, {
        indent_size: parseInt(indentSize),
        wrap_line_length: parseInt(wrapLineLength),
        preserve_newlines: true,
        indent_inner_html: true,
      });
      setOutput(formatted);
      toast.success("HTML formatted successfully");
    } catch {
      toast.error("HTML format failed");
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Options */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-6 items-end">
            <div className="space-y-2">
                <Label>Indent Size</Label>
                <Select value={indentSize} onValueChange={setIndentSize}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2">2 Spaces</SelectItem>
                        <SelectItem value="4">4 Spaces</SelectItem>
                        <SelectItem value="8">8 Spaces</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="space-y-2">
                <Label>Line Wrap</Label>
                <Select value={wrapLineLength} onValueChange={setWrapLineLength}>
                    <SelectTrigger className="w-32">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="0">No Wrap</SelectItem>
                        <SelectItem value="80">80 Chars</SelectItem>
                        <SelectItem value="120">120 Chars</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Button onClick={handleFormat} className="gap-2">
                Format <ArrowRight className="h-4 w-4" />
            </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card className="flex flex-col min-h-150">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Input HTML</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 h-125">
             <DynamicMonacoEditor
                height="100%"
                defaultLanguage="html"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={input}
                onChange={(value) => setInput(value || "")}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on"
                }}
             />
          </CardContent>
        </Card>

        {/* Output */}
        <Card className="flex flex-col min-h-150">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Result</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)} disabled={!output}>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 bg-muted/30 h-125">
             <DynamicMonacoEditor
                height="100%"
                defaultLanguage="html"
                theme={theme === "dark" ? "vs-dark" : "light"}
                value={output}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: "on"
                }}
             />
          </CardContent>
        </Card>
      </div>
</div>
  );
}
