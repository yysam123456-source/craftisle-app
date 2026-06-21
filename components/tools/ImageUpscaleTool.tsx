"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type UpscaleMode = "2x" | "4x";
type UpscaleModel = "general" | "anime" | "fast";

const MODE_CONFIG: Record<UpscaleMode, { scale: number; label: string }> = {
  "2x": { scale: 2, label: "2× (Fast)" },
  "4x": { scale: 4, label: "4× (High Quality)" },
};

export default function ImageUpscaleTool() {
  const [stage, setStage] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<string>("");
  const [outputSize, setOutputSize] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [scaleMode, setScaleMode] = useState<UpscaleMode>("2x");
  const [modelType, setModelType] = useState<UpscaleModel>("general");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ──
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      setStatusText("");

      // Check file size (warn if >10MB — large images are slow)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB. Large images may take several minutes to process.`);
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          setOriginalSize(`${img.naturalWidth} × ${img.naturalHeight}`);
          const s = MODE_CONFIG[scaleMode].scale;
          setOutputSize(`${img.naturalWidth * s} × ${img.naturalHeight * s}`);
          setStage("ready");
          setResultUrl(null);
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [scaleMode]
  );

  // ── Upscale processing using browser Canvas + optional ML ──
  const handleProcess = useCallback(async () => {
    if (!sourceImage) return;
    setStage("processing");
    setProgress(0);
    setError(null);

    try {
      const scale = MODE_CONFIG[scaleMode].scale;
      setStatusText("Preparing image…");
      setProgress(5);

      // Create source canvas
      const srcCanvas = document.createElement("canvas");
      srcCanvas.width = sourceImage.naturalWidth;
      srcCanvas.height = sourceImage.naturalHeight;
      srcCanvas.getContext("2d")!.drawImage(sourceImage, 0, 0);

      setProgress(10);
      let outCanvas: HTMLCanvasElement;

      // Try ML-based upscaling via Transformers.js (Real-ESRGAN ONNX model)
      if (modelType !== "fast") {
        setStatusText("Loading AI upscaling model…");
        try {
          // @ts-ignore — dynamic import, webpack code-splits into separate chunk
          const { pipeline, env } = await import("@huggingface/transformers");

          env.allowLocalModels = false;

          // Use image-to-image pipeline for super-resolution
          // Model selection based on type
          const modelId =
            modelType === "anime"
              ? "Xenova/swinIR-SR-x4-gan-anime"
              : "Xenova/swinIR-SR-x4-general";

          setProgress(15);
          setStatusText("Downloading AI model (~80MB, cached after first use)…");

          const pipe = await pipeline("image-to-image", modelId, {
            progress_callback: (p: any) => {
              if (p.status === "downloading") {
                setProgress(15 + Math.round((p.loaded / Math.max(p.total, 1)) * 60));
              }
            },
          });

          setProgress(78);
          setStatusText("Running AI super-resolution…");

          // Run inference
          const output = await pipe(srcCanvas.toDataURL("image/png"));

          setProgress(92);
          setStatusText("Generating output…");

          // Output is RawImage — convert to canvas
          const resultImg = await output.toCanvas();
          outCanvas = resultImg as HTMLCanvasElement;
        } catch (mlErr) {
          console.warn("[Upscale] ML failed, using high-quality canvas fallback:", mlErr);
          setStatusText("AI unavailable, using enhanced upscale…");
          outCanvas = enhancedCanvasScale(srcCanvas, scale);
        }
      } else {
        // Fast mode: pure canvas bicubic
        setStatusText("Processing with fast mode…");
        setProgress(20);
        await new Promise((r) => setTimeout(r, 100)); // yield to UI
        outCanvas = enhancedCanvasScale(srcCanvas, scale);
      }

      setProgress(95);
      const url = outCanvas.toDataURL("image/png");
      setResultUrl(url);
      setOutputSize(`${outCanvas.width} × ${outCanvas.height}`);

      setProgress(100);
      setStatusText("Done!");
      setStage("done");
    } catch (e) {
      console.error(e);
      setError(`Upscaling failed: ${(e as Error).message}`);
      setStage("ready");
    }
  }, [sourceImage, scaleMode, modelType]);

  // ── High-quality Canvas fallback upscaling ──
  function enhancedCanvasScale(src: HTMLCanvasElement, scale: number): HTMLCanvasElement {
    const outW = Math.round(src.width * scale);
    const outH = Math.round(src.height * scale);

    // Step-by-step 2x upscaling for better quality when scale > 2
    let current = document.createElement("canvas");
    current.width = src.width;
    current.height = src.height;
    current.getContext("2d")!.drawImage(src, 0, 0);

    const targetScale = scale;
    let curScale = 1;

    while (curScale < targetScale) {
      const step = Math.min(2, targetScale / curScale);
      const nextW = Math.round(current.width * step);
      const nextH = Math.round(current.height * step);

      const next = document.createElement("canvas");
      next.width = nextW;
      next.height = nextH;
      const ctx = next.getContext("2d")!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(current, 0, 0, nextW, nextH);

      current = next;
      curScale *= step;
    }

    // Apply subtle sharpening pass
    const finalCtx = current.getContext("2d")!;
    const imageData = finalCtx.getImageData(0, 0, current.width, current.height);
    sharpen(imageData, 0.3);
    finalCtx.putImageData(imageData, 0, 0);

    return current;
  }

  /** Simple unsharp mask sharpening */
  function sharpen(data: ImageData, amount: number): void {
    const { width, height, data: d } = data;
    const copy = new Uint8ClampedArray(d);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * width + x) * 4 + c;
          const neighbors =
            copy[idx - 4] + copy[idx + 4] +
            copy[idx - width * 4] + copy[idx + width * 4];
          const blurred = neighbors / 4;
          d[idx] = Math.min(255, Math.max(0, d[idx] + (d[idx] - blurred) * amount));
        }
      }
    }
  }

  // ── Download ──
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `upscaled-${scaleMode}-${modelType}.png`;
    a.click();
  }, [resultUrl, scaleMode, modelType]);

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Upload */}
      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          {sourceImage ? (
            <div className="space-y-3">
              <img src={sourceImage.src} alt="Uploaded" className="max-h-48 mx-auto rounded-lg shadow-sm" />
              <p className="text-sm text-green-600 font-medium">
                ✓ {originalSize}px — Click to replace
              </p>
            </div>
          ) : (
            <div className="py-4">
              <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-700">Upload an image</p>
              <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP — will be enlarged</p>
            </div>
          )}
        </div>
      </Card>

      {/* Settings + Process */}
      {stage !== "idle" && (
        <Card className="p-6 space-y-5">
          {/* Scale Selection */}
          <div>
            <Label className="font-semibold mb-3 block">Upscale Factor</Label>
            <div className="flex gap-3">
              {(Object.keys(MODE_CONFIG) as UpscaleMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setScaleMode(m);
                    if (sourceImage) {
                      const s = MODE_CONFIG[m].scale;
                      setOutputSize(`${sourceImage.naturalWidth * s} × ${sourceImage.naturalHeight * s}`);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    scaleMode === m
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  {MODE_CONFIG[m].label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Original: <strong>{originalSize}</strong> → Output: <strong>{outputSize}</strong>
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <Label className="font-semibold mb-3 block">Quality Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["general", "General", "Best for photos & real-world images"],
                ["anime", "Anime/Manga", "Optimized for illustrations"],
                ["fast", "Fast (No ML)", "Quick canvas upscale, no download"],
              ] as [UpscaleModel, string, string][]).map(([val, label, desc]) => (
                <button
                  key={val}
                  onClick={() => setModelType(val)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    modelType === val
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!sourceImage || stage === "processing"}
            size="lg"
            className="w-full text-base py-5"
          >
            {stage === "processing" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {statusText || "Upscaling…"}
              </span>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
                Upscale Image{modelType !== "fast" ? " (AI)" : ""}
              </>
            )}
          </Button>

          {stage === "processing" && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                {progress}% — {statusText}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Result */}
      {stage === "done" && resultUrl && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Image Upscaled!</h3>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ✓ Done
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Original ({originalSize})</p>
              <div className="rounded-lg border overflow-hidden bg-gray-50 p-1">
                {sourceImage && <img src={sourceImage.src} alt="Original" className="max-w-full mx-auto rounded" />}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Result ({outputSize})</p>
              <div className="rounded-lg border-2 border-green-200 overflow-hidden bg-white p-1">
                <img src={resultUrl} alt="Upscaled" className="max-w-full mx-auto rounded" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PNG
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setResultUrl(null); setStage("ready"); }}>
              Try Again
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              setSourceImage(null); setResultUrl(null); setStage("idle");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}>
              New Image
            </Button>
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="bg-violet-50 rounded-lg p-4 text-sm text-violet-800 space-y-2">
        <p><strong>How it works:</strong></p>
        <ul className="list-disc list-inside space-y-1 text-xs text-violet-700 ml-1">
          <li><strong>General/AI mode:</strong> Uses a super-resolution neural network (SwinIR) to intelligently enlarge and enhance details.</li>
          <li><strong>Anime mode:</strong> Optimized line-art and illustration upscaling.</li>
          <li><strong>Fast mode:</strong> High-quality multi-step canvas scaling with sharpening — no model download needed.</li>
          <li>All processing runs locally in your browser. No uploads.</li>
        </ul>
      </div>
    </div>
  );
}
