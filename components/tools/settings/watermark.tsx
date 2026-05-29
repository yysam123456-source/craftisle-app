"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { SettingsProps } from "./index";

export function WatermarkSettings({ params, onChange }: SettingsProps) {
  const text = (params.text as string) ?? "© Craftisle";
  const position = (params.position as string) ?? "bottom-right";
  const opacity = (params.opacity as number) ?? 0.5;
  const fontSize = (params.fontSize as number) ?? 32;
  const color = (params.color as string) ?? "#ffffff";

  return (
    <div className="space-y-4">
      <div>
        <Label>Watermark Text</Label>
        <Input
          value={text}
          onChange={(e) => onChange({ ...params, text: e.target.value })}
          placeholder="© Your Watermark"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Position</Label>
        <Select
          value={position}
          onValueChange={(v) => onChange({ ...params, position: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bottom-right">Bottom Right</SelectItem>
            <SelectItem value="bottom-left">Bottom Left</SelectItem>
            <SelectItem value="top-right">Top Right</SelectItem>
            <SelectItem value="top-left">Top Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Font Size ({fontSize}px)</Label>
        <Slider
          value={[fontSize]}
          min={12}
          max={120}
          step={2}
          onValueChange={([v]) => onChange({ ...params, fontSize: v })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Opacity ({Math.round(opacity * 100)}%)</Label>
        <Slider
          value={[opacity * 100]}
          min={5}
          max={100}
          step={5}
          onValueChange={([v]) => onChange({ ...params, opacity: v / 100 })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Color</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            type="color"
            value={color}
            onChange={(e) => onChange({ ...params, color: e.target.value })}
            className="h-9 w-14 cursor-pointer p-1"
          />
          <code className="text-xs text-muted-foreground">{color}</code>
        </div>
      </div>
    </div>
  );
}
