"use client";

import { useState } from "react";
import { Network, Search, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function IpCalcPage() {
  const [ip, setIp] = useState("192.168.1.1");
  const [mask, setMask] = useState("24");
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    try {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4 || parts.some(p => p < 0 || p > 255 || isNaN(p))) {
        toast.error("Invalid IP address");
        return;
      }

      const maskNum = parseInt(mask);
      if (isNaN(maskNum) || maskNum < 0 || maskNum > 32) {
        toast.error("Invalid mask bits (0-32)");
        return;
      }

      // Convert IP to 32-bit number
      const ipInt = (parts[0] << 24) >>> 0 | (parts[1] << 16) >>> 0 | (parts[2] << 8) >>> 0 | parts[3] >>> 0;
      
      // Calculate Mask
      const maskInt = maskNum === 0 ? 0 : (~0 << (32 - maskNum)) >>> 0;
      
      // Network & Broadcast
      const netInt = (ipInt & maskInt) >>> 0;
      const broadInt = (netInt | ~maskInt) >>> 0;
      
      const intToIp = (i: number) => [
        (i >>> 24) & 0xFF,
        (i >>> 16) & 0xFF,
        (i >>> 8) & 0xFF,
        i & 0xFF
      ].join('.');

      setResult({
        address: ip,
        netmask: intToIp(maskInt),
        wildcard: intToIp(~maskInt >>> 0),
        network: intToIp(netInt),
        broadcast: intToIp(broadInt),
        hostMin: intToIp(netInt + 1),
        hostMax: intToIp(broadInt - 1),
        hosts: maskNum >= 31 ? 0 : Math.pow(2, 32 - maskNum) - 2,
        cidr: `/${maskNum}`
      });
      
    } catch {
      toast.error("Calculation error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 shadow-lg">
          <Network className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IP Calculator</h1>
          <p className="text-muted-foreground">Subnet Mask, Network Address & Host Range Calculator</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Network Config</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="e.g. 192.168.1.1" />
            </div>
            <div className="space-y-2">
              <Label>Mask Bits (CIDR)</Label>
              <Input value={mask} onChange={(e) => setMask(e.target.value)} placeholder="e.g. 24" type="number" />
            </div>
            <Button onClick={calculate} className="w-full gap-2 mt-2">
              <Calculator className="h-4 w-4" />
              Calculate
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">CalculateResult</CardTitle>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                 <Search className="h-12 w-12 mb-2 opacity-20" />
                 <p>Enter config and click Calculate</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                 <ResultItem label="Network Address" value={result.network} cidr={result.cidr} />
                 <ResultItem label="Broadcast Address" value={result.broadcast} />
                 <ResultItem label="Subnet Mask" value={result.netmask} />
                 <ResultItem label="Wildcard Mask" value={result.wildcard} />
                 <ResultItem label="Min Host" value={result.hostMin} />
                 <ResultItem label="Max Host" value={result.hostMax} />
                 <ResultItem label="Available Hosts" value={result.hosts.toLocaleString()} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ResultItem({ label, value, cidr }: { label: string; value: string; cidr?: string }) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-lg font-semibold">{value}</span>
        {cidr && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{cidr}</span>}
      </div>
    <ToolDetailSections toolId="ip-calc" />
    </div>
  );
}
