"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Copy, Link2 } from "lucide-react";

// ---------- Simple AST Types ----------
interface ASTNode {
  type: string;
  raw?: string;
  children?: ASTNode[];
  flags?: string[];
}

// ---------- Simple Regex → AST Parser ----------
function parseRegexToAST(regex: string, flags: string[]): { ast: ASTNode | null; error: string | null } {
  if (!regex) return { ast: null, error: null };
  try {
    new RegExp(regex, flags.join(""));
  } catch (e: any) {
    return { ast: null, error: e?.message || "Invalid regex" };
  }

  const ast: ASTNode = { type: "regex", flags, children: [] };
  const stack: ASTNode[] = [ast];
  let i = 0;
  const len = regex.length;

  while (i < len) {
    const ch = regex[i];
    const top = stack[stack.length - 1];

    if (ch === "(") {
      const group: ASTNode = { type: "group", raw: "(", children: [] };
      if (regex[i + 1] === "?" && regex[i + 2] === ":") {
        group.raw = "(?:";
        i += 3;
      } else {
        i++;
      }
      top.children = top.children || [];
      top.children.push(group);
      stack.push(group);
      continue;
    }

    if (ch === ")") {
      stack.pop();
      i++;
      // check quantifier after )
      if (i < len && "*+?{".includes(regex[i])) {
        const q = parseQuantifier(regex, i);
        const last = top.children![top.children!.length - 1];
        if (last && last.type !== "alternation") {
          top.children![top.children!.length - 1] = {
            type: "quantifier",
            raw: q.text,
            children: [last],
          };
          i = q.next;
        }
      }
      continue;
    }

    if (ch === "|") {
      top.children = top.children || [];
      top.children.push({ type: "alternation", children: [] });
      i++;
      continue;
    }

    if (ch === "[" && !regex.startsWith("\\", i)) {
      const ccEnd = regex.indexOf("]", i + 1);
      const ccRaw = ccEnd > i ? regex.slice(i, ccEnd + 1) : "[...]";
      top.children = top.children || [];
      top.children.push({ type: "charset", raw: ccRaw });
      i = ccEnd > i ? ccEnd + 1 : i + 1;
      continue;
    }

    if ("*+?{".includes(ch)) {
      const q = parseQuantifier(regex, i);
      const last = top.children![top.children!.length - 1];
      if (last && last.type !== "alternation") {
        top.children![top.children!.length - 1] = {
          type: "quantifier",
          raw: q.text,
          children: [last],
        };
        i = q.next;
      } else {
        i++;
      }
      continue;
    }

    if (ch === ".") {
      top.children = top.children || [];
      top.children.push({ type: "wildcard", raw: "." });
      i++;
      continue;
    }
    if (ch === "^" || ch === "$") {
      top.children = top.children || [];
      top.children.push({ type: "anchor", raw: ch });
      i++;
      continue;
    }
    if (ch === "\\") {
      const escEnd = i + 1 < len ? i + 1 : i;
      top.children = top.children || [];
      top.children.push({ type: "escape", raw: regex.slice(i, escEnd + 1) });
      i = escEnd + 1;
      continue;
    }

    // literal
    top.children = top.children || [];
    top.children.push({ type: "literal", raw: ch });
    i++;
  }

  return { ast, error: null };
}

function parseQuantifier(regex: string, start: number): { text: string; next: number } {
  const ch = regex[start];
  if (ch === "*") return { text: "*", next: start + 1 };
  if (ch === "+") return { text: "+", next: start + 1 };
  if (ch === "?") return { text: "?", next: start + 1 };
  if (ch === "{") {
    const end = regex.indexOf("}", start);
    if (end > start) return { text: regex.slice(start, end + 1), next: end + 1 };
  }
  return { text: ch, next: start + 1 };
}

