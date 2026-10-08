"use client";

/**
 * 格式对转客户端组件
 *
 * 🔴 隐私铁律：全部转换在浏览器内完成（createImageBitmap / canvas.toBlob），
 * 没有任何 fetch、没有上传、没有服务端处理。
 * 页面文案可以如实承诺「文件不上传」，因为代码里确实不存在上传路径。
 *
 * 质量策略：
 *   - jpg/webp 用 quality 0.92；png 忽略 quality（无损）
 *   - JPEG 输出时若源图带透明通道，先铺白底 —— 否则透明区会变黑，
 *     这是「PNG 转 JPG 黑边」投诉的根因，直接在渲染层消除。
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { INPUT_META, OUTPUT_META, type ConvertPair } from "@/lib/convert/pairs";

interface Result {
  name: string;
  size: number;
  url: string;
}

export default function ConvertTool({ pair }: { pair: ConvertPair }) {
  const inputMeta = INPUT_META[pair.from];
  const outputMeta = OUTPUT_META[pair.to];
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const convertOne = useCallback(
    (file: File): Promise<Result> =>
      new Promise((resolve, reject) => {
        // createImageBitmap 在现代浏览器里最快；SVG 在部分浏览器不支持它，
        // 那种情况退回 Image + objectURL。
        const finish = (source: CanvasImageSource, w: number, h: number) => {
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas 不可用"));
            return;
          }

          // JPEG 不支持透明 —— 先铺白底，否则透明区解码后是黑色。
          if (outputMeta.mime === "image/jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
          }

          ctx.drawImage(source, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("编码失败"));
                return;
              }
              const base = file.name.replace(/\.[^.]+$/, "");
              resolve({
                name: `${base}.${pair.to}`,
                size: blob.size,
                url: URL.createObjectURL(blob),
              });
            },
            outputMeta.mime,
            pair.to === "png" ? undefined : Number(outputMeta.quality)
          );
        };

        if (file.type === "image/svg+xml") {
          const url = URL.createObjectURL(file);
          const img = new Image();
          img.onload = () => {
            finish(img, img.naturalWidth || 1024, img.naturalHeight || 1024);
            URL.revokeObjectURL(url);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("SVG 无法解码"));
          };
          img.src = url;
          return;
        }

        createImageBitmap(file)
          .then((bitmap) => {
            finish(bitmap, bitmap.width, bitmap.height);
            bitmap.close();
          })
          .catch(() => reject(new Error(`${file.name} 无法解码`)));
      }),
    [outputMeta.mime, pair.to]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      setError("");
      setResults([]);

      const out: Result[] = [];
      const failed: string[] = [];

      for (const file of Array.from(files)) {
        try {
          out.push(await convertOne(file));
        } catch (e) {
          failed.push(e instanceof Error ? e.message : String(e));
        }
      }

      setResults(out);
      setBusy(false);
      if (failed.length > 0) {
        setError(`${failed.length} 个文件失败：${failed.slice(0, 3).join("；")}`);
      }
    },
    [convertOne]
  );

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* 上传区 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <p className="text-base font-medium mb-1">
          Drop {inputMeta.label} file{inputMeta.label === outputMeta.label ? "" : "s"} here, or
          choose files from your device — nothing is uploaded
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Converts {inputMeta.label} to {outputMeta.label} locally in your browser
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={inputMeta.mime}
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Converting…" : "Select files"}
        </Button>
      </div>

      {/* 格式说明 */}
      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="font-medium text-xs text-muted-foreground mb-1">INPUT</p>
          <p className="font-medium">{inputMeta.label}</p>
          <p className="text-muted-foreground">{inputMeta.note}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="font-medium text-xs text-muted-foreground mb-1">OUTPUT</p>
          <p className="font-medium">{outputMeta.label}</p>
          <p className="text-muted-foreground">{outputMeta.note}</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {/* 结果 */}
      {results.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {results.length} file{results.length > 1 ? "s" : ""} converted
          </p>
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.url}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <span className="truncate text-sm">{r.name}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{fmtSize(r.size)}</span>
                  <a
                    href={r.url}
                    download={r.name}
                    className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                  >
                    Download
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}