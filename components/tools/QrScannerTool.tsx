import { useCallback, useEffect, useRef, useState } from "react";
import { QrCode, Camera, CameraOff, Upload, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Detected {
  rawValue: string;
  format: string;
}

interface Detector {
  detect: (source: CanvasImageSource) => Promise<Detected[]>;
}

function getDetector(): Detector | null {
  if (typeof window === "undefined") return null;
  const B = (window as unknown as { BarcodeDetector?: new (opts?: { formats?: string[] }) => Detector })
    .BarcodeDetector;
  if (!B) return null;
  try {
    return new B({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

export default function QrScannerTool() {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(getDetector() !== null);
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = async () => {
    setError("");
    const detector = getDetector();
    if (!detector) {
      setError("Your browser does not support the native BarcodeDetector API. Try Chrome or Edge, or use image upload below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);

      const tick = async () => {
        const video = videoRef.current;
        if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
          try {
            const found = await detector.detect(video);
            if (found.length) {
              const value = found[0].rawValue;
              setResults((r) => (r.includes(value) ? r : [value, ...r].slice(0, 20)));
            }
          } catch {
            /* transient detect error — keep scanning */
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Could not access the camera. Check browser permissions.");
    }
  };

  const scanImage = async (file: File) => {
    setError("");
    const detector = getDetector();
    if (!detector) {
      setError("Image decoding needs the native BarcodeDetector API (Chrome/Edge).");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const found = await detector.detect(bitmap);
      if (found.length) {
        setResults((r) => [...new Set([...found.map((f) => f.rawValue), ...r])].slice(0, 20));
        toast.success("QR code detected");
      } else {
        toast.error("No QR code found in that image");
      }
    } catch {
      toast.error("Could not read that image");
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {supported === false && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            This browser doesn't expose the native <code>BarcodeDetector</code> API, so QR decoding
            isn't available here. It works in Chrome and Edge (desktop and Android). You can still use
            the QR Code Generator tool.
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" /> Camera Scan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-black/90">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
                  Camera preview
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {scanning ? (
              <Button variant="outline" className="w-full gap-2" onClick={stopCamera}>
                <CameraOff className="h-4 w-4" /> Stop camera
              </Button>
            ) : (
              <Button className="w-full gap-2" onClick={startCamera} disabled={supported === false}>
                <Camera className="h-4 w-4" /> Start camera
              </Button>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> From Image
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) scanImage(f);
                e.target.value = "";
              }}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Upload a screenshot or photo containing a QR code. Decoding happens locally.
            </p>

            <div className="space-y-2">
              <div className="text-sm font-medium">Results</div>
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No codes detected yet.</p>
              ) : (
                results.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border p-2">
                    <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 break-all font-mono text-xs">{r}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(r)} aria-label="Copy">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">About QR Scanning</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Uses the browser's built-in barcode detection, so no image is uploaded and no third-party
            service is involved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
