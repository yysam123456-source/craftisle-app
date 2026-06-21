"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";

// ── TegakiRenderer (local copy via lib/tegaki/) ──
interface TegakiRendererProps {
  font?: any;
  text?: string;
  time?: any;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onComplete?: () => void;
  onChangeTimeline?: (timeline: unknown) => void;
  effects?: any;
  quality?: any;
  timing?: any;
  showOverlay?: boolean;
  direction?: string;
  shaper?: boolean;
  editable?: boolean;
  onTextChange?: (text: string) => void;
  ref?: React.Ref<any>;
}

const TegakiRenderer = dynamic<TegakiRendererProps & { ref?: React.Ref<any> }>(
  () => import("../../lib/tegaki/react").then((m: any) => ({ default: m.TegakiRenderer })),
  { ssr: false, loading: () => <p className="text-sm text-muted-foreground">Loading renderer...</p> }
);

// ── Font bundles (static files from public/tegaki-fonts/) ──
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

const bundleCache = new Map<string, any>();

async function loadFontBundle(name: string): Promise<any> {
  if (bundleCache.has(name)) return bundleCache.get(name)!;
  const url = FONT_BUNDLE_URLS[name];
  const mod = await import(/* webpackIgnore: true */ url);
  const bundle = mod.bundle ?? mod.default ?? mod;
  bundleCache.set(name, bundle);
  return bundle;
}

// ── Types ──
type SpeedMode = "slow" | "normal" | "fast";
type ExportFmt = "webm" | "gif";

// ── Default effects config ──
const DEFAULT_EFFECTS = {
  glow:          { enabled: false, radius: 8, color: "#000000" },
  wobble:        { enabled: false, amplitude: 1.5, frequency: 0.05, mode: "sine" as const },
  pressureWidth:  { enabled: false, strength: 0.5 },
  taper:         { enabled: false, startLength: 0.3, endLength: 0.7 },
  strokeGradient: { enabled: false, colors: ["#2563eb", "#7c3aed", "#db2777"], saturation: 80, lightness: 55 },
  globalGradient: { enabled: false, colors: ["#2563eb", "#db2777"], angle: 0 },
};

// ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░
//   HandwritingAnimationTool — full-feature rewrite
// ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░

