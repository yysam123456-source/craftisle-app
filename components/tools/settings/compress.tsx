"use client";

import { Slider } from "@/components/ui/slider";
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

export function CompressSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Quality</Label>
          <span className="text-xs font-mono text-muted-foreground">
            {(params.quality as number) ?? 80}
          </span>
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={[(params.quality as number) ?? 80]}
          onValueChange={([v]) => onChange({ ...params, quality: v })}
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Output Format</Label>
        <Select
          value={(params.format as string) || ""}
          onValueChange={(v) => onChange({ ...params, format: v || undefined })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Keep original" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Keep original</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="avif">AVIF</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
