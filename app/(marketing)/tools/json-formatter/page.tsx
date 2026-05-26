"use client";

import React, { useState, useCallback } from 'react';
import { 
  Code, Minimize2, CheckCircle, Copy, FilePlus, Eraser, Check, XCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

type Mode = 'format' | 'compress' | 'validate';

export default function JsonFormatterPage() {
  const [mode, setMode] = useState<Mode>('format');
  const [inputJson, setInputJson] = useState('');
  const [outputJson, setOutputJson] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [charCount, setCharCount] = useState(0);

  const validateJson = useCallback((jsonStr: string) => {
    if (!jsonStr.trim()) {
      setIsValid(null);
      setErrorMsg('');
      return null;
    }

    try {
      const parsed = JSON.parse(jsonStr);
      setIsValid(true);
      setErrorMsg('');
      return parsed;
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知Error';
      setErrorMsg(msg);
      setIsValid(false);
      return null;
    }
  }, []);

  const formatJson = useCallback(() => {
    const parsed = validateJson(inputJson);
    if (parsed !== null) {
      const formatted = JSON.stringify(parsed, null, 2);
      setOutputJson(formatted);
      toast.success('FormatSuccess');
    }
  }, [inputJson, validateJson]);

  const compressJson = useCallback(() => {
    const parsed = validateJson(inputJson);
    if (parsed !== null) {
      const compressed = JSON.stringify(parsed);
      setOutputJson(compressed);
      toast.success('MinifySuccess');
    }
  }, [inputJson, validateJson]);

  const validateOnly = useCallback(() => {
    validateJson(inputJson);
    if (inputJson.trim() && isValid) {
      toast.success('JSON FormatH确');
    }
  }, [inputJson, validateJson, isValid]);

  const handleAction = useCallback(() => {
    switch (mode) {
      case 'format':
        formatJson();
        break;
      case 'compress':
        compressJson();
        break;
      case 'validate':
        validateOnly();
        break;
    }
  }, [mode, formatJson, compressJson, validateOnly]);

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    if (!text) {
      toast.warning('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type}Copied`);
    } catch {
      toast.error('Copy failed');
    }
  }, []);

  const clearAll = useCallback(() => {
    setInputJson('');
    setOutputJson('');
    setIsValid(null);
    setErrorMsg('');
    setCharCount(0);
  }, []);

  const loadExample = useCallback(() => {
    const example = {
      name: "爱拓Tools箱",
      version: "1.0.0",
      features: ["JSONFormat", "Minify", "Validate"],
      config: {
        theme: "cyan",
        language: "zh-CN"
      }
    };
    const exampleStr = JSON.stringify(example, null, 2);
    setInputJson(exampleStr);
    setCharCount(exampleStr.length);
    validateJson(exampleStr);
  }, [validateJson]);

  const handleInputChange = useCallback((value: string) => {
    setInputJson(value);
    setCharCount(value.length);
    if (value.trim()) {
      validateJson(value);
    } else {
      setIsValid(null);
      setErrorMsg('');
    }
  }, [validateJson]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Code className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">JSON FormatTools</h1>
            <p className="text-muted-foreground">FormatJSON，使其更易读</p>
          </div>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-75">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="compress">Minify</TabsTrigger>
            <TabsTrigger value="validate">Validate</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Action Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <Button 
            onClick={handleAction} 
            disabled={!inputJson.trim()} 
            className="gap-2"
          >
            {mode === 'format' && <Code className="h-4 w-4" />}
            {mode === 'compress' && <Minimize2 className="h-4 w-4" />}
            {mode === 'validate' && <CheckCircle className="h-4 w-4" />}
            {mode === 'format' ? 'Format' : mode === 'compress' ? 'Minify' : 'Validate'}
          </Button>
          
          <Button
            variant="secondary"
            onClick={compressJson}
            disabled={!inputJson.trim() || isValid === false}
            className="gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            Minify
          </Button>

          <Button
            variant="outline"
            onClick={validateOnly}
            disabled={!inputJson.trim()}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Validate
          </Button>

          <Button variant="ghost" onClick={loadExample} className="gap-2">
            <FilePlus className="h-4 w-4" />
            LoadExample
          </Button>

          <Button variant="ghost" onClick={clearAll} className="gap-2 text-destructive hover:text-destructive/90 hover:bg-destructive/10">
            <Eraser className="h-4 w-4" />
            Clear内容
          </Button>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <Card className="flex flex-col h-full">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              JSON Input
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(inputJson, 'Input内容')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>CopyInput</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            {isValid !== null && (
              <Badge variant={isValid ? "default" : "destructive"} className={isValid ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                 {isValid ? <Check className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                 {isValid ? 'FormatH确' : 'FormatError'}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0 relative">
            <Textarea
              value={inputJson}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="EnterJSON数据..."
              className="min-h-125 h-full border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed p-4 bg-transparent"
            />
            {errorMsg && (
              <div className="absolute bottom-0 left-0 right-0 bg-destructive/10 text-destructive text-xs p-2 border-t border-destructive/20">
                {errorMsg}
              </div>
            )}
          </CardContent>
          <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground flex justify-end">
            字符数: {charCount}
          </div>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col h-full">
          <CardHeader className="py-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              FormatResult
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(outputJson, 'Result')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>CopyResult</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-muted/30">
            <Textarea
              value={outputJson}
              readOnly
              placeholder="ProcessResult将显示在这里..."
              className="min-h-125 h-full border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed p-4 bg-transparent"
            />
          </CardContent>
        </Card>
      </div>

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Format模式</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>BeautifyJSON结构，增加缩进</li>
                <li>提高可读性</li>
                <li>便于调试和查看</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Minify模式</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>移除所有空白字符</li>
                <li>减小File Size</li>
                <li>适合生产环境</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Validate模式</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>检查JSON语法H确性</li>
                <li>显示详细统Lap信息</li>
                <li>提供Error诊断</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
            💡 Tip：Support复杂的嵌套结构，包括对象、数组、String、Number、布尔值和null值。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