export default function HandwritingAnimationTool() {
  // ── Core state ──
  const [text, setText] = useState("Hello World");
  const [fontIdx, setFontIdx] = useState(0);
  const [speed, setSpeed] = useState<SpeedMode>("normal");
  const [loop, setLoop] = useState(true);
  const [fontSize, setFontSize] = useState(48);
  const [key, setKey] = useState(0);
  const [fontBundle, setFontBundle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // ── Playback state ──
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const tegakiRef = useRef<any>(null);

  // ── Effects state ──
  const [effects, setEffects] = useState<any>({});
  const [showEffects, setShowEffects] = useState(false);

  // ── Color / bg state ──
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("transparent");

  // ── Quality state ──
  const [quality, setQuality] = useState<any>({ smoothing: false, clipText: false });
  const [showQuality, setShowQuality] = useState(false);

  // ── Misc state ──
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [editable, setEditable] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // ── Export state ──
  const [exporting, setExporting] = useState(false);
  const [exportFmt, setExportFmt] = useState<ExportFmt>("webm");
  const [exportProgress, setExportProgress] = useState("");

  // ── Derived ──
  const speedMap: Record<SpeedMode, number> = { slow: 0.5, normal: 1, fast: 2 };

  // ── Load font bundle ──
  useEffect(() => {
    const name = FONT_NAMES[fontIdx];
    setLoading(true);
    loadFontBundle(name)
      .then((b) => { setFontBundle(b); setLoading(false); handleReplay(); })
      .catch(() => { setLoading(false); });
  }, [fontIdx]);

  // ── Sync playback state from engine ──
  useEffect(() => {
    const engine = tegakiRef.current?.engine;
    if (!engine) return;
    const iv = setInterval(() => {
      if (!engine) return;
      setIsPlaying(engine.isPlaying ?? false);
      // Estimate current time from timeline (best-effort)
    }, 200);
    return () => clearInterval(iv);
  }, [fontBundle]);

  // ── Callbacks ──
  const handleReplay = useCallback(() => {
    setKey((k) => k + 1);
    setCompleted(false);
    setIsPlaying(true);
  }, []);

  const handlePauseResume = useCallback(() => {
    const engine = tegakiRef.current?.engine;
    if (!engine) return;
    if (engine.isPlaying) {
      engine.pause();
      setIsPlaying(false);
    } else {
      engine.play();
      setIsPlaying(true);
    }
  }, []);

  const handleSeek = useCallback((pct: number) => {
    const engine = tegakiRef.current?.engine;
    if (!engine) return;
    engine.seek(`${pct}%`);
  }, []);

  // ── Effects helpers ──
  const toggleEffect = useCallback((name: string) => {
    setEffects((prev: any) => {
      const curr = prev[name] ?? { enabled: false };
      const enabled = !curr.enabled;
      return {
        ...prev,
        [name]: enabled ? { ...DEFAULT_EFFECTS[name as keyof typeof DEFAULT_EFFECTS], enabled: true } : { enabled: false },
      };
    });
  }, []);

  const updateEffect = useCallback((name: string, field: string, value: any) => {
    setEffects((prev: any) => ({
      ...prev,
      [name]: { ...(prev[name] ?? {}), [field]: value },
    }));
  }, []);

  // ── Build active effects for renderer ──
  const activeEffects = useMemo(() => {
    const out: any = {};
    for (const [k, v] of Object.entries(effects)) {
      if ((v as any)?.enabled) {
        out[k] = v;
      }
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }, [effects]);

  // ── Export handler ──
  const handleExport = useCallback(async () => {
    const handle = tegakiRef.current;
    if (!handle?.engine) return;
    setExporting(true);
    setExportProgress("Preparing...");

    try {
      const engine = handle.engine;
      const container = engine.element;
      if (!container) throw new Error("Canvas container not found");
      const canvas = container.querySelector('[data-tegaki="canvas"]') as HTMLCanvasElement | null;
      if (!canvas) throw new Error("Canvas element not found");
      const dur = engine.duration;
      if (!dur || dur <= 0) throw new Error("Animation has no duration");

      if (exportFmt === "webm") {
        // ── WebM export (MediaRecorder) ──
        setExportProgress("Recording WebM...");
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: 5_000_000,
        });
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

        await new Promise<void>((resolve, reject) => {
          recorder.onstop = () => resolve(undefined);
          recorder.onerror = () => reject(new Error("MediaRecorder error"));
          engine.pause();
          engine.seek("0%");
          setTimeout(() => {
            recorder.start();
            engine.play();
            const t = dur * 1000 + 500;
            setTimeout(() => {
              try { recorder.stop(); } catch {}
              engine.pause();
              if (loop) engine.seek("0%");
            }, t);
          }, 100);
        });

        setExportProgress("Generating file...");
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `handwriting-${FONT_NAMES[fontIdx] || "animation"}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setExportProgress("✅ Downloaded!");
      } else {
        // ── GIF export (canvas → frames → gif.js) ──
        setExportProgress("Loading GIF encoder...");
        // gif.js is UMD — must handle both ESM import and global fallback
        // @ts-ignore — CDN import, no local types
        const gifModule = await import(/* webpackIgnore: true */ "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js");
        const GifCtor = (gifModule.default || gifModule.GIF || (window as any).GIF || gifModule);
        if (typeof GifCtor !== "function") {
          throw new Error("GIF encoder failed to load (CDN unavailable?)");
        }
        setExportProgress("Capturing frames...");

        const W = canvas.width / (window.devicePixelRatio || 1);
        const H = canvas.height / (window.devicePixelRatio || 1);

        // ── Collect frames on main thread (no workers = avoid CDN worker script CORS issues) ──
        const fps = 10;
        const totalFrames = Math.ceil(dur * fps);
        const frames: ImageData[] = [];
        engine.pause();
        for (let i = 0; i <= totalFrames; i++) {
          const t = (i / totalFrames) * dur;
          engine.seek(t);
          await new Promise((r) => setTimeout(r, 30));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const tmp = document.createElement("canvas");
            tmp.width = W; tmp.height = H;
            const tmpCtx = tmp.getContext("2d");
            if (tmpCtx) {
              tmpCtx.drawImage(canvas, 0, 0, W, H);
              frames.push(tmpCtx.getImageData(0, 0, W, H));
            }
          }
          if (i % 5 === 0) setExportProgress(`Capturing... ${Math.round((i / totalFrames) * 100)}%`);
        }

        setExportProgress("Encoding GIF (single-thread)...");
        // Run GIF encoding in a setTimeout to avoid blocking UI
        await new Promise<void>((resolve, reject) => {
          const gif = new GifCtor({
            workers: 0,   // ← disable workers (CDN worker script fails silently in workers)
            quality: 10,
            width: W,
            height: H,
          });
          for (const f of frames) gif.addFrame(f, { delay: 1000 / fps });
          gif.on("finished", (blob: Blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `handwriting-${FONT_NAMES[fontIdx] || "animation"}.gif`;
            a.click();
            URL.revokeObjectURL(url);
            setExportProgress("✅ Downloaded!");
            setTimeout(() => { setExportProgress(""); setExporting(false); }, 2000);
            resolve();
          });
          // Timeout: if encoding takes > 60s, abort
          const to = setTimeout(() => {
            reject(new Error("GIF encoding timed out (>60s)"));
          }, 60000);
          gif.on("error", (err: any) => {
            clearTimeout(to);
            reject(new Error("GIF encoding error: " + String(err)));
          });
          gif.render();
        });
        return; // async finish
      }

      setTimeout(() => { setExportProgress(""); setExporting(false); }, 2000);
    } catch (err) {
      console.error("Export failed:", err);
      setExportProgress(`❌ Export failed: ${(err as Error).message}`);
      setTimeout(() => { setExportProgress(""); setExporting(false); }, 3000);
    }
  }, [fontIdx, exportFmt, loop]);

  // ── onComplete callback ──
  const handleComplete = useCallback(() => {
    setCompleted(true);
    setIsPlaying(false);
  }, []);

  // ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░
  //   RENDER
  // ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░

  const fontName = FONT_NAMES[fontIdx];

  return (
    <div className="space-y-6">
      {/* ── Row 1: Text + Font + Speed + Controls ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Text input */}
        <div className="space-y-1">
          <label htmlFor="hw-text" className="text-sm font-medium">
            Text
          </label>
          <textarea
            id="hw-text"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Enter text to animate..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleReplay}
              className="flex-1 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
            >
              ▶ Replay
            </button>
            <button
              onClick={handlePauseResume}
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-muted/50"
            >
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>
        </div>

        {/* Font + Speed + Direction */}
        <div className="space-y-1">
          <label htmlFor="hw-font" className="text-sm font-medium">Font</label>
          <select
            id="hw-font"
            value={fontIdx}
            onChange={(e) => setFontIdx(Number(e.target.value))}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {FONT_NAMES.map((name, i) => (
              <option key={name} value={i}>{name}</option>
            ))}
          </select>
          <label className="mt-2 block text-sm font-medium">Speed</label>
          <select
            value={speed}
            onChange={(e) => { setSpeed(e.target.value as SpeedMode); handleReplay(); }}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
          <label className="mt-2 block text-sm font-medium">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "ltr" | "rtl")}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </select>
        </div>

        {/* Size + Loop + Editable + Overlay */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Font Size: {fontSize}px</label>
          <input
            type="range" min={24} max={160} value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full"
          />
          <button
            onClick={() => { setLoop((v) => !v); handleReplay(); }}
            className={`mt-2 w-full rounded-md px-3 py-1.5 text-sm ${loop ? "bg-primary text-primary-foreground" : "border bg-background"}`}
          >
            {loop ? "🔁 Loop: ON" : "▶ Play Once"}
          </button>
          <button
            onClick={() => { setEditable((v) => !v); handleReplay(); }}
            className={`mt-1 w-full rounded-md px-3 py-1.5 text-sm ${editable ? "bg-accent text-accent-foreground" : "border bg-background"}`}
          >
            {editable ? "✏️ Editable: ON" : "✏️ Editable: OFF"}
          </button>
          <button
            onClick={() => { setShowOverlay((v) => !v); handleReplay(); }}
            className={`mt-1 w-full rounded-md px-3 py-1.5 text-sm ${showOverlay ? "bg-accent text-accent-foreground" : "border bg-background"}`}
          >
            {showOverlay ? "👁 Overlay: ON" : "👁 Overlay: OFF"}
          </button>
        </div>

        {/* Export + Progress bar */}
        <div className="space-y-1">
          <p className="text-sm font-medium">Export</p>
          <div className="flex gap-2">
            <button
              onClick={() => setExportFmt("webm")}
              className={`flex-1 rounded-md px-2 py-1 text-xs ${exportFmt === "webm" ? "bg-primary text-primary-foreground" : "border bg-background"}`}
            >WebM</button>
            <button
              onClick={() => setExportFmt("gif")}
              className={`flex-1 rounded-md px-2 py-1 text-xs ${exportFmt === "gif" ? "bg-primary text-primary-foreground" : "border bg-background"}`}
            >GIF</button>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading || !fontBundle}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Exporting...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>⬇</span> Download {exportFmt.toUpperCase()}
              </span>
            )}
          </button>
          {exportProgress && (
            <p className={`text-xs ${exportProgress.startsWith("✅") ? "text-green-600" : exportProgress.startsWith("❌") ? "text-red-600" : "text-muted-foreground"}`}>
              {exportProgress}
            </p>
          )}
          {/* Seek bar */}
          {duration > 0 && (
            <div className="mt-2 space-y-1">
              <label className="text-xs text-muted-foreground">
                Progress: {Math.round(currentTime * 10) / 10}s / {Math.round(duration * 10) / 10}s
                {completed && <span className="ml-2 text-green-600">(complete)</span>}
              </label>
              <input
                type="range" min={0} max={100} step={0.5}
                value={duration > 0 ? (currentTime / duration) * 100 : 0}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Row 2: Effects panel (collapsible) ── */}
      <details open={showEffects} onToggle={() => setShowEffects((v) => !v)} className="rounded-lg border bg-card">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium select-none">
          ✨ Effects {Object.values(effects).some((v: any) => v?.enabled) && <span className="ml-2 text-xs text-primary">(active)</span>}
        </summary>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Glow */}
          <EffectCard
            name="glow"
            label="Glow"
            config={effects.glow}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.glow}
            controls={
              <>
                <label className="text-xs">Radius</label>
                <input type="range" min={1} max={30} value={effects.glow?.radius ?? 8} onChange={(e) => updateEffect("glow", "radius", Number(e.target.value))} className="w-full" />
                <label className="text-xs">Color</label>
                <input type="color" value={effects.glow?.color ?? "#000000"} onChange={(e) => updateEffect("glow", "color", e.target.value)} className="h-8 w-full rounded border" />
              </>
            }
          />
          {/* Wobble */}
          <EffectCard
            name="wobble"
            label="Wobble"
            config={effects.wobble}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.wobble}
            controls={
              <>
                <label className="text-xs">Amplitude: {effects.wobble?.amplitude ?? 1.5}</label>
                <input type="range" min={0} max={5} step={0.1} value={effects.wobble?.amplitude ?? 1.5} onChange={(e) => updateEffect("wobble", "amplitude", Number(e.target.value))} className="w-full" />
                <label className="text-xs">Mode</label>
                <select value={effects.wobble?.mode ?? "sine"} onChange={(e) => updateEffect("wobble", "mode", e.target.value)} className="w-full rounded border bg-background px-2 py-1 text-xs">
                  <option value="sine">Sine</option>
                  <option value="noise">Noise</option>
                </select>
              </>
            }
          />
          {/* Pressure Width */}
          <EffectCard
            name="pressureWidth"
            label="Pressure Width"
            config={effects.pressureWidth}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.pressureWidth}
            controls={
              <>
                <label className="text-xs">Strength: {effects.pressureWidth?.strength ?? 0.5}</label>
                <input type="range" min={0} max={2} step={0.05} value={effects.pressureWidth?.strength ?? 0.5} onChange={(e) => updateEffect("pressureWidth", "strength", Number(e.target.value))} className="w-full" />
              </>
            }
          />
          {/* Taper */}
          <EffectCard
            name="taper"
            label="Taper"
            config={effects.taper}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.taper}
            controls={
              <>
                <label className="text-xs">Start: {effects.taper?.startLength ?? 0.3}</label>
                <input type="range" min={0} max={1} step={0.05} value={effects.taper?.startLength ?? 0.3} onChange={(e) => updateEffect("taper", "startLength", Number(e.target.value))} className="w-full" />
                <label className="text-xs">End: {effects.taper?.endLength ?? 0.7}</label>
                <input type="range" min={0} max={1} step={0.05} value={effects.taper?.endLength ?? 0.7} onChange={(e) => updateEffect("taper", "endLength", Number(e.target.value))} className="w-full" />
              </>
            }
          />
          {/* Stroke Gradient */}
          <EffectCard
            name="strokeGradient"
            label="Stroke Gradient"
            config={effects.strokeGradient}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.strokeGradient}
            controls={
              <>
                <label className="text-xs">Colors (comma-separated hex)</label>
                <input
                  type="text"
                  value={(effects.strokeGradient?.colors as string[] ?? ["#2563eb", "#7c3aed", "#db2777"]).join(",")}
                  onChange={(e) => updateEffect("strokeGradient", "colors", e.target.value.split(",").map((s: string) => s.trim()))}
                  className="w-full rounded border bg-background px-2 py-1 text-xs font-mono"
                  placeholder="#2563eb,#7c3aed,#db2777"
                />
                <label className="text-xs">Saturation: {effects.strokeGradient?.saturation ?? 80}</label>
                <input type="range" min={0} max={100} value={effects.strokeGradient?.saturation ?? 80} onChange={(e) => updateEffect("strokeGradient", "saturation", Number(e.target.value))} className="w-full" />
              </>
            }
          />
          {/* Global Gradient */}
          <EffectCard
            name="globalGradient"
            label="Global Gradient"
            config={effects.globalGradient}
            onToggle={toggleEffect}
            onUpdate={updateEffect}
            defaults={DEFAULT_EFFECTS.globalGradient}
            controls={
              <>
                <label className="text-xs">Colors (comma-separated hex)</label>
                <input
                  type="text"
                  value={(effects.globalGradient?.colors as string[] ?? ["#2563eb", "#db2777"]).join(",")}
                  onChange={(e) => updateEffect("globalGradient", "colors", e.target.value.split(",").map((s: string) => s.trim()))}
                  className="w-full rounded border bg-background px-2 py-1 text-xs font-mono"
                  placeholder="#2563eb,#db2777"
                />
                <label className="text-xs">Angle: {effects.globalGradient?.angle ?? 0}°</label>
                <input type="range" min={0} max={360} value={effects.globalGradient?.angle ?? 0} onChange={(e) => updateEffect("globalGradient", "angle", Number(e.target.value))} className="w-full" />
              </>
            }
          />
        </div>
      </details>

      {/* ── Row 3: Color + Quality (collapsible) ── */}
      <details open={false} className="rounded-lg border bg-card">
        <summary className="cursor-pointer px-4 py-2 text-sm font-medium select-none">
          🎨 Color & Quality
        </summary>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Stroke Color</label>
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="h-10 w-full rounded border" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Background</label>
            <select value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full rounded border bg-background px-2 py-2 text-sm">
              <option value="transparent">Transparent</option>
              <option value="#ffffff">White</option>
              <option value="#f8fafc">Light Gray</option>
              <option value="#1e293b">Dark Blue</option>
              <option value="custom">Custom...</option>
            </select>
            {bgColor === "custom" && (
              <input type="color" onChange={(e) => setBgColor(e.target.value)} className="mt-1 h-8 w-full rounded border" />
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Smoothing</label>
            <button
              onClick={() => setQuality((q: any) => ({ ...q, smoothing: !q.smoothing }))}
              className={`w-full rounded-md px-3 py-1.5 text-sm ${quality.smoothing ? "bg-primary text-primary-foreground" : "border bg-background"}`}
            >
              {quality.smoothing ? "✅ ON" : "OFF"}
            </button>
            <p className="text-xs text-muted-foreground">Catmull-Rom spline</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Clip Text</label>
            <button
              onClick={() => setQuality((q: any) => ({ ...q, clipText: q.clipText ? false : 2 }))}
              className={`w-full rounded-md px-3 py-1.5 text-sm ${quality.clipText ? "bg-primary text-primary-foreground" : "border bg-background"}`}
            >
              {quality.clipText ? "✅ ON (2×)" : "OFF"}
            </button>
            <p className="text-xs text-muted-foreground">Clip strokes to glyph</p>
          </div>
        </div>
      </details>

      {/* ── Preview ── */}
      <div
        className="rounded-lg border bg-card p-6 min-h-[200px] flex items-center justify-center overflow-auto"
        style={{ backgroundColor: bgColor !== "transparent" ? bgColor : undefined }}
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading font...</p>
        ) : (
          <div key={key} className="w-full">
            {fontBundle && (
              <TegakiRenderer
                ref={tegakiRef}
                font={fontBundle}
                text={text || " "}
                time={{ mode: "uncontrolled", speed: speedMap[speed], loop }}
                style={{ fontSize, color: strokeColor }}
                effects={activeEffects}
                quality={Object.keys(quality).length > 0 ? quality : undefined}
                direction={direction}
                showOverlay={showOverlay}
                editable={editable}
                onComplete={handleComplete}
              />
            )}
          </div>
        )}
      </div>

      {completed && (
        <p className="text-center text-sm text-green-600">✅ Animation complete!</p>
      )}

      {/* SEO footer */}
      <p className="text-xs text-muted-foreground text-center">
        Handwriting animation runs 100% in your browser. No data is uploaded.
      </p>
    </div>
  );
}

// ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░
//   EffectCard component
// ═║▌╝█▓▐▄▀▄▀ ▄▀▓▄ § ▄▄ ▓▒░

interface EffectCardProps {
  name: string;
  label: string;
  config: any;
  onToggle: (name: string) => void;
  onUpdate: (name: string, field: string, value: any) => void;
  defaults: any;
  controls: React.ReactNode;
}

function EffectCard({ name, label, config, onToggle, controls }: EffectCardProps) {
  const isOn = config?.enabled;
  return (
    <div className={`rounded-md border p-3 ${isOn ? "border-primary/50 bg-primary/5" : ""}`}>
      <button
        onClick={() => onToggle(name)}
        className={`w-full rounded px-2 py-1.5 text-sm font-medium text-left ${isOn ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`}
      >
        {isOn ? "✅" : "⬜"} {label}
      </button>
      {isOn && (
        <div className="mt-2 space-y-2">
          {controls}
        </div>
      )}
    </div>
  );
}
