import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ImageResizeTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);
  const [keepAspect, setKeepAspect] = useState(true);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = reader.result as string;
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(f);
  }, []);

  const handleResize = useCallback(() => {
    if (!file || !previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const url = canvas.toDataURL(file.type || "image/png");
      setResultUrl(url);
    };
    img.src = previewUrl;
  }, [file, previewUrl, width, height]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Resize Image</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {previewUrl && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Width (px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => {
                    const newW = parseInt(e.target.value) || 0;
                    setWidth(newW);
                    if (keepAspect && file) {
                      const img = new window.Image();
                      img.onload = () => setHeight(Math.round((newW * img.height) / img.width));
                      img.src = previewUrl;
                    }
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Height (px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => {
                    const newH = parseInt(e.target.value) || 0;
                    setHeight(newH);
                    if (keepAspect && file) {
                      const img = new window.Image();
                      img.onload = () => setWidth(Math.round((newH * img.width) / img.height));
                      img.src = previewUrl;
                    }
                  }}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
              Keep aspect ratio
            </label>
            <Button onClick={handleResize} className="w-full">Resize Image</Button>
          </>
        )}
        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Resized" className="max-w-full border rounded" />
            <a href={resultUrl} download="resized.png" className="inline-block mt-2 text-sm text-blue-600 underline">Download</a>
          </div>
        )}
      </Card>
    </div>
  );
}
