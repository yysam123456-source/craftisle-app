"use client";

import { useState } from "react";
import { Binary, Copy, Trash2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

// RFC 4648 Base32 alphabet
import ToolDetailSections from "@/components/tools/ToolDetailSections";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const ALPHABET_MAP = ALPHABET.split('').reduce((map, char, index) => {
  map[char] = index;
  return map;
}, {} as { [key: string]: number });

export default function Base32Page() {
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
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        let bits = 0;
        let value = 0;
        let output = "";

        for (let i = 0; i < data.length; i++) {
            value = (value << 8) | data[i];
            bits += 8;
            while (bits >= 5) {
                output += ALPHABET[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }
        if (bits > 0) {
            output += ALPHABET[(value << (5 - bits)) & 31];
        }
        
        // Padding
        while (output.length % 8 !== 0) {
            output += "=";
        }

        setInput(output);
        toast.success("Encoded to Base32");
    } catch {
        toast.error("Encoding failed");
    }
  };

  const decode = () => {
    try {
        let val = input.toUpperCase().replace(/=+$/, "");
        let bits = 0;
        let value = 0;
        let index = 0;
        const output = new Uint8Array((val.length * 5) / 8 | 0);

        for (let i = 0; i < val.length; i++) {
            if (!(val[i] in ALPHABET_MAP)) throw new Error("Invalid character");
            value = (value << 5) | ALPHABET_MAP[val[i]];
            bits += 5;
            if (bits >= 8) {
                output[index++] = (value >>> (bits - 8)) & 0xFF;
                bits -= 8;
            }
        }
        
        const decoder = new TextDecoder();
        setInput(decoder.decode(output));
        toast.success("Decoded to text");
    } catch {
        toast.error("Decode failed: invalid Base32 string");
    }
  };

  const clearAll = () => setInput("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-red-600 shadow-lg">
          <Binary className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base32 Encode/Decode</h1>
          <p className="text-muted-foreground">RFC 4648 standard Base32 text converter</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Input/Output Text</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)} disabled={!input}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={!input} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter content to encode/decode..."
              className="min-h-62.5 font-mono text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={encode} size="lg" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Encode (Encode)
          </Button>
          <Button onClick={decode} size="lg" variant="outline" className="flex-1 gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Decode (Decode)
          </Button>
        </div>
      <ToolDetailSections toolId="base32" />
      </div>
      
       {/* Info Card */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Base32 Description
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Base32 uses a 32-character set (A-Z and 2-7) to represent binary data. Commonly used in case-insensitive file systems or manual input scenarios.</p>
            <p>Base32 tools follow RFC 4648 standard.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
