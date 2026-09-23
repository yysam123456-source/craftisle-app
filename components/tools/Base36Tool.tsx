import { useState } from "react";
import { Binary, Copy, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function bytesToBigInt(bytes: Uint8Array): bigint {
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n;
}

function bigIntToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0]);
  const bytes: number[] = [];
  let x = n;
  while (x > 0n) {
    bytes.unshift(Number(x & 0xffn));
    x = x >> 8n;
  }
  return new Uint8Array(bytes);
}

export default function Base36Tool() {
  const [input, setInput] = useState("");

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const encode = () => {
    try {
      const bytes = new TextEncoder().encode(input);
      const bi = bytesToBigInt(bytes);
      setInput(bi.toString(36).toUpperCase());
      toast.success("Encoded to Base36");
    } catch {
      toast.error("Encoding failed");
    }
  };

  const decode = () => {
    try {
      const clean = input.trim().toLowerCase().replace(/[^0-9a-z]/g, "");
      if (!clean) throw new Error("empty");
      const bi = BigInt("0x" + [...clean].map((c) => parseInt(c, 36).toString(16)).join(""));
      const out = new TextDecoder().decode(bigIntToBytes(bi));
      setInput(out);
      toast.success("Decoded from Base36");
    } catch {
      toast.error("Decode failed: invalid Base36 string");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Input / Output</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(input)}
              disabled={!input}
            >
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter text to encode, or a Base36 string to decode..."
              className="min-h-62.5 font-mono text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={encode} size="lg" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" /> Encode
          </Button>
          <Button onClick={decode} size="lg" variant="outline" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" /> Decode
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-destructive hover:text-destructive"
            onClick={() => setInput("")}
            disabled={!input}
          >
            <Trash2 className="h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Binary className="h-5 w-5" /> About Base36
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Base36 uses the digits 0–9 and letters A–Z (case-insensitive) to represent data. It is
            handy for producing compact, human-friendly codes from arbitrary text.
          </p>
          <p>All encoding and decoding happen locally in your browser — nothing is uploaded.</p>
        </CardContent>
      </Card>
    </div>
  );
}
