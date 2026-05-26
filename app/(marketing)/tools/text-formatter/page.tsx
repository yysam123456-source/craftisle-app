"use client";

import React, { useState, useCallback } from "react";
import { Scissors, Copy, Eraser, FileText, CheckCircle, Trash2, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TextFormatterPage() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [removeSpaces, setRemoveSpaces] = useState(true);
  const [removeLineBreaks, setRemoveLineBreaks] = useState(true);
  const [removeExtraWhitespace, setRemoveExtraWhitespace] = useState(true);

  const [stats, setStats] = useState({
    originalChars: 0,
    originalLines: 0,
    formattedChars: 0,
    formattedLines: 0,
    spacesRemoved: 0,
    lineBreaksRemoved: 0,
  });

  const calculateStats = useCallback((original: string, formatted: string) => {
    const originalChars = original.length;
    const originalLines = original.split("\n").length;
    const formattedChars = formatted.length;
    const formattedLines = formatted.split("\n").length;

    const originalSpaces = (original.match(/\s/g) || []).length;
    const formattedSpaces = (formatted.match(/\s/g) || []).length;
    const spacesRemoved = originalSpaces - formattedSpaces;

    const lineBreaksRemoved = Math.max(0, originalLines - formattedLines);

    setStats({
      originalChars,
      originalLines,
      formattedChars,
      formattedLines,
      spacesRemoved,
      lineBreaksRemoved,
    });
  }, []);

  const formatText = useCallback(() => {
    if (!inputText.trim()) {
      toast.warning("Enter需要Format的文本");
      return;
    }

    let formatted = inputText;

    if (removeLineBreaks) {
      formatted = formatted.replace(/\r?\n/g, "");
    }

    if (removeSpaces) {
      formatted = formatted.replace(/\s+/g, "");
    } else if (removeExtraWhitespace) {
      formatted = formatted.replace(/\s+/g, " ").trim();
    }

    setOutputText(formatted);
    calculateStats(inputText, formatted);
    toast.success("Text formatted");
  }, [
    inputText,
    removeSpaces,
    removeLineBreaks,
    removeExtraWhitespace,
    calculateStats,
  ]);

  const copyResult = useCallback(async () => {
    if (!outputText) {
      toast.warning("Nothing to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(outputText);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  }, [outputText]);

  const clearAll = useCallback(() => {
    setInputText("");
    setOutputText("");
    setStats({
      originalChars: 0,
      originalLines: 0,
      formattedChars: 0,
      formattedLines: 0,
      spacesRemoved: 0,
      lineBreaksRemoved: 0,
    });
  }, []);

  const quickClean = useCallback(() => {
    if (!inputText.trim()) {
      toast.warning("Enter需要Format的文本");
      return;
    }

    const formatted = inputText
      .replace(/\r?\n/g, "")
      .replace(/\t/g, "")
      .replace(/\s+/g, "")
      .trim();

    setOutputText(formatted);
    calculateStats(inputText, formatted);
    toast.success("Quick clean done");
  }, [inputText, calculateStats]);

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 shadow-lg">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TextFormatTools</h1>
          <p className="text-muted-foreground">
            Remove formatting, spaces, and line breaks from copied text
          </p>
        </div>
      </div>

      {/* Options Panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">FormatOptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="removeSpaces"
                checked={removeSpaces}
                onCheckedChange={setRemoveSpaces}
              />
              <Label htmlFor="removeSpaces">Remove All Spaces</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="removeLineBreaks"
                checked={removeLineBreaks}
                onCheckedChange={setRemoveLineBreaks}
              />
              <Label htmlFor="removeLineBreaks">Remove Line Breaks</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="removeExtraWhitespace"
                checked={removeExtraWhitespace}
                onCheckedChange={setRemoveExtraWhitespace}
                disabled={removeSpaces}
              />
              <Label htmlFor="removeExtraWhitespace" className={removeSpaces ? "text-muted-foreground" : ""}>
                Remove Extra Whitespace
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <Button onClick={formatText} disabled={!inputText.trim()} className="gap-2">
            <Paintbrush className="h-4 w-4" />
            Format Text
          </Button>
          <Button
            variant="secondary"
            onClick={quickClean}
            disabled={!inputText.trim()}
            className="gap-2"
          >
            <Scissors className="h-4 w-4" />
            Quick Clean
          </Button>
          <Button
            variant="outline"
            onClick={copyResult}
            disabled={!outputText}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            CopyResult
          </Button>
          <Button
            variant="ghost"
            onClick={clearAll}
            className="gap-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Eraser className="h-4 w-4" />
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Stats Panel */}
      {(inputText || outputText) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Raw Characters
              </div>
              <div className="text-2xl font-bold">{stats.originalChars}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                After Format
              </div>
              <div className="text-2xl font-bold text-emerald-500">{stats.formattedChars}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Trash2 className="h-3 w-3" />
                Remove Spaces
              </div>
              <div className="text-2xl font-bold text-cyan-500">{stats.spacesRemoved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Scissors className="h-3 w-3" />
                移除换行
              </div>
              <div className="text-2xl font-bold text-violet-500">{stats.lineBreaksRemoved}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span>Input Text</span>
              {inputText.trim() && (
                <Badge variant="secondary">
                  {stats.originalChars} 字符
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Textarea
              value={inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="请Paste需要Format的文本..."
              className="min-h-[400px] border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed p-4"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="py-3">
            <CardTitle className="text-base font-medium flex items-center justify-between">
              <span>FormatResult</span>
              {outputText && (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                    {stats.formattedChars} 字符
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={copyResult}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/30">
            <Textarea
              value={outputText}
              readOnly
              placeholder="After Format的Plain text将显示在这里..."
              className="min-h-[400px] border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed p-4 bg-transparent"
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
              <h4 className="font-semibold text-sm">主要功能</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li><strong>去除Format：</strong>清除文本中的各种Format信息</li>
                <li><strong>Remove Spaces：</strong>删除Text间的所有空格字符</li>
                <li><strong>移除换行：</strong>去除文本中的换行符，合并为单行</li>
                <li><strong>统Lap分析：</strong>显示Process前后的字符数变化</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">使用场景</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Process从Word、PDFCopy的文本</li>
                <li>清理网页Copy的带Format Text</li>
                <li>去除邮件内容中的多余换行</li>
                <li>整理聊dayRecords或文档片段</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
