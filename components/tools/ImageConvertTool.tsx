import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImageConvertTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [resultUrl, setResultUrl] = useState<string>("");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleConvert = useCallback(() => {
    if (!file || !previewUrl) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const mime = `image/${format}`;
      const url = canvas.toDataURL(mime);
      setResultUrl(url);
    };
    img.src = previewUrl;
  }, [file, previewUrl, format]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Convert Image Format</h1>
      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm" />
        </div>
        {previewUrl && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Output Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPEG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            <Button onClick={handleConvert} className="w-full">Convert Image</Button>
          </>
        )}
        {resultUrl && (
          <div className="space-y-2">
            <h3 className="font-medium">Result</h3>
            <img src={resultUrl} alt="Converted" className="max-w-full border rounded" />
            <a href={resultUrl} download={`converted.${format}`} className="inline-block mt-2 text-sm text-blue-600 underline">Download</a>
          </div>
        )}
      </Card>
    </div>
  );
}
