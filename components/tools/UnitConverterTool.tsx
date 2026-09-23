import { useState } from "react";
import { Ruler, ArrowRightLeft } from "lucide-react";
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

type Unit = { label: string; factor: number }; // factor = value of 1 unit in base unit

const CATEGORIES: Record<string, { units: Record<string, Unit>; temp?: boolean }> = {
  Length: {
    units: {
      Meter: { label: "Meter (m)", factor: 1 },
      Kilometer: { label: "Kilometer (km)", factor: 1000 },
      Centimeter: { label: "Centimeter (cm)", factor: 0.01 },
      Millimeter: { label: "Millimeter (mm)", factor: 0.001 },
      Mile: { label: "Mile (mi)", factor: 1609.344 },
      Yard: { label: "Yard (yd)", factor: 0.9144 },
      Foot: { label: "Foot (ft)", factor: 0.3048 },
      Inch: { label: "Inch (in)", factor: 0.0254 },
      "Nautical mile": { label: "Nautical mile (nmi)", factor: 1852 },
    },
  },
  Mass: {
    units: {
      Kilogram: { label: "Kilogram (kg)", factor: 1 },
      Gram: { label: "Gram (g)", factor: 0.001 },
      Milligram: { label: "Milligram (mg)", factor: 1e-6 },
      Tonne: { label: "Tonne (t)", factor: 1000 },
      Pound: { label: "Pound (lb)", factor: 0.45359237 },
      Ounce: { label: "Ounce (oz)", factor: 0.028349523125 },
      Stone: { label: "Stone (st)", factor: 6.35029318 },
    },
  },
  Temperature: {
    temp: true,
    units: {
      Celsius: { label: "Celsius (°C)", factor: 1 },
      Fahrenheit: { label: "Fahrenheit (°F)", factor: 1 },
      Kelvin: { label: "Kelvin (K)", factor: 1 },
    },
  },
  Area: {
    units: {
      "Square meter": { label: "Square meter (m²)", factor: 1 },
      "Square kilometer": { label: "Square kilometer (km²)", factor: 1e6 },
      Hectare: { label: "Hectare (ha)", factor: 10000 },
      "Square foot": { label: "Square foot (ft²)", factor: 0.09290304 },
      "Square inch": { label: "Square inch (in²)", factor: 0.00064516 },
      Acre: { label: "Acre", factor: 4046.8564224 },
    },
  },
  Volume: {
    units: {
      Liter: { label: "Liter (L)", factor: 1 },
      Milliliter: { label: "Milliliter (mL)", factor: 0.001 },
      "Cubic meter": { label: "Cubic meter (m³)", factor: 1000 },
      "US gallon": { label: "US gallon (gal)", factor: 3.785411784 },
      "US quart": { label: "US quart (qt)", factor: 0.946352946 },
      "US cup": { label: "US cup", factor: 0.2365882365 },
      "Fluid ounce": { label: "US fluid ounce (fl oz)", factor: 0.0295735295625 },
    },
  },
  Speed: {
    units: {
      "Meter/second": { label: "Meter/second (m/s)", factor: 1 },
      "Kilometer/hour": { label: "Kilometer/hour (km/h)", factor: 0.2777777778 },
      "Mile/hour": { label: "Mile/hour (mph)", factor: 0.44704 },
      Knot: { label: "Knot (kn)", factor: 0.5144444444 },
      "Foot/second": { label: "Foot/second (ft/s)", factor: 0.3048 },
    },
  },
  Data: {
    units: {
      Byte: { label: "Byte (B)", factor: 1 },
      Kilobyte: { label: "Kilobyte (KB)", factor: 1024 },
      Megabyte: { label: "Megabyte (MB)", factor: 1024 ** 2 },
      Gigabyte: { label: "Gigabyte (GB)", factor: 1024 ** 3 },
      Terabyte: { label: "Terabyte (TB)", factor: 1024 ** 4 },
      Bit: { label: "Bit (b)", factor: 0.125 },
    },
  },
};

function toCelsius(value: number, unit: string): number {
  if (unit === "Celsius") return value;
  if (unit === "Fahrenheit") return (value - 32) / 1.8;
  return value - 273.15;
}
function fromCelsius(c: number, unit: string): number {
  if (unit === "Celsius") return c;
  if (unit === "Fahrenheit") return c * 1.8 + 32;
  return c + 273.15;
}

export default function UnitConverterTool() {
  const [category, setCategory] = useState("Length");
  const [from, setFrom] = useState("Meter");
  const [to, setTo] = useState("Foot");
  const [value, setValue] = useState("1");

  const num = parseFloat(value);
  const cat = CATEGORIES[category];

  let result = "";
  if (!isNaN(num)) {
    if (cat.temp) {
      result = fromCelsius(toCelsius(num, from), to).toFixed(4).replace(/\.?0+$/, "");
    } else {
      const base = num * cat.units[from].factor;
      const out = base / cat.units[to].factor;
      result = Number.isFinite(out) ? out.toPrecision(10).replace(/\.?0+$/, "") : "";
    }
  }

  const switchCategory = (c: string) => {
    setCategory(c);
    const keys = Object.keys(CATEGORIES[c].units);
    setFrom(keys[0]);
    setTo(keys[1] ?? keys[0]);
    setValue("1");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" /> Unit Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORIES).map((c) => (
              <button
                key={c}
                onClick={() => switchCategory(c)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  category === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="space-y-2">
              <Label>From</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter value"
              />
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cat.units).map(([k, u]) => (
                    <SelectItem key={k} value={k}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center pb-10">
              <button
                onClick={() => {
                  setFrom(to);
                  setTo(from);
                }}
                className="rounded-full border p-2 hover:bg-muted"
                aria-label="Swap units"
              >
                <ArrowRightLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 font-mono text-lg">
                {result || "—"}
              </div>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cat.units).map(([k, u]) => (
                    <SelectItem key={k} value={k}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About This Converter</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Converts between units of length, mass, temperature, area, volume, speed, and digital
            data. Data units use binary multiples (1 KB = 1024 B).
          </p>
          <p>All conversion happens locally in your browser.</p>
        </CardContent>
      </Card>
    </div>
  );
}
