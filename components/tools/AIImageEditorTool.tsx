"use client";

import { useState, useCallback, useRef } from "react";
import {
  removeBackgroundRMBG,
  removeBackgroundISNet,
} from "@/lib/idphoto/inference";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

// ─── Types ─────────────────────────────────────────────────────────────

type ActiveTab = "bg-remove" | "adjust" | "crop" | "filters";

// ─── Helpers: Canvas Image Processing ──────────────────────────────

/** Load image from File/Blob → HTMLImageElement */
function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

/** ImageData → Canvas */
function imgDataToCanvas(d: ImageData): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = d.width; c.height = d.height;
  c.getContext("2d")!.putImageData(d, 0, 0);
  return c;
}

/** Canvas → ImageData */
function canvasToImgData(c: HTMLCanvasElement): ImageData {
  return c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
}

/** Apply brightness/contrast/saturation adjustments */
function applyAdjustments(
  src: ImageData,
  opts: { brightness: number; contrast: number; saturation: number; blur: number; sharpen: number }
): ImageData {
  const { width: W, height: H, data } = src;
  const result = new ImageData(W, H);
  const br = opts.brightness;   // 0..200, 100 = neutral
  const ct = opts.contrast;     // 0..200, 100 = neutral
  const st = opts.saturation;  // 0..200, 100 = neutral

  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    let r = data[idx], g = data[idx + 1], b = data[idx + 2];

    // Brightness
    r = clamp(r * br / 100);
    g = clamp(g * br / 100);
    b = clamp(b * br / 100);

    // Contrast (simple scale around 128)
    r = clamp(128 + (r - 128) * ct / 100);
    g = clamp(128 + (g - 128) * ct / 100);
    b = clamp(128 + (b - 128) * ct / 100);

    // Saturation (convert to HSL-like, adjust S)
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      const newS = clamp01(s * st / 100);
      // Simplified: just interpolate toward grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = clamp(gray + (r - gray) * newS);
      g = clamp(gray + (g - gray) * newS);
      b = clamp(gray + (b - gray) * newS);
    }

    result.data[idx]     = r;
    result.data[idx + 1] = g;
    result.data[idx + 2] = b;
    result.data[idx + 3] = data[idx + 3];
  }

  // Sharpen (unsharp mask) — 2-pass convolution
  if (opts.sharpen > 0) {
    const strength = opts.sharpen / 100;
    const blurData = gaussianBlur(result, 1);
    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      for (let c = 0; c < 3; c++) {
        const ori = result.data[idx + c];
        const blr = blurData.data[idx + c];
        result.data[idx + c] = clamp(ori + (ori - blr) * strength);
      }
    }
  }

  return result;
}

function clamp(v: number): number { return Math.max(0, Math.min(255, Math.round(v))); }
function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }

/** Very basic Gaussian blur (1-pass, radius=1) */
function gaussianBlur(d: ImageData, r: number): ImageData {
  const { width: W, height: H, data } = d;
  const out = new ImageData(W, H);
  const weights = [1, 2, 1, 2, 4, 2, 1, 2, 1]; // 3x3
  const denom = 16;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;
        let wi = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            sum += data[((y + dy) * W + (x + dx)) * 4 + c] * weights[wi];
            wi++;
          }
        }
        out.data[(y * W + x) * 4 + c] = Math.round(sum / denom);
      }
      out.data[(y * W + x) * 4 + 3] = data[(y * W + x) * 4 + 3];
    }
  }
  return out;
}

