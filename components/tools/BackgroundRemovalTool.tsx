"use client";

import { useState, useCallback, useRef } from "react";
import {
  removeBackgroundML,
  preloadModel,
  removeBackground,
  applyBackground,
  removeBackgroundRMBG,
  preloadRMBG,
} from "@/lib/idphoto/inference";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BG_COLORS = [
  { name: "Transparent", value: null },
  { name: "White", value: "#ffffff" },
  { name: "Blue", value: "#438edb" },
  { name: "Red", value: "#d9001b" },
  { name: "Light Blue", value: "#1a73e8" },
  { name: "Light Gray", value: "#f0f0f0" },
  { name: "Black", value: "#000000" },
  { name: "Green", value: "#22c55e" },
];

export default function BackgroundRemovalTool() {
  const [stage, setStage] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [sourceImageData, setSourceImageData] = useState<ImageData | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [useAI, setUseAI] = useState(true);
  const [selectedModel, setSelectedModel] = useState<"standard" | "high-prec">("standard");
  const [selectedBg, setSelectedBg] = useState(0); // default transparent
  const [tolerance, setTolerance] = useState(40);
  const [outputFormat, setOutputFormat] = useState<"png" | "webp">("png");

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setResultUrl(null); // Clear previous result
        };
        img.src = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Process image
  const handleProcess = useCallback(async () => {
    if (!sourceImageData) return;
    setStage("processing");
    setProgress(0);
    setProgressLabel("");
    setError(null);

    try {
      let withAlpha: ImageData;

      if (useAI) {
        try {
          if (selectedModel === "high-prec") {
            setProgressLabel("Loading high-precision model…");
            withAlpha = await removeBackgroundRMBG(sourceImageData, {
              onProgress: (p) => {
                setProgress(p);
                if (p < 30) setProgressLabel("Loading high-precision model (RMBG-1.4)…");
                else if (p < 85) setProgressLabel("Removing background with high precision…");
                else setProgressLabel("Finalizing…");
              },
            });
          } else {
            setProgressLabel("Loading AI model…");
            withAlpha = await removeBackgroundML(sourceImageData, {
              onProgress: (p) => {
                setProgress(p);
                if (p < 30) setProgressLabel("Loading AI model…");
                else if (p < 85) setProgressLabel("Removing background with AI…");
                else setProgressLabel("Finalizing…");
              },
            });
          }
        } catch (mlErr: any) {
          console.warn("ML background removal failed:", mlErr);
          // If user explicitly chose high-prec, show error instead of silent fallback
          if (selectedModel === "high-prec") {
            throw new Error(
              `High-precision model failed to load: ${mlErr?.message || mlErr}. ` +
              `Try selecting "Standard" model instead.`
            );
          }
          setProgressLabel("AI unavailable, using fast mode…");
          withAlpha = removeBackground(sourceImageData, {
            tolerance,
            onProgress: (p) => setProgress(Math.round(10 + p * 0.3)),
          });
        }
      } else {
        setProgressLabel("Removing background…");
        withAlpha = removeBackground(sourceImageData, {
          tolerance,
          onProgress: (p) => setProgress(Math.round(p * 0.5)),
        });
      }

      // Apply background or keep transparent
      setProgress(88);
      setProgressLabel("Compositing result…");

      const bgColor = BG_COLORS[selectedBg].value;
      let finalData: ImageData;

      if (bgColor === null) {
        // Transparent output — keep alpha channel
        finalData = withAlpha;
      } else {
        finalData = applyBackground(withAlpha, bgColor);
      }

      // Render to canvas and create download URL
      setProgress(95);
      const outCanvas = document.createElement("canvas");
      outCanvas.width = finalData.width;
      outCanvas.height = finalData.height;
      const ctx = outCanvas.getContext("2d")!;
      ctx.putImageData(finalData, 0, 0);

      const mimeType = outputFormat === "png" ? "image/png" : "image/webp";
      const quality = outputFormat === "webp" ? 0.92 : undefined;
      setResultUrl(outCanvas.toDataURL(mimeType, quality));

      setProgress(100);
      setProgressLabel("Done!");
      setStage("done");
    } catch (e) {
      console.error(e);
      setError(`Processing failed: ${(e as Error).message}`);
      setStage("ready");
    }
  }, [sourceImageData, useAI, selectedModel, selectedBg, tolerance, outputFormat]);

  // Download
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `no-background.${outputFormat}`;
    a.click();
  }, [resultUrl, outputFormat]);

  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Upload Area */}
      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors group"
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
            <div className="space-y-3">
              <img
                src={sourceImage.src}
                alt="Uploaded image"
                className="max-h-48 mx-auto rounded-lg shadow-sm"
              />
              <p className="text-sm text-green-600 font-medium">
                ✓ {sourceImage.naturalWidth} × {sourceImage.naturalHeight}px — Click to replace
              </p>
            </div>
          ) : (
            <div className="py-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors mb-3"
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
              <p className="text-lg font-medium text-gray-700">Upload an image</p>
              <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP — Any background works</p>
            </div>
          )}
        </div>
      </Card>

      {/* Settings + Process Button */}
      {stage !== "idle" && (
        <Card className="p-6 space-y-5">
          {/* Output Background Color */}
          <div>
            <Label className="font-semibold mb-3 block">Output Background</Label>
            <div className="flex flex-wrap gap-3 items-center">
              {BG_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  className={`w-11 h-11 rounded-full border-2 transition-all hover:scale-110 relative flex items-center justify-center ${
                    selectedBg === i
                      ? "border-blue-500 shadow-md ring-2 ring-blue-100"
                      : c.value === null
                        ? "border-gray-300 bg-gradient-to-br from-white via-gray-100 to-gray-300 hover:border-gray-400"
                        : "border-gray-300 hover:border-gray-400"
                  }`}
                  style={c.value !== null ? { backgroundColor: c.value } : undefined}
                  onClick={() => setSelectedBg(i)}
                  title={c.name}
                  aria-label={`Background: ${c.name}`}
                >
                  {c.value === null && (
                    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">{BG_COLORS[selectedBg].name}</p>
          </div>

          {/* Format Selection */}
          <div>
            <Label className="font-semibold mb-2 block">Output Format</Label>
            <div className="flex gap-2">
              {(["png", "webp"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setOutputFormat(fmt)}
                  className={`px-4 py-1.5 rounded-md border text-sm font-medium transition-all ${
                    outputFormat === fmt
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {fmt.toUpperCase()}{fmt === "png" && selectedBg === 0 ? " (transparent)" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 select-none">
              Advanced Options
              <svg className="ml-1 inline h-4 w-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </summary>
            <div className="mt-3 space-y-3 pl-2 border-l-2 border-gray-100">

              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">AI Model</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedModel("standard")}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                      selectedModel === "standard"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="font-medium">Standard</div>
                    <div className="text-xs text-gray-500">ISNet · ~5MB · Fast</div>
                  </button>
                  <button
                    onClick={() => setSelectedModel("high-prec")}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                      selectedModel === "high-prec"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-200 hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <div className="font-medium">High Precision</div>
                    <div className="text-xs text-gray-500">RMBG-1.4 · ~170MB · Best quality</div>
                  </button>
                </div>
              </div>

              {/* AI Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg border border-purple-100">
                <Switch checked={useAI} onCheckedChange={setUseAI} />
                <div>
                  <Label className="text-sm font-medium">✨ AI Background Removal</Label>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Uses ML model for professional results with any photo.
                    First use downloads ~5MB model (~once).
                  </p>
                </div>
              </div>

              {!useAI && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Sensitivity (legacy mode)</Label>
                    <span className="text-xs text-gray-500">{tolerance}</span>
                  </div>
                  <Slider
                    value={[tolerance]}
                    onValueChange={([v]) => setTolerance(v)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full max-w-sm"
                  />
                </div>
              )}
            </div>
          </details>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!sourceImageData || stage === "processing"}
            size="lg"
            className="w-full text-base py-5"
          >
            {stage === "processing" ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {progressLabel || "Processing…"}
              </span>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M16 4H4a2 2 0 00-2 2v12a2 2 0 002 2h12" />
                </svg>
                Remove Background{useAI ? " (AI)" : ""}
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
      {stage === "done" && resultUrl && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Background Removed!</h3>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ✓ Done
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Original</p>
              <div className="rounded-lg border overflow-hidden bg-gray-50 p-1">
                {sourceImage && (
                  <img src={sourceImage.src} alt="Original" className="max-w-full mx-auto rounded" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500 font-medium">Result ({outputFormat.toUpperCase()})</p>
              <div
                className="rounded-lg border-2 border-green-200 overflow-hidden p-1 min-h-[120px] flex items-center justify-center"
                style={
                  BG_COLORS[selectedBg]?.value === null
                    ? { backgroundImage: "repeating-conic-gradient(#ddd 0% 25%, #eee 0% 50%) 50% / 16px 16px" }
                    : { backgroundColor: "#fff" }
                }
              >
                <img src={resultUrl} alt="Result" className="max-w-full mx-auto rounded" />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download {outputFormat.toUpperCase()}
            </Button>
            <Button variant="outline" size="lg" onClick={() => { setResultUrl(null); setStage("ready"); }}>
              Try Again
            </Button>
            <Button variant="outline" size="lg" onClick={() => {
              setSourceImage(null);
              setSourceImageData(null);
              setResultUrl(null);
              setStage("idle");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}>
              New Image
            </Button>
          </div>
        </Card>
      )}

      {/* Privacy note */}
      <p className="text-center text-xs text-gray-400 max-w-md mx-auto">
        🔒{" "}
        {useAI ? (
          selectedModel === "high-prec" ? (
            <>High-precision processing uses <strong>RMBG-1.4</strong> model (~170MB, downloaded once, cached locally). Your images are never uploaded.</>
          ) : (
            <>AI processing runs in your browser using ONNX Runtime. Your images are never uploaded. A ~5MB model is downloaded once and cached locally.</>
          )
        ) : (
          <>All processing happens in your browser using Canvas API. Your images are never uploaded.</>
        )}
      </p>
    </div>
  );
}
