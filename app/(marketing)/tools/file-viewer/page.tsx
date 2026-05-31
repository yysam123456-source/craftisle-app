"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { FileSearch, Eye, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ToolDetailSections from "@/components/tools/ToolDetailSections";
import { FileViewerProvider, useFileViewer } from "@/components/file-viewer/FileViewerContext";
import { UploadZone } from "@/components/file-viewer/UploadZone";
import { URLInput } from "@/components/file-viewer/URLInput";
import { PreviewFrame } from "@/components/file-viewer/PreviewFrame";
import {
  SUPPORTED_FORMATS_CATEGORIES,
  QUICK_ACCESS_FORMATS,
} from "@/constants/file-viewer";
import { cn } from "@/lib/utils";

// ============================================================
// Inner component (has access to FileViewerContext)
// ============================================================

function FileViewerInner() {
  const { state, selectFile, setBlobUrl } = useFileViewer();
  const fileRef = useRef<File | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [isMobile, setIsMobile] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Detect mobile for responsive layout (D6)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ============================================================
  // File drop handler — creates Blob URL, stores in context
  // ============================================================
  const handleFileDrop = useCallback(
    (file: File) => {
      fileRef.current = file;
      selectFile(file);
    },
    [selectFile]
  );

  // When state transitions to "selecting" (valid file chosen), create Blob URL
  useEffect(() => {
    if (state.status !== "selecting" || !state.fileInfo || !fileRef.current) return;

    const blobUrl = URL.createObjectURL(fileRef.current);
    setBlobUrl(blobUrl);
  }, [state.status, state.fileInfo, setBlobUrl]);

  // ============================================================
  // Mobile floating action button (D6)
  // ============================================================
  const renderMobileFAB = () => {
    if (!isMobile || state.status === "idle") return null;

    return (
      <>
        <button
          onClick={() => setShowMobilePanel(!showMobilePanel)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          aria-label={showMobilePanel ? "Close file panel" : "Open file panel"}
        >
          <FileSearch className="h-6 w-6" />
        </button>

        {/* Mobile panel — slides up from bottom */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 rounded-t-2xl bg-background shadow-2xl transition-transform duration-300",
            "max-h-[60vh] overflow-y-auto border-t",
            showMobilePanel ? "translate-y-0" : "translate-y-full"
          )}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">File Viewer</h3>
            <button
              onClick={() => setShowMobilePanel(false)}
              className="text-muted-foreground"
            >
              ✕
            </button>
          </div>
          <div className="p-4 space-y-4">
            <FileViewerToolbar onFileDrop={handleFileDrop} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* ============================================================
          Page Header
      ============================================================ */}
      <div className="flex items-center space-x-4 border-b pb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
          <Eye className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Viewer</h1>
          <p className="text-muted-foreground">
            Preview 135+ file formats — 100% private, no upload needed
          </p>
        </div>
      </div>

      {/* ============================================================
          Main Content — conditionally show UploadZone or PreviewFrame
      ============================================================ */}
      {state.status === "idle" || state.status === "error" ? (
        <>
          {/* Upload / URL tabs */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Tab switcher */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "upload"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setActiveTab("url")}
                  className={cn(
                    "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === "url"
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  From URL
                </button>
              </div>

              {activeTab === "upload" ? (
                <UploadZone onFileSelected={handleFileDrop} />
              ) : (
                <div className="py-6">
                  <URLInput />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy notice (D4 — empty state guidance) */}
          <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
            <CardContent className="flex items-start gap-3 py-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  100% Private & Offline
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Files never leave your device. All processing happens in your browser.
                  No upload, no server storage, no tracking.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick access format cards (D4) */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
              Quick Access Formats
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QUICK_ACCESS_FORMATS.map((fmt) => (
                <div
                  key={fmt.ext}
                  className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="text-lg">{fmt.icon}</span>
                  <span>{fmt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Format categories list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Supported Formats (135+)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(SUPPORTED_FORMATS_CATEGORIES).map(
                  ([category, exts]) => (
                    <div key={category}>
                      <h4 className="mb-1 text-sm font-semibold">{category}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {exts.join(", ")}
                      </p>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* PreviewFrame for loading / ready states */
        <PreviewFrame />
      )}

      {/* Mobile FAB (D6) */}
      {renderMobileFAB()}

      {/* Tool detail sections (SEO + how-to-use + FAQ) */}
      <ToolDetailSections toolId="file-viewer" />
    </div>
  );
}

// ============================================================
// Toolbar component — used on desktop (inline) and mobile (drawer)
// ============================================================

function FileViewerToolbar({ onFileDrop }: { onFileDrop: (file: File) => void }) {
  // For future toolbar actions (format filter, etc.)
  return null;
}

// ============================================================
// Export — wrapped in FileViewerProvider
// ============================================================

export default function FileViewerPage() {
  return (
    <FileViewerProvider>
      <FileViewerInner />
    </FileViewerProvider>
  );
}
