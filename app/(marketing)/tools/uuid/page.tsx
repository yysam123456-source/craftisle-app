"use client";

import { useState } from "react";
import { Copy, Eraser, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function UuidPage() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [format, setFormat] = useState<"default" | "uppercase" | "nohyphen">(
    "default"
  );

  const generateUUID = (): string => {
    // Generate符合 RFC 4122 版本 4 的 UUID
    const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    return template.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const formatUUID = (uuid: string): string => {
    switch (format) {
      case "uppercase":
        return uuid.toUpperCase();
      case "nohyphen":
        return uuid.replace(/-/g, "");
      default:
        return uuid;
    }
  };

  const handleGenerate = () => {
    const newUuids = Array.from({ length: count }, () =>
      formatUUID(generateUUID())
    );
    setUuids(newUuids);
    toast.success(`已Generate ${count}  UUID`);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const copyAll = async () => {
    if (uuids.length === 0) {
      toast.warning("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(uuids.join("\n"));
      toast.success("Copied所有 UUID");
    } catch {
      toast.error("Copy failed");
    }
  };

  const clearAll = () => {
    setUuids([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg">
          <FileText className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UUID Generate</h1>
          <p className="text-muted-foreground">
            Generate符合 RFC 4122 标准的 UUID v4 通用唯一标识符
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="count" className="whitespace-nowrap">
              数量：
            </Label>
            <Input
              id="count"
              type="number"
              min={1}
              max={100}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="whitespace-nowrap">Format：</Label>
            <Select
              value={format}
              onValueChange={(value: any) => setFormat(value)}
            >
              <SelectTrigger className="w-35">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default（Lowercase）</SelectItem>
                <SelectItem value="uppercase">Uppercase</SelectItem>
                <SelectItem value="nohyphen">无连字符</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-1 items-center gap-2 lg:justify-end">
            <Button onClick={handleGenerate} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Generate
            </Button>
            <Button variant="outline" onClick={copyAll} className="gap-2">
              <Copy className="h-4 w-4" />
              CopyAll
            </Button>
            <Button variant="ghost" onClick={clearAll} className="gap-2">
              <Eraser className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Panel */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">GenerateResult</CardTitle>
          <span className="text-sm text-muted-foreground">
            共 {uuids.length} 
          </span>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {uuids.length > 0 ? (
              uuids.map((uuid, index) => (
                <div
                  key={index}
                  className="group flex items-center justify-between rounded-md border bg-muted/50 px-4 py-2 transition-colors hover:bg-muted"
                >
                  <code className="font-mono text-sm">{uuid}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => copyToClipboard(uuid)}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex min-h-50 flex-col items-center justify-center text-muted-foreground">
                <FileText className="mb-4 h-12 w-12 opacity-20" />
                <p>ClickGenerate按钮创建 UUID</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">什么是 UUID</h4>
              <p className="text-sm text-muted-foreground">
                UUID（Universally Unique Identifier）是一种 128
                位的标识符，用于在分布式系统中唯一标识信息。
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">UUID v4 特点</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                <li>基于Random数Generate</li>
                <li>122 位有效Random位</li>
                <li>重复概率极低</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">常见用途</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                <li>数据库主键</li>
                <li>会话标识</li>
                <li>分布式系统 ID</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
