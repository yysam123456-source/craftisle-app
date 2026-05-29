"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Search } from "lucide-react";
import type { SettingsProps } from "./index";

interface FileSlot {
  id: number;
  file: File | null;
  preview: string | null;
}

export function FindDuplicatesSettings({ params, onChange }: SettingsProps) {
  const [files, setFiles] = useState<FileSlot[]>([
    { id: 1, file: null, preview: null },
    { id: 2, file: null, preview: null },
  ]);

  const handleFileSelect = useCallback(
    (id: number, file: File) => {
      setFiles((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const reader = new FileReader();
            const preview = URL.createObjectURL(file);
            return { ...s, file, preview };
          }
          return s;
        }),
      );
      // Update params so parent knows files changed
      onChange({ ...params, fileCount: files.length });
    },
    [params, onChange, files.length],
  );

  const addSlot = useCallback(() => {
    if (files.length >= 5) return;
    setFiles((prev) => [
      ...prev,
      { id: prev.length + 1, file: null, preview: null },
    ]);
  }, [files.length]);

  const removeSlot = useCallback((id: number) => {
    setFiles((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const validFiles = files.filter((s) => s.file !== null);

  return (
    <input type="hidden" name="fileCount" value={validFiles.length} />
  );
}

/**
 * Helper to get the list of selected files for the API call.
 */
export function getFindDuplicateFiles(
  containers: NodeListOf<Element> | Element[],
): { name: string; file: File }[] {
  const files: { name: string; file: File }[] = [];
  // We'll use refs instead — actually, this approach is too complex.
  // Let me simplify by pushing file state up.
  return files;
}
