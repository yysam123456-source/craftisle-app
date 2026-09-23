import { useState } from "react";
import { FileCode2, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const TEMPLATES: Record<string, string[]> = {
  Node: ["node_modules/", "dist/", "build/", ".env", ".env.local", "npm-debug.log*", "yarn-error.log*", ".cache/"],
  Python: ["__pycache__/", "*.py[cod]", ".venv/", "venv/", ".env", "*.egg-info/", ".pytest_cache/", "dist/", "build/"],
  Java: ["target/", "*.class", "*.jar", "*.war", ".gradle/", "build/", "out/"],
  Go: ["*.exe", "*.test", "*.out", "vendor/", "bin/"],
  Rust: ["target/", "Cargo.lock", "**/*.rs.bk"],
  "React/Next": [".next/", "out/", "build/", "node_modules/", ".env*.local", "*.tsbuildinfo"],
  macOS: [".DS_Store", ".AppleDouble", ".LSOverride", "._*"],
  Windows: ["Thumbs.db", "ehthumbs.db", "Desktop.ini", "$RECYCLE.BIN/"],
  Linux: ["*~", ".fuse_hidden*", ".directory", ".Trash-*"],
  IDE: [".idea/", ".vscode/", "*.swp", "*.swo", ".project", ".classpath"],
  Logs: ["*.log", "logs/", "npm-debug.log*", "yarn-debug.log*"],
  "Env/Secrets": [".env", ".env.*", "!.env.example", "*.pem", "*.key"],
};

export default function GitignoreGeneratorTool() {
  const [selected, setSelected] = useState<string[]>(["Node", "macOS", "IDE"]);
  const [custom, setCustom] = useState("");

  const toggle = (key: string) =>
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const output = [
    ...selected.flatMap((k) => [`# ${k}`, ...TEMPLATES[k], ""]),
    ...(custom.trim() ? ["# Custom", ...custom.split("\n")] : []),
  ]
    .join("\n")
    .trim();

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const download = () => {
    if (!output) return;
    const blob = new Blob([output + "\n"], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = ".gitignore";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded .gitignore");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode2 className="h-5 w-5" /> Select Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {Object.keys(TEMPLATES).map((k) => {
              const on = selected.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggle(k)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>
          <div className="space-y-2">
            <Label>Custom entries (one per line)</Label>
            <Textarea
              className="min-h-24 font-mono text-sm resize-y"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder={"secrets.json\n*.local"}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">.gitignore</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
            <Button variant="ghost" size="sm" onClick={download} disabled={!output}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea readOnly className="min-h-64 font-mono text-sm resize-y" value={output} />
        </CardContent>
      </Card>
    </div>
  );
}
