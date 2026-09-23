import { useState } from "react";
import { Contrast } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function hexToRgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

function Row({ label, pass }: { label: string; pass: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={pass ? "font-semibold text-emerald-600" : "font-semibold text-red-500"}>
        {pass ? "PASS" : "FAIL"}
      </span>
    </div>
  );
}

export default function ColorContrastTool() {
  const [fg, setFg] = useState("#1f2937");
  const [bg, setBg] = useState("#ffffff");

  const fgRgb = hexToRgb(fg);
  const bgRgb = hexToRgb(bg);
  const ratio = fgRgb && bgRgb ? contrastRatio(fgRgb, bgRgb) : 0;
  const r2 = Math.round(ratio * 100) / 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contrast className="h-5 w-5" /> Colors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Text color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border"
                    aria-label="Text color"
                  />
                  <Input value={fg} onChange={(e) => setFg(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Background color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border"
                    aria-label="Background color"
                  />
                  <Input value={bg} onChange={(e) => setBg(e.target.value)} />
                </div>
              </div>
            </div>

            <div
              className="rounded-lg border p-6 text-center"
              style={{ color: fg, backgroundColor: bg }}
            >
              <div className="text-2xl font-bold">Large text sample</div>
              <div className="mt-2 text-base">Normal body text sample for contrast preview.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">WCAG Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <div className="font-mono text-3xl font-bold">{r2.toFixed(2)}:1</div>
              <div className="text-sm text-muted-foreground">Contrast ratio</div>
            </div>
            <Row label="AA — Normal text (≥ 4.5)" pass={ratio >= 4.5} />
            <Row label="AA — Large text (≥ 3.0)" pass={ratio >= 3} />
            <Row label="AAA — Normal text (≥ 7.0)" pass={ratio >= 7} />
            <Row label="AAA — Large text (≥ 4.5)" pass={ratio >= 4.5} />
            {!fgRgb || !bgRgb ? (
              <p className="text-sm text-red-500">Enter valid hex colors (e.g. #1f2937).</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Contrast Checking</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Computes the WCAG 2.x contrast ratio from relative luminance. AA needs 4.5:1 for normal
            text and 3:1 for large text (≥ 18.66px bold or 24px).
          </p>
          <p>All calculation happens locally in your browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
