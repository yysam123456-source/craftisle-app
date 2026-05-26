"use client";

import { useState } from "react";
import { CaseSensitive, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function CaseConverterPage() {
  const [input, setInput] = useState("");

  const copyToClipboard = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const toUpper = () => setInput(input.toUpperCase());
  const toLower = () => setInput(input.toLowerCase());
  
  const toTitleCase = () => {
    const result = input
      .toLowerCase()
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
    setInput(result);
  };

  const toCamelCase = () => {
    const words = input.toLowerCase().split(/[\s_-]+/);
    const result = words[0] + words.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join("");
    setInput(result);
  };

  const toPascalCase = () => {
    const result = input
      .toLowerCase()
      .split(/[\s_-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
    setInput(result);
  };

  const toSnakeCase = () => {
    const result = input
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join("_") || "";
    setInput(result);
  };

  const toKebabCase = () => {
    const result = input
      .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
      ?.map(x => x.toLowerCase())
      .join("-") || "";
    setInput(result);
  };

  const clearAll = () => setInput("");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
          <CaseSensitive className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Text Case Converter</h1>
          <p className="text-muted-foreground">
            Quickly convert between uppercase, lowercase, camelCase, snake_case, etc.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">Input Text</CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(input)} disabled={!input}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={!input} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter or paste text to convert here..."
              className="min-h-50 font-mono text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">ConvertOptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button type="button" disabled={!input} onClick={toUpper} variant="secondary" className="flex-1 min-w-35">
                UPPER CASE (Uppercase)
              </Button>
              <Button type="button" disabled={!input} onClick={toLower} variant="secondary" className="flex-1 min-w-35">
                lower case (Lowercase)
              </Button>
              <Button type="button" disabled={!input} onClick={toTitleCase} variant="secondary" className="flex-1 min-w-35">
                Title Case (词首Uppercase)
              </Button>
              <Button type="button" disabled={!input} onClick={toCamelCase} variant="secondary" className="flex-1 min-w-35">
                camelCase (小驼峰)
              </Button>
              <Button type="button" disabled={!input} onClick={toPascalCase} variant="secondary" className="flex-1 min-w-35">
                PascalCase (大驼峰)
              </Button>
              <Button type="button" disabled={!input} onClick={toSnakeCase} variant="secondary" className="flex-1 min-w-35">
                snake_case (蛇形)
              </Button>
              <Button type="button" disabled={!input} onClick={toKebabCase} variant="secondary" className="flex-1 min-w-35">
                kebab-case (短横线)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl">💡</span> Common Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Camel Case</p>
              <p className="text-xs text-muted-foreground">First word lowercase, subsequent words capitalized, e.g., `helloWorld`。</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Snake Case</p>
              <p className="text-xs text-muted-foreground">All letters lowercase, words separated by underscores, e.g., `hello_world`。</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">Kebab Case</p>
              <p className="text-xs text-muted-foreground">所有字母Lowercase，单词间用连字符连接，如 `hello-world`。</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
