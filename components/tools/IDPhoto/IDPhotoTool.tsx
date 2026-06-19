"use client";

import { useState, useCallback, useRef } from "react";
import {
  loadModel,
  runInference,
  applyMatting,
  resizeToTarget,
  ID_PHOTO_SIZES,
  BG_COLORS,
} from "@/lib/idphoto/inference";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";

export function IDPhotoTool() {
  const [stage, setStage] = useState<
    "idle" | "loading-model" | "ready" | "processing" | "done"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [modelProgress, setModelProgress] = useState(0);
  const [sourceImage, setSourceImage] = useState<ImageData | null>(null);
  const [resultImage, setResultImage] = useState<ImageData | null>(null);
  const [selectedSize, setSelectedSize] = useState(0);
  const [selectedBg, setSelectedBg] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load model on first use
  const handleLoadModel = useCallback(async () => {
    setStage("loading-model");
    setModelProgress(0);
    try {
      await loadModel((p) => setModelProgress(p));
      setStage("ready");
    } catch (e) {
      console.error(e);
      setError(
        "Failed to load AI model. Please refresh the page and try again."
      );
      setStage("idle");
    }
  }, []);

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
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          setSourceImage(ctx.getImageData(0, 0, img.width, img.height));
          if (stage === "idle") {
            handleLoadModel();
          } else {
            setStage("ready");
          }
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    [stage, handleLoadModel]
  );

  // Run inference
  const handleProcess = useCallback(async () => {
    if (!sourceImage) return;
    setStage("processing");
    setProgress(0);
    setError(null);

    try {
      const mask = await runInference(sourceImage, (stage, p) => {
        if (stage === "preprocess") setProgress(Math.round(p * 0.3));
        if (stage === "inference") setProgress(Math.round(30 + p * 0.5));
        if (stage === "postprocess")
          setProgress(30 + 50 + Math.round(p * 0.2));
      });

      setProgress(80);

      const bgColor = BG_COLORS[selectedBg].value;
      const result = applyMatting(mask, sourceImage, bgColor);
      setResultImage(result);

      // Create preview URL
      const previewCanvas = previewCanvasRef.current!;
      previewCanvas.width = result.width;
      previewCanvas.height = result.height;
      previewCanvas.getContext("2d")!.putImageData(result, 0, 0);
      setPreviewUrl(previewCanvas.toDataURL("image/jpeg", 0.92));

      // Create final cropped ID photo
      const size = ID_PHOTO_SIZES[selectedSize];
      const cropped = resizeToTarget(result, size.width, size.height);
      const resultCanvas = canvasRef.current!;
      resultCanvas.width = size.width;
      resultCanvas.height = size.height;
      resultCanvas.getContext("2d")!.putImageData(cropped, 0, 0);
      setResultUrl(resultCanvas.toDataURL("image/jpeg", 0.95));

      setProgress(100);
      setStage("done");
    } catch (e) {
      console.error(e);
      setError(`Processing failed: ${(e as Error).message}`);
      setStage("ready");
    }
  }, [sourceImage, selectedBg, selectedSize]);

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          ⚠️ {error}
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
                {sourceImage.width} × {sourceImage.height} pixels
              </p>
              <button
                className="mt-3 text-sm text-blue-600 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSourceImage(null);
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
                JPG or PNG recommended · Front-facing photo works best
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Model Loading */}
      {stage === "loading-model" && (
        <Card className="p-6">
          <p className="font-medium mb-3 flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
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
            Loading AI model (~25 MB)...
          </p>
          <Progress value={modelProgress} />
          <p className="text-sm text-gray-500 mt-2">
            {modelProgress}% — This only happens once (model is cached after first load)
          </p>
        </Card>
      )}

      {/* Settings Panel */}
      {stage !== "idle" && stage !== "loading-model" && (
        <Card className="p-6 space-y-6">
          {/* Size Selection */}
          <div>
            <h3 className="font-semibold mb-3">Photo Size</h3>
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
            <h3 className="font-semibold mb-3">Background Color</h3>
            <div className="flex gap-3">
              {BG_COLORS.map((c, i) => (
                <button
                  key={c.value}
                  className={`w-11 h-11 rounded-full border-2 transition-all hover:scale-110 ${
                    selectedBg === i
                      ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setSelectedBg(i)}
                  title={c.name}
                  aria-label={`Background: ${c.name}`}
                >
                  {selectedBg === i && (
                    <svg
                      className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md"
                      style={{ margin: "7px" }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Selected: <strong>{BG_COLORS[selectedBg].name}</strong>
            </p>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!sourceImage || stage === "processing"}
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
                Generating your ID photo...
              </span>
            ) : (
              "Generate ID Photo"
            )}
          </Button>

          {stage === "processing" && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 mt-1.5 text-center">{progress}%</p>
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
              <p className="text-sm text-gray-500 font-medium">Original</p>
              <div className="rounded-lg border overflow-hidden bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Original uploaded photo"
                  className="max-w-full mx-auto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">
                ID Photo ({ID_PHOTO_SIZES[selectedSize].name}
                {ID_PHOTO_SIZES[selectedSize].label &&
                  ` — ${ID_PHOTO_SIZES[selectedSize].label}`})
              </p>
              <div className="rounded-lg border-2 border-blue-200 overflow-hidden bg-white">
                <img
                  src={resultUrl}
                  alt="Generated ID photo result"
                  className="max-w-full mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Download + Reset Actions */}
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
                setSourceImage(null);
                setPreviewUrl(null);
                setResultUrl(null);
                setStage("idle");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Start Over
            </Button>
          </div>
        </Card>
      )}

      {/* Hidden canvases for processing */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      <canvas ref={previewCanvasRef} className="hidden" aria-hidden="true" />

      {/* Privacy Note */}
      <p className="text-center text-xs text-gray-400 max-w-md mx-auto">
        🔒 All processing happens in your browser. Your photos are never uploaded
        to any server.
      </p>
    </div>
  );
}

export default IDPhotoTool;
