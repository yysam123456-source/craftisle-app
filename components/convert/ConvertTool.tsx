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

/**
 * HEIC/HEIF 判定。浏览器的 File.type 对 iPhone 拍的 HEIC 并不总是可靠
 * （常见 image/heic、image/heif，或干脆空字符串），因此同时看扩展名。
 */
function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif" || t === "image/heic-sequence" || t === "image/heif-sequence") {
    return true;
  }
  return /\.(heic|heif|heics|heifs)$/i.test(file.name);
}

/**
 * 🔴 隐私铁律：heic2any 内嵌 libheif（wasm 以 base64 形式打包在同一个 js 里，
 * 实测 dist 内无任何 http(s) 外链、无 CDN 运行时依赖）⇒ 解码完全发生在本机。
 *用**动态 import**：这1.35MB 只在用户真的选了 HEIC 文件时才下载，
 * 访问任何 /c 页面的人都不会为不需要它的能力付流量。
 */
async function decodeHeic(file: File, toType: string): Promise<Blob> {
  const mod: unknown = await import("heic2any");
  // heic2any 是 UMD 包：webpack 下既可能挂在 default 上，也可能直接是模块命名空间。
  const candidate = mod as { default?: unknown };
  const fn = (typeof candidate.default === "function" ? candidate.default : mod) as (opts: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;
  const out = await fn({ blob: file, toType, quality: 0.92 });
  return Array.isArray(out) ? out[0] : out;
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
            reject(new Error("Canvas is not available in this browser"));
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
                reject(new Error("Encoding failed"));
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
            reject(new Error("This SVG could not be decoded"));
          };
          img.src = url;
          return;
        }

        // HEIC/HEIF：浏览器原生解不了，走打包在包内的 libheif（动态 import）。
        if (isHeic(file)) {
          decodeHeic(file, outputMeta.mime)
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.onload = () => {
                finish(img, img.naturalWidth, img.naturalHeight);
                URL.revokeObjectURL(url);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(`${file.name} could not be decoded as HEIC`));
              };
              img.src = url;
            })
            .catch(() =>
              reject(
                new Error(
                  `${file.name} could not be decoded. The file may be corrupt, or an HEIC variant this browser build does not support.`
                )
              )
            );
          return;
        }

        createImageBitmap(file)
          .then((bitmap) => {
            finish(bitmap, bitmap.width, bitmap.height);
            bitmap.close();
          })
          .catch(() => reject(new Error(`${file.name} could not be decoded`)));
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
        setError(`${failed.length} file(s) failed: ${failed.slice(0, 3).join("; ")}`);
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
          accept={
            pair.from === "heic"
              ? // HEIC 的 MIME 在各系统上不一致，同时列出扩展名兜底。
                "image/heic,image/heif,.heic,.heif"
              : inputMeta.mime
          }
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