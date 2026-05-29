"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { SettingsProps } from "./index";

const PRESETS = [
  { value: "1inch", label: "1-inch (25×35mm) — 295×413px" },
  { value: "2inch", label: "2-inch (35×49mm) — 413×579px" },
  { value: "us-visa", label: "US Visa (51×51mm) — 600×600px" },
  { value: "eu-passport", label: "EU Passport (35×45mm) — 413×531px" },
  { value: "custom", label: "Custom size" },
];

export function PassportPhotoSettings({ params, onChange }: SettingsProps) {
  const preset = (params.preset as string) ?? "1inch";
  const width = (params.width as number) || "";
  const height = (params.height as number) || "";

  return (
    <div className="space-y-4">
      <div>
        <Label>Photo Size</Label>
        <Select
          value={preset}
          onValueChange={(v) => onChange({ ...params, preset: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Width (px)</Label>
            <Input
              type="number"
              value={width}
              onChange={(e) =>
                onChange({ ...params, width: Number(e.target.value) || "" })
              }
              placeholder="295"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={height}
              onChange={(e) =>
                onChange({ ...params, height: Number(e.target.value) || "" })
              }
              placeholder="413"
              className="mt-1.5"
            />
          </div>
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        Output: JPEG at 95% quality with white background. For best results,
        use a well-lit photo with a plain background.
      </div>
    </div>
  );
}
