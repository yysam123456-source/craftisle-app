"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  WebMOutputFormat,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_HIGH,
  type Quality,
} from "mediabunny";

/**
 * Video Compressor — 100% client-side re-encode via Mediabunny (WebCodecs).
 *
 * Why Mediabunny and not ffmpeg.wasm:
 *   ffmpeg.wasm needs SharedArrayBuffer ⇒ needs COOP/COEP response headers ⇒
 *   those headers break the ad scripts (and every cross-origin embed) on the
 *   same page. Mediabunny uses the browser's native WebCodecs encoders
 *   instead: no wasm, no cross-origin isolation, no COOP/COEP.
 *
 * Privacy: the file is read with FileReader/Blob and re-encoded in-page.
 * Nothing is uploaded — there is no server round-trip at all.
 */

type Preset = "small" | "balanced" | "high";
type OutFormat = "mp4" | "webm";

const PRESETS: Record<Preset, { label: string; hint: string; quality: Quality; maxEdge: number }> = {
  small: {
    label: "Smallest file",
    hint: "720p cap · lowest bitrate",
    quality: QUALITY_LOW,
    maxEdge: 1280,
  },
  balanced: {
    label: "Balanced",
    hint: "1080p cap · good quality",
    quality: QUALITY_MEDIUM,
    maxEdge: 1920,
  },
  high: {
    label: "Best quality",
    hint: "Keep resolution · mild shrink",
    quality: QUALITY_HIGH,
    maxEdge: 0,
  },
};

