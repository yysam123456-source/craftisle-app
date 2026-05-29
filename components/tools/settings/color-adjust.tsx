"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { SettingsProps } from "./index";

export function ColorAdjustSettings({ params, onChange }: SettingsProps) {
  const brightness = (params.brightness as number) ?? 1;
  const saturation = (params.saturation as number) ?? 1;
  const hue = (params.hue as number) ?? 0;
  const contrast = (params.contrast as number) ?? 1;

  return (
    <div className="space-y-5">
      <div>
        <Label>Brightness ({brightness.toFixed(1)}x)</Label>
        <Slider
          value={[brightness * 100]}
          min={0}
          max={300}
          step={5}
          onValueChange={([v]) => onChange({ ...params, brightness: v / 100 })}
          className="mt-1.5"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Dark</span>
          <span>Normal</span>
          <span>Bright</span>
        </div>
      </div>

      <div>
        <Label>Saturation ({saturation.toFixed(1)}x)</Label>
        <Slider
          value={[saturation * 100]}
          min={0}
          max={300}
          step={5}
          onValueChange={([v]) => onChange({ ...params, saturation: v / 100 })}
          className="mt-1.5"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>B/W</span>
          <span>Normal</span>
          <span>Vivid</span>
        </div>
      </div>

      <div>
        <Label>Hue Rotation ({hue}°)</Label>
        <Slider
          value={[hue]}
          min={-180}
          max={180}
          step={5}
          onValueChange={([v]) => onChange({ ...params, hue: v })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Contrast ({contrast.toFixed(1)}x)</Label>
        <Slider
          value={[contrast * 100]}
          min={0}
          max={300}
          step={5}
          onValueChange={([v]) => onChange({ ...params, contrast: v / 100 })}
          className="mt-1.5"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>Flat</span>
          <span>Normal</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}
