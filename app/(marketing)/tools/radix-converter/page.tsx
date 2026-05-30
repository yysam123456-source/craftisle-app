"use client";

import { useState } from "react";
import { Calculator, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RadixConverterPage() {
  const [values, setValues] = useState({
    bin: "",
    oct: "",
    dec: "",
    hex: ""
  });

  const handleUpdate = (val: string, radix: number) => {
    if (val === "") {
      setValues({ bin: "", oct: "", dec: "", hex: "" });
      return;
    }

    try {
      const decimal = parseInt(val, radix);
      if (isNaN(decimal)) return;

      setValues({
        bin: decimal.toString(2),
        oct: decimal.toString(8),
        dec: decimal.toString(10),
        hex: decimal.toString(16).toUpperCase()
      });
    } catch {
      // Ignore invalid input
    }
  };

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const clearAll = () => setValues({ bin: "", oct: "", dec: "", hex: "" });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 shadow-lg">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base Converter</h1>
          <p className="text-muted-foreground">
            Convert between binary, octal, decimal, and hexadecimal
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Conversion Panel</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {/* Decimal */}
              <div className="space-y-2">
                <Label htmlFor="dec">Decimal</Label>
                <div className="flex gap-2">
                  <Input
                    id="dec"
                    placeholder="Enter decimal value..."
                    value={values.dec}
                    onChange={(e) => handleUpdate(e.target.value, 10)}
                    className="font-mono text-lg"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(values.dec)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hexadecimal */}
              <div className="space-y-2">
                <Label htmlFor="hex">Hexadecimal</Label>
                <div className="flex gap-2">
                  <Input
                    id="hex"
                    placeholder="Enter hex value..."
                    value={values.hex}
                    onChange={(e) => handleUpdate(e.target.value, 16)}
                    className="font-mono text-lg"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(values.hex)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Binary */}
              <div className="space-y-2">
                <Label htmlFor="bin">Binary</Label>
                <div className="flex gap-2">
                  <Input
                    id="bin"
                    placeholder="Enter binary value..."
                    value={values.bin}
                    onChange={(e) => handleUpdate(e.target.value, 2)}
                    className="font-mono text-lg"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(values.bin)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Octal */}
              <div className="space-y-2">
                <Label htmlFor="oct">Octal</Label>
                <div className="flex gap-2">
                  <Input
                    id="oct"
                    placeholder="Enter octal value..."
                    value={values.oct}
                    onChange={(e) => handleUpdate(e.target.value, 8)}
                    className="font-mono text-lg"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(values.oct)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Base Conversion Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-2">
            <li><strong>Binary:</strong> base为2，composed of digits 0 and 1。</li>
            <li><strong>Octal:</strong> base为8，composed of digits 0 through 7。</li>
            <li><strong>Decimal:</strong> base为10，is the most commonly usedLap数方式。</li>
            <li><strong>Hexadecimal:</strong> base为16，of0-9和A-F (representing 10-15)组成。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
