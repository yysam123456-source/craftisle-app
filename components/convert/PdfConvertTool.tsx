"use client";

/**
 * PDF ⇄ 图片 对转客户端组件（独立于 ConvertTool，不动既有10 个对转页）
 *
 * 🔴 隐私铁律：PDF 的解析与生成**全部在浏览器内完成**。
 *   - PDF → 图片：pdf.js 在本地解析页面内容树，逐页渲染到 canvas，再 canvas.toBlob
 *   - 图片 → PDF：pdf-lib 在本地组装 PDFDocument 并嵌入 JPEG/PNG
 * 没有任何 fetch、没有上传、没有服务端处理 —— 因此页面文案可以如实承诺「文件不上传」，
 * 因为代码里确实不存在上传路径。
 *
 * 📦 包体策略：pdfjs-dist（含 1.37MB worker）与 pdf-lib 都用**动态 import**，
 * 只有用户真的进了 PDF 对转页并开始转换时才下载。访问任何图片对转页的人
 * 都不会为 PDF 能力付流量。
 *
 * ⚠️ worker 走本地静态文件 public/workers/pdf.worker.min.mjs：
 * 不用 CDN（不可达时静默失效）。这与 pdfcraft 子站的做法一致，已在生产验证过。
 *
 * 已知边界（如实告知，不假装支持）：
 *   - 加密 PDF（带密码）无法解析，给明确提示而不是空白输出
 *   - PDF → 图片按页拆分，输出多张图逐张下载
 *   - 不做 OCR：扫描件渲染出来就是图片，没有文字层
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { INPUT_META, OUTPUT_META, type ConvertPair } from "@/lib/convert/pairs";

interface Result {
  name: string;
  size: number;
  url: string;
}

const PDF_MIME = "application/pdf";

/** pdf.js 的最小类型面，避免为一个动态 import 引入完整类型包。 */
interface PdfjsPage {
  getViewport(opts: { scale: number }): { width: number; height: number };
  render(opts: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
  }): { promise: Promise<void> };
}
interface PdfjsDoc {
  numPages: number;
  getPage(n: number): Promise<PdfjsPage>;
  destroy?(): Promise<void>;
}
interface PdfjsModule {
  getDocument(opts: { data: ArrayBuffer }): { promise: Promise<PdfjsDoc> };
  GlobalWorkerOptions: { workerSrc: string };
}

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * 动态加载 pdf.js 并配好本地 worker（只配一次）。
 *
 * 🔴🔴 worker 必须与主文件**同源同版本**，即 legacy 主文件配 legacy worker。
 * 首版我加载的是 `legacy/build/pdf.mjs` 却把 workerSrc 指向 **modern** 的
 * `pdf.worker.min.mjs` —— 两者混用会在渲染阶段抛
 * `e.transform is not iterable (cannot read property undefined)`，
 * 页面只显示一句无意义的报错。构建全绿、worker 200、探针全过，只有真跑样本才暴露。
 */
