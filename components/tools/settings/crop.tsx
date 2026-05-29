"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function CropSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Enter crop coordinates in pixels.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">X (left)</Label>
          <Input
            type="number"
            placeholder="0"
            value={(params.x as string) ?? ""}
            onChange={(e) =>
              onChange({ ...params, x: e.target.value ? Number(e.target.value) : 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Y (top)</Label>
          <Input
            type="number"
            placeholder="0"
            value={(params.y as string) ?? ""}
            onChange={(e) =>
              onChange({ ...params, y: e.target.value ? Number(e.target.value) : 0 })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Width</Label>
          <Input
            type="number"
            placeholder="100"
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
          <Label className="text-xs">Height</Label>
          <Input
            type="number"
            placeholder="100"
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
    </div>
  );
}
