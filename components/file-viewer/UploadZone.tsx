"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { Upload, FileWarning } from "lucide-react";
import { useFileViewer } from "./FileViewerContext";
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from "@/constants/file-viewer";
import { cn } from "@/lib/utils";

export function UploadZone({ onFileSelected }: { onFileSelected?: (file: File) => void }) {
  const { selectFile } = useFileViewer();
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // ============================================================
  // Drag event handlers — three-layer feedback (D2)
  // ============================================================

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
      setDragError(null);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setDragError(null);
      dragCounterRef.current = 0;

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      // Only take the first file (T3: multi-file → first only)
      const file = files[0];

      // Validate before selectFile (so we can show visual error on drop zone)
      const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.has(ext)) {
        setDragError(`"${ext || "unknown"}" is not a supported format`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setDragError("File exceeds 50 MB limit");
        return;
      }

      selectFile(file);
      onFileSelected?.(file);
    },
    [selectFile, onFileSelected]
  );

  // ============================================================
  // Keyboard / click fallback (D2, D7 — a11y)
  // ============================================================

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    []
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      selectFile(file);
      onFileSelected?.(file);

      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    },
    [selectFile, onFileSelected]
  );

  // ============================================================
  // Render
  // ============================================================

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload a file to preview — click or drag and drop"
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isDragging && !dragError
          ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
          : dragError
            ? "border-destructive bg-destructive/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Visual feedback icon */}
      <div
        className={cn(
          "mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-all",
          isDragging && !dragError
            ? "bg-primary/10 text-primary scale-110"
            : dragError
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
        )}
      >
        {dragError ? (
          <FileWarning className="h-8 w-8" />
        ) : (
          <Upload className={cn("h-8 w-8", isDragging && "animate-bounce")} />
        )}
      </div>

      {/* Text — changes based on state */}
      {dragError ? (
        <>
          <p className="text-sm font-medium text-destructive">{dragError}</p>
          <p className="mt-1 text-xs text-muted-foreground">Try a different file</p>
        </>
      ) : isDragging ? (
        <>
          <p className="text-base font-semibold text-primary">Drop your file here</p>
          <p className="mt-1 text-sm text-muted-foreground">Release to start preview</p>
        </>
      ) : (
        <>
          <p className="text-base font-semibold">
            <span className="text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports 135+ formats — PDF, Word, Excel, CAD, 3D, Images, Archives & more
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            Max file size: 50 MB — 100% private, no upload to server
          </p>
        </>
      )}

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={Array.from(SUPPORTED_EXTENSIONS).join(",")}
        onChange={handleFileInput}
        aria-hidden="true"
      />
    </div>
  );
}
