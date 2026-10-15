"use client";

/**
 * CSS Minifier（CSS 压缩）
 *
 * 需求依据（Bing Suggest 2026-10-15，22 条建议）：
 *   css minifier / html css js minifier / what is minify css ...
 *   —— 「toptal」是竞品品牌词，不追。
 *
 * 🔴 手写压缩器的关键约束：**只在必须原样保留的片段之外删空白**。
 * `content: "a  b"` 里的空格是内容，删了就改语义；
 * `url( a.png )` 括号内外不能动；
 * 版权注释（斜杠星号叹号开头）即使开了删注释也要留。
 *
 * 🔴 注意：本注释里不能出现「斜杠星号 … 星号斜杠」的字面量 ——
 * 它会提前闭合块注释，后面全部被当成代码解析，报一堆莫名其妙的语法错。
 * （tsc 报的是 TS1443/TS1434，看着像正则写错，实际是这里。）
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface MinifyOptions {
  /** 删除注释（/*! … 的版权保留注释始终保留） */
  stripComments: boolean;
  /** 折叠连续空白为单个空格 */
  collapseWhitespace: boolean;
  /** 删除最后一个分号 */
  stripLastSemicolon: boolean;
  /** 删除选择器与 { 之间、} 后的空格 */
  stripStructuralSpaces: boolean;
}

export const DEFAULT_OPTIONS: MinifyOptions = {
  stripComments: true,
  collapseWhitespace: true,
  stripLastSemicolon: true,
  stripStructuralSpaces: true,
};

// 占位符前后用 \u0000（NUL）。它既不是空白也不是 CSS 元字符，
// 阶段 2 的 \s+→" " 与 \s*([{}:;,])\s* 都不会碰到它。
// 🔴 早期版本用空格包裹占位符（` STR0 `），结果还原正则永远匹配不上 ——
// 分隔空格先被归一吃掉了，输出里留下字面量被吞的坏 CSS。单测抓到的。
const PH = "\u0000";

/**
 * 纯函数压缩。导出以便 Node 端单测（组件是 .tsx，测试里无法直接 import）。
 */
export function minifyCss(input: string, opts: MinifyOptions = DEFAULT_OPTIONS): string {
  if (!input.trim()) return "";

  const literals: string[] = [];
  const keepComments: string[] = [];
  let work = input;

  // 1) 版权注释始终保留
  work = work.replace(/\/\*[\s\S]*?\*\//g, (m) => {
    if (m.startsWith("/*!")) {
      keepComments.push(m);
      return `${PH}K${keepComments.length - 1}${PH}`;
    }
    if (!opts.stripComments) return m;
    return " ";
  });

  // 2) 未加引号的 url(...) —— 括号内空白同样是内容
  work = work.replace(/url\(\s*([^'")][^)]*?)\s*\)/gi, (m) => {
    literals.push(m);
    return `${PH}S${literals.length - 1}${PH}`;
  });

  // 3) 字符串字面量
  work = work.replace(/(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/g, (m) => {
    literals.push(m);
    return `${PH}S${literals.length - 1}${PH}`;
  });

  // 阶段 2：空白处理
  if (opts.collapseWhitespace) {
    work = work.replace(/\s+/g, " ");
    work = work.replace(/\s*([{}:;,>~+])\s*/g, "$1");
  }

  if (opts.stripStructuralSpaces) {
    work = work
      .replace(/\s*([{};,])\s*/g, "$1")
      .replace(/;\}/g, "}")
      .replace(/;{2,}/g, ";");
    work = work.replace(/[{;]\s*;/g, (m) => m.replace(/;/g, ""));
  }

  // 阶段 3：还原。必须先字面量后注释 —— 反了会让字面量里的 /*! 破坏结构。
  // 还原后紧跟的空白是占位符被摘掉留下的痕迹，顺手清掉。
  work = work.replace(
    new RegExp(`${PH}S(\\d+)${PH}\\s*`, "g"),
    (_, i) => literals[Number(i)],
  );
  work = work.replace(
    new RegExp(`${PH}K(\\d+)${PH}\\s*`, "g"),
    (_, i) => keepComments[Number(i)],
  );

  if (opts.stripLastSemicolon) work = work.replace(/;\s*$/, "");

  return work.trim();
}

export default function CssMinifierTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [opts, setOpts] = useState<MinifyOptions>(DEFAULT_OPTIONS);

  const stats = useMemo(() => {
    if (!input) return null;
    const out = output || minifyCss(input, opts);
    const before = new Blob([input]).size;
    const after = new Blob([out]).size;
    return {
      before,
      after,
      saved: before > 0 ? Math.round(((before - after) / before) * 100) : 0,
    };
  }, [input, output, opts]);

  const run = () => {
    if (!input.trim()) {
      toast.error("Paste some CSS first.");
      return;
    }
    setOutput(minifyCss(input, opts));
    toast.success("Minified.");
  };

  const toggle = (key: keyof MinifyOptions) => (v: boolean) =>
    setOpts((p) => ({ ...p, [key]: v }));

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <Label className="mb-2 block font-semibold">CSS input</Label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`.card {
  padding: 16px;
  border-radius: 8px;
}`}
          rows={10}
          className="font-mono text-sm"
          spellCheck={false}
        />
      </Card>

      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap gap-5">
          <Toggle
            label="Strip comments"
            hint="keeps /*! legal notices"
            checked={opts.stripComments}
            onChange={toggle("stripComments")}
          />
          <Toggle
            label="Collapse whitespace"
            checked={opts.collapseWhitespace}
            onChange={toggle("collapseWhitespace")}
          />
          <Toggle
            label="Strip structural spaces"
            hint="around { } : ;"
            checked={opts.stripStructuralSpaces}
            onChange={toggle("stripStructuralSpaces")}
          />
          <Toggle
            label="Remove last semicolon"
            checked={opts.stripLastSemicolon}
            onChange={toggle("stripLastSemicolon")}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={run}>Minify</Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!output) return toast.error("Nothing to copy.");
              try {
                await navigator.clipboard.writeText(output);
                toast.success("Copied");
              } catch {
                toast.error("Copy failed");
              }
            }}
          >
            Copy result
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setOutput("");
              setInput("");
            }}
          >
            Clear both
          </Button>
        </div>

        {stats && stats.after > 0 ? (
          <p className="text-sm text-muted-foreground">
            {stats.before} bytes → {stats.after} bytes ·{" "}
            <strong className="text-foreground">{stats.saved}% smaller</strong>
          </p>
        ) : null}
      </Card>

      <Card className="p-5">
        <Label className="mb-2 block font-semibold">Minified output</Label>
        <Textarea
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          rows={10}
          className="font-mono text-sm"
          spellCheck={false}
        />
      </Card>

      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">What this does and does not do</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>
            String literals and unquoted <code className="mx-1">url()</code> arguments are
            protected before any whitespace is touched, so{" "}
            <code className="mx-1">content:&quot;a b&quot;</code> keeps its spaces.
          </li>
          <li>
            <code className="mx-1">/*! … */</code> licence headers are never removed, even with
            strip comments on — that is what the bang is for.
          </li>
          <li>No renaming, no reordering, no rule merging. Only bytes that carry no meaning are removed.</li>
          <li>Runs in this tab. Your stylesheet is never uploaded, which matters when it contains internal class names or tokens.</li>
        </ul>
      </div>
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span>
        {label}
        {hint ? <span className="block text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </label>
  );
}