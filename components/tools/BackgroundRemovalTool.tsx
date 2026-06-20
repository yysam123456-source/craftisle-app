"use client";

import { useState, useCallback, useRef } from "react";
import {
  removeBackgroundRMBG,
  removeBackgroundISNet,
  preloadModel,
} from "@/lib/idphoto/inference";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

type OutputFormat = "png" | "webp";
type BgMode = "transparent" | "solid" | "custom";

export function BackgroundRemovalTool() {
  const [stage, setStage] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [useHighQuality, setUseHighQuality] = useState(true);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [bgMode, setBgMode] = useState<BgMode>("transparent");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [customColor, setCustomColor] = useState("#1a73e8");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Handle file upload
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setSourceImage(img);
          setStage("ready");
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Main processing
  const handleProcess = useCallback(async () => {
    if (!sourceImage) return;
    setStage("processing");
    setProgress(0);
    setProgressLabel("");
    setError(null);

    try {
      let resultCanvas: HTMLCanvasElement;

      if (useHighQuality) {
        // RMBG-1.4 (~170MB, 98.7% edge accuracy)
        setProgressLabel("Loading high-quality AI model (RMBG-1.4)…");
        resultCanvas = await removeBackgroundRMBG(sourceImage, {
          onProgress: (pct) => {
            setProgress(pct);
            if (pct < 20) setProgressLabel("Loading AI model (~170MB first time)…");
            else if (pct < 90) setProgressLabel("Running AI segmentation…");
            else setProgressLabel("Refining edges…");
          },
          onStatus: (msg) => setProgressLabel(msg),
        });
      } else {
        // ISNet (5MB, fast)
        setProgressLabel("Loading fast AI model (ISNet)…");
        const canvas = await removeBackgroundISNet(sourceImage, {
          onProgress: (pct) => {
            setProgress(pct);
            if (pct < 80) setProgressLabel("Processing with ISNet…");
            else setProgressLabel("Finalizing…");
          },
        });
        if (!canvas) throw new Error("ISNet processing failed");
        resultCanvas = canvas;
      }

      // Apply background if not transparent
      let finalCanvas = resultCanvas;
      if (bgMode === "solid") {
        setProgressLabel("Applying background color…");
        finalCanvas = applySolidBackground(resultCanvas, solidColor);
      } else if (bgMode === "custom") {
        setProgressLabel("Applying custom background…");
        finalCanvas = applySolidBackground(resultCanvas, customColor);
      }

      setProgress(95);
      setProgressLabel("Encoding output…");

      // Export
      const canvas = canvasRef.current!;
      canvas.width = finalCanvas.width;
      canvas.height = finalCanvas.height;
      canvas.getContext("2d")!.drawImage(finalCanvas, 0, 0);

      const mimeType = outputFormat === "webp" ? "image/webp" : "image/png";
      const quality = outputFormat === "webp" ? 0.92 : undefined;
      const url = canvas.toDataURL(mimeType, quality);
      setResultUrl(url);

      setProgress(100);
      setProgressLabel("Done!");
      setStage("done");
    } catch (e) {
      console.error(e);
      setError(`Processing failed: ${(e as Error).message}`);
      setStage("ready");
    }
  }, [sourceImage, useHighQuality, outputFormat, bgMode, solidColor, customColor]);

  // Download
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const ext = outputFormat === "webp" ? "webp" : "png";
    a.download = `removed-bg-${Date.now()}.${ext}`;
    a.click();
  }, [resultUrl, outputFormat]);

  return (
    <div className="space-y-8">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Upload */}
      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 transition-colors group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {sourceImage ? (
            <div>
              <img
                src={sourceImage.src}
                alt="Uploaded"
                className="max-h-48 mx-auto rounded-lg shadow-sm mb-3"
              />
              <p className="text-green-600 font-semibold">✓ Image Loaded</p>
              <p className="text-xs text-gray-500 mt-1">
                {sourceImage.naturalWidth} × {sourceImage.naturalHeight} · Click to replace
              </p>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700">Upload Image</p>
              <p className="text-sm text-gray-500">JPG / PNG / WebP · Any background</p>
            </div>
          )}
        </div>
      </Card>

      {/* Settings */}
      {stage !== "idle" && (
        <Card className="p-6 space-y-6">
          <Tabs value={useHighQuality ? "hd" : "fast"} onValueChange={(v) => setUseHighQuality(v === "hd")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fast">⚡ Fast (ISNet, 5MB)</TabsTrigger>
              <TabsTrigger value="hd">✨ HD Quality (RMBG-1.4, 170MB)</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Background options */}
          <div>
            <Label className="font-semibold mb-3 block">Output Background</Label>
            <Tabs value={bgMode} onValueChange={(v) => setBgMode(v as BgMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transparent">Transparent</TabsTrigger>
                <TabsTrigger value="solid">Solid Color</TabsTrigger>
                <TabsTrigger value="custom">Custom Color</TabsTrigger>
              </TabsList>
            </Tabs>
            {bgMode === "solid" && (
              <div className="mt-3 flex gap-2 items-center">
                {["#ffffff","#438edb","#d9001b","#1a73e8","#f0f0f0","#000000"].map(c => (
                  <button
                    key={c}
                    className={`w-9 h-9 rounded-full border-2 ${solidColor === c ? "border-blue-500" : "border-gray-300"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setSolidColor(c)}
                  />
                ))}
              </div>
            )}
            {bgMode === "custom" && (
              <div className="mt-3 flex gap-2 items-center">
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="w-12 h-9 rounded border cursor-pointer" />
                <span className="text-sm text-gray-500">{customColor}</span>
              </div>
            )}
          </div>

          {/* Output format */}
          <div>
            <Label className="font-semibold mb-3 block">Output Format</Label>
            <Tabs value={outputFormat} onValueChange={(v) => setOutputFormat(v as OutputFormat)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="png">PNG (Lossless)</TabsTrigger>
                <TabsTrigger value="webp">WebP (Smaller)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Process */}
          <Button onClick={handleProcess} disabled={stage === "processing"} size="lg" className="w-full text-base py-6">
            {stage === "processing" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {progressLabel || "Processing…"}
              </span>
            ) : (
              <>🪄 Remove Background</>
            )}
          </Button>

          {stage === "processing" && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 mt-1.5 text-center">{progress}% — {progressLabel}</p>
            </div>
          )}
        </Card>
      )}

      {/* Result */}
      {stage === "done" && resultUrl && (
        <Card className="p-6 space-y-5">
          <h3 className="font-semibold text-lg">✅ Background Removed!</h3>
          <div className="rounded-lg border overflow-hidden bg-[repeating-conic-gradient(#ccc_0%_25%,#fff_0%_50%)] p-4">
            <img src={resultUrl} alt="Result" className="max-w-full mx-auto" style={{ imageRendering: "auto" }} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">⬇ Download</Button>
            <Button variant="outline" size="lg" onClick={() => { setResultUrl(null); setStage("ready"); }}>
              Process Another
            </Button>
          </div>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      <p className="text-center text-xs text-gray-400 max-w-md mx-auto">
        🔒 All processing runs in your browser.{" "}
        {useHighQuality
          ? "RMBG-1.4 model (~170MB) is downloaded once and cached locally."
          : "ISNet model (~5MB) downloads quickly on first use."}
      </p>
    </div>
  );
}

export default BackgroundRemovalTool;

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Apply solid background color to canvas with alpha */
function applySolidBackground(
  canvasWithAlpha: HTMLCanvasElement,
  hexColor: string
): HTMLCanvasElement {
  const ctx = canvasWithAlpha.getContext("2d")!;
  const W = canvasWithAlpha.width;
  const H = canvasWithAlpha.height;
  const imgData = ctx.getImageData(0, 0, W, H);
  const bgR = parseInt(hexColor.slice(1, 3), 16);
  const bgG = parseInt(hexColor.slice(3, 5), 16);
  const bgB = parseInt(hexColor.slice(5, 7), 16);
  const result = new ImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    const a = imgData.data[idx + 3] / 255;
    result.data[idx]     = Math.round(a * imgData.data[idx]     + (1 - a) * bgR);
    result.data[idx + 1] = Math.round(a * imgData.data[idx + 1] + (1 - a) * bgG);
    result.data[idx + 2] = Math.round(a * imgData.data[idx + 2] + (1 - a) * bgB);
    result.data[idx + 3] = 255;
  }
  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  out.getContext("2d")!.putImageData(result, 0, 0);
  return out;
}
