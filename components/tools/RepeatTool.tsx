import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function repeatText(text: string, amount: number, delimiter: string): string {
  const parsed = parseInt(String(amount)) || 0;
  if (parsed <= 0) return "";
  return Array(parsed).fill(text).join(delimiter);
}

export default function RepeatTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [amount, setAmount] = useState(3);
  const [delimiter, setDelimiter] = useState(" ");

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to repeat"); return; }
    if (amount < 1) { toast.warning("Amount must be at least 1"); return; }
    const result = repeatText(input, amount, delimiter);
    setOutput(result);
    toast.success(`Text repeated ${amount} times`);
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
          <Label className="text-sm">Repeat:</Label>
          <Input type="number" value={amount} onChange={e => setAmount(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} />
          <Label className="text-sm">times</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Delimiter:</Label>
          <Input value={delimiter} onChange={e => setDelimiter(e.target.value)} className="w-24 h-8" />
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Repeat Text</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to repeat..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Repeated Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Repeated text will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li>Repeat text N times with a custom delimiter between copies</li>
                <li>Example: "hello", 3 times, space delimiter → "hello hello hello"</li>
                <li>Set delimiter to empty string to repeat without separator</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Useful for generating test data, repeated patterns, or filler text</li>
                <li>Delimiter can be any string: comma, newline, custom separator</li>
                <li>Click Swap to use the repeated text as new input</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
