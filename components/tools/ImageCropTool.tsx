import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImageCropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropW, setCropW] = useState(100);
  const [cropH, setCropH] = useState(100);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleCrop = useCallback(() => {
    if (!previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      const url = canvas.toDataURL(file?.type || "image/png");
      setResultUrl(url);
    };
    img.src = previewUrl;
  }, [previewUrl, file, cropX, cropY, cropW, cropH]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Crop Image</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {previewUrl && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">X (px)</label>
                <input type="number" value={cropX} onChange={(e) => setCropX(parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Y (px)</label>
                <input type="number" value={cropY} onChange={(e) => setCropY(parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Width (px)</label>
                <input type="number" value={cropW} onChange={(e) => setCropW(parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (px)</label>
                <input type="number" value={cropH} onChange={(e) => setCropH(parseInt(e.target.value) || 0)} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <Button onClick={handleCrop} className="w-full">Crop Image</Button>
          </>
        )}
        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Cropped" className="max-w-full border rounded" />
            <a href={resultUrl} download="cropped.png" className="inline-block mt-2 text-sm text-blue-600 underline">Download</a>
          </div>
        )}
      </Card>
    </div>
  );
}
