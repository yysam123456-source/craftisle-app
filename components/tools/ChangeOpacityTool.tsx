import { useState, useCallback } from "react";
import { Card, Button, Textarea } from "@/components/ui";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";

interface OpacityOptions {
  opacity: number;
  mode: "solid" | "gradient";
  gradientType: "linear" | "radial";
  gradientDirection: "left-to-right" | "inside-out";
  areaLeft: number;
  areaTop: number;
  areaWidth: number;
  areaHeight: number;
}

function changeOpacity(file: File, options: OpacityOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not supported"));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;

        if (options.mode === "solid") {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = options.opacity;
          ctx.drawImage(img, 0, 0);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          let gradient: CanvasGradient;
          if (options.gradientType === "linear") {
            const { areaLeft, areaTop, areaWidth } = options;
            gradient = ctx.createLinearGradient(
              areaLeft,
              areaTop,
              areaLeft + areaWidth,
              areaTop
            );
            gradient.addColorStop(0, `rgba(255,255,255,${options.opacity})`);
            gradient.addColorStop(1, "rgba(255,255,255,0)");
          } else {
            const { areaLeft, areaTop, areaWidth, areaHeight } = options;
            const centerX = areaLeft + areaWidth / 2;
            const centerY = areaTop + areaHeight / 2;
            const radius = Math.min(areaWidth, areaHeight) / 2;
            gradient = ctx.createRadialGradient(
              centerX, centerY, 0,
              centerX, centerY, radius
            );
            if (options.gradientDirection === "inside-out") {
              gradient.addColorStop(0, `rgba(255,255,255,${options.opacity})`);
              gradient.addColorStop(1, "rgba(255,255,255,0)");
            } else {
              gradient.addColorStop(0, "rgba(255,255,255,0)");
              gradient.addColorStop(1, `rgba(255,255,255,${options.opacity})`);
            }
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(options.areaLeft, options.areaTop, options.areaWidth, options.areaHeight);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, { type: file.type });
            resolve(newFile);
          } else {
            reject(new Error("Failed to generate image blob"));
          }
        }, file.type);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function ChangeOpacityTool() {
  const [input, setInput] = useState<File | null>(null);
  const [result, setResult] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [opacity, setOpacity] = useState(0.5);
  const [mode, setMode] = useState<"solid" | "gradient">("solid");
  const [gradientType, setGradientType] = useState<"linear" | "radial">("linear");
  const [gradientDirection, setGradientDirection] = useState<"left-to-right" | "inside-out">("left-to-right");
  const [areaLeft, setAreaLeft] = useState(0);
  const [areaTop, setAreaTop] = useState(0);
  const [areaWidth, setAreaWidth] = useState(100);
  const [areaHeight, setAreaHeight] = useState(100);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInput(file);
    setResult(null);
  }, []);

  const handleProcess = async () => {
    if (!input) return;
    setIsProcessing(true);
    try {
      const options: OpacityOptions = {
        opacity,
        mode,
        gradientType,
        gradientDirection,
        areaLeft,
        areaTop,
        areaWidth,
        areaHeight,
      };
      const output = await changeOpacity(input, options);
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
            <Label>Opacity: {opacity}</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Mode</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as "solid" | "gradient")} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="solid" id="solid" />
                <Label htmlFor="solid">Solid Opacity</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gradient" id="gradient" />
                <Label htmlFor="gradient">Gradient Opacity</Label>
              </div>
            </RadioGroup>
          </div>

          {mode === "gradient" && (
            <>
              <div>
                <Label>Gradient Type</Label>
                <RadioGroup value={gradientType} onValueChange={(v) => setGradientType(v as "linear" | "radial")} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="linear" id="linear" />
                    <Label htmlFor="linear">Linear</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="radial" id="radial" />
                    <Label htmlFor="radial">Radial</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Gradient Direction</Label>
                <RadioGroup value={gradientDirection} onValueChange={(v) => setGradientDirection(v as "left-to-right" | "inside-out")} className="mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="left-to-right" id="l2r" />
                    <Label htmlFor="l2r">Left to Right</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inside-out" id="i2o" />
                    <Label htmlFor="i2o">Inside Out</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Area Left</Label>
                  <Input type="number" value={areaLeft} onChange={(e) => setAreaLeft(parseInt(e.target.value))} />
                </div>
                <div>
                  <Label>Area Top</Label>
                  <Input type="number" value={areaTop} onChange={(e) => setAreaTop(parseInt(e.target.value))} />
                </div>
                <div>
                  <Label>Area Width</Label>
                  <Input type="number" value={areaWidth} onChange={(e) => setAreaWidth(parseInt(e.target.value))} />
                </div>
                <div>
                  <Label>Area Height</Label>
                  <Input type="number" value={areaHeight} onChange={(e) => setAreaHeight(parseInt(e.target.value))} />
                </div>
              </div>
            </>
          )}

          <Button onClick={handleProcess} disabled={!input || isProcessing} className="w-full">
            {isProcessing ? "Processing..." : "Apply Opacity"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
