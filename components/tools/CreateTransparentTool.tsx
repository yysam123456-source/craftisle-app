import { useState, useCallback } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Label } from "@/components/ui/label";

function areColorsSimilar(
  color1: [number, number, number],
  color2: [number, number, number],
  threshold: number
): boolean {
  const rDiff = Math.abs(color1[0] - color2[0]);
  const gDiff = Math.abs(color1[1] - color2[1]);
  const bDiff = Math.abs(color1[2] - color2[2]);
  const similarity = ((rDiff + gDiff + bDiff) / (255 * 3)) * 100;
  return similarity <= threshold;
}

function createTransparent(
  file: File,
  fromColor: [number, number, number],
  similarity: number,
  bgRgb: [number, number, number]
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const currentColor: [number, number, number] = [
            data[i],
            data[i + 1],
            data[i + 2],
          ];
          if (areColorsSimilar(currentColor, fromColor, similarity)) {
            data[i] = bgRgb[0];
            data[i + 1] = bgRgb[1];
            data[i + 2] = bgRgb[2];
            data[i + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "") + "-transparent.png",
              { type: "image/png" }
            );
            resolve(newFile);
          } else {
            reject(new Error("Failed to create blob"));
          }
        }, "image/png");
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function CreateTransparentTool() {
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [fromColor, setFromColor] = useState("#ffffff");
  const [similarity, setSimilarity] = useState(10);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInput(file);
    setResult(null);
  }, []);

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [255, 255, 255];
  };

  const handleProcess = async () => {
    if (!input) return;
    setIsProcessing(true);
    try {
      const fromRgb = hexToRgb(fromColor);
      const bgRgb = hexToRgb(backgroundColor);
      const output = await createTransparent(input, fromRgb, similarity, bgRgb);
      setResult(output);
    } catch (err) {
      console.error(err);
      alert("Error processing image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Column */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Input</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input">Upload Image</Label>
            <Input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>
          {input && (
            <div className="text-sm text-gray-600">
              <p>File: {input.name}</p>
              <p>Size: {(input.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
      </Card>

      {/* Output Column */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Output</h3>
        <div className="space-y-4">
          {result && (
            <div className="text-sm text-gray-600">
              <p>File: {result.name}</p>
              <p>Size: {(result.size / 1024).toFixed(2)} KB</p>
            </div>
          )}
          {result && (
            <Button onClick={handleDownload} className="w-full">
              Download Result
            </Button>
          )}
          {!result && !isProcessing && (
            <p className="text-gray-400 text-sm">Process an image to see result</p>
          )}
          {isProcessing && (
            <p className="text-blue-600 text-sm">Processing...</p>
          )}
        </div>
      </Card>

      {/* Options Column */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">Options</h3>
        <div className="space-y-4">
          <div>
            <Label>From Color (color to replace)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="color"
                value={fromColor}
                onChange={(e) => setFromColor(e.target.value)}
                className="w-12 h-10"
              />
              <Input
                type="text"
                value={fromColor}
                onChange={(e) => setFromColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <Label>Similarity: {similarity}%</Label>
            <Input
              type="range"
              min="0"
              max="100"
              value={similarity}
              onChange={(e) => setSimilarity(parseInt(e.target.value))}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Match this % of similar colors. For example, 10% white will match white and light gray.
            </p>
          </div>

          <div>
            <Label>Background Color (replacement color)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-12 h-10"
              />
              <Input
                type="text"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>

          <Button onClick={handleProcess} disabled={!input || isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Create Transparent PNG"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
