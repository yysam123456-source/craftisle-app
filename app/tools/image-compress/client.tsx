"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ImageCompressClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [compressed, setCompressed] = useState<string>("");
  const [quality, setQuality] = useState<number>(80);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOriginalSize(f.size);
    setCompressed("");
    setCompressedSize(0);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const compressImage = () => {
    if (!preview || !file) return;
    setCompressing(true);

    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      const dataUrl = canvas.toDataURL(mime, quality / 100);
      setCompressed(dataUrl);

      const base64 = dataUrl.split(",")[1];
      const size = Math.round((base64.length * 3) / 4);
      setCompressedSize(size);
      setCompressing(false);
    };
    img.src = preview;
  };

  const downloadCompressed = () => {
    if (!compressed) return;
    const a = document.createElement("a");
    a.href = compressed;
    a.download = `compressed_${file?.name || "image.jpg"}`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPreview("");
    setCompressed("");
    setOriginalSize(0);
    setCompressedSize(0);
    setQuality(80);
  };

  const reduction = originalSize > 0
    ? Math.round((1 - compressedSize / originalSize) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* 上传区域 */}
      {!file && (
        <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-12 text-center transition-colors hover:border-primary/50">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="mx-auto mb-4 text-5xl">📁</div>
            <p className="text-lg font-medium">Click to upload an image</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Supports JPG, PNG, WebP, GIF, BMP
            </p>
          </label>
        </div>
      )}

      {/* 工具区域 */}
      {file && (
        <div className="space-y-6">
          {/* 质量滑块 */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Compression Settings</h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                Upload New Image
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Quality: {quality}%
                  </label>
                  <span className="text-xs text-muted-foreground">
                    Lower = smaller file
                  </span>
                </div>
                <Input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>Smallest file</span>
                  <span>Best quality</span>
                </div>
              </div>
              <Button
                onClick={compressImage}
                disabled={compressing}
                className="w-full"
                size="lg"
              >
                {compressing ? "Compressing..." : "🗜️ Compress Image"}
              </Button>
            </div>
          </div>

          {/* 预览对比 */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* 原图 */}
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">Original</h4>
                <span className="text-sm text-muted-foreground">
                  {(originalSize / 1024).toFixed(1)} KB
                </span>
              </div>
              <img
                src={preview}
                alt="Original"
                className="w-full rounded-lg object-contain"
                style={{ maxHeight: "300px" }}
              />
            </div>

            {/* 压缩后 */}
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">Compressed</h4>
                {compressed && (
                  <span className="text-sm text-green-600">
                    {compressedSize > 0
                      ? (compressedSize / 1024).toFixed(1)
                      : "?"} KB
                    {reduction > 0 && ` (-${reduction}%)`}
                  </span>
                )}
              </div>
              {compressed ? (
                <>
                  <img
                    src={compressed}
                    alt="Compressed"
                    className="w-full rounded-lg object-contain"
                    style={{ maxHeight: "300px" }}
                  />
                  <Button
                    onClick={downloadCompressed}
                    className="mt-4 w-full"
                  >
                    ⬇️ Download Compressed Image
                  </Button>
                </>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    Click "Compress Image" to see preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEO 内容 */}
      <div className="prose max-w-none rounded-xl border bg-card p-8">
        <h2>How to Compress Images Online</h2>
        <ol>
          <li>Upload your image (JPG, PNG, WebP, etc.)</li>
          <li>Adjust the quality slider (80% is recommended)</li>
          <li>Click "Compress Image" to process</li>
          <li>Preview the compressed image and compare file sizes</li>
          <li>Download the compressed image</li>
        </ol>
        <h3>Why Compress Images?</h3>
        <p>
          Image compression reduces file size without significant quality loss.
          This helps websites load faster, saves storage space, and reduces
          bandwidth usage. Our tool uses browser-native compression (Canvas API)
          — your images never leave your device.
        </p>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
