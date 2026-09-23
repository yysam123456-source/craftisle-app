import { useState } from "react";
import { KeyRound, Copy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const ALG_MAP: Record<string, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

function b64urlFromString(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromBuffer(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default function JwtGeneratorTool() {
  const [alg, setAlg] = useState("HS256");
  const [payload, setPayload] = useState(
    '{\n  "sub": "1234567890",\n  "name": "Ada Lovelace",\n  "iat": 1700000000\n}'
  );
  const [secret, setSecret] = useState("your-256-bit-secret");
  const [token, setToken] = useState("");

  const generate = async () => {
    try {
      const parsedPayload = JSON.parse(payload);
      const header = { alg, typ: "JWT" };
      const h = b64urlFromString(JSON.stringify(header));
      const p = b64urlFromString(JSON.stringify(parsedPayload));
      const signingInput = `${h}.${p}`;

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: ALG_MAP[alg] },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(signingInput));
      setToken(`${signingInput}.${b64urlFromBuffer(sig)}`);
      toast.success("Token generated");
    } catch (e) {
      setToken("");
      toast.error(e instanceof SyntaxError ? "Payload must be valid JSON" : "Generation failed");
    }
  };

  const copy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
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
              <KeyRound className="h-5 w-5" /> Header &amp; Payload
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Algorithm</Label>
              <Select value={alg} onValueChange={setAlg}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HS256">HS256</SelectItem>
                  <SelectItem value="HS384">HS384</SelectItem>
                  <SelectItem value="HS512">HS512</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payload (JSON)</Label>
              <Textarea
                className="min-h-44 font-mono text-sm resize-y"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Secret</Label>
              <Input value={secret} onChange={(e) => setSecret(e.target.value)} />
            </div>
            <Button onClick={generate} className="w-full gap-2">
              <Zap className="h-4 w-4" /> Generate JWT
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Signed Token</CardTitle>
            <Button variant="ghost" size="sm" onClick={copy} disabled={!token}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea readOnly className="min-h-44 font-mono text-xs break-all resize-y" value={token} />
            {token && (
              <div className="mt-3 space-y-1 text-xs">
                <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 font-mono text-red-700">
                  header
                </span>
                <span className="mx-1 text-muted-foreground">.</span>
                <span className="inline-block rounded bg-purple-100 px-1.5 py-0.5 font-mono text-purple-700">
                  payload
                </span>
                <span className="mx-1 text-muted-foreground">.</span>
                <span className="inline-block rounded bg-sky-100 px-1.5 py-0.5 font-mono text-sky-700">
                  signature
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About JWT Signing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Signs a JWT with HMAC (HS256/384/512) using the Web Crypto API. The token is built and
            signed entirely in your browser — your secret never leaves the page.
          </p>
          <p>
            Note: for production use verify signatures server-side and never embed secrets in client
            code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
