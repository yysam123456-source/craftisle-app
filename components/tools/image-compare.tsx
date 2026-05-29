"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Maximize2 } from "lucide-react";

interface ImageCompareProps {
  original: string;
  resultUrl: string | null;
  resultFilename: string | null;
  resultSize: number | null;
  metadata?: Record<string, unknown> | null;
}

export function ImageCompare({
  original,
  resultUrl,
  resultFilename,
  resultSize,
  metadata,
}: ImageCompareProps) {
  const [showFull, setShowFull] = useState(false);

  if (!resultUrl) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Result</h3>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Original
          </p>
          <div className="overflow-hidden rounded-lg border bg-muted/20">
            <img
              src={original}
              alt="Original"
              className="mx-auto max-h-48 w-auto object-contain"
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Processed
          </p>
          <div className="overflow-hidden rounded-lg border bg-muted/20">
            <img
              src={resultUrl}
              alt="Processed"
              className="mx-auto max-h-48 w-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Result info */}
      <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
        <div className="space-y-1 text-xs">
          {resultFilename && (
            <p className="text-muted-foreground">
              File: <span className="font-mono font-medium">{resultFilename}</span>
            </p>
          )}
          {resultSize != null && (
            <p className="text-muted-foreground">
              Size: <span className="font-medium">{(resultSize / 1024).toFixed(1)} KB</span>
            </p>
          )}
          {metadata && (
            <details className="mt-1">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Metadata
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFull(!showFull)}
          >
            <Maximize2 className="mr-1 h-3 w-3" />
            {showFull ? "Collapse" : "Full view"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const a = document.createElement("a");
              a.href = resultUrl;
              a.download = resultFilename || "processed";
              a.click();
            }}
          >
            <Download className="mr-1 h-3 w-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Full-size preview */}
      {showFull && (
        <div className="overflow-auto rounded-lg border bg-muted/10 p-2">
          <img
            src={resultUrl}
            alt="Full preview"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
