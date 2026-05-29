"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { SettingsProps } from "./index";

export function BeautifySettings({ params, onChange }: SettingsProps) {
  const padding = (params.padding as number) ?? 40;
  const borderRadius = (params.borderRadius as number) ?? 12;
  const shadow = (params.shadow as boolean) ?? true;
  const border = (params.border as boolean) ?? true;
  const borderColor = (params.borderColor as string) ?? "#e5e7eb";
  const borderWidth = (params.borderWidth as number) ?? 1;
  const bgColor = (params.bgColor as string) ?? "#ffffff";

  return (
    <div className="space-y-5">
      <div>
        <Label>Padding ({padding}px)</Label>
        <Slider
          value={[padding]}
          min={0}
          max={120}
          step={4}
          onValueChange={([v]) => onChange({ ...params, padding: v })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Border Radius ({borderRadius}px)</Label>
        <Slider
          value={[borderRadius]}
          min={0}
          max={48}
          step={2}
          onValueChange={([v]) => onChange({ ...params, borderRadius: v })}
          className="mt-1.5"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Shadow</Label>
          <p className="text-xs text-muted-foreground">
            Drop shadow behind the screenshot
          </p>
        </div>
        <Switch
          checked={shadow}
          onCheckedChange={(v) => onChange({ ...params, shadow: v })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Border</Label>
          <p className="text-xs text-muted-foreground">
            Thin border around the image
          </p>
        </div>
        <Switch
          checked={border}
          onCheckedChange={(v) => onChange({ ...params, border: v })}
        />
      </div>

      {border && (
        <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
          <div>
            <Label>Border Width ({borderWidth}px)</Label>
            <Slider
              value={[borderWidth]}
              min={1}
              max={8}
              step={1}
              onValueChange={([v]) =>
                onChange({ ...params, borderWidth: v })
              }
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Border Color</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                type="color"
                value={borderColor}
                onChange={(e) =>
                  onChange({ ...params, borderColor: e.target.value })
                }
                className="h-9 w-14 cursor-pointer p-1"
              />
              <code className="text-xs text-muted-foreground">{borderColor}</code>
            </div>
          </div>
        </div>
      )}

      <div>
        <Label>Background Color</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            type="color"
            value={bgColor}
            onChange={(e) => onChange({ ...params, bgColor: e.target.value })}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <code className="text-xs text-muted-foreground">{bgColor}</code>
        </div>
      </div>
    </div>
  );
}
