"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// TegakiRenderer props — matched to tegaki docs
interface TegakiRendererProps {
  font?: any;
  text?: string;
  time?: { mode: string; speed?: number; loop?: boolean };
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onComplete?: () => void;
  onChangeTimeline?: (timeline: unknown) => void;
  effects?: unknown;
  quality?: unknown;
  timing?: unknown;
  showOverlay?: boolean;
  direction?: string;
  shaper?: unknown;
  editable?: boolean;
  onTextChange?: (text: string) => void;
}

/** Imperative handle exposed by TegakiRenderer */
interface TegakiRendererHandle {
  readonly engine: {
    element: HTMLElement | null;
    duration: number;
    isPlaying: boolean;
    play(): void;
    pause(): void;
    seek(time: number | `${number}%`): void;
  } | null;
  readonly element: HTMLElement | null;
}

// Use local TypeScript source (lib/tegaki/) to bypass tegaki's "exports" field issue.
const TegakiRenderer = dynamic<TegakiRendererProps & { ref?: React.Ref<TegakiRendererHandle> }>(
  () => import("../../lib/tegaki/react").then((m: any) => ({ default: m.TegakiRenderer })),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading renderer...</p> }
);

// Font bundle URLs — served as static files from public/tegaki-fonts/
const FONT_BUNDLE_URLS: Record<string, string> = {
  "Caveat": "/tegaki-fonts/caveat-bundle.mjs",
  "Italianno": "/tegaki-fonts/italianno-bundle.mjs",
  "Tangerine": "/tegaki-fonts/tangerine-bundle.mjs",
  "Parisienne": "/tegaki-fonts/parisienne-bundle.mjs",
  "Suez One": "/tegaki-fonts/suez-one-bundle.mjs",
  "Klee One": "/tegaki-fonts/klee-one-bundle.mjs",
  "Amiri": "/tegaki-fonts/amiri-bundle.mjs",
  "Tillana": "/tegaki-fonts/tillana-bundle.mjs",
};

const FONT_NAMES = Object.keys(FONT_BUNDLE_URLS);

// Cache loaded bundles
const bundleCache = new Map<string, any>();

async function loadFontBundle(name: string): Promise<any> {
  if (bundleCache.has(name)) return bundleCache.get(name)!;
  const url = FONT_BUNDLE_URLS[name];
  // Use webpackIgnore so Next.js doesn't try to bundle this at build time.
  // The module is loaded at runtime from the public/ static path, which lets
  // import.meta.url resolve correctly inside the bundle (needed for .ttf font
  // file references).
  const mod = await import(/* webpackIgnore: true */ url);
  const bundle = mod.bundle ?? mod.default ?? mod;
  bundleCache.set(name, bundle);
  return bundle;
}

type SpeedMode = "slow" | "normal" | "fast";

