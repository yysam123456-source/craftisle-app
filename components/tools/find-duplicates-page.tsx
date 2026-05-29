"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Search, Plus } from "lucide-react";

interface FileSlot {
  id: number;
  file: File | null;
  preview: string | null;
}

interface PairResult {
  file1: string;
  file2: string;
  similarity: number;
  hammingDistance: number;
  verdict: "duplicate" | "similar" | "different";
}

export function FindDuplicatesPage() {
  const [slots, setSlots] = useState<FileSlot[]>([
    { id: 1, file: null, preview: null },
    { id: 2, file: null, preview: null },
  ]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<PairResult[] | null>(null);

  const handleFile = useCallback((id: number, f: File) => {
    const preview = URL.createObjectURL(f);
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, file: f, preview } : s)),
    );
    setError(null);
    setResults(null);
  }, []);

  const removeSlot = useCallback((id: number) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addSlot = useCallback(() => {
    if (slots.length >= 5) return;
    setSlots((prev) => [
      ...prev,
      { id: Math.max(...prev.map((s) => s.id)) + 1, file: null, preview: null },
    ]);
    setResults(null);
  }, [slots.length]);

  const handleCompare = useCallback(async () => {
    const validSlots = slots.filter((s) => s.file);
    if (validSlots.length < 2) {
      setError("Need at least 2 files to compare");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      validSlots.forEach((s, i) => {
        formData.append(`file${i + 1}`, s.file!);
      });

      const res = await fetch("/api/tools/find-duplicates", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResults(data.pairs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setProcessing(false);
    }
  }, [slots]);

  const verdictColor = {
    duplicate: "text-green-600 bg-green-50",
    similar: "text-yellow-600 bg-yellow-50",
    different: "text-red-600 bg-red-50",
  };

  const verdictLabel = {
    duplicate: "Duplicate",
    similar: "Similar",
    different: "Different",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Image</Badge>
          <Badge variant="outline" className="font-mono text-xs">
            find-duplicates
          </Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Upload 2–5 images to check if they are duplicates. Uses perceptual
          hashing (aHash) — works even if images are resized or recompressed.
        </p>
      </div>

      {/* File Slots */}
      <div className="space-y-3">
        {slots.map((slot) => (
          <div
            key={slot.id}
            className="flex items-center gap-4 rounded-xl border bg-card p-4"
          >
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {slot.preview ? (
                <img
                  src={slot.preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {slot.file ? (
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">
                    {slot.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(slot.file.size / 1024).toFixed(0)} KB
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No file selected
                </span>
              )}

              <label className="mt-1.5 inline-block cursor-pointer text-xs text-blue-600 hover:underline">
                {slot.file ? "Change file" : "Choose file"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(slot.id, f);
                  }}
                />
              </label>
            </div>

            {slots.length > 2 && slot.file === null && (
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

      {/* Add slot + Compare */}
      <div className="flex items-center gap-3">
        {slots.length < 5 && (
          <Button variant="outline" size="sm" onClick={addSlot}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add File
          </Button>
        )}
        <Button
          onClick={handleCompare}
          disabled={
            processing || slots.filter((s) => s.file).length < 2
          }
          size="lg"
          className="flex-1"
        >
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Compare Images
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Comparison Results</h3>
          <div className="space-y-3">
            {results.map((pair, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">
                    {pair.file1} ↔ {pair.file2}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {(pair.similarity * 100).toFixed(1)}% similar · Hamming:{" "}
                    {pair.hammingDistance}/256
                  </div>
                </div>
                <Badge
                  className={`ml-3 ${verdictColor[pair.verdict]}`}
                  variant="secondary"
                >
                  {verdictLabel[pair.verdict]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
