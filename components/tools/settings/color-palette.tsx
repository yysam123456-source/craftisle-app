"use client";

import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface Props {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function ColorPaletteSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Number of colors</Label>
        <span className="text-xs font-mono text-muted-foreground">
          {(params.count as number) ?? 5}
        </span>
      </div>
      <Slider
        min={2}
        max={12}
        step={1}
        value={[(params.count as number) ?? 5]}
        onValueChange={([v]) => onChange({ ...params, count: v })}
      />
    </div>
  );
}
