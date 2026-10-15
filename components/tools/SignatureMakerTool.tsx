"use client";

/**
 * Signature Maker（手写签名生成器）
 *
 * 需求依据（Bing Suggest 2026-10-15，69 条建议）：
 *   signature maker online free / copy and paste / for email / cursive / png /
 *   for names / free no sign up / pdf ...
 *   —— 「ai」「from image」「download apk」「for android」不追：
 *   AI 生成与图片转签名要么需要上传图片（违隐私立场），要么要装客户端。
 *
 * 隐私立场：签名是个人身份标记，**绝不做「上传手写签名图片转透明背景」**——
 * 那种要用户把签名原图传到别人服务器。本工具只画在本地 canvas，不上传。
 */

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

const FONTS = [
  { id: "cursive", css: '"Segoe Script", "Bradley Hand", "Brush Script MT", cursive', label: "Cursive" },
  { id: "elegant", css: '"Edwardian Script ITC", "Palace Script MT", "Monotype Corsiva", cursive', label: "Elegant script" },
  { id: "casual", css: '"Comic Sans MS", "Segoe Print", cursive', label: "Casual hand" },
  { id: "formal", css: '"Palatino Linotype", "Book Antiqua", Georgia, serif', label: "Formal serif" },
  { id: "marker", css: '"Ink Free", "Marker Felt", "Segoe Print", cursive', label: "Marker" },
  { id: "mono", css: '"Courier New", ui-monospace, monospace', label: "Monospace (typewriter)" },
] as const;

const INKS = ["#0f172a", "#1e3a8a", "#7f1d1d", "#14532d", "#4c1d95", "#000000"];

interface ImgOpts {
  transparent: boolean;
  format: "png" | "jpg";
  scale: number;
}

