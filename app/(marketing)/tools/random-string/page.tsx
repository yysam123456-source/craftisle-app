"use client";

import { useState, useCallback } from "react";
import { Settings, RefreshCw, Copy, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import ToolDetailSections from "@/components/tools/ToolDetailSections";
interface StringConfig {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
  customChars: string;
  batchCount: number;
}

const defaultConfig: StringConfig = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: false,
  excludeSimilar: false,
  customChars: "",
  batchCount: 1,
};

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SIMILAR_CHARS = "0O1lI|";

export default function RandomStringGenerator() {
  const [config, setConfig] = useState<StringConfig>(defaultConfig);
  const [generatedStrings, setGeneratedStrings] = useState<string[]>([]);
  const [currentString, setCurrentString] = useState("");

  const handleConfigChange = (field: keyof StringConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const getCharacterSet = useCallback(() => {
    let chars = "";

    if (config.customChars) {
      chars = config.customChars;
    } else {
      if (config.includeUppercase) chars += UPPERCASE;
      if (config.includeLowercase) chars += LOWERCASE;
      if (config.includeNumbers) chars += NUMBERS;
      if (config.includeSymbols) chars += SYMBOLS;
    }

    if (config.excludeSimilar && !config.customChars) {
      chars = chars
        .split("")
        .filter((char) => !SIMILAR_CHARS.includes(char))
        .join("");
    }

    return chars;
  }, [config]);

  const generateRandomString = useCallback(
    (length: number, charset: string) => {
      if (!charset) return "";

      let result = "";
      const charactersLength = charset.length;

      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charactersLength));
      }

      return result;
    },
    []
  );

  const generateStrings = useCallback(() => {
    const charset = getCharacterSet();

    if (!charset) {
      toast.error("Please select at least one character type");
      return;
    }

    const newStrings: string[] = [];
    for (let i = 0; i < config.batchCount; i++) {
      const randomStr = generateRandomString(config.length, charset);
      newStrings.push(randomStr);
    }

    setGeneratedStrings(newStrings);
    setCurrentString(newStrings[0] || "");
    toast.success(`SuccessGenerate ${newStrings.length} RandomString`);
  }, [config, getCharacterSet, generateRandomString]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Copied to clipboard");
      })
      .catch(() => {
        toast.error("Copy failed");
      });
  };

  const copyAllStrings = () => {
    const allStrings = generatedStrings.join("\n");
    copyToClipboard(allStrings);
  };

  const getStrengthInfo = () => {
    const charset = getCharacterSet();
    const entropy = Math.log2(Math.pow(charset.length, config.length));

    let strength = "Weak";
    let color = "bg-red-500 hover:bg-red-600";

    if (entropy >= 60) {
      strength = "Very Strong";
      color = "bg-emerald-500 hover:bg-emerald-600";
    } else if (entropy >= 40) {
      strength = "Strong";
      color = "bg-cyan-500 hover:bg-cyan-600";
    } else if (entropy >= 25) {
      strength = "Medium";
      color = "bg-amber-500 hover:bg-amber-600";
    }

    return { strength, entropy: entropy.toFixed(1), color };
  };

  const strengthInfo = getStrengthInfo();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Random String Generator</h1>
          <p className="text-muted-foreground">
            Generate secure random strings with customizable character sets
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Basic Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">StringLength</Label>
                  <div className="relative">
                    <Input
                      id="length"
                      type="number"
                      min={1}
                      max={1000}
                      value={config.length}
                      onChange={(e) =>
                        handleConfigChange("length", parseInt(e.target.value) || 1)
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground"></span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batchCount">Generate Count</Label>
                  <div className="relative">
                    <Input
                      id="batchCount"
                      type="number"
                      min={1}
                      max={100}
                      value={config.batchCount}
                      onChange={(e) =>
                        handleConfigChange("batchCount", parseInt(e.target.value) || 1)
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground"></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Character Sets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="uppercase"
                    checked={config.includeUppercase}
                    onCheckedChange={(checked) =>
                      handleConfigChange("includeUppercase", checked)
                    }
                  />
                  <Label htmlFor="uppercase">Uppercase (A-Z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={config.includeLowercase}
                    onCheckedChange={(checked) =>
                      handleConfigChange("includeLowercase", checked)
                    }
                  />
                  <Label htmlFor="lowercase">Lowercase (a-z)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="numbers"
                    checked={config.includeNumbers}
                    onCheckedChange={(checked) =>
                      handleConfigChange("includeNumbers", checked)
                    }
                  />
                  <Label htmlFor="numbers">Number (0-9)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="symbols"
                    checked={config.includeSymbols}
                    onCheckedChange={(checked) =>
                      handleConfigChange("includeSymbols", checked)
                    }
                  />
                  <Label htmlFor="symbols">Special Symbols</Label>
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Checkbox
                    id="excludeSimilar"
                    checked={config.excludeSimilar}
                    onCheckedChange={(checked) =>
                      handleConfigChange("excludeSimilar", checked)
                    }
                  />
                  <Label htmlFor="excludeSimilar">Exclude similar characters (0O1lI|)</Label>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="customChars">Custom character set</Label>
                <Input
                  id="customChars"
                  value={config.customChars}
                  onChange={(e) =>
                    handleConfigChange("customChars", e.target.value)
                  }
                  placeholder="Custom character set (overrides above selections)"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Generate & Result */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Character set size</div>
                  <div className="text-xl font-bold">{getCharacterSet().length}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Entropy</div>
                  <div className="text-xl font-bold">{strengthInfo.entropy}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Strength Level</div>
                  <Badge className={strengthInfo.color}>{strengthInfo.strength}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Generation Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateStrings}
                className="w-full h-12 text-lg gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                GenerateRandomString
              </Button>

              {generatedStrings.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(currentString)}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    CopyCurrent
                  </Button>
                  <Button
                    variant="outline"
                    onClick={copyAllStrings}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    CopyAll
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {generatedStrings.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">GenerateResult</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {config.batchCount === 1 ? (
                    <div className="relative">
                      <Input
                        value={currentString}
                        readOnly
                        className="font-mono text-lg pr-12"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-8 w-8"
                        onClick={() => copyToClipboard(currentString)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Textarea
                      value={generatedStrings.join("\n")}
                      readOnly
                      className="font-mono min-h-50"
                    />
                  )}
                  <div className="text-xs text-muted-foreground text-right">
                    GenerateTime: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Features</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Supports multiple character set combinations</li>
                <li>Exclude easily confused similar characters</li>
                <li>Supports custom character sets</li>
                <li>Batch generate multiple strings</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Security Tips</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Password length should be at least 12+ characters</li>
                <li>Important accounts should use 16+ character passwords</li>
                <li>Include multiple character types to improve security</li>
                <li>Regularly rotate passwords for important accounts</li>
              </ul>
            </div>
      <ToolDetailSections toolId="random-string" />
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Use Cases</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Generate secure passwords</li>
                <li>Create API keys</li>
                <li>Generate verification codes</li>
                <li>Create random standard characters</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-muted rounded-md text-xs text-muted-foreground">
            💡 Tip：GenerateStringbase，。
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
