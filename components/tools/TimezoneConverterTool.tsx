import { useMemo, useState } from "react";
import { Clock, ArrowRightLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Africa/Cairo",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

/** Offset (ms) of a timezone at a given instant. */
function tzOffset(instantMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(new Date(instantMs))) parts[p.type] = p.value;
  const asUTC = Date.UTC(
    +parts.year,
    +parts.month - 1,
    +parts.day,
    +parts.hour % 24,
    +parts.minute,
    +parts.second
  );
  return asUTC - instantMs;
}

/** Convert a wall-clock time in `tz` to the corresponding UTC instant. */
function wallToInstant(wall: string, tz: string): Date | null {
  const m = wall.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, 0);
  let inst = guess;
  for (let i = 0; i < 2; i++) inst = guess - tzOffset(inst, tz);
  return new Date(inst);
}

function localNowValue(): string {
  const n = new Date();
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}T${pad(n.getHours())}:${pad(n.getMinutes())}`;
}

function offsetLabel(tz: string, instantMs: number): string {
  const off = tzOffset(instantMs, tz) / 60000;
  const sign = off >= 0 ? "+" : "-";
  const abs = Math.abs(off);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export default function TimezoneConverterTool() {
  const [wall, setWall] = useState(localNowValue());
  const [from, setFrom] = useState("UTC");
  const [to, setTo] = useState("Asia/Shanghai");

  const instant = useMemo(() => wallToInstant(wall, from), [wall, from]);

  const formatted = instant
    ? new Intl.DateTimeFormat("en-GB", {
        timeZone: to,
        dateStyle: "full",
        timeStyle: "short",
        hour12: false,
      }).format(instant)
    : "—";

  const fromOffset = instant ? offsetLabel(from, instant.getTime()) : "";
  const toOffset = instant ? offsetLabel(to, instant.getTime()) : "";
  const utcIso = instant ? instant.toISOString().replace(".000Z", "Z") : "";

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Timezone Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Date &amp; time</Label>
              <Input type="datetime-local" value={wall} onChange={(e) => setWall(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>From timezone</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To timezone</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZONES.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-6 text-center">
            <div className="text-xl font-semibold">{formatted}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {from} ({fromOffset}) → {to} ({toOffset})
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              UTC: <span className="font-mono">{utcIso}</span>
            </div>
            <button
              onClick={() => {
                setFrom(to);
                setTo(from);
              }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <ArrowRightLeft className="h-4 w-4" /> Swap
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About Timezone Conversion</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Uses your browser's IANA timezone database, so daylight-saving transitions are handled
            correctly.
          </p>
          <p>Conversion runs entirely locally.</p>
        </CardContent>
      </Card>
    </div>
  );
}
