"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ImageIcon, Upload, Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import ToolDetailSections from "@/components/tools/ToolDetailSections";
export default function ImageToPixelPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pixelSize, setPixelSize] = useState(10);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (imageSrc && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        // Setup canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Pixelate
        if (pixelSize > 1) {
             const w = canvas.width;
             const h = canvas.height;
             
             // Disable image smoothing for pixelation effect
             ctx.imageSmoothingEnabled = false;

             // Calculate smaller dimensions
             const sw = w / pixelSize;
             const sh = h / pixelSize;

             // Draw small image
             ctx.drawImage(canvas, 0, 0, w, h, 0, 0, sw, sh);

             // Draw back scaled up
             ctx.drawImage(canvas, 0, 0, sw, sh, 0, 0, w, h);
        }
      };
    }
  }, [imageSrc, pixelSize]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = "pixel-art.png";
      link.href = canvasRef.current.toDataURL();
      link.click();
      toast.success("Image downloaded");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-rose-600 shadow-lg">
          <ImageIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Image to Pixel Art</h1>
          <p className="text-muted-foreground">Convert normal images to pixel art style</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-8 flex flex-col items-center justify-center min-h-100 p-6 bg-muted/20">
             {imageSrc ? (
                 <div className="relative max-w-full overflow-hidden shadow-xl rounded-lg border-4 border-white/50">
                    <canvas ref={canvasRef} className="max-w-full h-auto block" />
                 </div>
             ) : (
                 <div className="text-center space-y-4">
                     <div className="h-32 w-32 bg-muted rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-muted-foreground/30">
                         <ImageIcon className="h-12 w-12 text-muted-foreground" />
                     </div>
                     <div>
                        <h3 className="text-lg font-medium">Please select an image</h3>
                        <p className="text-sm text-muted-foreground">Support JPG, PNG, WEBP Format</p>
                     </div>
                     <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-4 w-4 mr-2" />
                        UploadImage
                     </Button>
                 </div>
             )}
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
                aria-label="UploadImage"
             />
        </Card>

        <Card className="lg:col-span-4 h-fit">
            <CardHeader>
                <CardTitle>Adjust & Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Label>Pixel Size: {pixelSize}px</Label>
                    </div>
                    <Slider
                        value={[pixelSize]}
                        onValueChange={(v) => setPixelSize(v[0])}
                        min={1}
                        max={50}
                        step={1}
                        disabled={!imageSrc}
                    />
                    <p className="text-xs text-muted-foreground">
                        Larger values create stronger pixelation and more abstract appearance。
                    </p>
                </div>
      <ToolDetailSections toolId="image-to-pixel" />

                <div className="space-y-2">
                    <Button onClick={handleDownload} disabled={!imageSrc} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        DownloadResult
                    </Button>
                    <Button variant="outline" onClick={() => setImageSrc(null)} disabled={!imageSrc} className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        NewUpload
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
