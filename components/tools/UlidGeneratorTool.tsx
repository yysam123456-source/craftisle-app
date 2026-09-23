import { useState } from "react";
import { RefreshCw, Copy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(now: number, len: number): string {
  let str = "";
  for (let i = len - 1; i >= 0; i--) {
    const mod = now % 32;
    str = CROCKFORD[mod] + str;
    now = Math.floor((now - mod) / 32);
  }
  return str;
}

function encodeRandom(len: number): string {
  let str = "";
  for (let i = 0; i < len; i++) {
    str += CROCKFORD[Math.floor(Math.random() * 32)];
  }
  return str;
}

export default function UlidGeneratorTool() {
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<string[]>([]);

  const generate = () => {
    const n = Math.max(1, Math.min(100, count || 1));
    const now = Date.now();
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(encodeTime(now, 10) + encodeRandom(16));
    }
    setResults(ids);
    toast.success(`Generated ${n} ULID${n > 1 ? "s" : ""}`);
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
            <Clock className="h-5 w-5" /> ULID Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
          <CardTitle className="text-base">About ULID</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            ULID (Universally Unique Lexicographically Sortable Identifier) is a 26-character,
            time-ordered identifier: the first 10 characters encode the timestamp, the last 16 are
            random.
          </p>
          <p>Lexicographic sorting by creation time makes them great for database primary keys.</p>
          <p>Generation runs entirely in your browser — nothing is uploaded.</p>
        </CardContent>
      </Card>
    </div>
  );
}
