"use client";

import { useState } from "react";
import { Lock, ArrowRightLeft, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";


export default function Base64Page() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const handleEncode = () => {
    if (!input) {
      toast.warning("Enter content to encode");
      return;
    }
    try {
      const encoded = btoa(unescape(encodeURIComponent(input)));
      setOutput(encoded);
      toast.success("Encoded successfully");
    } catch {
      toast.error("Encoding failed");
    }
  };

  const handleDecode = () => {
    if (!input) {
      toast.warning("Enter content to decode");
      return;
    }
    try {
      const decoded = decodeURIComponent(escape(atob(input)));
      setOutput(decoded);
      toast.success("Decoded successfully");
    } catch {
      toast.error("Decode failed: please check if input is valid Base64");
    }
  };

  const handleConvert = () => {
    if (mode === "encode") {
      handleEncode();
    } else {
      handleDecode();
    }
  };

  const copyToClipboard = async () => {
    if (!output) {
      toast.warning("Nothing to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
  };

  const swapInputOutput = () => {
    setInput(output);
    setOutput("");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 shadow-lg">
          <Lock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Base64 编Decode</h1>
          <p className="text-muted-foreground">
            Base64 Encode与DecodeConvertTools，Support中文
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-muted/50 p-4 rounded-lg border">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "encode" | "decode")}>
          <TabsList>
            <TabsTrigger value="encode">Encode</TabsTrigger>
            <TabsTrigger value="decode">Decode</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 ml-auto sm:ml-0">
          <Button onClick={handleConvert} className="gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            {mode === "encode" ? "Encode" : "Decode"}
          </Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2">
            <ArrowRightLeft className="h-4 w-4 rotate-90" />
            交换
          </Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive">
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">
                {mode === "encode" ? "Raw文本" : "Base64 String"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  mode === "encode"
                    ? "Enter要Encode的文本..."
                    : "Enter要Decode的 Base64 String..."
                }
                className="h-full min-h-75 font-mono resize-none"
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base font-medium">
                {mode === "encode" ? "Base64 Result" : "DecodeResult"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1"
                onClick={copyToClipboard}
              >
                <Copy className="h-3 w-3" />
                Copy
              </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-75">
              <Textarea
                value={output}
                readOnly
                placeholder="Conversion result will appear here..."
                className="h-full min-h-75 font-mono resize-none bg-muted/50"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Base64 是一种基于 64 可打印字符来表示二进制数据的Encode方式</li>
                <li>常用于在 URL、Cookie 中传输少量二进制数据</li>
                <li>本ToolsSupport中文Encode和Decode</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Encode后的数据比Raw数据大约 33%</li>
                <li>Base64 不是EncryptAlgorithm，仅是一种Encode方式</li>
                <li>Click"交换"可将OutputResult作为New的Input</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
