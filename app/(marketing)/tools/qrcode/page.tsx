"use client";

import { useState } from "react";
import { QrCode, Download, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

interface QRConfig {
  size: number;
  icon: string;
  iconSize: number;
  fgColor: string;
  bgColor: string;
  includeMargin: boolean;
  level: "L" | "M" | "Q" | "H";
}

export default function QRCodeGenerator() {
  const [text, setText] = useState("");
  const [config, setConfig] = useState<QRConfig>({
    size: 200,
    icon: "",
    iconSize: 40,
    fgColor: "#000000",
    bgColor: "#ffffff",
    includeMargin: true,
    level: "M",
  });

  const handleConfigChange = (field: keyof QRConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      try {
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("QR CodeDownloadSuccess");
      } catch {
        toast.error("DownloadFailed");
      }
    } else {
      toast.error("No QR code found");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-green-600 shadow-lg">
          <QrCode className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">QR Code Generator</h1>
          <p className="text-muted-foreground">
            Quickly generate custom QR codes with multiple style options
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Content Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="text">Text Content</Label>
                <Textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text to generate QR code, e.g., URL, text..."
                  maxLength={2953}
                  className="min-h-25"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Style Config
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">QR CodeSize (px)</Label>
                  <Input
                    id="size"
                    type="number"
                    value={config.size}
                    onChange={(e) =>
                      handleConfigChange(
                        "size",
                        parseInt(e.target.value) || 200
                      )
                    }
                    min={80}
                    max={500}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iconSize">Icon Size (px)</Label>
                  <Input
                    id="iconSize"
                    type="number"
                    value={config.iconSize}
                    onChange={(e) =>
                      handleConfigChange(
                        "iconSize",
                        parseInt(e.target.value) || 40
                      )
                    }
                    min={20}
                    max={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Center Icon URL (optional)</Label>
                <Input
                  id="icon"
                  value={config.icon}
                  onChange={(e) => handleConfigChange("icon", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fgColor">QR CodeColor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="fgColor"
                      type="color"
                      value={config.fgColor}
                      onChange={(e) =>
                        handleConfigChange("fgColor", e.target.value)
                      }
                      className="h-9 w-full p-1 cursor-pointer"
                    />
                    <Input 
                      value={config.fgColor} 
                      onChange={(e) => handleConfigChange("fgColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bgColor">BackgroundColor</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      type="color"
                      value={config.bgColor}
                      onChange={(e) =>
                        handleConfigChange("bgColor", e.target.value)
                      }
                      className="h-9 w-full p-1 cursor-pointer"
                    />
                    <Input 
                      value={config.bgColor} 
                      onChange={(e) => handleConfigChange("bgColor", e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Error Correction</Label>
                  <Select
                    value={config.level}
                    onValueChange={(value: "L" | "M" | "Q" | "H") =>
                      handleConfigChange("level", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">L - Low (7%)</SelectItem>
                      <SelectItem value="M">M - Medium (15%)</SelectItem>
                      <SelectItem value="Q">Q - Quartile (25%)</SelectItem>
                      <SelectItem value="H">H - High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="includeMargin"
                      checked={config.includeMargin}
                      onCheckedChange={(checked) =>
                        handleConfigChange("includeMargin", checked)
                      }
                    />
                    <Label htmlFor="includeMargin">显示Border</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Eye className="h-4 w-4" />
                实时Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center min-h-80 bg-muted/30 rounded-lg p-8 border border-dashed">
                {text ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <QRCodeCanvas
                        id="qr-code-canvas"
                        value={text}
                        size={config.size}
                        fgColor={config.fgColor}
                        bgColor={config.bgColor}
                        level={config.level}
                        includeMargin={config.includeMargin}
                        imageSettings={
                          config.icon
                            ? {
                                src: config.icon,
                                height: config.iconSize,
                                width: config.iconSize,
                                excavate: true,
                              }
                            : undefined
                        }
                      />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Size: {config.size}×{config.size}px
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center">
                    <QrCode className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>请在左侧Input内容后查看Preview</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {text && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">DownloadOptions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={downloadQRCode}
                  className="w-full h-12 text-lg gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download为 PNG
                </Button>
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
              <h4 className="font-semibold text-sm">功能特点</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Support文本、网址等多种内容</li>
                <li>CustomQR CodeColor和Background色</li>
                <li>Support中心图标</li>
                <li>多种Error Correction可选</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">使用技巧</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>Error Correction越高容错性越Strong</li>
                <li>中心图标建议使用H方形</li>
                <li>深色QR Code配浅色Background效果更佳</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">应用场景</h4>
              <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-1">
                <li>网站链接快速分享</li>
                <li>Contact方式信息传递</li>
                <li>活动邀请码Generate</li>
                <li>产品信息展示</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
