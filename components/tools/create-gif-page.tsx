"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, Plus, AlertTriangle } from "lucide-react";

interface FrameSlot {
  id: number;
  file: File | null;
  preview: string | null;
}

const MAX_FRAMES = 20;
const RECOMMENDED_FRAMES = 8;
const MAX_FRAME_DIM = 480;
const BODY_LIMIT_MB = 4.5;

export function CreateGifPage() {
  const [slots, setSlots] = useState<FrameSlot[]>([
    { id: 1, file: null, preview: null },
    { id: 2, file: null, preview: null },
  ]);
  const [frameDelay, setFrameDelay] = useState(500);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultMeta, setResultMeta] = useState<Record<string, unknown> | null>(null);

  const handleFile = useCallback((id: number, f: File) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, file: f, preview: URL.createObjectURL(f) } : s)),
    );
    setError(null);
    setResultUrl(null);
    setResultMeta(null);
  }, []);

  const removeSlot = useCallback((id: number) => {
    setSlots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      return next.length >= 2 ? next : next;
    });
  }, []);

  const addSlot = useCallback(() => {
    if (slots.length >= MAX_FRAMES) return;
    setSlots((prev) => [
      ...prev,
      { id: Math.max(...prev.map((s) => s.id), 0) + 1, file: null, preview: null },
    ]);
  }, [slots.length]);

  const validSlots = slots.filter((s) => s.file);
  const totalSize = validSlots.reduce((sum, s) => sum + (s.file?.size ?? 0), 0);
  const isOverLimit = totalSize > BODY_LIMIT_MB * 1024 * 1024;

  const handleCreate = useCallback(async () => {
    if (validSlots.length < 2) {
      setError("Need at least 2 frames");
      return;
    }
    if (isOverLimit) {
      setError(`Total file size (${(totalSize / 1024 / 1024).toFixed(1)} MB) exceeds Vercel limit (${BODY_LIMIT_MB} MB). Reduce frames or use smaller images.`);
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      validSlots.forEach((s, i) => formData.append(`frame${i + 1}`, s.file!));
      formData.append("frameDelay", String(frameDelay));

      const res = await fetch("/api/tools/create-gif", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setResultMeta({
        frameCount: validSlots.length,
        delay: frameDelay,
        outputSizeKB: Math.round(blob.size / 1024),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "GIF creation failed");
    } finally {
      setProcessing(false);
    }
  }, [validSlots, frameDelay, totalSize, isOverLimit]);

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Image</Badge>
          <Badge variant="outline" className="font-mono text-xs">
            create-gif
          </Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Create animated GIFs from multiple image frames. All processing is
          server-side via Sharp + gif-encoder-2.
        </p>
      </div>

      {/* ⚠️ Vercel Limit Warning — explicit per user requirement */}
      <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-200">
              Vercel Free Tier Size Limit: {BODY_LIMIT_MB} MB
            </p>
            <p className="mt-1 text-amber-700 dark:text-amber-300">
              The total size of ALL uploaded frames combined must be under{" "}
              {BODY_LIMIT_MB} MB. For best results:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-amber-700 dark:text-amber-300">
              <li>Keep each frame under 400×400px (auto-resized if larger)</li>
              <li>Use ≤{RECOMMENDED_FRAMES} frames for reliable uploads</li>
              <li>PNG frames ~300KB each → max ~12 frames</li>
              <li>JPEG frames ~150KB each → max ~25 frames</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current size status */}
      {validSlots.length > 0 && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            isOverLimit
              ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {validSlots.length} frames ·{" "}
          {(totalSize / 1024 / 1024).toFixed(1)} MB total
          {isOverLimit && " — EXCEEDS LIMIT"}
        </div>
      )}

      {/* Frame Slots */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center gap-4 rounded-xl border bg-card p-4"
          >
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {slot.preview ? (
                <img
                  src={slot.preview}
                  alt={`Frame ${slot.id}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {slot.file ? (
                <div>
                  <span className="truncate text-sm font-medium">
                    {slot.file.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {(slot.file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Frame {slot.id}
                </span>
              )}

              <label className="mt-1 inline-block cursor-pointer text-xs text-blue-600 hover:underline">
                {slot.file ? "Change" : "Choose frame"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(slot.id, f);
                  }}
                />
              </label>
            </div>

            {slots.length > 2 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => removeSlot(slot.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {slots.length < MAX_FRAMES && (
          <Button variant="outline" size="sm" onClick={addSlot}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Frame
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Label className="text-sm whitespace-nowrap">Delay:</Label>
          <Input
            type="number"
            value={frameDelay}
            onChange={(e) => setFrameDelay(Number(e.target.value) || 100)}
            min={50}
            max={5000}
            step={50}
            className="w-24"
          />
          <span className="text-xs text-muted-foreground">ms</span>
        </div>

        <Button
          onClick={handleCreate}
          disabled={processing || validSlots.length < 2 || isOverLimit}
          size="lg"
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating GIF...
            </>
          ) : (
            "Create GIF"
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Result */}
      {resultUrl && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Result</h3>
          <div className="flex flex-col items-center gap-4">
            <img
              src={resultUrl}
              alt="Generated GIF"
              className="max-h-96 rounded-lg border"
            />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {resultMeta && (
                <>
                  <span>{String(resultMeta.frameCount)} frames</span>
                  <span>·</span>
                  <span>{String(resultMeta.delay)}ms delay</span>
                  <span>·</span>
                  <span>{String(resultMeta.outputSizeKB)} KB output</span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const a = document.createElement("a");
                a.href = resultUrl;
                a.download = "animated.gif";
                a.click();
              }}
            >
              Download GIF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