/** Apply filters: grayscale / sepia / invert / vintage */
function applyFilters(
  src: ImageData,
  filters: { grayscale: number; sepia: number; invert: number; vintage: number }
): ImageData {
  const { width: W, height: H, data } = src;
  const result = new ImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const idx = i * 4;
    let r = data[idx], g = data[idx + 1], b = data[idx + 2];

    // Grayscale
    if (filters.grayscale > 0) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const f = filters.grayscale / 100;
      r = clamp(r + (gray - r) * f);
      g = clamp(g + (gray - g) * f);
      b = clamp(b + (gray - b) * f);
    }

    // Sepia
    if (filters.sepia > 0) {
      const sr = clamp(r * 0.393 + g * 0.769 + b * 0.189);
      const sg = clamp(r * 0.349 + g * 0.686 + b * 0.168);
      const sb = clamp(r * 0.272 + g * 0.534 + b * 0.131);
      const f = filters.sepia / 100;
      r = clamp(r + (sr - r) * f);
      g = clamp(g + (sg - g) * f);
      b = clamp(b + (sb - b) * f);
    }

    // Invert
    if (filters.invert > 0) {
      const f = filters.invert / 100;
      r = clamp(r + (255 - r - r) * f);
      g = clamp(g + (255 - g - g) * f);
      b = clamp(b + (255 - b - b) * f);
    }

    // Vintage (warm tone + slight fade)
    if (filters.vintage > 0) {
      const f = filters.vintage / 100;
      r = clamp(r + (r * 0.1 + 20 - r) * f);
      b = clamp(b + (b * 0.9 - b) * f);
    }

    result.data[idx]     = r;
    result.data[idx + 1] = g;
    result.data[idx + 2] = b;
    result.data[idx + 3] = data[idx + 3];
  }
  return result;
}

// ─── Component ─────────────────────────────────────────────────────────

