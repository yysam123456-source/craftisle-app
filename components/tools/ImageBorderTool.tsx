"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImageBorderTool() {
  const [image, setImage] = useState<string | null>(null);
  const [borderWidth, setBorderWidth] = useState(10);
  const [borderColor, setBorderColor] = useState("#000000");
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      canvas.width = img.width + borderWidth * 2;
      canvas.height = img.height + borderWidth * 2;
      
      // Fill background with border color
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw image on top
      ctx.drawImage(img, borderWidth, borderWidth);
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
      a.download = "image-with-border.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add Border to Image</h1>
      
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
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="border-width">Border Width (px)</Label>
              <Input
                id="border-width"
                type="number"
                value={borderWidth}
                onChange={(e) => setBorderWidth(parseInt(e.target.value) || 0)}
                className="mt-2"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="border-color">Border Color</Label>
              <Input
                id="border-color"
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button onClick={handleProcess}>Add Border</Button>
            <Button onClick={handleDownload} variant="outline">Download</Button>
          </div>

          <canvas ref={canvasRef} className="max-w-full border rounded" />
        </div>
      )}
    </div>
  );
}
