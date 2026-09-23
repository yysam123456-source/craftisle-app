import { useState } from "react";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CheckKey = "length" | "upper" | "lower" | "digit" | "symbol";

function analyze(pw: string) {
  const checks: Record<CheckKey, boolean> = {
    length: pw.length >= 12,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
  const pool =
    (checks.upper ? 26 : 0) +
    (checks.lower ? 26 : 0) +
    (checks.digit ? 10 : 0) +
    (checks.symbol ? 33 : 0);
  const entropy = pw.length * (pool > 0 ? Math.log2(pool) : 0);

  let label = "Very Weak";
  let score = 0;
  if (pw.length === 0) {
    label = "—";
  } else if (entropy >= 80) {
    label = "Very Strong";
    score = 4;
  } else if (entropy >= 60) {
    label = "Strong";
    score = 3;
  } else if (entropy >= 40) {
    label = "Moderate";
    score = 2;
  } else if (entropy >= 20) {
    label = "Weak";
    score = 1;
  }
  return { checks, entropy, label, score };
}

const LABEL_COLOR = ["text-red-500", "text-red-500", "text-amber-500", "text-emerald-500", "text-emerald-600"];

export default function PasswordStrengthTool() {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const { checks, entropy, label, score } = analyze(pw);

  const items: { key: CheckKey; text: string }[] = [
    { key: "length", text: "At least 12 characters" },
    { key: "upper", text: "Uppercase letter (A–Z)" },
    { key: "lower", text: "Lowercase letter (a–z)" },
    { key: "digit", text: "Number (0–9)" },
    { key: "symbol", text: "Symbol (!@#$…)" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> Password Strength Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="flex gap-2">
              <Input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Type a password to check its strength"
              />
              <Button variant="outline" size="icon" onClick={() => setShow((s) => !s)} aria-label="Toggle visibility">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {pw.length > 0 && (
            <>
              <div>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-muted-foreground">Strength</span>
                  <span className={LABEL_COLOR[score]}>{label}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${LABEL_COLOR[score].replace("text-", "bg-")}`}
                    style={{ width: `${(score / 4) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((it) => (
                  <div
                    key={it.key}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      checks[it.key] ? "bg-emerald-50 text-emerald-700" : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <span>{checks[it.key] ? "✓" : "○"}</span>
                    {it.text}
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Estimated entropy: <span className="font-semibold text-foreground">{entropy.toFixed(1)} bits</span>.
                Higher is harder to crack.
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Password Strength</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Strength is estimated from length and character variety (entropy in bits). A password
            with ≥ 60 bits of entropy is considered strong.
          </p>
          <p>Your password never leaves the browser — checking happens locally.</p>
        </CardContent>
      </Card>
    </div>
  );
}
