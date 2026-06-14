import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type SplitType = "symbol" | "regex";

function isPalindrome(word: string, left: number, right: number): boolean {
  if (left >= right) return true;
  if (word[left] !== word[right]) return false;
  return isPalindrome(word, left + 1, right - 1);
}

function checkPalindromes(array: string[]): boolean[] {
  return array.map(word => isPalindrome(word, 0, word.length - 1));
}

function palindromeText(input: string, splitType: SplitType, separator: string): string {
  if (!input) return "";
  const array = splitType === "regex" ? input.split(new RegExp(separator)) : input.split(separator);
  const trimmed = array.map(item => item.trim());
  const statusArray = checkPalindromes(trimmed);
  return statusArray.map(s => s.toString()).join(separator);
}

export default function PalindromeTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("symbol");
  const [separator, setSeparator] = useState(" ");

  const handleCheck = () => {
    if (!input) { toast.warning("Enter text to check"); return; }
    try {
      const result = palindromeText(input, splitType, separator);
      setOutput(result);
      toast.success("Palindrome check complete");
    } catch (e: any) {
      toast.error(e.message || "Check failed");
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
          <Label className="text-sm">Split by:</Label>
          <Select value={splitType} onValueChange={v => setSplitType(v as SplitType)}>
            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="symbol">Symbol</SelectItem>
              <SelectItem value="regex">Regex</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Separator:</Label>
          <Input value={separator} onChange={e => setSeparator(e.target.value)} className="w-16 h-8 text-center" />
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleCheck} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Check Palindrome</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Text</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Enter text to check (words separated by spaces)..." className="h-full min-h-75 font-mono resize-none" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Results (true/false)</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea value={output} readOnly placeholder="true/false results will appear here..." className="h-full min-h-75 font-mono resize-none bg-muted/50" />
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
                <li>Check if words are palindromes (read the same forwards and backwards)</li>
                <li>Results are "true" or "false", joined by the separator</li>
                <li>Supports custom separators and regex splitting</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Example: "aba bab" → "true,false" (space separator)</li>
                <li>Use regex mode for complex splitting (e.g. commas, semicolons)</li>
                <li>Click Swap to check the results as input</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
