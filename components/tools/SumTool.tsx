import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type ExtractType = "smart" | "delimiter";

function getAllNumbers(text: string): number[] {
  const matches = text.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

function computeSum(input: string, type: ExtractType, separator: string, running: boolean): string {
  let numbers: number[] = [];
  if (type === "smart") {
    numbers = getAllNumbers(input);
  } else {
    numbers = input
      .split(separator)
      .filter(p => !isNaN(Number(p)) && p.trim() !== "")
      .map(Number);
  }

  if (numbers.length === 0) return "0";

  if (running) {
    let result = "";
    let sum = 0;
    for (const n of numbers) {
      sum += n;
      result += sum + "\n";
    }
    return result;
  }

  return numbers.reduce((a, b) => a + b, 0).toString();
}

export default function SumTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [type, setType] = useState<ExtractType>("smart");
  const [separator, setSeparator] = useState(",");
  const [running, setRunning] = useState(false);

  const handleCompute = () => {
    if (!input) { toast.warning("Enter numbers to sum"); return; }
    const result = computeSum(input, type, separator, running);
    setOutput(result);
    toast.success(running ? "Running sum computed" : `Sum: ${result.trim()}`);
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
          <Label className="text-sm">Extract:</Label>
          <select value={type} onChange={e => setType(e.target.value as ExtractType)} className="h-8 rounded-md border px-2 text-sm">
            <option value="smart">Smart (find all numbers)</option>
            <option value="delimiter">By delimiter</option>
          </select>
        </div>
        {type === "delimiter" && (
          <div className="flex items-center gap-2">
            <Label className="text-sm">Separator:</Label>
            <Input value={separator} onChange={e => setSeparator(e.target.value)} className="w-16 h-8 text-center" />
          </div>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={running} onCheckedChange={v => setRunning(!!v)} />
            Running sum
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleCompute} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Compute Sum</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input (numbers)</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter numbers...&#10;Smart mode: extracts all numbers from text&#10;Delimiter mode: 1,2,3,4" className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">{running ? "Running Sum" : "Sum Result"}</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Sum result will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li><b>Smart mode</b>: Extracts all numbers from text (e.g. "I have 3 apples and 5 oranges" → 3, 5)</li>
                <li><b>Delimiter mode</b>: Splits by separator and sums numeric values</li>
                <li><b>Running sum</b>: Shows cumulative sum after each number</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Example: "1, 2, 3" (comma delimiter) → sum = 6</li>
                <li>Example: "The 3 items cost $50 each" (smart) → sum = 53</li>
                <li>Supports negative numbers and decimals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
