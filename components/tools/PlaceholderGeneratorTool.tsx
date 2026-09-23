import { useMemo, useState } from "react";
import { Image as ImageIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function buildSvg(w: number, h: number, bg: string, fg: string, text: string, fontSize: number): string {
  const t = (text || `${w} × ${h}`).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="50%" fill="${fg}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${t}</text>
</svg>`;
}

export default function PlaceholderGeneratorTool() {
  const [w, setW] = useState(600);
  const [h, setH] = useState(400);
  const [bg, setBg] = useState("#e5e7eb");
  const [fg, setFg] = useState("#6b7280");
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(48);

  const svg = useMemo(() => buildSvg(w, h, bg, fg, text, fontSize), [w, h, bg, fg, text, fontSize]);
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `placeholder-${w}x${h}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const downloadPng = () => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `placeholder-${w}x${h}.png`;
      a.click();
      toast.success("Downloaded PNG");
    };
    img.onerror = () => toast.error("Could not render PNG");
    img.src = dataUrl;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Placeholder Preview
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={downloadSvg}>
              <Download className="h-4 w-4 mr-2" /> SVG
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadPng}>
              <Download className="h-4 w-4 mr-2" /> PNG
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center overflow-auto rounded-lg border bg-muted/30 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={dataUrl} alt="Placeholder preview" style={{ maxWidth: "100%" }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input type="number" min={16} max={4000} value={w} onChange={(e) => setW(Math.max(16, parseInt(e.target.value) || 16))} />
          </div>
          <div className="space-y-2">
            <Label>Height</Label>
            <Input type="number" min={16} max={4000} value={h} onChange={(e) => setH(Math.max(16, parseInt(e.target.value) || 16))} />
          </div>
          <div className="space-y-2">
            <Label>Font size</Label>
            <Input type="number" min={8} max={400} value={fontSize} onChange={(e) => setFontSize(Math.max(8, parseInt(e.target.value) || 8))} />
          </div>
          <div className="space-y-2">
            <Label>Background</Label>
            <div className="flex gap-2">
              <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-9 w-12 cursor-pointer rounded border" aria-label="Background color" />
              <Input value={bg} onChange={(e) => setBg(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Text color</Label>
            <div className="flex gap-2">
              <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-9 w-12 cursor-pointer rounded border" aria-label="Text color" />
              <Input value={fg} onChange={(e) => setFg(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Text (leave empty for size)</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`${w} × ${h}`} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
