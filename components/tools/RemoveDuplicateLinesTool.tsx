import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type DupMode = "all" | "consecutive" | "unique";
type NewlineOpt = "preserve" | "filter" | "delete";

interface DupOptions {
  mode: DupMode;
  newlines: NewlineOpt;
  sortLines: boolean;
  trimLines: boolean;
}

function removeDuplicateLines(text: string, opts: DupOptions): string {
  let lines = text.split("\n");

  if (opts.newlines === "delete") {
    lines = lines.filter(line => line.trim() !== "");
  }

  if (opts.trimLines) {
    lines = lines.map(line => line.trim());
  }

  let result: string[];
  if (opts.mode === "all") {
    const seen = new Set<string>();
    result = lines.filter(line => {
      if (seen.has(line)) return false;
      seen.add(line);
      return true;
    });
  } else if (opts.mode === "consecutive") {
    result = lines.filter((line, i, arr) => i === 0 || line !== arr[i - 1]);
  } else {
    const counts = new Map<string, number>();
    lines.forEach(line => counts.set(line, (counts.get(line) || 0) + 1));
    result = lines.filter(line => counts.get(line) === 1);
  }

  if (opts.sortLines) result.sort();

  if (opts.newlines === "preserve") {
    const preserved: string[] = [];
    for (const line of text.split("\n")) {
      if (line.trim() === "") {
        preserved.push(line);
      } else {
        preserved.push(result.includes(line) ? line : "");
      }
    }
    return preserved.join("\n");
  }

  return result.join("\n");
}

export default function RemoveDuplicateLinesTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<DupMode>("all");
  const [newlines, setNewlines] = useState<NewlineOpt>("filter");
  const [sortLines, setSortLines] = useState(false);
  const [trimLines, setTrimLines] = useState(false);

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text"); return; }
    const result = removeDuplicateLines(input, { mode, newlines, sortLines, trimLines });
    setOutput(result);
    toast.success("Duplicates removed");
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
          <Select value={mode} onValueChange={v => setMode(v as DupMode)}>
            <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Remove all</SelectItem>
              <SelectItem value="consecutive">Consecutive only</SelectItem>
              <SelectItem value="unique">Keep unique only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Newlines:</Label>
          <Select value={newlines} onValueChange={v => setNewlines(v as NewlineOpt)}>
            <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="preserve">Preserve</SelectItem>
              <SelectItem value="filter">Filter</SelectItem>
              <SelectItem value="delete">Delete empty</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={sortLines} onCheckedChange={v => setSortLines(!!v)} />
            Sort lines
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={trimLines} onCheckedChange={v => setTrimLines(!!v)} />
            Trim lines
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Remove Duplicates</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text with duplicate lines..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Result (duplicates removed)</CardTitle>
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
                <li><b>Remove all</b>: Removes all duplicate lines, keeping only first occurrence</li>
                <li><b>Consecutive only</b>: Removes only consecutive duplicate lines</li>
                <li><b>Keep unique only</b>: Keeps only lines that appear exactly once</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Newline options: preserve empty lines, filter them, or delete them</li>
                <li>Enable "Sort lines" to alphabetically sort the output</li>
                <li>Enable "Trim lines" to remove leading/trailing whitespace</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
