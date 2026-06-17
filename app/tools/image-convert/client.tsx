"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Format = "image/jpeg" | "image/png" | "image/webp" | "image/gif" | "image/bmp";

const FORMAT_MAP: Record<Format, { ext: string; label: string }> = {
  "image/jpeg": { ext: "jpg", label: "JPG" },
  "image/png": { ext: "png", label: "PNG" },
  "image/webp": { ext: "webp", label: "WebP" },
  "image/gif": { ext: "gif", label: "GIF" },
  "image/bmp": { ext: "bmp", label: "BMP" },
};

export default function ImageConvertClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [converted, setConverted] = useState<string>("");
  const [targetFormat, setTargetFormat] = useState<Format>("image/png");
  const [converting, setConverting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setConverted("");

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const convertImage = () => {
    if (!preview) return;
    setConverting(true);

    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const dataUrl = canvas.toDataURL(targetFormat, 0.92);
      setConverted(dataUrl);
      setConverting(false);
    };
    img.src = preview;
  };

  const downloadConverted = () => {
    if (!converted || !file) return;
    const a = document.createElement("a");
    a.href = converted;
    const baseName = file.name.replace(/\.[^.]+$/, "");
    a.download = `${baseName}_converted.${FORMAT_MAP[targetFormat].ext}`;
    a.click();
  };

  const reset = () => {
    setFile(null);
    setPreview("");
    setConverted("");
  };

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
            id="image-upload-convert"
          />
          <label htmlFor="image-upload-convert" className="cursor-pointer">
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
          {/* 格式选择 */}
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Conversion Settings</h3>
              <Button variant="ghost" size="sm" onClick={reset}>
                Upload New Image
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Target Format
                </label>
                <Select
                  value={targetFormat}
                  onValueChange={(v) => setTargetFormat(v as Format)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FORMAT_MAP).map(([mime, { label }]) => (
                      <SelectItem key={mime} value={mime}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={convertImage}
                disabled={converting}
                className="w-full"
                size="lg"
              >
                {converting ? "Converting..." : "🔄 Convert Image"}
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
                  {file.type.split("/")[1].toUpperCase()}
                </span>
              </div>
              <img
                src={preview}
                alt="Original"
                className="w-full rounded-lg object-contain"
                style={{ maxHeight: "300px" }}
              />
            </div>

            {/* 转换后 */}
            <div className="rounded-xl border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-medium">Converted</h4>
                {converted && (
                  <span className="text-sm text-green-600">
                    {FORMAT_MAP[targetFormat].label}
                  </span>
                )}
              </div>
              {converted ? (
                <>
                  <img
                    src={converted}
                    alt="Converted"
                    className="w-full rounded-lg object-contain"
                    style={{ maxHeight: "300px" }}
                  />
                  <Button
                    onClick={downloadConverted}
                    className="mt-4 w-full"
                  >
                    ⬇️ Download Converted Image
                  </Button>
                </>
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded-lg bg-muted/50">
                  <p className="text-muted-foreground">
                    Click "Convert Image" to see preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SEO 内容 */}
      <div className="prose max-w-none rounded-xl border bg-card p-8">
        <h2>How to Convert Images Online</h2>
        <ol>
          <li>Upload your image (any common format)</li>
          <li>Select the target format (JPG, PNG, WebP, GIF, BMP)</li>
          <li>Click "Convert Image" to process</li>
          <li>Preview the converted image</li>
          <li>Download the converted image</li>
        </ol>
        <h3>Supported Formats</h3>
        <ul>
          <li><strong>JPG</strong> — Best for photos, small file size</li>
          <li><strong>PNG</strong> — Supports transparency, lossless</li>
          <li><strong>WebP</strong> — Modern format, smaller than JPG/PNG</li>
          <li><strong>GIF</strong> — Supports animation (first frame only)</li>
          <li><strong>BMP</strong> — Uncompressed, large file size</li>
        </ul>
        <h3>Privacy Guaranteed</h3>
        <p>
          All conversion happens in your browser using the Canvas API.
          Your images never leave your device. No server upload, no tracking.
        </p>
      </div>

      {/* Hidden canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