function formatBytes(n: number): string {
  if (!n || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function VideoCompressTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [format, setFormat] = useState<OutFormat>("mp4");
  const [stage, setStage] = useState<"idle" | "ready" | "processing" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const conversionRef = useRef<Conversion | null>(null);
  // Object URLs are revoked explicitly — a 200 MB blob left dangling in a
  // long-lived tab is a real memory leak, not a theoretical one.
  const urlsRef = useRef<string[]>([]);

  const trackUrl = useCallback((url: string) => {
    urlsRef.current.push(url);
    return url;
  }, []);

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      urlsRef.current = [];
    };
  }, []);

  const resetResult = useCallback(() => {
    setResultUrl(null);
    setResultSize(0);
    setProgress(0);
    setStatusText("");
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      setError(null);
      resetResult();
      // WebCodecs demuxes by container, not by extension. A .mov that is
      // really an MP4 works; a renamed .avi does not. Say so up front.
      if (!/\.(mp4|m4v|mov|webm|mkv|avi)$/i.test(f.name)) {
        setError(
          `“${f.name}” does not look like a video file. Supported containers: MP4, MOV, WebM, MKV, AVI.`
        );
        return;
      }
      if (f.size > 500 * 1024 * 1024) {
        setError(
          `File is ${formatBytes(f.size)}. Files above 500 MB are likely to exhaust browser memory — try a shorter clip.`
        );
      }
      setFile(f);
      setStage("ready");
    },
    [resetResult]
  );

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setProgress(0);
    setError(null);
    resetResult();

    try {
      setStatusText("Reading video…");
      const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

      const videoTrack = await input.getPrimaryVideoTrack();
      if (!videoTrack) {
        throw new Error("No video track found in this file.");
      }

      // Only downscale, never upscale: blowing a 480p clip up to 1080p makes
      // the file bigger, which is the opposite of what this page promises.
      const naturalWidth = await videoTrack.getDisplayWidth();
      const naturalHeight = await videoTrack.getDisplayHeight();
      const maxEdge = PRESETS[preset].maxEdge;
      const longEdge = Math.max(naturalWidth, naturalHeight);
      const needsDownscale = maxEdge > 0 && longEdge > maxEdge;
      const scale = needsDownscale ? maxEdge / longEdge : 1;

      const target = new BufferTarget();
      const output = new Output({
        format: format === "webm" ? new WebMOutputFormat() : new Mp4OutputFormat(),
        target,
      });

      const conversion = await Conversion.init({
        input,
        output,
        video: {
          width: Math.max(2, Math.round(naturalWidth * scale)),
          height: Math.max(2, Math.round(naturalHeight * scale)),
          fit: "contain",
          quality: PRESETS[preset].quality,
        },
        // Audio is re-encoded too, otherwise a 1080p video with a 320 kbps
        // audio track does not actually shrink much.
        audio: { quality: QUALITY_MEDIUM },
      });

      if (!conversion.isValid) {
        const reasons = conversion.discardedTracks
          .map((t) => `${t.track.type} track: ${t.reason}`)
          .join("; ");
        throw new Error(
          `This file cannot be re-encoded in your browser${reasons ? ` (${reasons})` : ""}. Try the other output format.`
        );
      }

      conversionRef.current = conversion;
      setStatusText("Compressing…");
      conversion.onProgress = (p) => {
        setProgress(Math.min(99, Math.round(p * 100)));
      };

      await conversion.execute();
      setProgress(100);

      const buffer = target.buffer;
      if (!buffer) {
        throw new Error("Encoder produced no output.");
      }

      const mime = format === "webm" ? "video/webm" : "video/mp4";
      const blob = new Blob([buffer], { type: mime });
      setResultSize(blob.size);
      setResultUrl(trackUrl(URL.createObjectURL(blob)));

      // A "compressed" file that got bigger is the single most common
      // complaint about online video compressors. Warn instead of pretending.
      if (blob.size >= file.size) {
        setError(
          `The re-encoded file is ${formatBytes(blob.size)} — larger than the original (${formatBytes(file.size)}). This video was already efficiently encoded; try “Smallest file” or keep the original.`
        );
      }

      setStatusText(
        needsDownscale
          ? `Done — scaled to ${Math.round(naturalWidth * scale)}×${Math.round(naturalHeight * scale)}`
          : "Done"
      );
      setStage("done");
    } catch (e) {
      const msg = (e as Error)?.message || String(e);
      setError(
        /cancel/i.test(msg)
          ? "Compression cancelled."
          : `${msg} — Mediabunny needs WebCodecs (Chrome/Edge 94+, Safari 16.4+, Firefox 130+).`
      );
      setStage("ready");
    } finally {
      conversionRef.current = null;
    }
  }, [file, preset, format, resetResult, trackUrl]);

  const handleCancel = useCallback(() => {
    void conversionRef.current?.cancel();
  }, []);

  const handleDownload = useCallback(() => {
    if (!resultUrl || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${base}-compressed.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [resultUrl, file, format]);

  const saving =
    stage === "done" && resultSize > 0 && file && resultSize < file.size
      ? Math.round((1 - resultSize / file.size) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 text-sm flex items-start gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <Card className="p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv,.mov,.avi"
            className="hidden"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">
                ✓ {file.name} — {formatBytes(file.size)}
              </p>
              <p className="text-xs text-gray-500">Click to choose a different video</p>
            </div>
          ) : (
            <div className="py-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 group-hover:text-blue-400 transition-colors mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <p className="text-lg font-medium text-gray-700">Upload a video</p>
              <p className="text-sm text-gray-500 mt-1">MP4, MOV, WebM, MKV — compressed in your browser</p>
            </div>
          )}
        </div>
      </Card>

      {stage !== "idle" && file && (
        <Card className="p-6 space-y-5">
          <div>
            <Label className="font-semibold mb-3 block">Compression level</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as Preset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPreset(p)}
                  disabled={stage === "processing"}
                  className={`p-3 rounded-lg border text-left transition-all disabled:opacity-60 ${
                    preset === p
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <p className="text-sm font-medium">{PRESETS[p].label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{PRESETS[p].hint}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="font-semibold mb-3 block">Output format</Label>
            <div className="flex gap-3">
              {([
                ["mp4", "MP4 (H.264)", "Plays everywhere"],
                ["webm", "WebM (VP9)", "Usually smaller"],
              ] as [OutFormat, string, string][]).map(([val, label, hint]) => (
                <button
                  key={val}
                  onClick={() => setFormat(val)}
                  disabled={stage === "processing"}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-60 ${
                    format === val
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-blue-300 text-gray-700"
                  }`}
                >
                  {label} <span className="text-xs text-gray-500 font-normal">· {hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCompress}
              disabled={stage === "processing"}
              size="lg"
              className="flex-1 text-base py-5"
            >
              {stage === "processing" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {statusText || "Compressing…"}
                </span>
              ) : (
                "Compress video"
              )}
            </Button>
            {stage === "processing" && (
              <Button variant="outline" size="lg" onClick={handleCancel}>
                Cancel
              </Button>
            )}
          </div>

          {stage === "processing" && (
            <div>
              <Progress value={progress} />
              <p className="text-xs text-gray-500 mt-1.5 text-center">
                {progress}% — keep this tab open, encoding happens on your device
              </p>
            </div>
          )}
        </Card>
      )}

      {stage === "done" && resultUrl && file && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Compressed!</h3>
            {saving > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                −{saving}% smaller
              </span>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-gray-500">Original</p>
              <p className="font-medium">{formatBytes(file.size)}</p>
            </div>
            <div className="rounded-lg border-2 border-green-200 p-3">
              <p className="text-gray-500">Compressed</p>
              <p className="font-medium">
                {formatBytes(resultSize)} <span className="text-xs text-gray-500">· {statusText}</span>
              </p>
            </div>
          </div>

          <video src={resultUrl} controls className="w-full max-h-80 rounded-lg border bg-black" />

          <div className="flex gap-3">
            <Button onClick={handleDownload} size="lg" className="flex-1">
              Download {format.toUpperCase()}
            </Button>
            <Button variant="outline" size="lg" onClick={resetResult}>
              Try other settings
            </Button>
          </div>
        </Card>
      )}

      <div className="bg-violet-50 rounded-lg p-4 text-sm text-violet-800 space-y-2">
        <p>
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-xs text-violet-700 ml-1">
          <li>
            Re-encodes video with your browser&apos;s native <strong>WebCodecs</strong> encoder, using
            Mediabunny — no ffmpeg, no WebAssembly, no upload.
          </li>
          <li>
            Your file never leaves your device. Nothing is sent to a server, so there is no size limit
            other than your own memory.
          </li>
          <li>
            <strong>Smallest file</strong> caps the long edge at 1280 px — for a 4K phone clip that is
            where most of the saving comes from.
          </li>
          <li>
            Already-compressed videos (a 20 MB 1-minute MP4) barely shrink: the data was squeezed once
            already. Use it for screen recordings, phone footage and camera exports.
          </li>
        </ul>
      </div>
    </div>
  );
}
