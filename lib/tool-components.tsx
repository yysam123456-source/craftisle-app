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
  "rot13": () => import("@/components/tools/Rot13Tool"),
  "slug-generator": () => import("@/components/tools/SlugGeneratorTool"),
  "string-randomize-case": () => import("@/components/tools/StringRandomizeCaseTool"),
  "quote": () => import("@/components/tools/QuoteTool"),
  "censor": () => import("@/components/tools/CensorTool"),
  "palindrome": () => import("@/components/tools/PalindromeTool"),
  "remove-duplicate-lines": () => import("@/components/tools/RemoveDuplicateLinesTool"),
  "string-rotate": () => import("@/components/tools/RotateTool"),
  "string-split": () => import("@/components/tools/SplitTool"),
  "string-join": () => import("@/components/tools/JoinTool"),
  "string-repeat": () => import("@/components/tools/RepeatTool"),
  "byte-converter": () => import("@/components/tools/ByteConverterTool"),
  "sum": () => import("@/components/tools/SumTool"),
  "random-port-generator": () => import("@/components/tools/RandomPortGeneratorTool"),
  "string-reverse": () => import("@/components/tools/StringReverseTool"),
  "string-statistic": () => import("@/components/tools/TextStatisticsTool"),
  "unicode": () => import("@/components/tools/UnicodeTool"),
  "url-encode": () => import("@/components/tools/UrlEncodeTool"),
  "user-agent": () => import("@/components/tools/UATool"),
  "uuid": () => import("@/components/tools/UuidTool"),
  "wheel": () => import("@/components/tools/WheelTool"),
  "yaml-formatter": () => import("@/components/tools/YamlFormatterTool"),
  // Non-standard file names:
  "create-gif": () => import("@/components/tools/create-gif-page").then(m => ({ default: m.CreateGifPage })),
  "find-duplicates": () => import("@/components/tools/find-duplicates-page").then(m => ({ default: m.FindDuplicatesPage })),

  // ==================== Time Tools ====================
  "unix-to-date": () => import("@/components/tools/UnixToDateTool"),
  "discord-timestamp": () => import("@/components/tools/DiscordTimestampTool"),
  "seconds-to-time": () => import("@/components/tools/SecondsToTimeTool"),
  "time-between-dates": () => import("@/components/tools/TimeBetweenDatesTool"),
  "cron-parser": () => import("@/components/tools/CrontabGuruTool"),
  "leap-year": () => import("@/components/tools/LeapYearTool"),

  // ==================== List Tools ====================
  "shuffle-lines": () => import("@/components/tools/ListShuffleTool"),
  "sort-lines": () => import("@/components/tools/ListSortTool"),
  "unique-lines": () => import("@/components/tools/ListUniqueTool"),

  // ==================== CSV Tools ====================
  "csv-to-json": () => import("@/components/tools/CsvToJsonTool"),

  // ==================== JSON Tools ====================
  "json-to-csv": () => import("@/components/tools/JsonToCsvTool"),

  // ==================== More Time Tools ====================
  "days-to-hours": () => import("@/components/tools/DaysToHoursTool"),
  "hours-to-days": () => import("@/components/tools/HoursToDaysTool"),
  "time-to-seconds": () => import("@/components/tools/TimeToSecondsTool"),
  "truncate-time": () => import("@/components/tools/TruncateClockTimeTool"),
  "time-to-decimal": () => import("@/components/tools/TimeToDecimalTool"),

  // ==================== More List Tools ====================
  "duplicate-lines": () => import("@/components/tools/ListDuplicateTool"),
  "find-popular": () => import("@/components/tools/FindMostPopularTool"),
  "reverse-lines": () => import("@/components/tools/ListReverseTool"),
  "rotate-lines": () => import("@/components/tools/ListRotateTool"),
  "wrap-lines": () => import("@/components/tools/ListWrapTool"),
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
