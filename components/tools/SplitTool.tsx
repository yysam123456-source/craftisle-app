import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type SplitMode = "symbol" | "regex" | "length" | "chunks";

function splitText(input: string, mode: SplitMode, symbol: string, regex: string, lengthVal: number, chunksVal: number, chunkPrefix: string, chunkSuffix: string, outputSep: string): string {
  let parts: string[];
  if (mode === "symbol") {
    parts = input.split(symbol);
  } else if (mode === "regex") {
    parts = input.split(new RegExp(regex));
  } else if (mode === "length") {
    if (lengthVal <= 0) throw new Error("Length must be positive");
    parts = [];
    for (let i = 0; i < input.length; i += lengthVal) {
      parts.push(input.slice(i, i + lengthVal));
    }
  } else {
    if (chunksVal <= 0) throw new Error("Chunks must be positive");
    if (input.length < chunksVal) throw new Error("Text too short for chunk count");
    const size = Math.ceil(input.length / chunksVal);
    parts = [];
    for (let i = 0; i < input.length; i += size) {
      parts.push(chunkPrefix + input.slice(i, i + size) + chunkSuffix);
    }
    if (parts.length > chunksVal) {
      parts[chunksVal - 1] = chunkPrefix + parts.slice(chunksVal - 1).join("") + chunkSuffix;
      parts = parts.slice(0, chunksVal);
    }
  }
  return parts.join(outputSep);
}

export default function SplitTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<SplitMode>("symbol");
  const [symbol, setSymbol] = useState(" ");
  const [regex, setRegex] = useState("\\s+");
  const [lengthVal, setLengthVal] = useState(10);
  const [chunksVal, setChunksVal] = useState(3);
  const [chunkPrefix, setChunkPrefix] = useState("[");
  const [chunkSuffix, setChunkSuffix] = useState("]");
  const [outputSep, setOutputSep] = useState("\n");

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to split"); return; }
    try {
      const result = splitText(input, mode, symbol, regex, lengthVal, chunksVal, chunkPrefix, chunkSuffix, outputSep);
      setOutput(result);
      toast.success("Text split");
    } catch (e: any) {
      toast.error(e.message || "Split failed");
    }
  };

  const copyToClipboard = async () => {
    if (!output) { toast.warning("Nothing to copy"); return; }
    try { await navigator.clipboard.writeText(output); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearAll = () => { setInput(""); setOutput(""); };
  const swapInputOutput = () => { setInput(output); setOutput(""); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Mode:</Label>
          <Select value={mode} onValueChange={v => setMode(v as SplitMode)}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="symbol">By symbol</SelectItem>
              <SelectItem value="regex">By regex</SelectItem>
              <SelectItem value="length">By length</SelectItem>
              <SelectItem value="chunks">Into chunks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "symbol" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Separator:</Label>
            <Input value={symbol} onChange={e => setSymbol(e.target.value)} className="w-20 h-8 text-center" />
          </div>
        )}
        {mode === "regex" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Regex:</Label>
            <Input value={regex} onChange={e => setRegex(e.target.value)} className="w-40 h-8 font-mono" />
          </div>
        )}
        {mode === "length" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Max length:</Label>
            <Input type="number" value={lengthVal} onChange={e => setLengthVal(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} />
          </div>
        )}
        {mode === "chunks" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Chunks:</Label>
            <Input type="number" value={chunksVal} onChange={e => setChunksVal(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} />
            <Label className="text-sm">Prefix:</Label>
            <Input value={chunkPrefix} onChange={e => setChunkPrefix(e.target.value)} className="w-16 h-8 text-center" />
            <Label className="text-sm">Suffix:</Label>
            <Input value={chunkSuffix} onChange={e => setChunkSuffix(e.target.value)} className="w-16 h-8 text-center" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Label className="text-sm">Output sep:</Label>
          <Input value={outputSep} onChange={e => setOutputSep(e.target.value)} className="w-20 h-8 text-center" />
        </div>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Split</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to split..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Split Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Split result will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
