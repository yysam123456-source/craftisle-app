import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { FileCode, Copy, Download, Trash2, Eye, Edit3, AlertTriangle } from "lucide-react";

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180">
  <rect width="320" height="180" rx="24" fill="#0f172a"/>
  <circle cx="96" cy="90" r="42" fill="#38bdf8" opacity=".85"/>
  <text x="160" y="98" fill="#ffffff" font-size="28" font-family="Arial, sans-serif" text-anchor="middle">SVG Editor</text>
</svg>`;

function parseSvg(markup: string) {
  if (typeof DOMParser === "undefined") return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(markup, "image/svg+xml");
  return doc.querySelector("parsererror") ? "SVG parsing failed. Please check tags and attributes." : "";
}

export default function SvgEditorTool() {
  const [svg, setSvg] = useState(DEFAULT_SVG);
  const error = useMemo(() => parseSvg(svg), [svg]);
  const previewSrc = useMemo(() => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, [svg]);

  const copySvg = async () => {
    try {
      await navigator.clipboard.writeText(svg);
      toast.success("SVG Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const downloadSvg = () => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graphic.svg";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("StartDownload SVG");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-140px)] flex flex-col">

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>ParseError</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 min-h-0 grid grid-rows-2 lg:grid-cols-2 lg:grid-rows-1 gap-4 lg:gap-6">
        <Card className="flex flex-col min-h-0 border-0 shadow-lg ring-1 ring-border">
          <CardHeader className="py-2 px-4 border-b bg-muted/30 flex flex-row items-center space-y-0"><CardTitle className="text-sm font-medium flex items-center gap-2"><Edit3 className="h-4 w-4" />Edit</CardTitle></CardHeader>
          <CardContent className="p-0 flex-1 min-h-0"><Textarea value={svg} onChange={(e) => setSvg(e.target.value)} className="h-full min-h-full resize-none rounded-none border-0 font-mono text-xs" placeholder="Enter SVG markup here" /></CardContent>
        </Card>

        <Card className="flex flex-col min-h-0 border-0 shadow-lg ring-1 ring-border overflow-hidden">
          <CardHeader className="py-2 px-4 border-b bg-muted/30 flex flex-row items-center space-y-0"><CardTitle className="text-sm font-medium flex items-center gap-2"><Eye className="h-4 w-4" />Preview</CardTitle></CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-auto p-6 bg-white dark:bg-zinc-950">
            {error ? <div className="text-sm text-muted-foreground">Preview paused, fix the error on the right first.</div> : <img src={previewSrc} alt="SVG code preview — free online SVG editor tool" className="max-h-full max-w-full object-contain" />}
          </CardContent>
        </Card>
      </div>
</div>
  );
}
