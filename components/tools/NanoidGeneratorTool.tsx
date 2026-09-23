import { useState } from "react";
import { RefreshCw, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const DEFAULT_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";

export default function NanoidGeneratorTool() {
  const [length, setLength] = useState(21);
  const [count, setCount] = useState(1);
  const [alphabet, setAlphabet] = useState(DEFAULT_ALPHABET);
  const [results, setResults] = useState<string[]>([]);

  const generate = () => {
    const len = Math.max(1, Math.min(64, length || 1));
    const n = Math.max(1, Math.min(100, count || 1));
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      let id = "";
      for (let j = 0; j < len; j++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      ids.push(id);
    }
    setResults(ids);
    toast.success(`Generated ${n} ID${n > 1 ? "s" : ""}`);
  };

  const copyAll = async () => {
    if (!results.length) return;
    try {
      await navigator.clipboard.writeText(results.join("\n"));
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> Nano ID Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Length: {length}</Label>
              <Input
                type="number"
                min={1}
                max={64}
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Count: {count}</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alphabet</Label>
              <Input value={alphabet} onChange={(e) => setAlphabet(e.target.value)} />
            </div>
          </div>
          <Button onClick={generate} size="lg" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" /> Generate
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Results</CardTitle>
            <Button variant="ghost" size="sm" onClick={copyAll}>
              <Copy className="h-4 w-4 mr-2" /> Copy all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {results.map((r, i) => (
                <div key={i} className="break-all rounded bg-muted/50 p-2">
                  {r}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Nano ID</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Nano ID generates compact, URL-safe unique identifiers using a non-sequential random
            alphabet — ideal for database keys, filenames, and API tokens.
          </p>
          <p>All generation happens locally in your browser; no IDs leave your device.</p>
        </CardContent>
      </Card>
    </div>
  );
}
