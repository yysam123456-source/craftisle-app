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

export function ResizeSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Width (px)</Label>
          <Input
            type="number"
            placeholder="Auto"
            value={(params.width as string) ?? ""}
            onChange={(e) =>
              onChange({
                ...params,
                width: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Height (px)</Label>
          <Input
            type="number"
            placeholder="Auto"
            value={(params.height as string) ?? ""}
            onChange={(e) =>
              onChange({
                ...params,
                height: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Fit</Label>
        <Select
          value={(params.fit as string) || "inside"}
          onValueChange={(v) => onChange({ ...params, fit: v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="inside">Inside (fit within)</SelectItem>
            <SelectItem value="cover">Cover (fill)</SelectItem>
            <SelectItem value="fill">Fill (stretch)</SelectItem>
            <SelectItem value="outside">Outside (at least)</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
