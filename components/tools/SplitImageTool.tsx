import { useState, useCallback } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Label } from "@/components/ui/label";

interface SplitOptions {
  tileWidth: number;
  tileHeight: number;
}

function splitImageToFiles(
  file: File,
  options: SplitOptions
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const { tileWidth, tileHeight } = options;
        const horParts = Math.ceil(width / tileWidth);
        const verParts = Math.ceil(height / tileHeight);

        const promises: Promise<File>[] = [];

        for (let y = 0; y < verParts; y++) {
          for (let x = 0; x < horParts; x++) {
            const tileW = Math.min(tileWidth, width - x * tileWidth);
            const tileH = Math.min(tileHeight, height - y * tileHeight);

            const canvas = document.createElement("canvas");
            canvas.width = tileW;
            canvas.height = tileH;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Canvas not supported"));
              return;
            }

            ctx.drawImage(
              img,
              x * tileWidth,
              y * tileHeight,
              tileW,
              tileH,
              0,
              0,
              tileW,
              tileH
            );

            promises.push(
              new Promise<File>((resolveCanvas) => {
                canvas.toBlob((blob) => {
                  if (blob) {
                    const file = new File(
                      [blob],
                      `part-${x}-${y}.png`,
                      { type: "image/png" }
                    );
                    resolveCanvas(file);
                  }
                }, "image/png");
              })
            );
          }
        }

        Promise.all(promises).then(resolve).catch(reject);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function SplitImageTool() {
  const [input, setInput] = useState<File | null>(null);
  const [results, setResults] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tileWidth, setTileWidth] = useState(100);
  const [tileHeight, setTileHeight] = useState(100);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInput(file);
    setResults([]);
  }, []);

  const handleProcess = async () => {
    if (!input) return;
    setIsProcessing(true);
    try {
      const options: SplitOptions = { tileWidth, tileHeight };
      const files = await splitImageToFiles(input, options);
      setResults(files);
    } catch (err) {
      console.error(err);
      alert("Error processing image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAll = () => {
    results.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
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
          {results.length > 0 && (
            <div className="text-sm text-gray-600">
              <p>Split into {results.length} parts</p>
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {results.map((file, index) => (
                  <li key={index} className="text-xs">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </li>
                ))}
              </ul>
            </div>
          )}
          {results.length > 0 && (
            <Button onClick={handleDownloadAll} className="w-full">
              Download All Parts ({results.length} files)
            </Button>
          )}
          {results.length === 0 && !isProcessing && (
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tile Width (px)</Label>
              <Input
                type="number"
                min="1"
                value={tileWidth}
                onChange={(e) => setTileWidth(parseInt(e.target.value) || 100)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Tile Height (px)</Label>
              <Input
                type="number"
                min="1"
                value={tileHeight}
                onChange={(e) => setTileHeight(parseInt(e.target.value) || 100)}
                className="mt-1"
              />
            </div>
          </div>

          <p className="text-sm text-gray-500">
            The image will be split into tiles of the specified width and height.
            Each tile will be saved as a separate PNG file.
          </p>

          <Button onClick={handleProcess} disabled={!input || isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Split Image"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