// ---------- AST → SVG Graph ----------
function ASTGraph({ ast, regex, onNodeClick }: { ast: ASTNode | null; regex: string; onNodeClick?: (node: ASTNode) => void }) {
  if (!ast || !ast.children || ast.children.length === 0) {
    return <div className="text-muted-foreground text-sm p-8 text-center">Enter a regex pattern to see the AST graph.</div>;
  }

  const svgW = 680;
  const svgH = estimateHeight(ast) * 54 + 40;

  let nodeId = 0;
  const nodes: JSX.Element[] = [];
  const edges: JSX.Element[] = [];

  function walk(node: ASTNode, x: number, y: number, w: number, depth: number) {
    const id = `n${nodeId++}`;
    const color = nodeColor(node.type);
    const label = nodeLabel(node);
    const myH = 40;

    nodes.push(
      <g key={id} onClick={() => onNodeClick?.(node)} className="cursor-pointer hover:opacity-80">
        <rect x={x} y={y} width={w} height={myH} rx={8} ry={8}
          fill={color.bg} stroke={color.border} strokeWidth={0.5} />
        <text x={x + w / 2} y={y + myH / 2}
          textAnchor="middle" dominantBaseline="central"
          fontSize={12} fontWeight={500} fill={color.text}
        >
          {label}
        </text>
      </g>
    );

    if (node.children && node.children.length > 0) {
      const childW = Math.max(80, (w - (node.children.length - 1) * 8) / node.children.length);
      const childY = y + myH + 30;
      const totalW = node.children.length * (childW + 8) - 8;
      const startX = x + (w - totalW) / 2;

      node.children.forEach((child, ci) => {
        const cx = startX + ci * (childW + 8);
        edges.push(
          <line key={`e${id}${ci}`}
            x1={x + w / 2} y1={y + myH}
            x2={cx + childW / 2} y2={childY}
            stroke="#94a3b8" strokeWidth={0.5} markerEnd="url(#arrow)" />
        );
        walk(child, cx, childY, childW, depth + 1);
      });
    }
  }

  walk(ast, 40, 20, svgW - 80, 0);

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ fontFamily: "monospace", fontSize: 12 }}>
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX={8} refY={5}
          markerWidth={6} markerHeight={6} orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="currentColor"
            strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>
      {edges}
      {nodes}
    </svg>
  );
}

function estimateHeight(node: ASTNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(estimateHeight));
}

function nodeColor(type: string): { bg: string; border: string; text: string } {
  const map: Record<string, { bg: string; border: string; text: string }> = {
    "group":        { bg: "#EEEDFE", border: "#7F77DD", text: "#26215C" },
    "quantifier":  { bg: "#E1F5EE", border: "#1D9E75", text: "#04342C" },
    "charset":     { bg: "#FAECE7", border: "#D85A30", text: "#712B13" },
    "alternation": { bg: "#E6F1FB", border: "#378ADD", text: "#042C53" },
    "wildcard":    { bg: "#FBEAF0", border: "#D4537E", text: "#4B1528" },
    "anchor":      { bg: "#E1F5EE", border: "#1D9E75", text: "#04342C" },
    "escape":      { bg: "#FAECE7", border: "#D85A30", text: "#712B13" },
    "literal":     { bg: "#F1EFE8", border: "#888780", text: "#2C2C2A" },
  };
  return map[type] || { bg: "#F1EFE8", border: "#888780", text: "#2C2C2A" };
}

function nodeLabel(node: ASTNode): string {
  if (node.raw) {
    const s = node.type === "literal" ? `"${node.raw}"` : node.raw;
    return s.length > 20 ? s.slice(0, 18) + "..." : s;
  }
  return node.type;
}

