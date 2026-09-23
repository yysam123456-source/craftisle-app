import { useState } from "react";
import { Lock, Copy, Zap } from "lucide-react";
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

const ALGOS: Record<string, string> = {
  "SHA-1": "SHA-1",
  "SHA-256": "SHA-256",
  "SHA-384": "SHA-384",
  "SHA-512": "SHA-512",
};

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function toBase64(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export default function HmacGeneratorTool() {
  const [message, setMessage] = useState("");
  const [key, setKey] = useState("");
  const [algo, setAlgo] = useState("SHA-256");
  const [result, setResult] = useState<{ hex: string; base64: string } | null>(null);

  const run = async () => {
    if (!message || !key) {
      toast.warning("Enter both a message and a secret key");
      return;
    }
    try {
      const enc = new TextEncoder();
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        enc.encode(key),
        { name: "HMAC", hash: algo },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
      setResult({ hex: toHex(sig), base64: toBase64(sig) });
      toast.success("HMAC computed");
    } catch {
      toast.error("Computation failed");
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
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
              <Lock className="h-5 w-5" /> Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                className="min-h-32 font-mono text-sm resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="The message to authenticate"
              />
            </div>
            <div className="space-y-2">
              <Label>Secret key</Label>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="shared secret" />
            </div>
            <div className="space-y-2">
              <Label>Hash algorithm</Label>
              <Select value={algo} onValueChange={setAlgo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(ALGOS).map((a) => (
                    <SelectItem key={a} value={a}>
                      HMAC-{a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={run} className="w-full gap-2">
              <Zap className="h-4 w-4" /> Compute HMAC
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result ? (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Hex</Label>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.hex)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <code className="block break-all rounded border bg-muted/50 p-2 font-mono text-xs">
                    {result.hex}
                  </code>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label>Base64</Label>
                    <Button variant="ghost" size="sm" onClick={() => copy(result.base64)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <code className="block break-all rounded border bg-muted/50 p-2 font-mono text-xs">
                    {result.base64}
                  </code>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a message and key, then compute the HMAC.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About HMAC</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            HMAC (Hash-based Message Authentication Code) combines a message with a secret key to
            prove both integrity and authenticity. Uses the Web Crypto API locally.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
