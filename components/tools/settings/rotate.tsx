"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  params: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
}

export function RotateSettings({ params, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Angle (degrees)</Label>
        <Input
          type="number"
          placeholder="90"
          value={(params.angle as string) ?? ""}
          onChange={(e) =>
            onChange({
              ...params,
              angle: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          Common: 90, 180, 270, -90
        </p>
      </div>
    </div>
  );
}
