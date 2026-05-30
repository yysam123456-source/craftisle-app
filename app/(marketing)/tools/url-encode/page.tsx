"use client";

import { useState } from "react";
import { Link, ArrowLeftRight, Copy, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function UrlEncodePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");

  const handleEncode = () => {
    if (!input) {
      toast.warning("Enter content to encode");
      return;
    }
    try {
      const encoded = encodeURIComponent(input);
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
      const decoded = decodeURIComponent(input);
      setOutput(decoded);
      toast.success("Decoded successfully");
    } catch {
      toast.error("Decoding failed — please verify input is valid URL-encoded");
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
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-600 shadow-lg">
          <Link className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">URL Encode & Decode</h1>
          <p className="text-muted-foreground">
            URL Encode & Decode — process special characters
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "encode" | "decode")}
            className="w-50"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="encode">Encode</TabsTrigger>
              <TabsTrigger value="decode">Decode</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleConvert} className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            {mode === "encode" ? "Encode" : "Decode"}
          </Button>
          <Button variant="outline" onClick={swapInputOutput} className="gap-2">
            <ArrowLeftRight className="h-4 w-4 rotate-90" />
            
          </Button>
          <Button variant="ghost" onClick={clearAll} className="gap-2">
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {mode === "encode" ? "Raw Text" : "URL EncodeString"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "encode"
                  ? "EnterEncodetext，： "
                  : "EnterDecode URL EncodeString，：%E4%BD%A0%E5%A5%BD"
              }
              className="min-h-75 font-mono text-sm resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              {mode === "encode" ? "URL EncodeResult" : "DecodeResult"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              value={output}
              readOnly
              placeholder="Conversion result will appear here..."
              className="min-h-75 font-mono text-sm bg-muted/50 resize-none"
            />
          </CardContent>
        </Card>
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
                <li>URL Encode用于Process URL 的Special Characters和非 ASCII character</li>
                <li>空格会被Encode为 %20</li>
                <li>Textcharacter会被Encode为 UTF-8 Format的百分symbol(s)Encode</li>
              </ul>
            </div>
            <div className="space-y-2">
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>使用 encodeURIComponent 进行Encode</li>
                <li>保留character如 - _ . ! ~ * ' ( ) 不会被Encode</li>
                <li>常用于构建 URL 查询参数</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
