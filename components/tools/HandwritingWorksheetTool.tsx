"use client";

/**
 * 手写字帖 / 描红练习页生成器。
 *
 * 纯前端：所有排版在 Canvas 上完成，导出 PNG 与打印 PDF（走浏览器打印管线，
 * 不引pdf-lib —— 保持零依赖、零上传）。
 *
 * 真实需求词（Bing Suggest 2026-10-15 采集）：
 *   letter b/c/f handwriting practice(7)、letter handwriting(5)、
 *   handwriting practice sheets pdf、make handwriting practice sheet、
 *   first grade handwriting practice、letter tracing pages
 * ⇒ 落点是「按字母/单词生成可打印的描红练习页」，不是字母表展示器。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type Mode = "letter" | "word" | "custom";
type Style = "trace" | "outline" | "solid";

interface Row {
  /** 描红底字 */
  text: string;
  /** 每行重复次数 */
  repeats: number;
  /** 是否有虚线中线（x-height 参考线） */
  guides: boolean;
}

const LETTER_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  "upper+lower": "Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz".replace(
    / /g,
    "\n",
  ),
  numbers: "0123456789",
  "letters+numbers": "Aa Bb Cc Dd Ee Ff\nGg Hh Ii Jj Kk Ll\nMm Nn Oo Pp Qq Rr\nSs Tt Uu Vv Ww Xx\nYy Zz 0 1 2 3 4\n5 6 7 8 9".split("\n").join("\n"),
} as const;

/** 三种练习样式在页面上的可读标签 */
const STYLE_LABEL: Record<Style, string> = {
  trace: "Trace (faded model letter)",
  outline: "Outline (hollow letter)",
  solid: "Solid (copy by eye)",
};

const PAGE_W = 850; // A4 @96dpi 的近似宽度，用于屏幕预览比例
const MARGIN = 48;
const TITLE_H = 46;

/**
 * 描红体：同一段文本画三次，透明度递减。
 * 这是描红练习页的通用做法 —— 越往右越淡，直到最后只剩参考线。
 */
function drawGuides(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  ctx.save();
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 1;
  // 基线
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  // 中线（x-height 顶部参考）
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.72);
  ctx.lineTo(x + w, y + h * 0.72);
  ctx.stroke();
  // 竖向分隔
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
  ctx.restore();
}

/** 把一段文本画成一个单元；opacity 递减实现描红梯度 */
function drawCell(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize: number,
  style: Style,
  opacity: number,
): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `${fontSize}px "Comic Sans MS", "Segoe Print", "Bradley Hand", cursive`;

  if (style === "solid") {
    ctx.fillStyle = "#0f172a";
    ctx.globalAlpha = 1;
    ctx.fillText(text, x + w / 2, y + h * 0.78);
    ctx.restore();
    return;
  }

  if (style === "outline") {
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.globalAlpha = opacity;
    ctx.strokeText(text, x + w / 2, y + h * 0.78);
    ctx.restore();
    return;
  }

  // trace：灰色实心模型字，透明度随列递减
  ctx.fillStyle = "#94a3b8";
  ctx.globalAlpha = opacity;
  ctx.fillText(text, x + w / 2, y + h * 0.78);
  ctx.restore();
}

