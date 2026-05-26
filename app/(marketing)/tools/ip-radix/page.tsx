"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Network, Copy } from "lucide-react";
import { toast } from "sonner";

// --- Helper Functions ---

// IPv4 (uses regular numbers, no BigInt needed)
const ipv4ToInt = (ip: string): number =>
  ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

const intToIpv4 = (int: number): string =>
  [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join('.');

// IPv6 (uses BigInt constructor instead of literals like 0n)
const ipv6ToBigInt = (ip: string): bigint => {
   let expanded = ip;
   if (expanded.includes('::')) {
       const parts = expanded.split('::');
       const left = parts[0] ? parts[0].split(':').filter(Boolean) : [];
       const right = parts[1] ? parts[1].split(':').filter(Boolean) : [];
       const missing = 8 - (left.length + right.length);
       expanded = [...left, ...Array(missing).fill('0'), ...right].join(':');
   }

   const parts = expanded.split(':');
   let result = BigInt(0);
   for (const part of parts) {
       result = (result << BigInt(16)) + BigInt(parseInt(part || '0', 16));
   }
   return result;
};

const bigIntToIpv6 = (int: bigint): string => {
    let parts: string[] = [];
    for (let i = 0; i < 8; i++) {
        parts.unshift((int & BigInt(0xffff)).toString(16));
        int >>= BigInt(16);
    }
    return parts.join(':').replace(/(^|:)0(:0)*:0(:|$)/, '::');
};

export default function IpRadixPage() {
  const [ip, setIp] = useState("192.168.1.1");
  const [type, setType] = useState<"IPv4" | "IPv6">("IPv4");

  const [decimal, setDecimal] = useState("");
  const [hex, setHex] = useState("");
  const [binary, setBinary] = useState("");

  const [errorV4, setErrorV4] = useState("");

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  useEffect(() => {
    if (!ip.trim()) return;

    try {
        let val: bigint | number;
        if (ip.includes(':')) {
            setType("IPv6");
            val = ipv6ToBigInt(ip);
        } else {
            setType("IPv4");
            if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
                val = ipv4ToInt(ip);
            } else if (/^\d+$/.test(ip)) {
                // Treat as decimal input — could be IPv4 or IPv6 decimal
                const n = Number(ip);
                if (n <= 0xffffffff) {
                    val = n;
                } else {
                    val = BigInt(ip);
                }
            } else {
                throw new Error("Invalid Format");
            }
        }

        setErrorV4("");
        const bi = typeof val === "number" ? BigInt(val) : val;
        setDecimal(bi.toString());
        setHex("0x" + bi.toString(16).toUpperCase());
        setBinary(bi.toString(2));

    } catch {
        setDecimal("---");
        setHex("---");
        setBinary("---");
        setErrorV4("Invalid IP address format");
    }
  }, [ip]);

  const displayStandard = () => {
    try {
      const d = BigInt(decimal || "0");
      return type === "IPv4" ? intToIpv4(Number(d & BigInt(0xffffffff))) : bigIntToIpv6(d);
    } catch {
      return "---";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg">
          <Network className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">IP Base Converter</h1>
          <p className="text-muted-foreground">Convert IPv4/IPv6 addresses to/from decimal, hex, binary</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Input IP Address</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label>IPv4, IPv6 or Decimal Integer</Label>
                    <div className="flex gap-2">
                         <Input
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            placeholder="e.g., 192.168.1.1 or 2001:db8::1"
                            className="font-mono text-lg"
                         />
                    </div>
                     {errorV4 && <p className="text-sm text-destructive">{errorV4}</p>}
                     <p className="text-xs text-muted-foreground">
                         Auto-detects IPv4 / IPv6 format. Supports reverse conversion from decimal integer.
                     </p>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Standard Format ({type})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="p-4 bg-muted/40 rounded-lg font-mono text-lg break-all flex justify-between items-start">
                    <span>{displayStandard()}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={() => copyToClipboard(displayStandard())}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Decimal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="p-4 bg-muted/40 rounded-lg font-mono text-lg break-all flex justify-between items-start">
                    <span>{decimal}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={() => copyToClipboard(decimal)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Hexadecimal (Hex)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="p-4 bg-muted/40 rounded-lg font-mono text-lg break-all flex justify-between items-start">
                    <span>{hex}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={() => copyToClipboard(hex)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="text-base text-muted-foreground">Binary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <div className="p-4 bg-muted/40 rounded-lg font-mono text-sm break-all flex justify-between items-start max-h-40 overflow-y-auto">
                    <span>{binary}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 ml-2" onClick={() => copyToClipboard(binary)}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
