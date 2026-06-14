"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ImageGenerateMemesTool() {
  const [image, setImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");

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
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      if (topText) {
        ctx.fillText(topText, canvas.width / 2, 50);
        ctx.strokeText(topText, canvas.width / 2, 50);
      }
      if (bottomText) {
        ctx.fillText(bottomText, canvas.width / 2, canvas.height - 20);
        ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 20);
      }
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
      a.download = "meme.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Generate Memes from Image</h1>
      
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
            <Label>Top Text</Label>
            <Input type="text" placeholder="Enter top text" value={topText} onChange={(e) => setTopText(e.target.value)} className="mt-2" />
          </div>
          <div className="mb-4">
            <Label>Bottom Text</Label>
            <Input type="text" placeholder="Enter bottom text" value={bottomText} onChange={(e) => setBottomText(e.target.value)} className="mt-2" />
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
