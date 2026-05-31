"use client";

import { useState } from "react";
import { FileSpreadsheet, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function CsvJsonPage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const csvToJson = () => {
    try {
      if (!input.trim()) return;
      const lines = input.trim().split('\n');
      if (lines.length < 2) {
        toast.error("Enter CSV with at least a header and one row of data");
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const result = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, i) => {
          obj[header] = values[i]?.trim() || "";
        });
        return obj;
      });
      
      setOutput(JSON.stringify(result, null, 2));
      toast.success("ConvertSuccess");
    } catch {
      toast.error("CSV FormatError");
    }
  };

  const jsonToCsv = () => {
    try {
      if (!input.trim()) return;
      const data = JSON.parse(input);
      if (!Array.isArray(data) || data.length === 0) {
        toast.error("JSON must be an array of objects");
        return;
      }
      
      const headers = Object.keys(data[0]);
      const csvLines = [
        headers.join(','),
        ...data.map(row => headers.map(h => row[h]).join(','))
      ];
      
      setOutput(csvLines.join('\n'));
      toast.success("ConvertSuccess");
    } catch {
      toast.error("JSON format error or not an array of objects");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-600 shadow-lg">
          <FileSpreadsheet className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CSV / JSON Converter</h1>
          <p className="text-muted-foreground">Convert between tabular data and JSON format</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">Input Area</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive">
               <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste CSV (comma-separated) or JSON array here..."
              className="min-h-75 font-mono text-sm resize-none bg-muted/30"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex gap-4">
               <Button onClick={csvToJson} className="flex-1 gap-2">
                 CSV &rarr; JSON
               </Button>
               <Button onClick={jsonToCsv} variant="outline" className="flex-1 gap-2">
                 JSON &rarr; CSV
               </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">OutputResult</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(output)} disabled={!output}>
               <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              placeholder="Conversion result will appear here..."
              className="min-h-87 font-mono text-sm resize-none bg-muted/30"
              value={output}
            />
          </CardContent>
        </Card>
      </div>

      <ToolDetailSections toolId="csv-json" />
    </div>
  );
}