export default function HandwritingWorksheetTool() {
  const [mode, setMode] = useState<Mode>("letter");
  const [letterSet, setLetterSet] = useState<keyof typeof LETTER_SETS>("lowercase");
  const [customText, setCustomText] = useState("");
  const [style, setStyle] = useState<Style>("trace");
  const [repeats, setRepeats] = useState(4);
  const [fontSize, setFontSize] = useState(72);
  const [guides, setGuides] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** 拆成行：letter 模式按字母集切分；其余按换行/空格语义切分 */
  const rows: Row[] = useMemo(() => {
    let source: string[];

    if (mode === "letter") {
      const raw = LETTER_SETS[letterSet];
      source = raw.includes("\n") ? raw.split("\n") : raw.split("");
    } else if (mode === "word") {
      source = customText
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean);
    } else {
      source = customText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    }

    return source.map((text) => ({ text, repeats, guides }));
  }, [mode, letterSet, customText, repeats, guides]);

  const totalCells = rows.reduce((n, r) => n + r.repeats, 0);

  /** 渲染到 canvas，返回是否成功 */
  const render = useCallback((): boolean => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    if (rows.length === 0) return false;

    const ctx = canvas.getContext("2d");
    if (!ctx) return false;

    const rowH = Math.round(fontSize * 1.55);
    const cellW = Math.max(
      90,
      Math.min(190, Math.round((PAGE_W - MARGIN * 2) / Math.max(repeats, 1))),
    );
    const contentW = cellW * repeats;

    // 页高按实际行数算，不写死 —— 否则换字号/换行数会留大片空白
    const pageH =
      MARGIN * 2 + TITLE_H + rows.length * rowH + Math.max(0, rowsPerPage - rows.length) * rowH;

    canvas.width = PAGE_W;
    canvas.height = pageH;

    // 白底（打印必需）
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 标题
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `600 22px system-ui, -apple-system, "Segoe UI", sans-serif`;
    const heading =
      mode === "letter"
        ? `Handwriting practice — ${letterSet.replace(/\+/g, " and ")}`
        : "Handwriting practice";
    ctx.fillText(heading, MARGIN, MARGIN + 22);
    ctx.font = `13px system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = "#64748b";
    ctx.fillText(
      "Name ______________________     Date ____________",
      MARGIN,
      MARGIN + 42,
    );
    ctx.textAlign = "right";
    ctx.fillText(`${rows.length} rows`, PAGE_W - MARGIN, MARGIN + 42);

    let y = MARGIN + TITLE_H + 24;

    rows.forEach((row) => {
      const x0 = MARGIN;

      if (row.guides) {
        drawGuides(ctx, x0, y, contentW, rowH);
      }

      for (let i = 0; i < row.repeats; i++) {
        const cx = x0 + i * cellW;
        // 首格始终是完整模型字；后续格按列递减压淡，最后一格接近空白
        const opacity =
          style === "solid"
            ? 1
            : Math.max(0.08, 1 - (i / Math.max(row.repeats - 1, 1)) * 0.95);
        drawCell(
          ctx,
          row.text,
          cx,
          y,
          cellW,
          rowH,
          Math.min(fontSize, cellW * 0.7),
          style,
          opacity,
        );
      }

      // 行标签（左侧留白处写出来源词，方便孩子对照）
      ctx.save();
      ctx.fillStyle = "#94a3b8";
      ctx.font = `12px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(row.text, MARGIN - 8, y + rowH * 0.78);
      ctx.restore();

      y += rowH;
    });

    return true;
  }, [rows, fontSize, style, mode, letterSet, rowsPerPage]);

  // canvas 挂载后必须立刻画一次，否则首屏预览是空白 200px；
  // 之后每次参数变化都重绘，做到「调完即所见」而不是必须点按钮。
  useEffect(() => {
    render();
  }, [render]);

  const handleDownload = useCallback(() => {
    if (!render()) {
      toast.error("Nothing to draw yet — enter some letters or words first.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error("Could not encode the worksheet.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "handwriting-practice.png";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Worksheet downloaded as PNG.");
    }, "image/png");
  }, [render]);

  /**
   * 打印：先把当前画布内容以 dataURL 形式塞进一个临时窗口，
   * 让浏览器打印管线输出 PDF。dataURL 而非 blob URL —— 部分浏览器
   * 在打印时不会等待 blob 解析完成。
   */
  const handlePrint = useCallback(() => {
    if (!render()) {
      toast.error("Nothing to draw yet — enter some letters or words first.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Pop-up blocked — allow pop-ups to print, or download the PNG.");
      return;
    }
    w.document.write(
      `<!doctype html><html><head><title>Handwriting practice</title>` +
        `<style>@page{size:A4 portrait;margin:10mm}` +
        `html,body{margin:0;padding:0}` +
        `img{width:100%;height:auto;display:block}</style></head>` +
        `<body><img src="${dataUrl}" onload="window.focus();window.print()"></body></html>`,
    );
    w.document.close();
  }, [render]);

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">What to practise</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letter">Letters (tracing)</SelectItem>
                <SelectItem value="word">Words (one per row)</SelectItem>
                <SelectItem value="custom">Custom text (line per entry)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "letter" ? (
            <div className="space-y-2">
              <Label className="font-semibold">Letter set</Label>
              <Select
                value={letterSet}
                onValueChange={(v) => setLetterSet(v as keyof typeof LETTER_SETS)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowercase">a–z lowercase</SelectItem>
                  <SelectItem value="uppercase">A–Z uppercase</SelectItem>
                  <SelectItem value="upper+lower">Aa–Zz pairs</SelectItem>
                  <SelectItem value="numbers">0–9 numbers</SelectItem>
                  <SelectItem value="letters+numbers">Letters + numbers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2 sm:col-span-2">
              <Label className="font-semibold">
                {mode === "word" ? "Words (separated by spaces)" : "Text (one per line)"}
              </Label>
              <Textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={
                  mode === "word" ? "cat sun moon tree" : "Aa\nBb\nCc"
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {customText.trim()
                  ? `${rows.length} entries queued`
                  : "Nothing entered yet."}
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">Practice style</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STYLE_LABEL) as Style[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STYLE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              Repetitions per row: {repeats}
            </Label>
            <Slider
              value={[repeats]}
              min={2}
              max={8}
              step={1}
              onValueChange={(v) => setRepeats(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Letter size: {fontSize}px</Label>
            <Slider
              value={[fontSize]}
              min={36}
              max={120}
              step={4}
              onValueChange={(v) => setFontSize(v[0])}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              Blank rows to add: {Math.max(0, rowsPerPage - rows.length)}
            </Label>
            <Slider
              value={[rowsPerPage]}
              min={Math.max(1, rows.length)}
              max={12}
              step={1}
              onValueChange={(v) => setRowsPerPage(v[0])}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          Draw baseline and midline guides
        </label>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => { render(); toast.success("Preview updated."); }} variant="secondary">
            Refresh preview
          </Button>
          <Button onClick={handleDownload}>Download PNG</Button>
          <Button onClick={handlePrint} variant="outline">
            Print / Save as PDF
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {rows.length > 0
            ? `${rows.length} rows · ${totalCells} letters on the page · A4 at 100% scale`
            : "Enter letters or words to generate a page."}
        </p>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold">Preview</p>
        <div className="overflow-x-auto rounded-lg border bg-white">
          <canvas
            ref={canvasRef}
            className="block h-auto w-full"
            // 首屏 + 每次参数变化后重绘；canvas 尺寸由 JS 设置，这里给个兜底
            style={{ minHeight: 200 }}
          />
        </div>
      </Card>

      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">How it works</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>Every page is drawn on a canvas in your browser — nothing is uploaded, and there is no account.</li>
          <li>
            Trace style prints the model letter in grey and fades it across each repetition, so the last
            cell is nearly blank and the child writes into it.
          </li>
          <li>
            Print / Save as PDF opens the browser print dialog with the page sized for A4 — choose
            &quot;Save as PDF&quot; as the destination, and set margins to none to keep the full page.
          </li>
          <li>
            The guides are baseline plus x-height midline, which is what tells a learner where the
            letter sits. Turn them off for older children who already know the baseline.
          </li>
        </ul>
      </div>
    </div>
  );
}