export function AIImageEditorTool() {
  const [stage, setStage] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("bg-remove");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // BG Remove options
  const [bgUseHD, setBgUseHD] = useState(true);

  // Adjust options
  const [adjBrightness, setAdjBrightness] = useState(100);
  const [adjContrast, setAdjContrast] = useState(100);
  const [adjSaturation, setAdjSaturation] = useState(100);
  const [adjSharpen, setAdjSharpen] = useState(0);

  // Filter options
  const [fltGrayscale, setFltGrayscale] = useState(0);
  const [fltSepia, setFltSepia] = useState(0);
  const [fltInvert, setFltInvert] = useState(0);
  const [fltVintage, setFltVintage] = useState(0);

  // Crop options
  const [cropMode, setCropMode] = useState<"free" | "1:1" | "4:3" | "16:9">("free");
  const [cropScale, setCropScale] = useState(100);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── File Upload ───────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => { setSourceImage(img); setStage("ready"); };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // ── Process: BG Removal ──────────────────────────────────────────
  const handleBgRemove = useCallback(async () => {
    if (!sourceImage) return;
    setStage("processing"); setProgress(0); setProgressLabel(""); setError(null);
    try {
      const canvas = bgUseHD
        ? await removeBackgroundRMBG(sourceImage, {
            onProgress: (p) => { setProgress(p); setProgressLabel(p < 90 ? "AI processing…" : "Finalizing…"); },
            onStatus: (m) => setProgressLabel(m),
          })
        : await removeBackgroundISNet(sourceImage, {
            onProgress: (p) => { setProgress(p); setProgressLabel("Processing with ISNet…"); },
          });
      if (!canvas) throw new Error("Processing failed");
      finishCanvas(canvas);
    } catch (e) {
      setError((e as Error).message); setStage("ready");
    }
  }, [sourceImage, bgUseHD]);

  // ── Process: Adjustments ───────────────────────────────────────
  const handleAdjust = useCallback(() => {
    if (!sourceImage) return;
    setStage("processing"); setProgress(0); setError(null);
    try {
      setProgressLabel("Applying adjustments…");
      const srcCanvas = imgDataToCanvas(
        new ImageData(
          sourceImage.width, sourceImage.height
        )
      );
      // Actually, let me get ImageData from source
      const tmp = document.createElement("canvas");
      tmp.width = sourceImage.width; tmp.height = sourceImage.height;
      tmp.getContext("2d")!.drawImage(sourceImage, 0, 0);
      const srcData = tmp.getContext("2d")!.getImageData(0, 0, tmp.width, tmp.height);

      setProgress(30);
      const adjusted = applyAdjustments(srcData, {
        brightness: adjBrightness,
        contrast: adjContrast,
        saturation: adjSaturation,
        blur: 0,
        sharpen: adjSharpen,
      });

      setProgress(80);
      const outCanvas = imgDataToCanvas(adjusted);
      finishCanvas(outCanvas);
    } catch (e) {
      setError((e as Error).message); setStage("ready");
    }
  }, [sourceImage, adjBrightness, adjContrast, adjSaturation, adjSharpen]);

  // ── Process: Filters ───────────────────────────────────────────
  const handleFilters = useCallback(() => {
    if (!sourceImage) return;
    setStage("processing"); setProgress(0); setError(null);
    try {
      setProgressLabel("Applying filters…");
      const tmp = document.createElement("canvas");
      tmp.width = sourceImage.width; tmp.height = sourceImage.height;
      tmp.getContext("2d")!.drawImage(sourceImage, 0, 0);
      const srcData = tmp.getContext("2d")!.getImageData(0, 0, tmp.width, tmp.height);

      setProgress(40);
      const filtered = applyFilters(srcData, {
        grayscale: fltGrayscale,
        sepia: fltSepia,
        invert: fltInvert,
        vintage: fltVintage,
      });

      setProgress(80);
      finishCanvas(imgDataToCanvas(filtered));
    } catch (e) {
      setError((e as Error).message); setStage("ready");
    }
  }, [sourceImage, fltGrayscale, fltSepia, fltInvert, fltVintage]);

  // ── Process: Crop ────────────────────────────────────────────────
  const handleCrop = useCallback(() => {
    if (!sourceImage) return;
    setStage("processing"); setProgress(0); setError(null);
    try {
      setProgressLabel("Cropping…");
      const W = sourceImage.width, H = sourceImage.height;
      let cW = W, cH = H;
      if (cropMode === "1:1") { cH = cW; } else if (cropMode === "4:3") { cH = Math.round(cW * 3 / 4); } else if (cropMode === "16:9") { cH = Math.round(cW * 9 / 16); }
      cW = Math.round(cW * cropScale / 100);
      cH = Math.round(cH * cropScale / 100);
      const x = Math.round((W - cW) / 2), y = Math.round((H - cH) / 2);

      const out = document.createElement("canvas");
      out.width = cW; out.height = cH;
      out.getContext("2d")!.drawImage(sourceImage, x, y, cW, cH, 0, 0, cW, cH);

      setProgress(80);
      finishCanvas(out);
    } catch (e) {
      setError((e as Error).message); setStage("ready");
    }
  }, [sourceImage, cropMode, cropScale]);

  // ── Finish: export canvas → resultUrl ──────────────────────────
  function finishCanvas(canvas: HTMLCanvasElement) {
    setProgress(90);
    setProgressLabel("Encoding…");
    const url = canvas.toDataURL("image/png");
    setResultUrl(url);
    setProgress(100);
    setProgressLabel("Done!");
    setStage("done");
  }

  // ── Download ─────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `ai-editor-${Date.now()}.png`;
    a.click();
  }, [resultUrl]);

  // ── UI ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
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
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
          {sourceImage ? (
            <div>
              <img src={sourceImage.src} alt="Uploaded" className="max-h-48 mx-auto rounded-lg shadow-sm mb-3" />
              <p className="text-green-600 font-semibold">✓ Image Loaded</p>
              <p className="text-xs text-gray-500 mt-1">Click to replace</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium text-gray-700 mt-3">Upload Image</p>
              <p className="text-sm text-gray-500">JPG / PNG / WebP</p>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs: Feature Modules */}
      {stage !== "idle" && (
        <Card className="p-6 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bg-remove">🪄 BG Remove</TabsTrigger>
              <TabsTrigger value="adjust">🎚️ Adjust</TabsTrigger>
              <TabsTrigger value="crop">✂️ Crop</TabsTrigger>
              <TabsTrigger value="filters">🎨 Filters</TabsTrigger>
            </TabsList>

            {/* ── BG Remove Tab ──────────────────────────────── */}
            <TabsContent value="bg-remove" className="space-y-4 pt-4">
              <div className="flex gap-4 items-center">
                <Button
                  variant={!bgUseHD ? "default" : "outline"}
                  onClick={() => setBgUseHD(false)}
                  size="sm"
                >⚡ Fast (5MB)</Button>
                <Button
                  variant={bgUseHD ? "default" : "outline"}
                  onClick={() => setBgUseHD(true)}
                  size="sm"
                >✨ HD Quality (170MB)</Button>
              </div>
              <p className="text-xs text-gray-500">
                {bgUseHD
                  ? "RMBG-1.4: 98.7% edge accuracy, best for complex backgrounds. First use downloads ~170MB."
                  : "ISNet: Fast processing, good for simple/solid backgrounds. ~5MB download."}
              </p>
            </TabsContent>

            {/* ── Adjust Tab ─────────────────────────────────── */}
            <TabsContent value="adjust" className="space-y-5 pt-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between"><Label className="text-sm">Brightness</Label><span className="text-xs text-gray-500">{adjBrightness}%</span></div>
                  <Slider value={[adjBrightness]} onValueChange={([v]) => setAdjBrightness(v)} min={0} max={200} step={1} />
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between"><Label className="text-sm">Contrast</Label><span className="text-xs text-gray-500">{adjContrast}%</span></div>
                    <Slider value={[adjContrast]} onValueChange={([v]) => setAdjContrast(v)} min={0} max={200} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between"><Label className="text-sm">Saturation</Label><span className="text-xs text-gray-500">{adjSaturation}%</span></div>
                    <Slider value={[adjSaturation]} onValueChange={([v]) => setAdjSaturation(v)} min={0} max={200} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between"><Label className="text-sm">Sharpen</Label><span className="text-xs text-gray-500">{adjSharpen}%</span></div>
                    <Slider value={[adjSharpen]} onValueChange={([v]) => setAdjSharpen(v)} min={0} max={100} step={1} />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── Crop Tab ────────────────────────────────────── */}
            <TabsContent value="crop" className="space-y-4 pt-4">
              <div>
                <Label className="font-semibold mb-2 block">Aspect Ratio</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["free","1:1","4:3","16:9"] as const).map(m => (
                    <button
                      key={m}
                      className={`px-3 py-2 rounded-lg border text-sm ${cropMode === m ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                      onClick={() => setCropMode(m)}
                    >{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between"><Label className="text-sm">Scale</Label><span className="text-xs text-gray-500">{cropScale}%</span></div>
                <Slider value={[cropScale]} onValueChange={([v]) => setCropScale(v)} min={10} max={100} step={1} />
              </div>
            </TabsContent>

            {/* ── Filters Tab ────────────────────────────────── */}
            <TabsContent value="filters" className="space-y-5 pt-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between"><Label className="text-sm">Grayscale</Label><span className="text-xs text-gray-500">{fltGrayscale}%</span></div>
                  <Slider value={[fltGrayscale]} onValueChange={([v]) => setFltGrayscale(v)} min={0} max={100} step={1} />
                </div>
                <div>
                  <div className="flex justify-between"><Label className="text-sm">Sepia</Label><span className="text-xs text-gray-500">{fltSepia}%</span></div>
                  <Slider value={[fltSepia]} onValueChange={([v]) => setFltSepia(v)} min={0} max={100} step={1} />
                </div>
                <div>
                  <div className="flex justify-between"><Label className="text-sm">Invert</Label><span className="text-xs text-gray-500">{fltInvert}%</span></div>
                  <Slider value={[fltInvert]} onValueChange={([v]) => setFltInvert(v)} min={0} max={100} step={1} />
                </div>
                <div>
                  <div className="flex justify-between"><Label className="text-sm">Vintage</Label><span className="text-xs text-gray-500">{fltVintage}%</span></div>
                  <Slider value={[fltVintage]} onValueChange={([v]) => setFltVintage(v)} min={0} max={100} step={1} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Run Button */}
          <Button
            onClick={
              activeTab === "bg-remove" ? handleBgRemove :
              activeTab === "adjust" ? handleAdjust :
              activeTab === "crop" ? handleCrop :
              handleFilters
            }
            disabled={stage === "processing"}
            size="lg" className="w-full text-base py-6"
          >
            {stage === "processing" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                {progressLabel || "Processing…"}
              </span>
            ) : (
              <>🪄 Apply {activeTab === "bg-remove" ? "BG Removal" : activeTab === "adjust" ? "Adjustments" : activeTab === "crop" ? "Crop" : "Filters"}</>
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
          <h3 className="font-semibold text-lg">✅ Done!</h3>
          <div className="rounded-lg border overflow-hidden bg-[repeating-conic-gradient(#ccc_0%_25%,#fff_0%_50%)] p-4">
            <img src={resultUrl} alt="Result" className="max-w-full mx-auto" />
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
    </div>
  );
}

export default AIImageEditorTool;
