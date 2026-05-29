"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap } from "lucide-react";
import type { ToolDefinition } from "@/lib/image-tools";
import { ImageUpload } from "./image-upload";
import { ImageCompare } from "./image-compare";
import {
  settingsComponents,
  OneClickSettings,
} from "./settings";

interface ImageToolPageProps {
  toolId: string;
  definition: ToolDefinition;
}

export function ImageToolPage({ toolId, definition }: ImageToolPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number | null>(null);
  const [resultMetadata, setResultMetadata] = useState<Record<string, unknown> | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);

  const SettingsComponent = settingsComponents[toolId] || OneClickSettings;

  const handleUpload = useCallback(
    (f: File) => {
      setFile(f);
      setError(null);
      setResultUrl(null);
      setResultFilename(null);
      setResultMetadata(null);

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => setOriginalPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    },
    [],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    setOriginalPreview(null);
    setResultUrl(null);
    setResultFilename(null);
    setResultMetadata(null);
    setError(null);
  }, []);

  const handleProcess = useCallback(async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("params", JSON.stringify(params));

      // Pre-compress large files before upload
      let fileToUpload = file;
      if (file.size > definition.maxFileSize * 0.9) {
        try {
          const imageCompression = (
            await import("browser-image-compression")
          ).default;
          fileToUpload = await imageCompression(file, {
            maxSizeMB: definition.maxFileSize / 1024 / 1024 - 0.5,
            maxWidthOrHeight: 4096,
            useWebWorker: true,
          });
        } catch {
          // Fall through — let server reject if still too large
        }
      }

      const uploadForm = new FormData();
      uploadForm.append("file", fileToUpload);
      uploadForm.append("params", JSON.stringify(params));

      const res = await fetch(`/api/tools/${toolId}`, {
        method: "POST",
        body: uploadForm,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        // metadata-only tools (info)
        const json = await res.json();
        setResultMetadata(json);
        setResultUrl(null);
        setResultFilename(null);
        setResultSize(null);
      } else {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
        setResultSize(blob.size);

        const disposition = res.headers.get("content-disposition") || "";
        const filenameMatch = disposition.match(/filename="?(.+?)"?$/);
        setResultFilename(filenameMatch?.[1] || "processed");
        setResultMetadata(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [file, params, toolId, definition.maxFileSize]);

  // Check if this is a metadata-only tool
  const isMetadataOnly = !resultUrl && resultMetadata;

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-8">
      {/* Tool Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Image</Badge>
          <Badge variant="outline" className="font-mono text-xs">
            {toolId}
          </Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Upload an image and process it. All processing happens server-side via
          Sharp. Your file is not stored.
        </p>
      </div>

      {/* Upload */}
      <ImageUpload
        acceptTypes={definition.acceptTypes}
        maxFileSize={definition.maxFileSize}
        onUpload={handleUpload}
        onClear={handleClear}
        file={file}
      />

      {/* Settings */}
      {file && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Settings</h3>
          <SettingsComponent params={params} onChange={setParams} />

          <Button
            onClick={handleProcess}
            disabled={processing}
            className="mt-6 w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Process Image
              </>
            )}
          </Button>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Metadata-only result (info, color-palette) */}
      {isMetadataOnly && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Result</h3>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(resultMetadata, null, 2)}
          </pre>
        </div>
      )}

      {/* Image comparison result */}
      {resultUrl && originalPreview && (
        <ImageCompare
          original={originalPreview}
          resultUrl={resultUrl}
          resultFilename={resultFilename}
          resultSize={resultSize}
          metadata={resultMetadata}
        />
      )}
    </div>
  );
}
