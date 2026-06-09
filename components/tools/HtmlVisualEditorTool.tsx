"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, FileCode, Loader2, Download, RefreshCw, AlertCircle } from "lucide-react";

const EDITOR_JS_PATH = "/editor.js";

export default function HtmlVisualEditorTool() {
  const [htmlInput, setHtmlInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [iframeSrcdoc, setIframeSrcdoc] = useState<string>("");
  const [editorJs, setEditorJs] = useState<string>("");
  const [status, setStatus] = useState<{
    text: string;
    type: "idle" | "ready" | "error" | "loading";
  }>({
    text: 'Upload an HTML file or paste HTML code, then click "Start Visual Editing".',
    type: "idle",
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch editor.js text on mount (bust cache with timestamp)
  useEffect(() => {
    fetch(EDITOR_JS_PATH + "?t=" + Date.now())
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => setEditorJs(text))
      .catch(() => setEditorJs(""));
  }, []);

  // Handle file upload via FileReader (100% local)
  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.html?$/i)) {
      setStatus({ text: "Please upload an .html or .htm file.", type: "error" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setHtmlInput(content || "");
      setFileName(file.name);
      setStatus({
        text: `Loaded "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Click "Start Visual Editing" to begin.`,
        type: "ready",
      });
    };
    reader.onerror = () => {
      setStatus({ text: "Failed to read file. Try pasting HTML instead.", type: "error" });
    };
    reader.readAsText(file);
  }, []);

  // Drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  // Inject editor.js via external <script src="..."> tag (no inline)
  function buildEditorSrcdoc(html: string): string {
    // Strip any existing editor.js/script tags
    let cleaned = html
      .replace(/<script[^>]*src=["'][^"']*editor\.js[^"']*["'][^>]*><\/script>\s*/gi, "")
      .replace(/<script[^>]*data-ve\b[^>]*>[\s\S]*?<\/script>\s*/gi, "");

    // Use external script tag — avoids inline <\/script> escaping issues
    const externalScript = `<script src="/editor.js" data-ve="1"></script>`;

    // Inject before </body> or </html>, or append
    if (/<\/body\s*>/i.test(cleaned)) {
      return cleaned.replace(/<\/body\s*>/i, externalScript + "\n</body>");
    }
    if (/<\/html\s*>/i.test(cleaned)) {
      return cleaned.replace(/<\/html\s*>/i, externalScript + "\n</html>");
    }
    return cleaned + "\n" + externalScript;
  }

  // Start editing: build srcdoc and load into iframe
  const startEditing = useCallback(() => {
    const html = htmlInput.trim();
    if (!html) {
      setStatus({ text: "Please upload or paste HTML first.", type: "error" });
      return;
    }
    if (!editorJs) {
      setStatus({ text: "Editor script still loading. Please wait a moment and try again.", type: "loading" });
      return;
    }

    setStatus({ text: "Loading visual editor...", type: "loading" });
    const srcdoc = buildEditorSrcdoc(html);
    setIframeSrcdoc(srcdoc);
    setEditing(true);
    // Status will be updated after iframe loads
  }, [htmlInput, editorJs]);

  // Listen for postMessage from iframe (copy/download/reload)
  const startEditingRef = useRef(startEditing);
  startEditingRef.current = startEditing;
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || typeof e.data !== "object") return;
      const { type, html, filename } = e.data;
      if (type === "__ve-copy" && html) {
        navigator.clipboard.writeText(html).then(
          () => setStatus({ text: "HTML copied to clipboard.", type: "ready" }),
          () => setStatus({ text: "Copy failed. Use Export HTML button instead.", type: "error" })
        );
      }
      if (type === "__ve-download" && html) {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename || "edited.html";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1000);
        setStatus({ text: "HTML downloaded.", type: "ready" });
      }
      if (type === "__ve-reload") {
        setEditing(false);
        setIframeSrcdoc("");
        setTimeout(() => startEditingRef.current(), 100);
      }
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  // Called when iframe finishes loading srcdoc
  const handleIframeLoad = useCallback(() => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      if (iframeDoc) {
        // editor.js auto-activates when it sees data-ve="1" script
        setStatus({
          text: "Editor loaded. Click any element in the preview to edit it.",
          type: "ready",
        });
      }
    } catch {
      // Cross-origin restriction — editor.js may still work
      setStatus({ text: "Editor loaded.", type: "ready" });
    }
  }, []);

  // Export clean HTML from iframe
  const exportHtml = useCallback(() => {
    if (!iframeRef.current) return;
    try {
      const iframeDoc = iframeRef.current.contentDocument;
      if (!iframeDoc) {
        setStatus({ text: "Cannot access iframe content (cross-origin).", type: "error" });
        return;
      }
      // Clone and strip editor artifacts
      const cloned = iframeDoc.documentElement.cloneNode(true) as HTMLElement;
      cloned.querySelectorAll("[data-ve]").forEach((el) => el.remove());
      cloned.querySelectorAll("[class*='ve-']").forEach((el) => {
        if (el instanceof HTMLElement) {
          el.classList.remove(...Array.from(el.classList).filter((c) => c.startsWith("ve-")));
        }
      });

      const cleanHtml =
        "<!DOCTYPE html>\n" +
        cloned.outerHTML
          .replace(/\s+data-ve="[^"]*"/g, "")
          .replace(/<script[^>]*data-ve[^>]*>[\s\S]*?<\/script>\s*/gi, "");

      const blob = new Blob([cleanHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName
        ? fileName.replace(/\.html?$/i, "-edited.html")
        : "edited.html";
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ text: "HTML exported successfully!", type: "ready" });
    } catch {
      setStatus({ text: "Export failed. Try copy-pasting from preview.", type: "error" });
    }
  }, [fileName]);

  // Reset everything
  const resetAll = useCallback(() => {
    setHtmlInput("");
    setFileName(null);
    setEditing(false);
    setIframeSrcdoc("");
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
    }
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
    setStatus({
      text: 'Reset complete. Upload or paste HTML to start again.',
      type: "idle",
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">HTML Visual Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">
            100% browser-based. Upload or paste HTML, edit visually, export clean HTML.
          </p>
        </div>
        {editing && (
          <Button variant="outline" onClick={resetAll} size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Status bar */}
      {status.text && (
        <div
          className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
            status.type === "error"
              ? "bg-destructive/10 text-destructive"
              : status.type === "loading"
              ? "bg-muted/50 text-muted-foreground"
              : "bg-primary/10 text-primary"
          }`}
        >
          {status.type === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : null}
          <span>{status.text}</span>
        </div>
      )}

      {!editing ? (
        /* Input mode */
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          {/* Upload area */}
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium">Click or drag HTML file here</p>
            <p className="text-xs text-muted-foreground mt-2">Supports .html, .htm up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Paste HTML */}
          <div className="space-y-2">
            <label htmlFor="html-input" className="text-sm font-medium">
              Or paste HTML code
            </label>
            <Textarea
              id="html-input"
              ref={textareaRef}
              className="min-h-[200px] font-mono text-xs"
              placeholder="<!DOCTYPE html>...</html>"
              value={htmlInput}
              onChange={(e) => {
                setHtmlInput(e.target.value);
                if (e.target.value.trim()) {
                  setStatus({ text: "HTML code entered. Click 'Start Visual Editing'.", type: "ready" });
                }
              }}
            />
          </div>
        </div>
      ) : (
        /* Editing mode: iframe preview */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Visual Editor</h2>
            <div className="flex gap-2">
              <Button onClick={exportHtml} size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export HTML
              </Button>
            </div>
          </div>
          <div className="border rounded-xl overflow-hidden bg-white min-h-[600px]">
            {iframeSrcdoc && (
              <iframe
                ref={iframeRef}
                title="HTML Visual Editor"
                sandbox="allow-scripts allow-downloads"
                className="w-full min-h-[600px]"
                srcDoc={iframeSrcdoc}
                onLoad={handleIframeLoad}
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The editor runs entirely in your browser. Your HTML is never uploaded to any server.
          </p>
        </div>
      )}

      {/* Action button (input mode only) */}
      {!editing && (
        <Button onClick={startEditing} size="lg" className="w-full">
          <FileCode className="mr-2 h-5 w-5" />
          Start Visual Editing
        </Button>
      )}

      {/* Tips */}
      {!editing && (
        <div className="border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold text-sm">How to use</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Upload an HTML file or paste HTML code in the editor.</li>
            <li>Click <strong>Start Visual Editing</strong> to load the visual editor.</li>
            <li>Click any element in the preview to edit it visually.</li>
            <li>Click <strong>Export HTML</strong> to download the edited result.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
