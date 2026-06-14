import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImageCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [quality, setQuality] = useState(80);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleCompress = useCallback(() => {
    if (!file || !previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setResultUrl(url);
        },
        "image/jpeg",
        quality / 100
      );
    };
    img.src = previewUrl;
  }, [file, previewUrl, quality]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Compress Image</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {previewUrl && (
          <>
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
            <Button onClick={handleCompress} className="w-full">Compress Image</Button>
          </>
        )}
        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Compressed" className="max-w-full border rounded" />
            <a href={resultUrl} download="compressed.jpg" className="inline-block mt-2 text-sm text-blue-600 underline">Download</a>
          </div>
        )}
      </Card>
    </div>
  );
}