export default function HandwritingAnimationTool() {
  const [text, setText] = useState("Hello World");
  const [fontIdx, setFontIdx] = useState(0);
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [loop, setLoop] = useState(true);
  const [fontSize, setFontSize] = useState(48);
  const [key, setKey] = useState(0); // force re-render to replay
  const [fontBundle, setFontBundle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const tegakiRef = useRef<TegakiRendererHandle>(null);

  const speedMap: Record<SpeedMode, number> = { slow: 0.5, normal: 1, fast: 2 };

  const replay = useCallback(() => setKey((k) => k + 1), []);

  // Load font bundle when fontIdx changes
  useEffect(() => {
    const name = FONT_NAMES[fontIdx];
    setLoading(true);
    loadFontBundle(name)
      .then((b) => { setFontBundle(b); setLoading(false); replay(); })
      .catch(() => { setLoading(false); });
  }, [fontIdx, replay]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontIdx(Number(e.target.value));
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpeed(e.target.value as SpeedMode);
    replay();
  };

  const handleLoopToggle = () => {
    setLoop((v) => !v);
    replay();
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(Number(e.target.value));
    replay();
  };

  // ── Export as WebM video using MediaRecorder + canvas.captureStream() ──
  const handleExport = useCallback(async () => {
    const handle = tegakiRef.current;
    if (!handle?.engine) return;

    setExporting(true);
    setExportProgress("Preparing…");

    try {
      // Get canvas from Tegaki container (data-tegaki="canvas")
      const engine = handle.engine;
      if (!engine) return;

      const container = engine.element;
      if (!container) throw new Error("Canvas not found");
      const canvas = container.querySelector<HTMLCanvasElement>('[data-tegaki="canvas"]');
      if (!canvas) throw new Error("Canvas element not found");

      const duration = engine.duration;
      if (!duration || duration <= 0) throw new Error("Animation has no duration");

      setExportProgress("Recording animation…");

      // Capture stream from canvas at 30fps
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 5_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      await new Promise<void>((resolve, reject) => {
        recorder.onstop = () => resolve();
        recorder.onerror = () => reject(new Error("MediaRecorder error"));

        // Seek to start, ensure loop is off for clean recording, then play
        engine.pause();
        engine.seek("0%");

        // Small delay to let seek take effect
        setTimeout(() => {
          recorder.start();
          engine.play();

          // Stop recording after animation completes (+ buffer)
          const recordDuration = duration * 1000 + 500;
          setTimeout(() => {
            try { recorder.stop(); } catch {}
            engine.pause();
            // Restore original state
            if (loop) engine.seek("0%");
          }, recordDuration);
        }, 100);
      });

      setExportProgress("Generating file…");

      // Assemble blob and download
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `handwriting-${FONT_NAMES[fontIdx] || "animation"}.webm`;
      a.click();
      URL.revokeObjectURL(url);

      setExportProgress("✅ Downloaded!");
      setTimeout(() => setExportProgress(""), 2000);
    } catch (err) {
      console.error("Export failed:", err);
      setExportProgress(`❌ Export failed: ${(err as Error).message}`);
      setTimeout(() => setExportProgress(""), 3000);
    } finally {
      setExporting(false);
    }
  }, [fontIdx]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label htmlFor="hw-text" className="text-sm font-medium">
            Text
          </label>
          <textarea
            id="hw-text"
            rows={3}
            value={text}
            onChange={handleTextChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Enter text to animate..."
          />
          <button
            onClick={replay}
            className="mt-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
          >
            ▶ Replay Animation
          </button>
        </div>

        <div className="space-y-1">
          <label htmlFor="hw-font" className="text-sm font-medium">
            Font
          </label>
          <select
            id="hw-font"
            value={fontIdx}
            onChange={handleFontChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {FONT_NAMES.map((name, i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>

          <label htmlFor="hw-speed" className="mt-3 block text-sm font-medium">
            Speed
          </label>
          <select
            id="hw-speed"
            value={speed}
            onChange={handleSpeedChange}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="hw-fontSize" className="text-sm font-medium">
            Font Size: {fontSize}px
          </label>
          <input
            id="hw-fontSize"
            type="range"
            min={24}
            max={120}
            value={fontSize}
            onChange={handleFontSizeChange}
            className="w-full"
          />

          <button
            onClick={handleLoopToggle}
            className={`mt-3 w-full rounded-md px-3 py-1.5 text-sm ${
              loop
                ? "bg-primary text-primary-foreground"
                : "border bg-background"
            }`}
          >
            {loop ? "🔁 Loop: ON" : "▶ Play Once"}
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Export</p>
          <button
            onClick={handleExport}
            disabled={exporting || loading || !fontBundle}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download WebM Video
              </>
            )}
          </button>
          {exportProgress && (
            <p className={`text-xs ${exportProgress.startsWith("✅") ? "text-green-600" : exportProgress.startsWith("❌") ? "text-red-600" : "text-muted-foreground"}`}>
              {exportProgress}
            </p>
          )}
          {!exportProgress && (
            <p className="text-xs text-muted-foreground mt-1">
              Records canvas animation as WebM video (30fps).
            </p>
          )}
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-lg border bg-card p-6 min-h-[200px] flex items-center justify-center overflow-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading font...</p>
        ) : (
          <div key={key}>
            {fontBundle && (
              <TegakiRenderer
                ref={tegakiRef}
                font={fontBundle}
                text={text || " "}
                time={{ mode: "uncontrolled", speed: speedMap[speed], loop }}
                style={{ fontSize, color: "var(--foreground)" }}
              />
            )}
          </div>
        )}
      </div>

      {/* SEO footer note */}
      <p className="text-xs text-muted-foreground text-center">
        Handwriting animation runs 100% in your browser. No data is uploaded to any
        server.
      </p>
    </div>
  );
}