// ---------- Main Client Component ----------
export default function RegexVisClient() {
  const [regex, setRegex] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [testStr, setTestStr] = useState("");
  const [astResult, setAstResult] = useState<{ ast: ASTNode | null; error: string | null }>({ ast: null, error: null });
  const [tab, setTab] = useState<"graph" | "test" | "edit">("graph");
  const [matches, setMatches] = useState<RegExpExecArray[]>([]);
  const [copied, setCopied] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ASTNode | null>(null);

  // Parse on regex/flags change
  useEffect(() => {
    const r = parseRegexToAST(regex, flags);
    setAstResult(r);
  }, [regex, flags]);

  // Test on regex/testStr/flags change
  useEffect(() => {
    if (!regex || !testStr) { setMatches([]); return; }
    try {
      const f = flags.includes("i") ? "i" : "";
      const g = flags.includes("g") ? "g" : "";
      const m = flags.includes("m") ? "m" : "";
      const re = new RegExp(regex, f + g + m);
      const ms: RegExpExecArray[] = [];
      if (re.global) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(testStr)) !== null) {
          ms.push(m);
          if (m[0].length === 0) re.lastIndex++;
        }
      } else {
        const m = re.exec(testStr);
        if (m) ms.push(m);
      }
      setMatches(ms);
    } catch {
      setMatches([]);
    }
  }, [regex, flags, testStr]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(regex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [regex]);

  const handleCopyPermalink = useCallback(() => {
    const url = `${window.location.pathname}?r=${encodeURIComponent(regex)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [regex]);

  // Highlight matches in test string
  const renderHighlighted = () => {
    if (!testStr || matches.length === 0) return <span>{testStr}</span>;
    const parts: JSX.Element[] = [];
    let last = 0;
    matches.forEach((m, i) => {
      if (m.index > last) {
        parts.push(<span key={`t${i}`}>{testStr.slice(last, m.index)}</span>);
      }
      parts.push(
        <span key={`m${i}`} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
          {m[0]}
        </span>
      );
      last = m.index + m[0].length;
    });
    if (last < testStr.length) {
      parts.push(<span key="tend">{testStr.slice(last)}</span>);
    }
    return <>{parts}</>;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Regex Visualizer</h1>
        <p className="text-muted-foreground text-sm">
          Visualize regular expressions as an AST graph. Edit visually, test matches in real-time.
        </p>
      </div>

      {/* Regex Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regex Pattern</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Enter regex pattern, e.g. ^(a|b)+$"
              className="font-mono text-sm"
            />
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? "Copied!" : <Copy className="h-4 w-4" />}
            </Button>
            <Button onClick={handleCopyPermalink} variant="outline" size="sm">
              <Link2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Flags */}
          <div className="flex gap-2">
            {["g", "i", "m", "s", "u", "y"].map((f) => (
              <Badge
                key={f}
                variant={flags.includes(f) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setFlags((prev) =>
                    prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
                  );
                }}
              >
                {f}
              </Badge>
            ))}
          </div>

          {/* Error */}
          {astResult.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{astResult.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Graph / Test / Edit */}
      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="graph">AST Graph</TabsTrigger>
          <TabsTrigger value="test">Test Matches</TabsTrigger>
          <TabsTrigger value="edit">Edit (Visual)</TabsTrigger>
        </TabsList>

        {/* Graph Tab */}
        <TabsContent value="graph" className="min-h-[300px]">
          <Card>
            <CardContent className="p-4 overflow-auto">
              {!regex ? (
                <div className="text-muted-foreground py-12 text-center">
                  Enter a regex pattern to see the AST graph.
                </div>
              ) : astResult.error ? (
                <div className="text-destructive py-12 text-center">
                  {astResult.error}
                </div>
              ) : (
                <ASTGraph
                  ast={astResult.ast}
                  regex={regex}
                  onNodeClick={(node) => setSelectedNode(node)}
                />
              )}
            </CardContent>
          </Card>
          {selectedNode && (
            <Card className="mt-2">
              <CardHeader>
                <CardTitle className="text-sm">Selected Node</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div><span className="text-muted-foreground">Type:</span> {selectedNode.type}</div>
                {selectedNode.raw && <div><span className="text-muted-foreground">Raw:</span> <code className="font-mono">{selectedNode.raw}</code></div>}
                {selectedNode.children && <div><span className="text-muted-foreground">Children:</span> {selectedNode.children.length}</div>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Test String</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={testStr}
                onChange={(e) => setTestStr(e.target.value)}
                placeholder="Enter test string..."
                rows={4}
              />
              {matches.length > 0 && (
                <div>
                  <Label>Matches ({matches.length})</Label>
                  <div className="bg-muted mt-2 rounded-md p-3 font-mono text-sm whitespace-pre-wrap">
                    {renderHighlighted()}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {matches.map((m, i) => (
                      <div key={i} className="bg-accent rounded px-2 py-1">
                        <span className="text-muted-foreground">Match {i + 1}: </span>
                        <span className="font-mono">{m[0]}</span>
                        {m.length > 1 && (
                          <span className="text-muted-foreground ml-2">
                            groups: [{m.slice(1).join(", ")}]
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {testStr && matches.length === 0 && !astResult.error && (
                <div className="text-muted-foreground text-sm">No matches found.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Tab (simplified) */}
        <TabsContent value="edit">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Visual node editing coming soon. Use the regex input above to modify the pattern.
              </p>
              {astResult.ast && (
                <pre className="bg-muted mt-4 overflow-auto rounded p-3 text-left text-xs">
                  {JSON.stringify(astResult.ast, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
