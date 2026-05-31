"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { AlertTriangle, RefreshCw, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileViewer, useProgress } from "./FileViewerContext";
import {
  VIEWER_ORIGIN,
  ALLOWED_ORIGINS,
} from "@/constants/file-viewer";
import { PROTOCOL_VERSION } from "@/types/file-viewer";
import type { ViewerHandshake, FileViewerResponse } from "@/types/file-viewer";

export function PreviewFrame() {
  const { state, dispatch } = useFileViewer();
  const { progress } = useProgress();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  /** Track previous Blob URL to revoke when replacing files */
  const prevBlobUrlRef = useRef<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // ============================================================
  // Send file to iframe via postMessage
  // ============================================================
  const sendFileToViewer = useCallback(
    (blobUrl: string) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      const fileInfo = state.fileInfo;
      if (!fileInfo) return;

      iframe.contentWindow.postMessage(
        {
          type: "file-viewer:file",
          version: PROTOCOL_VERSION,
          file: {
            name: fileInfo.name,
            size: fileInfo.size,
            type: fileInfo.type || "application/octet-stream",
          },
          url: blobUrl,
        },
        VIEWER_ORIGIN
      );
    },
    [state.fileInfo]
  );

  // ============================================================
  // Watch blobUrl changes → send to iframe when ready
  // ============================================================
  useEffect(() => {
    if (!state.blobUrl || state.status !== "loading") return;
    if (!iframeReady) return;

    // Revoke previous blob URL (file replacement)
    if (prevBlobUrlRef.current && prevBlobUrlRef.current !== state.blobUrl) {
      URL.revokeObjectURL(prevBlobUrlRef.current);
    }
    prevBlobUrlRef.current = state.blobUrl;

    sendFileToViewer(state.blobUrl);
  }, [state.blobUrl, state.status, iframeReady, sendFileToViewer]);

  // ============================================================
  // Cancel handler (E3) — reducer handles Blob URL cleanup
  // ============================================================
  const handleCancel = useCallback(() => {
    prevBlobUrlRef.current = null;
    dispatch({ type: "CANCEL" });
  }, [dispatch]);

  // ============================================================
  // Retry
  // ============================================================
  const handleRetry = useCallback(() => {
    setIframeReady(false);

    // Reload iframe
    if (iframeRef.current) {
      iframeRef.current.src = `${VIEWER_ORIGIN}/?t=${Date.now()}`;
    }

    dispatch({ type: "START_LOADING" });
  }, [dispatch]);

  // ============================================================
  // postMessage listener — origin whitelist (T1) + error handling (T2)
  // ============================================================
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // CRITICAL: origin whitelist (T1)
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        return;
      }

      const data = event.data;
      if (!data || typeof data !== "object" || !data.type) return;

      switch (data.type) {
        case "file-viewer:handshake": {
          const handshake = data as ViewerHandshake;
          if (handshake.version !== PROTOCOL_VERSION) {
            console.warn(
              `[FileViewer] Protocol mismatch: parent=${PROTOCOL_VERSION}, viewer=${handshake.version}`
            );
          }
          setIframeReady(true);
          break;
        }

        case "file-viewer:ready":
          setIframeReady(true);
          dispatch({ type: "VIEWER_READY" });
          break;

        case "file-viewer:error":
          dispatch({
            type: "VIEWER_ERROR",
            error: {
              type: "FILE_CORRUPT",
              message:
                (data as FileViewerResponse).payload?.error ||
                "File could not be rendered.",
              retryable: false,
            },
          });
          break;

        case "file-viewer:loaded":
          dispatch({ type: "VIEWER_LOADED" });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [dispatch]);

  // ============================================================
  // Cleanup on unmount (E2) — dispatch RESET to revoke Blob URL
  // ============================================================
  useEffect(() => {
    return () => {
      dispatch({ type: "RESET" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Render: Error states (D3)
  // ============================================================

  if (state.status === "error" && state.error) {
    const isRetryable = state.error.retryable;

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-destructive/30 bg-destructive/5 p-12 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          {isRetryable ? (
            <AlertTriangle className="h-8 w-8 text-destructive" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-destructive">
          {state.error.type === "VIEWER_UNAVAILABLE"
            ? "Preview Service Unavailable"
            : state.error.type === "FILE_CORRUPT"
              ? "Cannot Preview This File"
              : state.error.type === "FILE_TOO_LARGE"
                ? "File Too Large"
                : state.error.type === "FILE_UNSUPPORTED"
                  ? "Unsupported Format"
                  : state.error.type === "CORS_BLOCKED"
                    ? "Access Denied"
                    : state.error.type === "FETCH_TIMEOUT"
                      ? "Connection Timeout"
                      : state.error.type === "BROWSER_UNSUPPORTED"
                        ? "Browser Not Supported"
                        : "Preview Error"}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {state.error.message}
        </p>
        <div className="mt-4 flex gap-3">
          {isRetryable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Try Another File
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: Loading state (D5)
  // ============================================================

  if (state.status === "loading") {
    return (
      <div className="rounded-xl border p-8">
        <div className="flex flex-col items-center gap-4">
          {/* Skeleton info bar */}
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground"
            >
              Cancel
            </Button>
          </div>

          {/* Progress bar (D5) */}
          <div className="w-full max-w-sm space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-center text-xs text-muted-foreground">
              {progress < 50
                ? "Processing file..."
                : progress < 90
                  ? "Loading preview engine..."
                  : "Almost ready..."}
            </p>
          </div>

          {/* Spinner */}
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // ============================================================
  // Render: iframe (ready / idle)
  // ============================================================

  return (
    <div className="relative w-full overflow-hidden rounded-xl border" style={{ minHeight: 500 }}>
      {/* File info bar */}
      {state.fileInfo && state.status === "ready" && (
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm font-medium">
              {state.fileInfo.name}
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">
              {(state.fileInfo.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "RESET" })}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* iframe (E1: sandbox) */}
      <iframe
        ref={iframeRef}
        src={`${VIEWER_ORIGIN}/`}
        title="File Preview"
        className="w-full border-0"
        style={{ height: state.status === "ready" ? "calc(100vh - 200px)" : 500 }}
        sandbox="allow-scripts allow-same-origin"
        allow="autoplay"
        onLoad={() => {
          // iframe loaded, send handshake to confirm protocol version
          const iframe = iframeRef.current;
          if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(
              {
                type: "file-viewer:handshake",
                version: PROTOCOL_VERSION,
                capabilities: ["blob-url", "remote-url"],
              },
              VIEWER_ORIGIN
            );
          }
        }}
        onError={() => {
          dispatch({
            type: "VIEWER_ERROR",
            error: {
              type: "VIEWER_UNAVAILABLE",
              message: "The preview service is temporarily unavailable.",
              retryable: true,
            },
          });
        }}
      />
    </div>
  );
}

// Re-export loadFile and loadRemoteUrl for page-level orchestration
export type { PreviewFrame as PreviewFrameType };
