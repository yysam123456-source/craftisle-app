"use client";

import { useState, useCallback, useEffect } from "react";
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

// Use local TypeScript source (lib/tegaki/) to bypass tegaki's "exports" field issue.
// This is a direct import from project source — Next.js TypeScript compiler handles it natively.
const TegakiRenderer = dynamic<TegakiRendererProps>(
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
  // Dynamically import the .mjs bundle via fetch + import()
  // Next.js can't statically analyze this, so we use a direct dynamic import
  // with a full URL (relative to origin) after fetching the bundle text.
  const res = await fetch(url);
  const text = await res.text();
  // Evaluate the module (it's a JS module exporting `bundle`)
  const blob = new Blob([text], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  const mod = await import(/* webpackIgnore: true */ blobUrl);
  URL.revokeObjectURL(blobUrl);
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
          <p className="text-xs text-muted-foreground">
            To save as video, use your browser&apos;s screen recorder (Cmd+Shift+5 on
            Mac).
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            <strong>Tip:</strong> Increase font size for better export quality.
          </p>
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
