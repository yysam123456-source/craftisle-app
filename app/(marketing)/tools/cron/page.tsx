"use client";

import { useState } from "react";
import { Timer, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function CronPage() {
  const [expression, setExpression] = useState("*/5 * * * *");
  
  const parts = expression.split(/\s+/);
  const labels = ["min", "hour", "day", "month", "weekday"];
  
  const decodePart = (part: string, type: string) => {
    if (!part) return "-";
    if (part === "*") return `Every ${type}`;
    if (part.includes("/")) {
      const [start, step] = part.split("/");
      return `Every ${step} ${type}${start !== "*" ? ` (from ${start})` : ""}`;
    }
    if (part.includes("-")) {
      return `${part.replace("-", " to ")} ${type}`;
    }
    if (part.includes(",")) {
      return `Values: ${part} ${type}`;
    }
    return `Value: ${part} ${type}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-orange-500 to-red-600 shadow-lg">
          <Timer className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cron Expression Parser</h1>
          <p className="text-muted-foreground">Parse and explain cron schedule expressions</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Input expression</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input 
                value={expression} 
                onChange={(e) => setExpression(e.target.value)}
                placeholder="e.g. */5 * * * *"
                className="font-mono text-lg"
              />
              <Button onClick={() => toast.success("ParseSuccess")}>Parse</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-5 gap-4">
          {labels.map((label, i) => (
            <Card key={label} className="bg-muted/30 border-none">
              <CardContent className="pt-6 text-center space-y-2">
                <p className="text-xs text-muted-foreground font-bold">{label}</p>
                <p className="font-mono text-xl font-bold text-primary">{parts[i] || "*"}</p>
                <p className="text-xs text-muted-foreground">{decodePart(parts[i], label)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4" />
              ParseDescription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-lg">
                   ：
                   <span className="font-bold text-primary ml-2">
                      {parts.length >= 5 
                        ? labels.map((l, i) => decodePart(parts[i], l)).join("，") 
                        : "Enter full 5-field cron expression"}
                   </span>
                </p>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div className="space-y-1">
                   <p className="font-bold text-foreground">*</p>
                   <p>Match all values for this field</p>
                </div>
                <div className="space-y-1">
                   <p className="font-bold text-foreground">/n</p>
                   <p>Specify step value (every n)</p>
                </div>
                <div className="space-y-1">
                   <p className="font-bold text-foreground">-</p>
                   <p>Specify range (from x to y)</p>
                </div>
                <div className="space-y-1">
                   <p className="font-bold text-foreground">,</p>
                   <p>Specify multiple values</p>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    <ToolDetailSections toolId="cron" />
    </div>
  );
}
