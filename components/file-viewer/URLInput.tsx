"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Link, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileViewer } from "./FileViewerContext";
import { MIME_TO_EXTENSION, SUPPORTED_EXTENSIONS } from "@/constants/file-viewer";

const URL_REGEX = /^https?:\/\/.+/i;
const FETCH_TIMEOUT_MS = 30_000;

export function URLInput() {
  const { selectUrl, startLoading } = useFileViewer();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const validateAndLoad = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const trimmed = url.trim();
      if (!trimmed) return;

      // URL format validation (T4)
      if (!URL_REGEX.test(trimmed)) {
        setError("Please enter a valid URL starting with http:// or https://");
        return;
      }

      setError(null);
      setChecking(true);

      try {
        // Content-Type pre-check via HEAD request (T4)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

        let headRes: Response;
        try {
          headRes = await fetch(trimmed, {
            method: "HEAD",
            signal: controller.signal,
            mode: "cors",
          });
        } catch (err) {
          clearTimeout(timeoutId);
          if (err instanceof DOMException && err.name === "AbortError") {
            setError("Request timed out. The server may be unavailable.");
          } else if (err instanceof TypeError) {
            // Network error or CORS block → may still work via direct URL iframe
            // Don't block the user; let the viewer handle it
            selectUrl(trimmed);
            startLoading();
            return;
          } else {
            setError("Failed to connect. Check the URL and try again.");
          }
          setChecking(false);
          return;
        }

        clearTimeout(timeoutId);

        if (!headRes.ok) {
          // Some servers block HEAD but allow GET — still try
          selectUrl(trimmed);
          startLoading();
          setChecking(false);
          return;
        }

        // Check Content-Type
        const contentType = headRes.headers.get("content-type") || "";
        const contentLength = headRes.headers.get("content-length");

        // If it's clearly HTML (not a file), warn user
        if (contentType.includes("text/html") && !contentLength) {
          setError(
            "This appears to be a web page, not a file. Try a direct file link instead."
          );
          setChecking(false);
          return;
        }

        // Size check
        if (contentLength && parseInt(contentLength, 10) > 50 * 1024 * 1024) {
          setError("Remote file exceeds 50 MB limit.");
          setChecking(false);
          return;
        }

        // All good
        selectUrl(trimmed);
        startLoading();
      } catch {
        setError("An unexpected error occurred.");
      } finally {
        setChecking(false);
      }
    },
    [url, selectUrl, startLoading]
  );

  return (
    <form onSubmit={validateAndLoad} className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste a direct file link (https://...)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            className="pl-9"
            disabled={checking}
            aria-label="File URL"
          />
        </div>
        <Button type="submit" disabled={!url.trim() || checking} size="default">
          {checking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            "Preview"
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