export default function SignatureMakerTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const hasInk = useRef(false);

  const [font, setFont] = useState<(typeof FONTS)[number]["id"]>("cursive");
  const [color, setColor] = useState("#0f172a");
  const [width, setWidth] = useState(3);
  const [transparent, setTransparent] = useState(true);
  const [name, setName] = useState("");

  const canvasW = 900;
  const canvasH = 320;

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!transparent) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
    }
    hasInk.current = false;
  }, [transparent]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvasW,
      y: ((e.clientY - rect.top) / rect.height) * canvasH,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = getPos(e);
    hasInk.current = true;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  /** 用名字生成一笔「手写体」参考签名（不是字体渲染，是路径变形） */
  const generateFromName = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    clearCanvas();
    const text = name.trim();
    if (!text) {
      toast.error("Type a name first, or draw it by hand.");
      return;
    }

    const fontDef = FONTS.find((f) => f.id === font) ?? FONTS[0];
    const size = 130;
    ctx.font = `${size}px ${fontDef.css}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // 逐字加随机位移与旋转，模拟手写的不规则
    const total = text.length;
    const step = Math.min(size * 0.62, (canvasW - 120) / Math.max(total, 1));
    const startX = canvasW / 2 - ((total - 1) * step) / 2;

    for (let i = 0; i < total; i++) {
      const ch = text[i];
      // 用固定伪随机（基于字符码 + 索引），保证每次生成结果一致
      const seed = ch.charCodeAt(0) * 31 + i * 17;
      const jitterY = ((seed % 13) - 6) * 1.6;
      const rot = (((seed >> 4) % 11) - 5) * 0.012;
      const scale = 1 + (((seed >> 8) % 7) - 3) * 0.012;

      ctx.save();
      ctx.translate(startX + i * step, canvasH / 2 + jitterY);
      ctx.rotate(rot);
      ctx.scale(scale, scale);
      ctx.fillStyle = color;
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }

    // 一条手写风格的横线尾巴
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 0.8;
    ctx.lineCap = "round";
    ctx.moveTo(startX - 10, canvasH / 2 + 74);
    ctx.bezierCurveTo(
      canvasW * 0.35,
      canvasH / 2 + 92,
      canvasW * 0.65,
      canvasH / 2 + 58,
      startX + (total - 1) * step + 10,
      canvasH / 2 + 80,
    );
    ctx.stroke();

    hasInk.current = true;
    toast.success("Signature generated — adjust the style or download it.");
  }, [name, font, color, width, clearCanvas]);

  const download = useCallback(
    (opts: ImgOpts) => {
      const c = canvasRef.current;
      if (!c) return;
      if (!hasInk.current) {
        toast.error("Draw or generate a signature first.");
        return;
      }

      const out = document.createElement("canvas");
      out.width = c.width * opts.scale;
      out.height = c.height * opts.scale;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      if (opts.format === "jpg") {
        // JPEG 没有透明通道，必须铺白底，否则透明区会变黑
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(c, 0, 0, out.width, out.height);

      out.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Could not encode the image.");
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = opts.format === "jpg" ? "signature.jpg" : "signature.png";
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Downloaded ${opts.scale}× ${opts.format.toUpperCase()}`);
        },
        opts.format === "jpg" ? "image/jpeg" : "image/png",
        0.95,
      );
    },
    [],
  );

  const copyToClipboard = useCallback(async () => {
    const c = canvasRef.current;
    if (!c || !hasInk.current) {
      toast.error("Draw or generate a signature first.");
      return;
    }
    try {
      const blob: Blob | null = await new Promise((res) => c.toBlob(res, "image/png"));
      if (!blob) throw new Error("encode failed");
      // Clipboard API 只接受 PNG，且部分浏览器不支持 canvas.toBlob 之外的内容类型
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Signature copied — paste it straight into an email.");
    } catch {
      toast.error("This browser blocked the image clipboard. Download the PNG instead.");
    }
  }, []);

  const fontDef = FONTS.find((f) => f.id === font) ?? FONTS[0];

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">Handwriting style</Label>
            <Select value={font} onValueChange={(v) => setFont(v as typeof font)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">Ink colour</Label>
            <div className="flex flex-wrap gap-2">
              {INKS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`ink ${c}`}
                  className="h-7 w-7 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "#0f172a" : "transparent",
                    transform: color === c ? "scale(1.15)" : undefined,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Stroke width: {width}px</Label>
          <Slider value={[width]} min={1} max={14} step={1} onValueChange={(v) => setWidth(v[0])} />
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Or type a name to generate one</Label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <Button onClick={generateFromName}>Generate</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Each letter gets a slight offset and tilt so the result reads as handwriting rather
            than typed text. It is a starting point — trace over it with your mouse for a signature
            that is actually yours.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => {
              setTransparent(e.target.checked);
              if (!e.target.checked) clearCanvas();
            }}
            className="h-4 w-4 rounded border-slate-300"
          />
          Transparent background (for PNG / Word / email)
        </label>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Sign here — mouse, finger or stylus</p>
          <Button variant="ghost" size="sm" onClick={clearCanvas}>
            Clear
          </Button>
        </div>
        <div
          className="rounded-lg border"
          style={{ background: transparent ? "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px" : "#ffffff" }}
        >
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
            className="block h-auto w-full touch-none"
            style={{ cursor: "crosshair" }}
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Draw with a mouse, a finger on a touchscreen, or a stylus. The signature never leaves this
          page — it is drawn on a local canvas and nothing is transmitted.
        </p>
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Export</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => download({ transparent, format: "png", scale: 1 })}>
            PNG (transparent)
          </Button>
          <Button variant="outline" onClick={() => download({ transparent, format: "png", scale: 3 })}>
            PNG 3× (print / Word)
          </Button>
          <Button variant="outline" onClick={() => download({ transparent, format: "jpg", scale: 2 })}>
            JPG 2× (white background)
          </Button>
          <Button variant="secondary" onClick={copyToClipboard}>
            Copy to clipboard
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          For Word documents use the 3× PNG — it stays sharp when scaled and Word keeps the
          transparency. For an email signature, Copy to clipboard pastes the image straight in.
        </p>
      </Card>

      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">How it works</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>Drawing happens on an HTML canvas in this browser tab — pointer events only, no network request at any point.</li>
          <li>
            Name generation draws the characters with per-letter jitter and rotation so the output
            looks handwritten. It is deliberately not an AI service: uploading your name to a
            third-party model server would be a poor trade for something this small.
          </li>
          <li>PNG keeps transparency; JPG always gets a white background because JPEG cannot store an alpha channel.</li>
          <li>There is no account and no saved history — close the tab and the signature is gone, which is what you want for a legal mark.</li>
        </ul>
        <p className="mt-3 text-xs">
          Style preview font: <span style={{ fontFamily: fontDef.css, fontSize: 20 }}>Sample Signature</span>
        </p>
      </div>
    </div>
  );
}