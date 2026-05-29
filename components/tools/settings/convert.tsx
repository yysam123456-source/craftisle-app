"use client";

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

export function ConvertSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">Target Format</Label>
      <Select
        value={(params.format as string) || "webp"}
        onValueChange={(v) => onChange({ ...params, format: v })}
      >
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="jpeg">JPEG</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="webp">WebP</SelectItem>
          <SelectItem value="avif">AVIF</SelectItem>
          <SelectItem value="tiff">TIFF</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
