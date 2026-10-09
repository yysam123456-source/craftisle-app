import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Mode = "quality" | "target";

const kbToBytes = (kb: number) => Math.round(kb * 1024);

/**
 * 在 canvas 上二分搜索 quality，找出满足「体积 ≤ 目标字节」的最高质量。
 * 每次迭代是一次 toBlob 回调，故用 Promise 包装。最多 9 轮，精度足够。
 */
function encodeAtQuality(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
}

export default function ImageCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [mode, setMode] = useState<Mode>("quality");
  const [quality, setQuality] = useState(80);
  const [targetKb, setTargetKb] = useState(100);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [resultSize, setResultSize] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string>("");

  const reset = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl("");
    setResultSize(0);
    setNote("");
  }, [resultUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      reset();
      setFile(f);
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(f);
    },
    [reset]
  );

  const run = useCallback(async () => {
    if (!file || !previewUrl) return;
    setBusy(true);
    reset();

    const img = new window.Image();
    img.src = previewUrl;
    await img.decode().catch(() => undefined);
    if (!img.width || !img.height) {
      setBusy(false);
      setNote("Could not decode this image. HEIC and some RAW files need a converter first.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setBusy(false);
      return;
    }
    // 先铺白底：JPEG 无 alpha 通道，直接 drawImage 会让透明区域变黑。
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    let blob: Blob | null = null;

    if (mode === "quality") {
      blob = await encodeAtQuality(canvas, quality / 100);
    } else {
      const target = kbToBytes(targetKb);
      let lo = 0.05;
      let hi = 0.95;
      let best: Blob | null = null;
      // 二分：每次取中点质量，体积超标就降质量，不达标就升质量并记下当前结果。
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        const candidate = await encodeAtQuality(canvas, mid);
        if (!candidate) break;
        if (candidate.size <= target) {
          best = candidate;
          lo = mid;
        } else {
          hi = mid;
        }
        // 已经贴着上限且再调也不会更小，提前收手。
        if (best && best.size >= target * 0.97) break;
      }
      blob = best;
      if (!blob) {
        setBusy(false);
        setNote(
          `Could not reach ${targetKb} KB at these dimensions. Resize the image first — a smaller canvas is the only way to hit a very small target.`
        );
        return;
      }
      if (blob.size > target) {
        setNote(`Closest achievable size was ${(blob.size / 1024).toFixed(1)} KB.`);
      }
    }

    if (!blob) {
      setBusy(false);
      setNote("Compression failed in this browser. Try a different image.");
      return;
    }

    const url = URL.createObjectURL(blob);
    setResultUrl(url);
    setResultSize(blob.size);
    setBusy(false);
  }, [file, previewUrl, mode, quality, targetKb, reset]);

  const originalKb = file ? file.size / 1024 : 0;
  const ratio = resultSize > 0 && originalKb > 0 ? (1 - resultSize / (originalKb * 1024)) * 100 : 0;
  const isPngInput = file?.type === "image/png";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Compress Image — Reduce Image Size to a Target KB</h1>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
          {file && (
            <p className="text-xs text-muted-foreground mt-1">
              {file.name} — {originalKb.toFixed(1)} KB
            </p>
          )}
        </div>

        {previewUrl && (
          <>
            <div className="flex gap-2">
              <Button
                variant={mode === "quality" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("quality")}
              >
                Adjust quality
              </Button>
              <Button
                variant={mode === "target" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("target")}
              >
                Compress to exact size
              </Button>
            </div>

            {mode === "quality" ? (
              <div>
                <label className="block text-sm font-medium mb-1">Quality: {quality}%</label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target file size: {targetKb} KB
                </label>
                <input
                  type="range"
                  min={20}
                  max={2000}
                  step={10}
                  value={targetKb}
                  onChange={(e) => setTargetKb(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use this when an upload form rejects anything above a fixed limit — 100 KB, 200 KB,
                  500 KB, 1 MB. Quality is lowered automatically until the file fits.
                </p>
              </div>
            )}

            {isPngInput && (
              <p className="text-xs text-muted-foreground">
                This PNG has transparency. Output is JPG, so transparent areas are filled white.
              </p>
            )}

            <Button onClick={run} disabled={busy} className="w-full">
              {busy ? "Compressing…" : mode === "target" ? `Compress to ${targetKb} KB` : "Compress Image"}
            </Button>
          </>
        )}

        {note && <p className="text-sm text-amber-600">{note}</p>}

        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Compressed" className="max-w-full border rounded" />
            <p className="text-sm text-muted-foreground">
              {(resultSize / 1024).toFixed(1)} KB — {ratio > 0 ? `${ratio.toFixed(0)}% smaller` : "no change"}
              {mode === "target" ? ` (target ${targetKb} KB)` : ""}
            </p>
            <a href={resultUrl} download="compressed.jpg" className="inline-block mt-2 text-sm text-blue-600 underline">
              Download
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}