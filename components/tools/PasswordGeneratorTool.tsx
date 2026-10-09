"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { PASSPHRASE_WORDS } from "@/lib/wordlist";

type Mode = "characters" | "passphrase";

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";

/**
 * 🔴 密码学安全随机：必须用 crypto.getRandomValues，不能用 Math.random()。
 * Math.random 的内部状态可由少量输出反推，用它生成密码等于没有随机性。
 * 取模有偏置，故做拒绝采样。
 */
function randomInt(maxExclusive: number): number {
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % maxExclusive;
}

/** 从任意序列取一个随机元素（用于字符池与词表）。 */
function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)];
}

function shuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export default function PasswordGeneratorTool() {
  const [mode, setMode] = useState<Mode>("characters");

  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);

  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState("-");
  const [capitalize, setCapitalize] = useState(true);
  const [appendNumber, setAppendNumber] = useState(false);

  const [count, setCount] = useState(1);
  const [output, setOutput] = useState("");

  const generateRandomChars = () => {
    let chars = "";
    if (useUpper) chars += UPPER;
    if (useLower) chars += LOWER;
    if (useNumbers) chars += NUMBERS;
    if (useSymbols) chars += SYMBOLS;

    if (chars.length === 0) {
      setOutput("Error: Please select at least one character type");
      return "";
    }

    // 每种勾选的类型至少出现一次，避免 "aaaa111" 这类看起来随机的假随机。
    const required: string[] = [];
    if (useUpper) required.push(pick(UPPER.split("")));
    if (useLower) required.push(pick(LOWER.split("")));
    if (useNumbers) required.push(pick(NUMBERS.split("")));
    if (useSymbols) required.push(pick(SYMBOLS.split("")));

    const pool = Array.from(chars);
    const target = Math.max(length, required.length);
    const out: string[] = required;
    while (out.length < target) out.push(pick(pool));
    return shuffle(out).join("");
  };

  const generatePassphrase = () => {
    const words: string[] = [];
    for (let i = 0; i < wordCount; i++) {
      const w = pick(PASSPHRASE_WORDS);
      words.push(capitalize ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    }
    let pass = words.join(separator);
    if (appendNumber) pass += separator + String(randomInt(100));
    return pass;
  };

  const generatePassword = () => {
    const passwords: string[] = [];
    for (let c = 0; c < count; c++) {
      passwords.push(mode === "characters" ? generateRandomChars() : generatePassphrase());
    }
    setOutput(passwords.filter(Boolean).join("\n"));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success("Copied!");
  };

  const bits = wordCount * Math.round(Math.log2(PASSPHRASE_WORDS.length));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password Generator — Random Passwords &amp; Word Passphrases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === "characters" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("characters")}
          >
            Random characters
          </Button>
          <Button
            variant={mode === "passphrase" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("passphrase")}
          >
            Passphrase (words)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mode === "characters" ? (
            <div>
              <label className="text-sm font-medium">Length</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value) || 16)}
                min={4}
                max={128}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Number of words</label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) =>
                  setWordCount(Math.min(12, Math.max(3, parseInt(e.target.value) || 4)))
                }
                min={3}
                max={12}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Count</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              min={1}
              max={20}
              className="w-full mt-1 px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        {mode === "characters" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium">Character Types</label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useUpper} onChange={(e) => setUseUpper(e.target.checked)} />
                Uppercase
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useLower} onChange={(e) => setUseLower(e.target.checked)} />
                Lowercase
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} />
                Numbers
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} />
                Symbols
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium">Options</label>
            <div className="flex gap-4 flex-wrap items-center">
              <label className="flex items-center gap-2">
                Separator
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value)}
                  className="px-2 py-1 border rounded-md text-sm"
                >
                  <option value="-">hyphen (-)</option>
                  <option value=" ">space</option>
                  <option value="_">underscore (_)</option>
                  <option value="">none</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={capitalize} onChange={(e) => setCapitalize(e.target.checked)} />
                Capitalize words
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={appendNumber} onChange={(e) => setAppendNumber(e.target.checked)} />
                Append a number
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              {wordCount} words from a {PASSPHRASE_WORDS.length}-word list — roughly {bits} bits. Built to be
              read aloud and typed on a phone. For master passwords and encryption keys, use character mode.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={generatePassword} className="gap-2">
            Generate Password
          </Button>
          {output && (
            <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copy">
              <Copy className="h-4 w-4" />
            </Button>
          )}
        </div>

        {output && (
          <div>
            <label className="text-sm font-medium mb-2 block">Output</label>
            <pre className="p-3 bg-muted rounded-md overflow-auto whitespace-pre-wrap text-sm">
              {output}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}