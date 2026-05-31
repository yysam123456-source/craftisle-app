"use client";

import { useState } from "react";
import { ImagePlus, Copy, Trash2, Download, Upload, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

export default function ImageBase64Page() {
  const [imageBase64, setImageBase64] = useState("");
  const [preview, setPreview] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageBase64(result);
      setPreview(result);
      toast.success("Image converted to Base64");
    };
    reader.readAsDataURL(file);
  };

  const handleBase64Change = (val: string) => {
    setImageBase64(val);
    if (val.startsWith("data:image/")) {
      setPreview(val);
    } else {
      setPreview("");
    }
  };

  const copyToClipboard = async () => {
    if (!imageBase64) return;
    try {
      await navigator.clipboard.writeText(imageBase64);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const downloadImage = () => {
    if (!preview) return;
    const link = document.createElement("a");
    link.href = preview;
    link.download = "downloaded_image";
    link.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-indigo-600 shadow-lg">
          <ImagePlus className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Image Base64 Converter</h1>
          <p className="text-muted-foreground">Convert between image files and Base64 strings</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Image to Base64</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 bg-muted/30 hover:bg-muted/50 transition-colors relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Click or drag image file here</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Supports JPG, PNG, GIF, WebP, etc.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Base64 String</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!imageBase64}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {setImageBase64(""); setPreview("");}} disabled={!imageBase64} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter Base64 string here (include data:image/... prefix)..."
                className="min-h-[250px] font-mono text-xs break-all"
                value={imageBase64}
                onChange={(e) => handleBase64Change(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">PreviewResult</CardTitle>
            {preview && (
              <Button variant="outline" size="sm" onClick={downloadImage}>
                <Download className="h-4 w-4 mr-2" />
                DownloadImage
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center bg-muted/20 rounded-b-xl p-6 min-h-[400px]">
            {preview ? (
              <div className="relative group max-w-full">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-[600px] rounded-lg shadow-lg object-contain"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground italic space-y-2">
                <FileImage className="h-12 w-12 mx-auto opacity-10" />
                <p>WaitingImageUploador Base64 Input</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    <ToolDetailSections toolId="image-base64" />
    </div>
  );
}
