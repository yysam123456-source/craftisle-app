import { useState } from "react";
import { Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const PORT_RANGES = [
  { value: "well-known", label: "Well-Known (1-1023)", min: 1, max: 1023 },
  { value: "registered", label: "Registered (1024-49151)", min: 1024, max: 49151 },
  { value: "dynamic", label: "Dynamic/Private (49152-65535)", min: 49152, max: 65535 },
  { value: "custom", label: "Custom Range", min: 1, max: 65535 },
];

const COMMON_PORTS = [20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3306, 5432, 6379, 8080];
const PORT_SERVICES: Record<number, string> = {
  20: "FTP Data", 21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
  53: "DNS", 80: "HTTP", 110: "POP3", 143: "IMAP", 443: "HTTPS",
  993: "IMAPS", 995: "POP3S", 3306: "MySQL", 5432: "PostgreSQL",
  6379: "Redis", 8080: "HTTP Alt",
};

function generateRandomPort(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePorts(count: number, min: number, max: number, allowDup: boolean, sort: boolean): number[] {
  if (count <= 0 || min >= max) return [];
  if (!allowDup && count > max - min + 1) return [];

  const ports: number[] = [];
  if (allowDup) {
    for (let i = 0; i < count; i++) {
      ports.push(generateRandomPort(min, max));
    }
  } else {
    const available = new Set<number>();
    for (let i = min; i <= max; i++) available.add(i);
    const arr = Array.from(available);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    for (let i = 0; i < Math.min(count, arr.length); i++) ports.push(arr[i]);
  }

  return sort ? ports.sort((a, b) => a - b) : ports;
}

export default function RandomPortGeneratorTool() {
  const [count, setCount] = useState(5);
  const [rangeType, setRangeType] = useState("registered");
  const [minPort, setMinPort] = useState(1024);
  const [maxPort, setMaxPort] = useState(49151);
  const [allowDup, setAllowDup] = useState(true);
  const [sortResults, setSortResults] = useState(true);
  const [ports, setPorts] = useState<number[]>([]);

  const selectedRange = PORT_RANGES.find(r => r.value === rangeType);
  const actualMin = rangeType === "custom" ? minPort : (selectedRange?.min ?? 1);
  const actualMax = rangeType === "custom" ? maxPort : (selectedRange?.max ?? 65535);

  const handleGenerate = () => {
    if (count < 1 || count > 1000) { toast.warning("Count must be 1-1000"); return; }
    if (actualMin >= actualMax) { toast.warning("Min must be less than max"); return; }
    const result = generatePorts(count, actualMin, actualMax, allowDup, sortResults);
    setPorts(result);
    toast.success(`Generated ${result.length} ports`);
  };

  const copyToClipboard = async () => {
    if (ports.length === 0) { toast.warning("No ports to copy"); return; }
    try { await navigator.clipboard.writeText(ports.join("\n")); toast.success("Copied"); } catch { toast.error("Copy failed"); }
  };

  const clearAll = () => { setPorts([]); };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Count:</Label>
          <Input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))} className="w-20 h-8 text-center" min={1} max={1000} />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Range:</Label>
          <Select value={rangeType} onValueChange={setRangeType}>
            <SelectTrigger className="w-64 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PORT_RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {rangeType === "custom" && (
          <>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Min:</Label>
              <Input type="number" value={minPort} onChange={e => setMinPort(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} max={65535} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Max:</Label>
              <Input type="number" value={maxPort} onChange={e => setMaxPort(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 h-8 text-center" min={1} max={65535} />
            </div>
          </>
        )}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={allowDup} onCheckedChange={v => setAllowDup(!!v)} />
            Allow duplicates
          </label>
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <Checkbox checked={sortResults} onCheckedChange={v => setSortResults(!!v)} />
            Sort results
          </label>
        </div>
        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleGenerate} className="gap-2">Generate Ports</Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive"><Eraser className="h-4 w-4" />Clear</Button>
        </div>
      </div>

      {ports.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Generated Ports ({ports.length})</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={copyToClipboard}><Copy className="h-3 w-3" />Copy All</Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {ports.map((port, i) => (
                <div key={i} className="flex items-center gap-1 p-2 bg-muted/50 rounded-md font-mono text-sm">
                  <span className="font-semibold">{port}</span>
                  {COMMON_PORTS.includes(port) && (
                    <span className="text-xs text-muted-foreground">{PORT_SERVICES[port]}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Range: {actualMin} - {actualMax} | {allowDup ? "Duplicates allowed" : "Unique only"} | {sortResults ? "Sorted" : "Random order"}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><span className="text-xl">💡</span>Usage</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Generate random network port numbers for testing and configuration</li>
                <li>Well-Known ports (1-1023): System services (HTTP 80, SSH 22)</li>
                <li>Registered ports (1024-49151): Application ports</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Dynamic ports (49152-65535): Temporary/private use</li>
                <li>Common ports are highlighted with their service names</li>
                <li>Up to 1000 ports can be generated at once</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