async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((mod: unknown) => {
      // UMD/ESM 混包下 pdfjs 既可能在 default 上，也可能直接是命名空间
      const candidate = mod as { default?: unknown };
      const pdfjs = (
        typeof candidate.default === "object" || typeof candidate.default === "function"
          ? candidate.default
          : mod
      ) as PdfjsModule;
      pdfjs.GlobalWorkerOptions.workerSrc = "/workers/pdf.worker.legacy.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

let pdfLibPromise: Promise<typeof import("pdf-lib")> | null = null;

async function loadPdfLib() {
  if (!pdfLibPromise) pdfLibPromise = import("pdf-lib");
  return pdfLibPromise;
}

export default function PdfConvertTool({ pair }: { pair: ConvertPair }) {
  const inputMeta = INPUT_META[pair.from];
  const outputMeta = OUTPUT_META[pair.to];
  const [results, setResults] = useState<Result[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isPdfOutput = pair.to === "pdf";

  /** PDF → 图片：逐页渲染到 canvas 再导出。scale 2（约 144 DPI）。 */
  const convertPdfToImage = useCallback(
    async (file: File, targetType: "jpeg" | "png"): Promise<Result[]> => {
      const pdfjs = await loadPdfjs();
      const data = await file.arrayBuffer();

      let doc: PdfjsDoc;
      try {
        doc = await pdfjs.getDocument({ data }).promise;
      } catch (e) {
        const err = e as { name?: string; message?: string; code?: number };
        const msg = err?.message ?? String(e);
        // 🔴 只认pdf.js 的 PasswordException，**不要全文匹配 "password"**。
        // 此前用 /password/i 会把「worker 加载失败」这类错误也显示成
        // 「This PDF is password-protected」—— 真实原因被完全掩盖，排查时被骗了很久。
        // pdf.js 的密码错误有固定 code：PasswordException = 1 / MissingPDFException = 2。
        if (err?.name === "PasswordException" || err?.code === 1) {
          throw new Error(
            "This PDF is password-protected. Remove the password first, then convert it here."
          );
        }
        throw new Error(
          `This PDF could not be read (${err?.name || "unknown error"}: ${msg}). ` +
            `It may be corrupted, or the in-browser PDF engine failed to start.`
        );
      }

      const out: Result[] = [];
      const base = (file.name.replace(/\.pdf$/i, "") || "page").slice(0, 60);

      try {
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not create a 2D canvas context.");

          // PDF 页面背景默认透明，导出 JPG 时铺白底，否则透明区会变黑
          if (targetType === "jpeg") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // 🔴 渲染阶段的错误和解析阶段一样要如实报出。此前这一层没有 catch，
          // 上层只看到一句 `e.transform is not iterable`，看不出是哪一页、哪个环节。
          try {
            await page.render({
              canvasContext: ctx,
              viewport: { width: canvas.width, height: canvas.height },
            }).promise;
          } catch (e) {
            throw new Error(
              `Page ${n} could not be rendered (${e instanceof Error ? e.message : String(e)}).`
            );
          }

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, outputMeta.mime, 0.92)
          );
          if (!blob) throw new Error(`Page ${n} could not be exported as an image.`);
          out.push({
            name: `${base}-${n}.${targetType === "jpeg" ? "jpg" : "png"}`,
            size: blob.size,
            url: URL.createObjectURL(blob),
          });
        }
      } finally {
        await doc.destroy?.();
      }

      if (out.length === 0) throw new Error("This PDF has no pages.");
      return out;
    },
    [outputMeta.mime]
  );

  /** 图片 → PDF：每张图一页，用像素数作页面尺寸可保持原图比例。 */
  const convertImageToPdf = useCallback(async (files: File[]): Promise<Result[]> => {
    const { PDFDocument } = await loadPdfLib();
    const doc = await PDFDocument.create();

    for (const file of files) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const isPng = file.type === "image/png" || /\.png$/i.test(file.name);
      const img = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
      // 72dpi 下 1px = 1pt，直接用像素数当页面尺寸可保持原图比例
      const page = doc.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    }

    const bytes = await doc.save();
    const blob = new Blob([bytes as unknown as BlobPart], { type: PDF_MIME });
    const base = (files[0]?.name.replace(/\.[^.]+$/, "") || "images")
      .slice(0, 60)
      .replace(/[\\/:*?"<>|]/g, "_");
    return [{ name: `${base}.pdf`, size: blob.size, url: URL.createObjectURL(blob) }];
  }, []);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setBusy(true);
      setError(null);
      // 释放上一轮的 object URL，避免内存泄漏
      setResults((prev) => {
        prev.forEach((r) => URL.revokeObjectURL(r.url));
        return [];
      });

      try {
        const list = Array.from(files);
        if (isPdfOutput) {
          setResults(await convertImageToPdf(list));
        } else {
          const target: "jpeg" | "png" = pair.to === "jpg" ? "jpeg" : "png";
          setResults(await convertPdfToImage(list[0], target));
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setResults([]);
      } finally {
        setBusy(false);
      }
    },
    [convertImageToPdf, convertPdfToImage, isPdfOutput, pair.to]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-6 text-center">
        <p className="mb-3 text-sm text-muted-foreground">
          Converts {inputMeta.label} to {outputMeta.label} locally in your browser
          {!isPdfOutput && " — every page comes out as a separate image"}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple={isPdfOutput}
          accept={isPdfOutput ? "image/jpeg,image/png,.jpg,.jpeg,.png" : `${PDF_MIME},.pdf`}
          onChange={(e) => void handleFiles(e.target.files)}
          className="hidden"
        />
        <Button onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Converting…" : "Select files"}
        </Button>
      </div>

      {!isPdfOutput && (
        <p className="text-xs text-muted-foreground">
          Password-protected PDFs cannot be opened here — remove the password first. Scanned PDFs
          convert fine, but they contain no selectable text layer.
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {results.length} file{results.length > 1 ? "s" : ""} ready
          </p>
          <ul className="space-y-1">
            {results.map((r) => (
              <li key={r.name}>
                <a
                  href={r.url}
                  download={r.name}
                  className="text-sm underline underline-offset-2 hover:no-underline"
                >
                  {r.name}
                </a>{" "}
                <span className="text-xs text-muted-foreground">
                  ({(r.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
