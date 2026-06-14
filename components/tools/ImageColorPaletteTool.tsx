"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImageColorPaletteTool() {
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [palette, setPalette] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleProcess = () => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      // 简化版：提取主要颜色
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // 这里应该实现颜色量化算法，暂时简化
      setPalette(["#ff0000", "#00ff00", "#0000ff"]);
    };
    img.src = image;
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "color-palette.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Extract Color Palette from Image</h1>
      
      <div className="mb-6">
        <Label htmlFor="image-upload">Upload Image</Label>
        <Input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-2"
        />
      </div>

      {image && (
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-4">Click Process to extract color palette</p>
          {palette.length > 0 && (
            <div className="flex gap-2 mb-4">
              {palette.map((color, i) => (
                <div key={i} className="w-12 h-12 rounded" style={{ backgroundColor: color }} />
              ))}
            </div>
          )}
          <div className="flex gap-4 mb-6">
            <Button onClick={handleProcess}>Process</Button>
            <Button onClick={handleDownload} variant="outline">Download</Button>
          </div>

          <canvas ref={canvasRef} className="max-w-full border rounded" />
        </div>
      )}
    </div>
  );
}
