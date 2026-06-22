"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Image as ImageIcon, Trash2, Sparkles, Zap } from "lucide-react";

type PlatformInfo = {
  id: string;
  name: string;
  desc: string;
};

const PLATFORMS: PlatformInfo[] = [
  { id: "auto", name: "Auto Detect", desc: "Automatically detect the AI platform" },
  { id: "gemini", name: "Gemini (Google)", desc: "⭐ Star logo in bottom-right" },
  { id: "doubao", name: "豆包 (ByteDance)", desc: "Text watermark, bottom-right" },
  { id: "jimeng", name: "即梦 (ByteDance)", desc: "Text/logo watermark" },
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
  const [applied, setApplied] = useState<boolean | null>(null);
  const [platform, setPlatform] = useState<string>("auto");
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
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
    setApplied(null);
    setResultSrc(null);
    setDetectedPlatform(null);

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
    setApplied(null);
    setDetectedPlatform(null);

    try {
      // Load image file to ImageData
      const imageData = await fileToImageData(file);

      let targetPlatform = platform;

      // Auto-detect platform
      if (platform === "auto") {
        // Try Gemini first (most common), then others
        const { autoDetectPlatform } = await import("@/lib/watermark-remover/index.ts");
        targetPlatform = autoDetectPlatform(imageData);
        setDetectedPlatform(targetPlatform);
      }

      let cleanedData: ImageData;
      let wasApplied = false;

      if (targetPlatform === "gemini") {
        // Use the precise @pilio package for Gemini
        try {
          const { removeWatermarkFromImageData: removeGemini } = await import(
            "@pilio/gemini-watermark-remover/image-data"
          );
          const result = await (removeGemini as any)(imageData, { adaptiveMode: "auto" });
          wasApplied = result.meta?.applied ?? false;
          if (wasApplied) {
            cleanedData = result.imageData;
          } else {
            // Gemini detection failed — try generic removal as fallback
            const { removeWatermark, resolveConfig } = await import("@/lib/watermark-remover/index.ts");
            const cfg = resolveConfig("doubao", imageData.width, imageData.height);
            const { cleaned } = removeWatermark(imageData, cfg);
            cleanedData = cleaned;
            wasApplied = true;
          }
        } catch {
          // Package not available or failed — fall through to generic
          const { removeWatermark, resolveConfig } = await import("@/lib/watermark-remover/index.ts");
          const cfg = resolveConfig(targetPlatform, imageData.width, imageData.height);
          const { cleaned } = removeWatermark(imageData, cfg);
          cleanedData = cleaned;
          wasApplied = true;
        }
      } else {
        // Use generic removal for all other platforms
        const { removeWatermark, resolveConfig } = await import("@/lib/watermark-remover/index.ts");
        const cfg = resolveConfig(targetPlatform, imageData.width, imageData.height);
        const { cleaned } = removeWatermark(imageData, cfg);
        cleanedData = cleaned;
        wasApplied = true;
      }

      setApplied(wasApplied);

      if (!wasApplied) {
        setError(
          "No watermark detected. The image may not be from a supported AI platform, or the watermark format is unsupported."
        );
        setProcessing(false);
        return;
      }

      const resultUrl = imageDataToDataURL(cleanedData);
      setResultSrc(resultUrl);
    } catch (err) {
      console.error("Watermark removal failed:", err);
      setError(
        `Processing failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
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
    setApplied(null);
    setDetectedPlatform(null);
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
            Supports JPG, PNG, WebP. AI-generated images.
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
            {detectedPlatform && detectedPlatform !== "auto" && (
              <p className="mt-2 text-xs text-green-600 dark:text-green-400">
                ✅ Auto-detected: {PLATFORMS.find(p => p.id === detectedPlatform)?.name ?? detectedPlatform}
              </p>
            )}
          </div>

          {/* Detection status */}
          {applied !== null && (
            <div
              className={`rounded-lg p-3 text-sm ${
                applied
                  ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
                  : "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400"
              }`}
            >
              {applied
                ? `✅ Watermark removed successfully.${detectedPlatform ? ` (Detected: ${detectedPlatform})` : ""}`
                : "⚠️ No watermark detected. Try selecting the AI platform manually, or the image may not have a supported watermark."}
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
