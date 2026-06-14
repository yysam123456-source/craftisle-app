import { useState } from "react";
import { ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const UNITS = [
  { value: "b", label: "Bytes (B)" },
  { value: "kb", label: "Kilobytes (KB)" },
  { value: "mb", label: "Megabytes (MB)" },
  { value: "gb", label: "Gigabytes (GB)" },
  { value: "tb", label: "Terabytes (TB)" },
  { value: "pb", label: "Petabytes (PB)" },
];

const UNIT_MAP: Record<string, number> = {
  b: 1,
  kb: 1024,
  mb: 1024 ** 2,
  gb: 1024 ** 3,
  tb: 1024 ** 4,
  pb: 1024 ** 5,
};

function convertByte(value: number, fromUnit: string, toUnit: string, precision: number): number {
  if (precision < 0 || value < 0) return 0;
  const bytes = value * (UNIT_MAP[fromUnit] || 1);
  const result = bytes / (UNIT_MAP[toUnit] || 1);
  return Number(result.toFixed(precision));
}

export default function ByteConverterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [fromUnit, setFromUnit] = useState("mb");
  const [toUnit, setToUnit] = useState("gb");
  const [precision, setPrecision] = useState(4);

  const handleConvert = () => {
    if (!input) { toast.warning("Enter a number to convert"); return; }
    const num = parseFloat(input);
    if (isNaN(num)) { toast.warning("Enter a valid number"); return; }
    const result = convertByte(num, fromUnit, toUnit, precision);
    setOutput(String(result));
    toast.success("Converted");
  };

  const copyToClipboard = async () => {
    if (!output) { toast.warning("Nothing to copy"); return; }
    try { await navigator.clipboard.writeText(output); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearAll = () => { setInput(""); setOutput(""); };
  const swapInputOutput = () => { setInput(output); setOutput(""); };

  const examples = [
    { from: 1024, fromU: "mb", toU: "gb", label: "1024 MB → GB" },
    { from: 1, fromU: "tb", toU: "gb", label: "1 TB → GB" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="text-sm">From:</Label>
          <Select value={fromUnit} onValueChange={setFromUnit}>
            <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">To:</Label>
          <Select value={toUnit} onValueChange={setToUnit}>
            <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Precision:</Label>
          <Input type="number" value={precision} onChange={e => setPrecision(Math.max(0, parseInt(e.target.value) || 0))} className="w-16 h-8 text-center" min={0} />
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2"><ArrowRightLeft className="h-4 w-4" />Convert</Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2"><ArrowRightLeft className="h-4 w-4 rotate-90" /></Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3"><CardTitle className="text-base font-medium">Input Value</CardTitle></CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter a number..." className="h-12 text-lg font-mono" type="number" />
              <div className="mt-3 flex flex-wrap gap-2">
                {examples.map((ex, i) => (
                  <Button key={i} variant="outline" size="sm" onClick={() => { setInput(String(ex.from)); setFromUnit(ex.fromU); setToUnit(ex.toU); }}>{ex.label}</Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">Converted Result ({UNITS.find(u => u.value === toUnit)?.label})</CardTitle>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy</Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75 flex items-center justify-center">
              <div className="text-3xl font-bold font-mono text-primary">{output || "—"}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><span className="text-xl">💡</span>Usage</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Convert between Bytes, KB, MB, GB, TB, PB</li>
                <li>Uses binary (1024) conversion: 1 KB = 1024 B</li>
                <li>Supports multi-line input (one number per line)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Set precision (decimal places) for the output</li>
                <li>Common conversions: 1024 MB = 1 GB, 1 TB = 1024 GB</li>
                <li>Click Swap to convert back</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
