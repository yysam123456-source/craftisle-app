import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function joinText(text: string, deleteBlank: boolean, deleteTrailing: boolean, joinChar: string): string {
  let lines = text.split("\n");
  if (deleteTrailing) {
    lines = lines.map(line => line.trimEnd());
  }
  if (deleteBlank) {
    lines = lines.filter(line => line.trim());
  }
  return lines.join(joinChar);
}

export default function JoinTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [joinChar, setJoinChar] = useState("");
  const [deleteBlank, setDeleteBlank] = useState(true);
  const [deleteTrailing, setDeleteTrailing] = useState(true);

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to join"); return; }
    const result = joinText(input, deleteBlank, deleteTrailing, joinChar);
    setOutput(result);
    toast.success("Lines joined");
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
          <Label className="text-sm">Join with:</Label>
          <Input value={joinChar} onChange={e => setJoinChar(e.target.value)} placeholder="e.g. comma, space" className="w-32 h-8" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={deleteBlank} onCheckedChange={v => setDeleteBlank(!!v)} />
            Delete blank lines
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={deleteTrailing} onCheckedChange={v => setDeleteTrailing(!!v)} />
            Trim trailing spaces
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Join Lines</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text (one line per item)</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text lines to join..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Joined Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Joined text will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li>Join multiple lines into a single line with a custom separator</li>
                <li>Example: lines "a", "b", "c" joined with ", " → "a, b, c"</li>
                <li>Blank lines can be deleted before joining</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Trailing spaces on each line can be trimmed</li>
                <li>Leave join character empty to join without separator</li>
                <li>Useful for creating CSV, arrays, or delimited strings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
