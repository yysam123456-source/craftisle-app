import { useState } from "react";
import { Palette, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Stop {
  color: string;
  position: number;
}

export default function GradientGeneratorTool() {
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(90);
  const [stops, setStops] = useState<Stop[]>([
    { color: "#3b82f6", position: 0 },
    { color: "#8b5cf6", position: 100 },
  ]);

  const stopStr = stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => `${s.color} ${s.position}%`)
    .join(", ");

  const css =
    type === "linear"
      ? `background: linear-gradient(${angle}deg, ${stopStr});`
      : `background: radial-gradient(circle, ${stopStr});`;

  const updateStop = (i: number, patch: Partial<Stop>) =>
    setStops((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(css);
      toast.success("CSS copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="h-56 w-full rounded-xl border shadow-inner"
        style={{ background: css.replace(/^background:\s*/, "").replace(/;$/, "") }}
        aria-label="Gradient preview"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" /> Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {type === "linear" && (
                <div className="space-y-2">
                  <Label>Angle: {angle}°</Label>
                  <Input
                    type="range"
                    min={0}
                    max={360}
                    value={angle}
                    onChange={(e) => setAngle(parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Color stops</Label>
              {stops.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => updateStop(i, { color: e.target.value })}
                    className="h-9 w-12 cursor-pointer rounded border"
                    aria-label={`Color stop ${i + 1}`}
                  />
                  <Input
                    className="w-28 font-mono text-sm"
                    value={s.color}
                    onChange={(e) => updateStop(i, { color: e.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={s.position}
                    onChange={(e) => updateStop(i, { position: parseInt(e.target.value) || 0 })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setStops((x) => x.filter((_, idx) => idx !== i))}
                    disabled={stops.length <= 2}
                    aria-label="Remove stop"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStops((s) => [...s, { color: "#22c55e", position: 50 }])}
              >
                <Plus className="h-4 w-4 mr-2" /> Add stop
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">CSS</CardTitle>
            <Button variant="ghost" size="sm" onClick={copy}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea readOnly className="min-h-32 font-mono text-sm resize-y" value={css} />
            <p className="mt-3 text-sm text-muted-foreground">
              Paste into any element's style. Generated locally — nothing uploaded.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
