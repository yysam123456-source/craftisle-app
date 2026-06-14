import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function rotateStr(input: string, step: number, right: boolean): string {
  const arr = input.split("");
  const len = arr.length;
  if (len === 0) return input;
  const norm = ((step % len) + len) % len;
  if (right) {
    return arr.slice(-norm).concat(arr.slice(0, -norm)).join("");
  } else {
    return arr.slice(norm).concat(arr.slice(0, norm)).join("");
  }
}

function rotateText(input: string, step: number, right: boolean, multiLine: boolean): string {
  if (multiLine) {
    return input.split("\n").map(line => rotateStr(line, step, right)).join("\n");
  }
  return rotateStr(input, step, right);
}

export default function RotateTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [step, setStep] = useState(1);
  const [right, setRight] = useState(true);
  const [multiLine, setMultiLine] = useState(false);

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to rotate"); return; }
    const result = rotateText(input, step, right, multiLine);
    setOutput(result);
    toast.success("Text rotated");
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
          <Label className="text-sm">Step:</Label>
          <Input type="number" value={step} onChange={e => setStep(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={right} onCheckedChange={v => setRight(!!v)} />
            Rotate right
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={multiLine} onCheckedChange={v => setMultiLine(!!v)} />
            Multi-line
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Rotate</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to rotate..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Rotated Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Rotated text will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li>Rotate characters in text by N positions left or right</li>
                <li>Example: "hello" rotated right by 1 → "ohell"</li>
                <li>Multi-line mode rotates each line independently</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Step = number of positions to rotate</li>
                <li>Rotate right: moves characters from end to beginning</li>
                <li>Rotate left: moves characters from beginning to end</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
