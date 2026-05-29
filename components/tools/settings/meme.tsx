"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { SettingsProps } from "./index";

export function MemeSettings({ params, onChange }: SettingsProps) {
  const topText = (params.topText as string) ?? "";
  const bottomText = (params.bottomText as string) ?? "";
  const fontSize = (params.fontSize as number) ?? 48;
  const fontColor = (params.fontColor as string) ?? "#ffffff";
  const strokeColor = (params.strokeColor as string) ?? "#000000";

  return (
    <div className="space-y-4">
      <div>
        <Label>Top Text</Label>
        <Input
          value={topText}
          onChange={(e) => onChange({ ...params, topText: e.target.value })}
          placeholder="WHEN YOU FINALLY"
          className="mt-1.5 font-bold uppercase tracking-wide"
        />
      </div>

      <div>
        <Label>Bottom Text</Label>
        <Input
          value={bottomText}
          onChange={(e) => onChange({ ...params, bottomText: e.target.value })}
          placeholder="SHIP THE FEATURE"
          className="mt-1.5 font-bold uppercase tracking-wide"
        />
      </div>

      <div>
        <Label>Font Size ({fontSize}px)</Label>
        <Slider
          value={[fontSize]}
          min={16}
          max={120}
          step={2}
          onValueChange={([v]) => onChange({ ...params, fontSize: v })}
          className="mt-1.5"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Text Color</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              type="color"
              value={fontColor}
              onChange={(e) =>
                onChange({ ...params, fontColor: e.target.value })
              }
              className="h-9 w-14 cursor-pointer p-1"
            />
            <code className="text-xs text-muted-foreground">{fontColor}</code>
          </div>
        </div>
        <div>
          <Label>Outline Color</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              type="color"
              value={strokeColor}
              onChange={(e) =>
                onChange({ ...params, strokeColor: e.target.value })
              }
              className="h-9 w-14 cursor-pointer p-1"
            />
            <code className="text-xs text-muted-foreground">{strokeColor}</code>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        Uses Impact-style font with outline stroke. Text auto-wraps to fit the
        image width.
      </div>
    </div>
  );
}
