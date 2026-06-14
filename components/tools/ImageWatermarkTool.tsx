"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImageWatermarkTool() {
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [watermarkText, setWatermarkText] = useState("WATERMARK");

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
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2);
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
      a.download = "watermarked-image.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Add Watermark to Image</h1>
      
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
          <div className="mb-4">
            <Label>Watermark Text</Label>
            <Input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="mt-2" />
          </div>
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
