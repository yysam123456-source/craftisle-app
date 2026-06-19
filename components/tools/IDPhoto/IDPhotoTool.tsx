"use client";

import { useState, useCallback, useRef } from "react";
import { loadModel, runInference, applyMatting, resizeToTarget, ID_PHOTO_SIZES, BG_COLORS } from "@/lib/idphoto/inference";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { constructMetadata } from "@/lib/utils";

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
      alert("模型加载失败，请刷新重试");
      setStage("idle");
    }
  }, []);

  // Handle file upload
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
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

    try {
      const mask = await runInference(sourceImage, (stage, p) => {
        if (stage === "preprocess") setProgress(Math.round(p * 0.3));
        if (stage === "inference") setProgress(Math.round(30 + p * 0.5));
        if (stage === "postprocess") setProgress(30 + 50 + Math.round(p * 0.2));
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
      alert("处理失败：" + (e as Error).message);
      setStage("ready");
    }
  }, [sourceImage, selectedBg, selectedSize]);

  // Download result
  const handleDownload = useCallback(() => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `id-photo-${ID_PHOTO_SIZES[selectedSize].name}.jpg`;
    a.click();
  }, [resultUrl, selectedSize]);

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition"
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
              <p className="text-green-600 font-medium">✅ 已选择照片</p>
              <p className="text-sm text-gray-500 mt-1">
                {sourceImage.width} × {sourceImage.height}px
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-700">点击上传照片</p>
              <p className="text-sm text-gray-500 mt-1">支持 JPG / PNG，正面免冠照片效果最佳</p>
            </div>
          )}
        </div>
      </Card>

      {/* Model Loading */}
      {stage === "loading-model" && (
        <Card className="p-6">
          <p className="font-medium mb-2">正在加载 AI 模型...</p>
          <Progress value={modelProgress} />
          <p className="text-sm text-gray-500 mt-2">{modelProgress}% （仅首次需要，~25MB）</p>
        </Card>
      )}

      {/* Settings */}
      {stage !== "idle" && stage !== "loading-model" && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="font-medium mb-3">证件照尺寸</h3>
            <div className="grid grid-cols-3 gap-2">
              {ID_PHOTO_SIZES.map((s, i) => (
                <button
                  key={s.name}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    selectedSize === i
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedSize(i)}
                >
                  {s.name}
                  <br />
                  <span className="text-xs text-gray-500">
                    {s.width}×{s.height}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">背景颜色</h3>
            <div className="flex gap-2">
              {BG_COLORS.map((c, i) => (
                <button
                  key={c.value}
                  className={`w-10 h-10 rounded-full border-2 ${
                    selectedBg === i ? "border-blue-500" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setSelectedBg(i)}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!sourceImage || stage === "processing"}
            className="w-full"
          >
            {stage === "processing" ? "处理中..." : "开始制作证件照"}
          </Button>

          {stage === "processing" && (
            <Progress value={progress} />
          )}
        </Card>
      )}

      {/* Result Preview */}
      {stage === "done" && previewUrl && resultUrl && (
        <Card className="p-6 space-y-4">
          <h3 className="font-medium">制作完成！</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">原始照片</p>
              <img
                src={previewUrl}
                alt="preview"
                className="rounded-lg border max-w-full"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">
                证件照 ({ID_PHOTO_SIZES[selectedSize].name})
              </p>
              <img
                src={resultUrl}
                alt="result"
                className="rounded-lg border max-w-full"
              />
            </div>
          </div>
          <Button onClick={handleDownload} className="w-full">
            下载证件照
          </Button>
        </Card>
      )}

      {/* Hidden canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />
    </div>
  );
}
