"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Image as ImageIcon, Trash2, Zap } from "lucide-react";

type PlatformInfo = {
  id: string;
  name: string;
  desc: string;
};

const PLATFORMS: PlatformInfo[] = [
  { id: "auto", name: "Auto Detect", desc: "Automatically detect the AI platform" },
  { id: "gemini", name: "Gemini (Google)", desc: "⭐ Star logo in bottom-right" },
  { id: "jimeng", name: "即梦 (ByteDance)", desc: "⭐ Text/logo watermark (recommended for Chinese AI)" },
  { id: "doubao", name: "豆包 (ByteDance)", desc: "Text watermark, bottom-right" },
  { id: "tongyi", name: "通义万相 (Alibaba)", desc: "Text watermark" },
  { id: "wenxin", name: "文心一格 (Baidu)", desc: "Text watermark" },
  { id: "leonardo", name: "Leonardo.ai", desc: "Logo watermark" },
];

export default function WatermarkRemoverClient() {
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [resultSrc, setResultSrc] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{
    applied: boolean;
    platform?: string;
    pixels?: number;
    confidence?: number;
  } | null>(null);
  const [platform, setPlatform] = useState<string>("auto");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      if (resultSrc) URL.revokeObjectURL(resultSrc);
    };
  }, []);

  const processFile = useCallback(async (f: File) => {
    setError(null);
    setStatus(null);
    setResultSrc(null);

    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewSrc(url);
  }, []);

  const handleRemove = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setStatus(null);

    try {
      const imageData = await fileToImageData(file);
      let targetPlatform = platform;
      let cleanedData: ImageData;
      let applied = false;
      let resultInfo: { pixels?: number; confidence?: number } = {};

      // Load watermark remover
      const { removeWatermark, resolveConfig, autoDetectPlatform } = await import("@/lib/watermark-remover/index.ts");

      // Auto-detect platform
      if (platform === "auto") {
        targetPlatform = autoDetectPlatform(imageData);
      }

      if (targetPlatform === "gemini") {
        // Use @pilio's precise engine for Gemini
        try {
          const { removeWatermarkFromImageData: removeGemini } = await import(
            "@pilio/gemini-watermark-remover/image-data"
          );
          const result = await (removeGemini as any)(imageData, { adaptiveMode: "auto" });
          applied = result.meta?.applied ?? false;
          if (applied) {
            cleanedData = result.imageData;
          } else {
            // Gemini not detected — try generic engine with jimeng config
            const cfg = resolveConfig("jimeng", imageData.width, imageData.height);
            const res = removeWatermark(imageData, cfg);
            cleanedData = res.cleaned;
            applied = res.pixelCount > 3 && res.passes > 0;
            targetPlatform = "jimeng";
            resultInfo = { pixels: res.pixelCount, confidence: Math.round(res.confidence * 100) };
          }
        } catch {
          // @pilio failed → fall back to generic
          const cfg = resolveConfig(targetPlatform, imageData.width, imageData.height);
          const res = removeWatermark(imageData, cfg);
          cleanedData = res.cleaned;
          applied = res.pixelCount > 3 && res.passes > 0;
          resultInfo = { pixels: res.pixelCount, confidence: Math.round(res.confidence * 100) };
        }
      } else {
        // Generic detection + inpainting for all other platforms
        const cfg = resolveConfig(targetPlatform, imageData.width, imageData.height);
        const res = removeWatermark(imageData, cfg);
        cleanedData = res.cleaned;
        applied = res.pixelCount > 3 && res.passes > 0;
        resultInfo = { pixels: res.pixelCount, confidence: Math.round(res.confidence * 100) };
      }

      setStatus({ applied, platform: targetPlatform, ...resultInfo });

      if (!applied) {
        setError(
          "No watermark detected. Try selecting the AI platform manually, or this image may not have a supported watermark type."
        );
        setProcessing(false);
        return;
      }

      const resultUrl = imageDataToDataURL(cleanedData);
      setResultSrc(resultUrl);
    } catch (err) {
      console.error("Watermark removal failed:", err);
      setError(`Processing failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
    }
  }, [file, platform]);

  const handleDownload = useCallback(() => {
    if (!resultSrc) return;
    const a = document.createElement("a");
    a.href = resultSrc;
    a.download = `watermark-removed-${file?.name || "image.png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [resultSrc, file]);

  const handleClear = useCallback(() => {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    if (resultSrc) URL.revokeObjectURL(resultSrc);
    setFile(null);
    setPreviewSrc(null);
    setResultSrc(null);
    setError(null);
    setStatus(null);
  }, [previewSrc, resultSrc]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) processFile(f);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 transition-colors hover:border-muted-foreground/50 hover:bg-muted/30"
        >
          <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Click or drag an image here</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Supports JPG, PNG, WebP. Works best with images from Gemini, 即梦, 豆包, 通义万相, 文心一格.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) processFile(f);
            }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Preview + Result */}
      {file && (
        <div className="space-y-4">
          {/* Platform selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">AI Platform</p>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`rounded-lg border px-3 py-2 text-xs transition-colors ${
                    platform === p.id
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-muted-foreground/20 bg-transparent text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                  title={p.desc}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          {status && status.applied && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
              ✅ Watermark removed
              {status.platform && status.platform !== "auto" && (
                <span className="ml-1">— {PLATFORMS.find(p => p.id === status.platform)?.name ?? status.platform}</span>
              )}
              {status.pixels != null && (
                <span className="ml-2 text-xs opacity-75">
                  ({status.pixels} pixels repaired, {status.confidence}% confidence)
                </span>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {/* Original */}
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Original</p>
              {previewSrc && (
                <img
                  src={previewSrc}
                  alt="Original"
                  className="rounded-lg border bg-muted/30"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              )}
            </div>

            {/* Result */}
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">Result</p>
              {resultSrc ? (
                <img
                  src={resultSrc}
                  alt="Result"
                  className="rounded-lg border bg-muted/30"
                  style={{ maxWidth: "100%", height: "auto" }}
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-muted/20">
                  <p className="text-sm text-muted-foreground">
                    {processing ? "Processing..." : "Result will appear here"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRemove} disabled={processing} className="gap-2">
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Remove Watermark
                </>
              )}
            </Button>

            {resultSrc && (
              <Button onClick={handleDownload} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}

            <Button onClick={handleClear} variant="ghost" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
            This tool removes semi-transparent watermarks added by AI image generators.
            For personal use only. Results may vary depending on image quality and watermark type.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Load a File to ImageData via an offscreen canvas. */
function fileToImageData(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new Error("Failed to load image file."));
    img.src = URL.createObjectURL(file);
  });
}

/** Convert ImageData to a PNG data URL. */
function imageDataToDataURL(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
