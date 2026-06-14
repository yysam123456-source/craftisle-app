import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function quoteWord(word: string, leftQuote: string, rightQuote: string, doubleQuotation: boolean): string {
  const array = word.split("");
  if (doubleQuotation) {
    array.unshift(leftQuote);
    array.push(rightQuote);
  } else {
    if (array[0] === leftQuote && array[array.length - 1] === rightQuote) return word;
    array.unshift(leftQuote);
    array.push(rightQuote);
  }
  return array.join("");
}

function quoteText(input: string, leftQuote: string, rightQuote: string, doubleQuotation: boolean, emptyQuoting: boolean, multiLine: boolean): string {
  if (!input) return "";
  const lines = multiLine ? input.split("\n") : [input];
  const result: string[] = [];
  for (const line of lines) {
    if (line === "") {
      result.push(emptyQuoting ? quoteWord(line, leftQuote, rightQuote, doubleQuotation) : line);
    } else {
      result.push(quoteWord(line, leftQuote, rightQuote, doubleQuotation));
    }
  }
  return result.join("\n");
}

export default function QuoteTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [leftQuote, setLeftQuote] = useState("\"");
  const [rightQuote, setRightQuote] = useState("\"");
  const [doubleQuotation, setDoubleQuotation] = useState(true);
  const [emptyQuoting, setEmptyQuoting] = useState(false);
  const [multiLine, setMultiLine] = useState(true);

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to quote"); return; }
    const result = quoteText(input, leftQuote, rightQuote, doubleQuotation, emptyQuoting, multiLine);
    setOutput(result);
    toast.success("Text quoted");
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
          <Label className="text-sm">Left:</Label>
          <Input value={leftQuote} onChange={e => setLeftQuote(e.target.value)} className="w-12 h-8 text-center" />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Right:</Label>
          <Input value={rightQuote} onChange={e => setRightQuote(e.target.value)} className="w-12 h-8 text-center" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={doubleQuotation} onCheckedChange={v => setDoubleQuotation(!!v)} />
            Double quotes
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={emptyQuoting} onCheckedChange={v => setEmptyQuoting(!!v)} />
            Quote empty lines
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={multiLine} onCheckedChange={v => setMultiLine(!!v)} />
            Multi-line
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Apply Quotes</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to quote..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Result will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><span className="text-xl">💡</span>Usage</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Add custom quotation marks to text lines</li>
                <li>Supports multi-line processing</li>
                <li>Useful for formatting code strings, CSV fields, or text data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Customize left/right quote characters</li>
                <li>Option to quote empty lines or skip them</li>
                <li>Click Swap to use output as new input</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
