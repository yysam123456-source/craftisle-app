import { useState } from "react";
import { Terminal, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Parsed {
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;
  user: string | null;
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let cur = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"') cur += input[++i] ?? "";
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur) {
        tokens.push(cur);
        cur = "";
      }
    } else if (ch === "\\") {
      cur += input[++i] ?? "";
    } else {
      cur += ch;
    }
  }
  if (cur) tokens.push(cur);
  return tokens;
}

function parseCurl(cmd: string): Parsed {
  const tokens = tokenize(cmd.replace(/\\\r?\n/g, " ").trim());
  const args = tokens[0]?.toLowerCase() === "curl" ? tokens.slice(1) : tokens;
  const out: Parsed = { method: "", url: "", headers: [], body: null, user: null };
  let method: string | null = null;
  let hasData = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => args[++i] ?? "";
    if (a === "-X" || a === "--request") method = next().toUpperCase();
    else if (a === "-H" || a === "--header") {
      const h = next();
      const idx = h.indexOf(":");
      if (idx > -1) out.headers.push([h.slice(0, idx).trim(), h.slice(idx + 1).trim()]);
    } else if (a === "-d" || a === "--data" || a === "--data-raw" || a === "--data-binary" || a === "--data-urlencode") {
      out.body = (out.body ? out.body + "&" : "") + next();
      hasData = true;
    } else if (a === "-u" || a === "--user") out.user = next();
    else if (a === "--url") out.url = next();
    else if (a === "-b" || a === "--cookie") out.headers.push(["Cookie", next()]);
    else if (a === "-A" || a === "--user-agent") out.headers.push(["User-Agent", next()]);
    else if (a.startsWith("http://") || a.startsWith("https://")) out.url = a;
  }

  if (!out.url) {
    const guess = args.find((a) => /^https?:\/\//.test(a));
    if (guess) out.url = guess;
  }
  out.method = method || (hasData ? "POST" : "GET");
  if (!out.url) throw new Error("No URL found in the cURL command");
  return out;
}

function jsHeaders(p: Parsed): string {
  const lines = [...p.headers];
  if (p.user) {
    lines.push(["Authorization", `Basic ${btoa(p.user)}`]);
  }
  if (!lines.some((h) => h[0].toLowerCase() === "content-type") && p.body) {
    lines.push(["Content-Type", "application/json"]);
  }
  return lines.length
    ? "{\n" + lines.map(([k, v]) => `    "${k}": "${v.replace(/"/g, '\\"')}",`).join("\n") + "\n  }"
    : "{}";
}

function genFetch(p: Parsed): string {
  return `const res = await fetch("${p.url}", {
  method: "${p.method}",
  headers: ${jsHeaders(p)},${p.body ? `\n  body: JSON.stringify(${JSON.stringify(p.body)}),` : ""}
});

const data = await res.json();
console.log(data);`;
}

function genAxios(p: Parsed): string {
  return `import axios from "axios";

const { data } = await axios({
  url: "${p.url}",
  method: "${p.method.toLowerCase()}",
  headers: ${jsHeaders(p)},${p.body ? `\n  data: ${JSON.stringify(p.body)},` : ""}
});

console.log(data);`;
}

function genPython(p: Parsed): string {
  const headers = p.headers.map(([k, v]) => `    "${k}": "${v}",`).join("\n");
  const bodyLine = p.body ? `,\n    data=${JSON.stringify(p.body)}` : "";
  return `import requests

headers = {
${headers || '    # add headers here'}
}

response = requests.request("${p.method}", "${p.url}", headers=headers${bodyLine})

print(response.text)`;
}

function genPhp(p: Parsed): string {
  const headers = p.headers.map(([k, v]) => `    "${k}: ${v}",`).join("\n");
  return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "${p.url}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "${p.method}",
  CURLOPT_HTTPHEADER => [
${headers || "  "}
  ],${p.body ? `\n  CURLOPT_POSTFIELDS => ${JSON.stringify(p.body)},` : ""}
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
}

function genGo(p: Parsed): string {
  return `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
    var body io.Reader
    ${p.body ? `body = strings.NewReader(${JSON.stringify(p.body)})` : "// no request body"}
    req, _ := http.NewRequest("${p.method}", "${p.url}", body)
${p.headers.map(([k, v]) => `    req.Header.Set("${k}", "${v}")`).join("\n")}

    res, _ := http.DefaultClient.Do(req)
    defer res.Body.Close()
    out, _ := io.ReadAll(res.Body)
    fmt.Println(string(out))
}`;
}

const GENERATORS: Record<string, (p: Parsed) => string> = {
  fetch: genFetch,
  axios: genAxios,
  python: genPython,
  php: genPhp,
  go: genGo,
};

export default function CurlToCodeTool() {
  const [input, setInput] = useState(
    "curl -X POST https://api.example.com/users \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"name\":\"Ada\"}'"
  );
  const [lang, setLang] = useState("fetch");
  const [output, setOutput] = useState("");

  const convert = () => {
    try {
      const parsed = parseCurl(input);
      setOutput(GENERATORS[lang](parsed));
      toast.success("Converted");
    } catch (e) {
      setOutput("");
      toast.error((e as Error).message || "Could not parse cURL command");
    }
  };

  const copy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" /> cURL Command
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="min-h-56 font-mono text-sm resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='curl https://api.example.com -H "Authorization: Bearer ..."'
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <Select value={lang} onValueChange={setLang}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fetch">JavaScript (fetch)</SelectItem>
                    <SelectItem value="axios">JavaScript (axios)</SelectItem>
                    <SelectItem value="python">Python (requests)</SelectItem>
                    <SelectItem value="php">PHP (cURL)</SelectItem>
                    <SelectItem value="go">Go (net/http)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={convert}>Convert</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Generated Code</CardTitle>
            <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
              <Copy className="h-4 w-4 mr-2" /> Copy
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              className="min-h-56 font-mono text-sm resize-y"
              value={output}
              placeholder="Generated code appears here..."
            />
          </CardContent>
        </Card>
      </div>

      <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
        Supports <code>-X</code>, <code>-H</code>, <code>-d</code>, <code>-u</code>, <code>--url</code>,
        and multiline commands. Everything runs locally — your command (and any tokens in it) never
        leaves the browser.
      </div>
    </div>
  );
}
