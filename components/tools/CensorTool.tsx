import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isSymbol(input: string): boolean {
  return /^[^\p{L}\p{N}]+$/u.test(input) || /\p{Extended_Pictographic}/u.test(input);
}

function censorText(input: string, wordsToCensor: string, censorSymbol: string, censoredBySymbol: boolean, eachLetter: boolean, censorWord: string): string {
  if (!input) return "";
  if (!wordsToCensor) return input;

  if (censoredBySymbol && !isSymbol(censorSymbol)) {
    throw new Error("Enter a valid censor symbol (non-alphanumeric or emoji)");
  }

  const words = wordsToCensor.split("\n").map(w => w.trim()).filter(w => w.length > 0);
  let result = input;

  for (const word of words) {
    const escaped = escapeRegex(word);
    const pattern = new RegExp(`\\b${escaped}\\b`, "giu");
    const replacement = censoredBySymbol
      ? (eachLetter ? censorSymbol.repeat(word.length) : censorSymbol)
      : censorWord;
    result = result.replace(pattern, replacement);
  }

  return result;
}

export default function CensorTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [words, setWords] = useState("");
  const [symbol, setSymbol] = useState("*");
  const [bySymbol, setBySymbol] = useState(true);
  const [eachLetter, setEachLetter] = useState(true);
  const [wordCensor, setWordCensor] = useState("[censored]");

  const handleConvert = () => {
    if (!input) { toast.warning("Enter text to censor"); return; }
    if (!words) { toast.warning("Enter words to censor"); return; }
    try {
      const result = censorText(input, words, symbol, bySymbol, eachLetter, wordCensor);
      setOutput(result);
      toast.success("Text censored");
    } catch (e: any) {
      toast.error(e.message || "Censoring failed");
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
          <Label className="text-sm">Symbol:</Label>
          <Input value={symbol} onChange={e => setSymbol(e.target.value)} className="w-12 h-8 text-center" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={bySymbol} onCheckedChange={v => setBySymbol(!!v)} />
            Censor by symbol
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={eachLetter} onCheckedChange={v => setEachLetter(!!v)} />
            Each letter
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Censor</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to censor..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Words to Censor (one per line)</CardTitle></CardHeader>
            <CardContent>
              <Textarea value={words} onChange={e => setWords(e.target.value)} placeholder="Enter words to censor, one per line..." className="h-24 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Censored Result</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="Censored text will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li>Censor sensitive words by replacing them with symbols or placeholder text</li>
                <li>Enter words to censor, one per line</li>
                <li>Word boundaries are respected (partial matches are not censored)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Choose symbol mode to replace with a character (e.g. *)</li>
                <li>Enable "Each letter" to repeat the symbol for each character</li>
                <li>Use word mode to replace with a custom placeholder</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
