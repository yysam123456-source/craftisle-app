"use client";

import { lazy, Suspense, useState, useEffect, type ReactNode } from "react";
/**
 * Dynamic tool component loader.
 *
 * `"use client"` is required because we use useState/useEffect
 * to dynamically import tool components at runtime.
 *
 * Instead of statically importing all components (which forces Next.js
 * to resolve EVERY component at build time), we store a map of
 * dynamic import functions and only call the one that is needed.
 *
 * This means broken components only fail when actually visited,
 * not at build time.
 */

// ---------------------------------------------------------------------------
// Type — each entry is a function that returns a dynamic import promise
// ---------------------------------------------------------------------------
type ComponentLoader = () => Promise<{ default: React.ComponentType<any> }>;

const componentLoaders: Record<string, ComponentLoader> = {
  "aes-des": () => import("@/components/tools/AesDesTool"),
  "base32": () => import("@/components/tools/Base32Tool"),
  "base58": () => import("@/components/tools/Base58Tool"),
  "base64": () => import("@/components/tools/Base64Tool"),
  "bcrypt": () => import("@/components/tools/BcryptTool"),
  "case-converter": () => import("@/components/tools/CaseConverterTool"),
  "coin-flip": () => import("@/components/tools/CoinFlipTool"),
  "countdown": () => import("@/components/tools/CountdownTool"),
  "counter": () => import("@/components/tools/CounterTool"),
  "cron": () => import("@/components/tools/CronTool"),
  "csv-json": () => import("@/components/tools/CsvJsonTool"),
  "diff": () => import("@/components/tools/DiffTool"),
  "file-viewer": () => import("@/components/tools/FileViewerTool"),
  "hash": () => import("@/components/tools/HashTool"),
  "html-escape": () => import("@/components/tools/HtmlEscapeTool"),
  "html-formatter": () => import("@/components/tools/HtmlFormatterTool"),
  "image-to-pixel": () => import("@/components/tools/ImageToPixelTool"),
  "ip-calc": () => import("@/components/tools/IpCalcTool"),
  "ip-radix": () => import("@/components/tools/IpRadixTool"),
  "json-formatter": () => import("@/components/tools/JsonFormatterTool"),
  "jwt": () => import("@/components/tools/JwtDecoderTool"),
  "keyboard": () => import("@/components/tools/KeyboardTool"),
  "lorem-ipsum": () => import("@/components/tools/LoremIpsumTool"),
  "mermaid": () => import("@/components/tools/MermaidTool"),
  "pomodoro": () => import("@/components/tools/PomodoroTool"),
  "qrcode": () => import("@/components/tools/QRCodeGeneratorTool"),
  "radix-converter": () => import("@/components/tools/RadixConverterTool"),
  "random-group": () => import("@/components/tools/RandomGroupTool"),
  "random-string": () => import("@/components/tools/RandomStringGeneratorTool"),
  "regex": () => import("@/components/tools/RegexTool"),
  "scoreboard": () => import("@/components/tools/ScoreboardTool"),
  "sql-formatter": () => import("@/components/tools/SqlFormatterTool"),
  "stopwatch": () => import("@/components/tools/StopwatchTool"),
  "text-formatter": () => import("@/components/tools/TextFormatterTool"),
  "tts": () => import("@/components/tools/TtsTool"),
  "unicode": () => import("@/components/tools/UnicodeTool"),
  "url-encode": () => import("@/components/tools/UrlEncodeTool"),
  "user-agent": () => import("@/components/tools/UATool"),
  "uuid": () => import("@/components/tools/UuidTool"),
  "wheel": () => import("@/components/tools/WheelTool"),
  "yaml-formatter": () => import("@/components/tools/YamlFormatterTool"),
  // Non-standard file names:
  "create-gif": () => import("@/components/tools/create-gif-page").then(m => ({ default: m.CreateGifPage })),
  "find-duplicates": () => import("@/components/tools/find-duplicates-page").then(m => ({ default: m.FindDuplicatesPage })),
};

// ---------------------------------------------------------------------------
// ToolLoader — dynamically loads ONLY the requested component
// ---------------------------------------------------------------------------
export function ToolLoader({ toolId }: { toolId: string }): ReactNode {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loader = componentLoaders[toolId];
    if (!loader) return; // No component for this tool — fallback to ToolDetailSections

    setLoading(true);
    setError(false);
    loader()
      .then(m => {
        setComponent(() => m.default);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [toolId]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (error || !Component) {
    // Component not found or failed to load — render nothing
    // ToolDetailSections in page.tsx will show the descriptions/FAQ
    return null;
  }

  return <Component />;
}
