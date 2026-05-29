"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function BorderSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Size (px)</Label>
        <Input
          type="number"
          placeholder="10"
          value={(params.size as string) ?? "10"}
          onChange={(e) =>
            onChange({
              ...params,
              size: Number(e.target.value) || 0,
            })
          }
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(params.color as string) || "#000000"}
            onChange={(e) => onChange({ ...params, color: e.target.value })}
            className="h-9 w-9 cursor-pointer rounded border"
          />
          <Input
            value={(params.color as string) || "#000000"}
            onChange={(e) => onChange({ ...params, color: e.target.value })}
            className="h-9 font-mono text-xs"
            placeholder="#000000"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Side</Label>
        <Select
          value={(params.side as string) || "all"}
          onValueChange={(v) => onChange({ ...params, side: v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sides</SelectItem>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
