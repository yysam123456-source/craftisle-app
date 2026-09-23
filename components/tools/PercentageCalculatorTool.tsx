import { useState } from "react";
import { Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Mode = "of" | "isWhat" | "change" | "increase";

const MODES: { key: Mode; label: string }[] = [
  { key: "of", label: "What is X% of Y?" },
  { key: "isWhat", label: "X is what % of Y?" },
  { key: "change", label: "% change from X to Y" },
  { key: "increase", label: "Increase/decrease X by Y%" },
];

export default function PercentageCalculatorTool() {
  const [mode, setMode] = useState<Mode>("of");
  const [a, setA] = useState("25");
  const [b, setB] = useState("200");

  const x = parseFloat(a);
  const y = parseFloat(b);

  let result = "—";
  let formula = "";

  if (!isNaN(x) && !isNaN(y)) {
    if (mode === "of") {
      result = `${(x / 100) * y}`;
      formula = "X% × Y";
    } else if (mode === "isWhat") {
      result = y === 0 ? "—" : `${(x / y) * 100}%`;
      formula = "(X / Y) × 100";
    } else if (mode === "change") {
      result = x === 0 ? "—" : `${((y - x) / Math.abs(x)) * 100}%`;
      formula = "((Y − X) / |X|) × 100";
    } else {
      result = `${x * (1 + y / 100)}`;
      formula = "X × (1 + Y/100)";
    }
  }

  const labels: Record<Mode, [string, string]> = {
    of: ["Percentage (%)", "Of value"],
    isWhat: ["Value X", "Total Y"],
    change: ["Original X", "New Y"],
    increase: ["Base value X", "Change % (Y)"],
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" /> Percentage Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  mode === m.key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{labels[mode][0]}</Label>
              <Input type="number" value={a} onChange={(e) => setA(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{labels[mode][1]}</Label>
              <Input type="number" value={b} onChange={(e) => setB(e.target.value)} />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-6 text-center">
            <div className="font-mono text-3xl font-bold break-all">{result}</div>
            {formula && <div className="mt-1 text-sm text-muted-foreground">{formula}</div>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Percentage Math</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Percentage change uses the absolute value of the original, so a drop from 200 to 150 is a
            −25% change.
          </p>
          <p>All calculations run locally in your browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
