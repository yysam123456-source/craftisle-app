import { useEffect, useState } from "react";
import { ShieldCheck, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Uint8Array {
  const clean = input.toUpperCase().replace(/[\s=]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(secret: Uint8Array, counter: number, digits: number, algo: string): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000), false);
  view.setUint32(4, counter >>> 0, false);

  const key = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: algo },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin =
    ((sig[offset] & 0x7f) << 24) |
    (sig[offset + 1] << 16) |
    (sig[offset + 2] << 8) |
    sig[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, "0");
}

export default function OtpGeneratorTool() {
  const [mode, setMode] = useState("totp");
  const [secret, setSecret] = useState("JBSWY3DPEHPK3PXP");
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [algo, setAlgo] = useState("SHA-1");
  const [counter, setCounter] = useState(0);
  const [code, setCode] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const key = base32Decode(secret);
      if (key.length === 0) {
        if (alive) setCode("");
        return;
      }
      const c = mode === "totp" ? Math.floor(now / 1000 / period) : counter;
      try {
        const out = await hotp(key, c, digits, algo);
        if (alive) setCode(out);
      } catch {
        if (alive) setCode("");
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [secret, digits, period, algo, counter, mode, now]);

  const secondsLeft = period - (Math.floor(now / 1000) % period);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totp">TOTP (time-based)</SelectItem>
                  <SelectItem value="hotp">HOTP (counter-based)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Secret (Base32)</Label>
              <Input value={secret} onChange={(e) => setSecret(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Digits</Label>
                <Select value={String(digits)} onValueChange={(v) => setDigits(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Period</Label>
                <Input
                  type="number"
                  min={10}
                  value={period}
                  onChange={(e) => setPeriod(parseInt(e.target.value) || 30)}
                  disabled={mode === "hotp"}
                />
              </div>
              <div className="space-y-2">
                <Label>Algorithm</Label>
                <Select value={algo} onValueChange={setAlgo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHA-1">SHA-1</SelectItem>
                    <SelectItem value="SHA-256">SHA-256</SelectItem>
                    <SelectItem value="SHA-512">SHA-512</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {mode === "hotp" && (
              <div className="space-y-2">
                <Label>Counter</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={counter}
                    onChange={(e) => setCounter(parseInt(e.target.value) || 0)}
                  />
                  <Button variant="outline" size="icon" onClick={() => setCounter((c) => c + 1)} aria-label="Increment counter">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">One-Time Code</CardTitle>
            <Button variant="ghost" size="sm" onClick={copy} disabled={!code}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <div className="font-mono text-4xl font-bold tracking-widest">
                {code ? code.replace(/(\d{3})(?=\d)/g, "$1 ") : "—"}
              </div>
              {mode === "totp" && code && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Valid for {secondsLeft}s
                </div>
              )}
            </div>
            {mode === "totp" && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(secondsLeft / period) * 100}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Compare against your authenticator app to verify a secret. Codes are computed locally.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About OTP</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            TOTP (RFC 6238) derives a code from the current time; HOTP (RFC 4226) from a counter.
            Both use HMAC and a shared Base32 secret.
          </p>
          <p>The secret and codes stay in your browser — nothing is transmitted.</p>
        </CardContent>
      </Card>
    </div>
  );
}
