import { useState } from "react";
import { Sigma, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TO_ROMAN: [number, string][] = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
  [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

function toRoman(num: number): string {
  if (!Number.isInteger(num) || num <= 0 || num > 3999) {
    throw new Error("Value must be an integer between 1 and 3999");
  }
  let out = "";
  for (const [v, s] of TO_ROMAN) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out;
}

function fromRoman(input: string): number {
  const s = input.trim().toUpperCase();
  if (!/^[IVXLCDM]+$/.test(s)) throw new Error("Invalid Roman numeral");
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let i = 0; i < s.length; i++) {
    const cur = map[s[i]];
    const next = map[s[i + 1]] ?? 0;
    if (cur < next) total -= cur;
    else total += cur;
  }
  if (total <= 0 || total > 3999) throw new Error("Out of supported range");
  return total;
}

export default function RomanNumeralTool() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState("");

  const run = (mode: "toRoman" | "toArabic") => {
    try {
      if (mode === "toRoman") {
        const n = parseInt(value, 10);
        setResult(toRoman(n));
      } else {
        setResult(String(fromRoman(value)));
      }
      toast.success("Converted");
    } catch (e) {
      setResult("");
      toast.error((e as Error).message || "Conversion failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sigma className="h-5 w-5" /> Roman Numeral Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter a number (1–3999) or Roman numeral (e.g. MMXXIV)"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => run("toRoman")} size="lg" className="flex-1 gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Number → Roman
            </Button>
            <Button onClick={() => run("toArabic")} size="lg" variant="outline" className="flex-1 gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Roman → Number
            </Button>
          </div>
          {result && (
            <div className="rounded-lg bg-muted/50 p-4 text-center font-mono text-2xl font-semibold">
              {result}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Roman Numerals</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Roman numerals use combinations of letters (I, V, X, L, C, D, M). This tool converts both
            ways for values from 1 to 3999.
          </p>
          <p>Conversion runs entirely in your browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
