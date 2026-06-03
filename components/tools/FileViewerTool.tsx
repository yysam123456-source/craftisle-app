import { ArrowRight, Eye, Shield, FileText, Image, Code } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ToolDetailSections from "@/components/tools/ToolDetailSections";

const FEATURES = [
  {
    icon: FileText,
    title: "135+ Formats",
    desc: "PDF, Word, Excel, CAD, 3D, images, archives, code & more",
  },
  {
    icon: Shield,
    title: "100% Private",
    desc: "Files never leave your device. All processing happens in your browser.",
  },
  {
    icon: Eye,
    title: "No Install",
    desc: "Works in any modern browser. No plugins, no downloads.",
  },
];

const FORMAT_EXAMPLES = [
  { ext: ".pdf", label: "PDF" },
  { ext: ".docx", label: "Word" },
  { ext: ".xlsx", label: "Excel" },
  { ext: ".pptx", label: "PPT" },
  { ext: ".dwg", label: "CAD" },
  { ext: ".stl", label: "3D" },
  { ext: ".zip", label: "Archive" },
  { ext: ".py", label: "Code" },
];

export default function FileViewerTool() {
  return (
    <div className="space-y-8">
      {/* ============================================================
          Hero
      ============================================================ */}
      <section className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
            <Eye className="h-8 w-8 text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            File Viewer
          </h1>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground">
            Preview 135+ file formats instantly — PDF, Word, Excel, CAD, 3D
            models & more. 100% browser-based, nothing leaves your device.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://viewer.craftisle.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="gap-2 text-base">
              Open File Viewer <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>

        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>135+ formats</span>
          <span>·</span>
          <span>0 uploads to server</span>
          <span>·</span>
          <span>50 MB max</span>
        </div>
      </section>

      {/* ============================================================
          Why Section
      ============================================================ */}
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="text-center">
            <CardContent className="pt-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* ============================================================
          Format Examples
      ============================================================ */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          Supported Formats
        </h2>
        <div className="flex flex-wrap gap-2">
          {FORMAT_EXAMPLES.map((f) => (
            <span
              key={f.ext}
              className="rounded-lg border bg-card px-3 py-1.5 text-sm"
            >
              <span className="font-mono text-xs text-muted-foreground mr-1">
                {f.ext}
              </span>
              {f.label}
            </span>
          ))}
          <span className="rounded-lg border bg-card px-3 py-1.5 text-sm text-muted-foreground">
            + 127 more…
          </span>
        </div>
      </section>

      {/* ============================================================
          Preview Screenshot / Demo CTA
      ============================================================ */}
      <section className="rounded-2xl border bg-muted/30 p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Ready to preview?</h2>
        <p className="text-muted-foreground">
          Open the viewer, drop any file, and see instant results — no signup,
          no install.
        </p>
        <a
          href="https://viewer.craftisle.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="lg" className="gap-2">
            Launch File Viewer <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      </section>

      {/* SEO / Tool Detail Sections */}
      <ToolDetailSections toolId="file-viewer" />
    </div>
  );
}
