import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImageRotateTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [rotation, setRotation] = useState(90);
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleRotate = useCallback(() => {
    if (!file || !previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const rad = (rotation * Math.PI) / 180;
      if (rotation % 180 === 90 || rotation % 180 === -90) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext("2d")!;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const url = canvas.toDataURL(file.type || "image/png");
      setResultUrl(url);
    };
    img.src = previewUrl;
  }, [file, previewUrl, rotation]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Rotate Image</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {previewUrl && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Rotation (degrees)</label>
              <input
                type="number"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setRotation(90); setTimeout(handleRotate, 0); }} className="flex-1">Rotate 90°</Button>
              <Button onClick={() => { setRotation(-90); setTimeout(handleRotate, 0); }} className="flex-1">Rotate -90°</Button>
              <Button onClick={() => { setRotation(180); setTimeout(handleRotate, 0); }} className="flex-1">Rotate 180°</Button>
            </div>
          </>
        )}
        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Rotated" className="max-w-full border rounded" />
            <a href={resultUrl} download="rotated.png" className="inline-block mt-2 text-sm text-blue-600 underline">Download</a>
          </div>
        )}
      </Card>
    </div>
  );
}
