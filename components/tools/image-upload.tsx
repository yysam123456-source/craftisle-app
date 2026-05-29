"use client";

import { useState, useRef, useCallback, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  acceptTypes: string[];
  maxFileSize: number;
  onUpload: (file: File) => void;
  onClear: () => void;
  file: File | null;
}

export function ImageUpload({
  acceptTypes,
  maxFileSize,
  onUpload,
  onClear,
  file,
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const maxMB = (maxFileSize / 1024 / 1024).toFixed(0);

  const validateAndAccept = useCallback(
    (f: File) => {
      setError(null);

      if (!acceptTypes.includes(f.type) && !acceptTypes.includes("image/*")) {
        setError(`Unsupported file type: ${f.type}. Accepted: ${acceptTypes.join(", ")}`);
        return;
      }

      if (f.size > maxFileSize) {
        setError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${maxMB} MB.`);
        return;
      }

      // Generate preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);

      onUpload(f);
    },
    [acceptTypes, maxFileSize, maxMB, onUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) validateAndAccept(dropped);
    },
    [validateAndAccept],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) validateAndAccept(selected);
    },
    [validateAndAccept],
  );

  const handleClear = useCallback(() => {
    setPreview(null);
    setError(null);
    onClear();
  }, [onClear]);

  const acceptStr = acceptTypes.join(",");

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptStr}
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">
            Drop image here or click to browse
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {maxMB} MB &bull; {acceptTypes.map((t) => t.split("/")[1].toUpperCase()).join(", ")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative mx-auto max-w-md overflow-hidden rounded-lg border bg-muted/20">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-64 w-auto object-contain"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {file.name} &bull; {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
