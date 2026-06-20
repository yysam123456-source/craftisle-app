"use client";

import { useState, useCallback, useRef } from "react";
import {
  removeBackgroundML,
  preloadModel,
  removeBackground,
  applyBackground,
  cropToSize,
  ID_PHOTO_SIZES,
  BG_COLORS,
} from "@/lib/idphoto/inference";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function IDPhotoTool() {
  const [stage, setStage] = useState<
    "idle" | "ready" | "processing" | "done"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageData, setSourceImageData] =
    useState<ImageData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useML, setUseML] = useState(true);

  // Processing options
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedBg, setSelectedBg] = useState(0);
  const [tolerance, setTolerance] = useState(40);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

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
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          setSourceImageData(ctx.getImageData(0, 0, img.width, img.height));
          setStage("ready");
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Run processing — ML primary, fallback to legacy
  const handleProcess = useCallback(async () => {
    if (!sourceImageData) return;
    setStage("processing");
    setProgress(0);
    setProgressLabel("");
    setError(null);

    try {
      let withAlpha: ImageData;

      if (useML) {
        // ── Primary: ML-based background removal ──
        try {
          setProgressLabel("Loading AI model…");
          withAlpha = await removeBackgroundML(sourceImageData, {
            onProgress: (p) => {
              setProgress(p);
              if (p < 30) setProgressLabel("Loading AI model…");
              else if (p < 85) setProgressLabel("Processing with AI…");
              else setProgressLabel("Finalizing…");
            },
          });
        } catch (mlErr) {
          console.warn("ML background removal failed, falling back:", mlErr);
          // Fall back to legacy algorithm
          setProgressLabel("AI unavailable, using fast mode…");
          withAlpha = removeBackground(sourceImageData, {
            tolerance,
            onProgress: (p) =>
              setProgress(Math.round(10 + p * 0.3)),
          });
        }
      } else {
        // ── Fallback: Legacy color-keying ──
        setProgressLabel("Removing background…");
        withAlpha = removeBackground(sourceImageData, {
          tolerance,
          onProgress: (p) => setProgress(Math.round(p * 0.4)),
        });
      }

      // Step 2: Apply new background color
      setProgress(50);
      setProgressLabel("Applying background…");
      const bgColor = BG_COLORS[selectedBg].value;
      const composited = applyBackground(withAlpha, bgColor);

      // Step 3: Create preview (full size)
      setProgress(70);
      setProgressLabel("Generating preview…");
      const previewCanvas = previewCanvasRef.current!;
      previewCanvas.width = composited.width;
      previewCanvas.height = composited.height;
      previewCanvas.getContext("2d")!.putImageData(composited, 0, 0);
      setPreviewUrl(previewCanvas.toDataURL("image/jpeg", 0.92));

      // Step 4: Crop to target size
      setProgress(80);
      setProgressLabel("Cropping to format…");
      const size = ID_PHOTO_SIZES[selectedSize];
      const cropped = cropToSize(composited, size.width, size.height);

      const resultCanvas = canvasRef.current!;
      resultCanvas.width = size.width;
      resultCanvas.height = size.height;
      resultCanvas.getContext("2d")!.putImageData(cropped, 0, 0);
      setResultUrl(resultCanvas.toDataURL("image/jpeg", 0.95));

      setProgress(100);
      setProgressLabel("Done!");
      setStage("done");
    } catch (e) {
      console.error(e);
      setError(`Processing failed: ${(e as Error).message}`);
      setStage("ready");
    }
  }, [sourceImageData, tolerance, selectedBg, selectedSize, useML]);

  // Download result
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `id-photo-${ID_PHOTO_SIZES[selectedSize]
      .name.toLowerCase()
      .replace(/\s+/g, "-")}.jpg`;
    a.click();
  }, [resultUrl, selectedSize]);

  return (
    <div className="space-y-8">
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Upload Area */}
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
              <div className="text-green-600 font-semibold text-lg mb-1">
                ✓ Photo Selected
              </div>
              <p className="text-sm text-gray-500">
                {sourceImage.naturalWidth} × {sourceImage.naturalHeight} pixels
              </p>
              <button
                className="mt-3 text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceImage(null);
                  setSourceImageData(null);
                  setPreviewUrl(null);
                  setResultUrl(null);
                  setStage("idle");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Choose a different photo
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-700 mb-1">
                Click or drag to upload a photo
              </p>
              <p className="text-sm text-gray-500">
                JPG or PNG · Works with any background
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Settings Panel */}
      {stage !== "idle" && (
        <Card className="p-6 space-y-6">
          {/* Size Selection */}
          <div>
            <Label className="font-semibold mb-3 block">Photo Size</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ID_PHOTO_SIZES.map((s, i) => (
                <button
                  key={s.name}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    selectedSize === i
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50 text-gray-700"
                  }`}
                  onClick={() => setSelectedSize(i)}
                >
                  {s.name}
                  {s.label && (
                    <span className="block text-xs text-gray-400 font-normal mt-0.5">
                      {s.label}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Selection */}
          <div>
            <Label className="font-semibold mb-3 block">Background Color</Label>
            <div className="flex gap-3 items-center">
              {BG_COLORS.map((c, i) => (
                <button
                  key={c.value}
                  className={`w-11 h-11 rounded-full border-2 transition-all hover:scale-110 relative ${
                    selectedBg === i
                      ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setSelectedBg(i)}
                  title={c.name}
                  aria-label={`Background: ${c.name}`}
                />
              ))}
              <span className="text-sm text-gray-500 ml-2">
                {BG_COLORS[selectedBg].name}
              </span>
            </div>
          </div>

          {/* AI Engine Toggle + Advanced Options */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 select-none">
              Advanced Options
              <svg
                className="ml-1 inline h-4 w-4 transition-transform group-open:rotate-90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div className="mt-4 space-y-4 pl-2 border-l-2 border-gray-100">
              {/* AI Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg border border-blue-100">
                <Switch checked={useML} onCheckedChange={setUseML} />
                <div>
                  <Label className="text-sm font-medium">
                    ✨ AI Background Removal
                  </Label>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Uses an ML model for professional-quality results with any
                    photo. First use downloads ~5MB model.
                  </p>
                </div>
              </div>

              {/* Tolerance Slider (only for legacy mode) */}
              {!useML && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Background Sensitivity</Label>
                    <span className="text-sm text-gray-500">{tolerance}</span>
                  </div>
                  <Slider
                    value={[tolerance]}
                    onValueChange={([v]) => setTolerance(v)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full max-w-sm"
                  />
                  <p className="text-xs text-gray-400">
                    Lower = more aggressive removal · Higher = keep more detail.
                    Only applies when AI is off.
                  </p>
                </div>
              )}
            </div>
          </details>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!sourceImageData || stage === "processing"}
            size="lg"
            className="w-full text-base py-6"
          >
            {stage === "processing" ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {progressLabel || "Processing…"}
              </span>
            ) : (
              <>
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Generate ID Photo{useML ? " (AI)" : ""}
              </>
            )}
          </Button>

          {stage === "processing" && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                {progress}% — {progressLabel}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Result Preview & Download */}
      {stage === "done" && previewUrl && resultUrl && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Your ID Photo is Ready!</h3>
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ✓ Done
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                Original
              </p>
              <div className="rounded-lg border overflow-hidden bg-gray-50 p-1">
                {sourceImage && (
                  <img
                    src={sourceImage.src}
                    alt="Original uploaded photo"
                    className="max-w-full mx-auto rounded"
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                ID Photo ({ID_PHOTO_SIZES[selectedSize].name}
                {ID_PHOTO_SIZES[selectedSize].label &&
                  ` — ${ID_PHOTO_SIZES[selectedSize].label}`})
              </p>
              <div className="rounded-lg border-2 border-blue-200 overflow-hidden bg-white p-1">
                <img
                  src={resultUrl}
                  alt="Generated ID photo result"
                  className="max-w-full mx-auto rounded"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download JPG
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setPreviewUrl(null);
                setResultUrl(null);
                setStage("ready");
              }}
            >
              Regenerate
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSourceImage(null);
                setSourceImageData(null);
                setPreviewUrl(null);
                setResultUrl(null);
                setStage("idle");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              New Photo
            </Button>
          </div>

          {/* Print tip */}
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
            💡 <strong>Tip:</strong> For best results, print on high-quality glossy paper at 300 DPI or higher.
            Most photo labs accept digital files — just download and bring it to any store.
          </div>
        </Card>
      )}

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <canvas ref={previewCanvasRef} className="hidden" aria-hidden="true" />

      {/* Privacy Note */}
      <p className="text-center text-xs text-gray-400 max-w-md mx-auto">
        🔒{" "}
        {useML ? (
          <>
            AI processing runs in your browser using ONNX Runtime. Your photos are never uploaded to any server. A ~5MB model is downloaded once and cached locally.
          </>
        ) : (
          <>
            All processing happens in your browser using Canvas API. Your photos are never uploaded to any server.
          </>
        )}
      </p>
    </div>
  );
}

export default IDPhotoTool;
