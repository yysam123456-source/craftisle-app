"use client";

/**
 * Typing Speed Test（打字测速）
 *
 * 需求依据（Bing Suggest 2026-10-15，75 条建议）：
 *   typing test online free / 60 seconds / 5 minutes / 10 minutes / 15 minutes /
 *   wpm / in english / speed / practice / paragraph ...
 *   —— 平台词（app download / software / pc / android / apk）与「typing.com」品牌词
 *   不追：前者要装客户端，违背浏览器内零上传立场；后者是竞品品牌词。
 *
 * 纯前端：计时、比对、统计全在本机，无任何请求。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Duration = 15 | 30 | 60 | 120 | 300;

interface Result {
  wpm: number;
  cpm: number;
  accuracy: number;
  correctChars: number;
  totalChars: number;
  seconds: number;
  /** 每个字符的正确/错误/漏打，用于结果图 */
  marks: Array<"ok" | "bad" | "miss" | "pending">;
}

const PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog while the sun sets slowly behind the distant hills, and the quiet evening air carries the faint sound of a river running past the old stone bridge.",
  "Typing is a skill that rewards accuracy before speed. If you rush and make mistakes, you will spend more time correcting than typing, so it pays to slow down until your fingers know the path without thinking about it.",
  "Every small daily improvement compounds. A person who types ten extra words per minute across a working year recovers hundreds of hours, and those hours are the ones that otherwise disappear into repetitive data entry.",
  "Good posture matters more than most people expect. Keep your wrists floating rather than planted, sit back in the chair, and let your forearms take the weight. Tension in the hands turns into tension in the shoulders within minutes.",
  "A keyboard is a tool, not a test of character. The numbers matter when you compare your own progress over time, but they do not define what you are capable of. Speed follows familiarity; accuracy follows care.",
];

const CN_PARAGRAPH =
  "清晨六点，城市还没有完全醒来。街道上只有零星的行人和第一班公交车。早餐店的蒸汽从窗口飘出来，混合着油条和豆浆的味道。有人快步走过，有人停下来看手机。这是普通的一天，但对很多人来说，新的一天已经开始。";

function pickText(lang: "en" | "zh", seed: number): string {
  if (lang === "zh") return CN_PARAGRAPH;
  return PARAGRAPHS[seed % PARAGRAPHS.length];
}

/** 标准 WPM：5 个字符算 1 个「词」，中文按 1 字 = 1 词折算前的常见做法是按字符/5 */
function computeWpm(chars: number, seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round(chars / 5 / (seconds / 60));
}

export default function TypingTestTool() {
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [duration, setDuration] = useState<Duration>(60);
  const [target, setTarget] = useState(() => pickText("en", 0));
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [liveWpm, setLiveWpm] = useState(0);

  const startedAt = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /** 逐字符比对：ok / bad / miss（目标有、用户没打）/ pending（还没轮到） */
  const marks = useMemo(() => {
    const out: Result["marks"] = [];
    for (let i = 0; i < target.length; i++) {
      if (i >= typed.length) {
        out.push("pending");
      } else if (typed[i] === target[i]) {
        out.push("ok");
      } else {
        out.push("bad");
      }
    }
    // 用户多打出来的部分一律算错
    for (let i = target.length; i < typed.length; i++) out.push("bad");
    return out;
  }, [target, typed]);

  const finish = useCallback(
    (seconds: number) => {
      stopTimer();
      setRunning(false);

      const chars = target.slice(0, typed.length).split("");
      let correct = 0;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === typed[i]) correct++;
      }

      const total = Math.max(target.length, typed.length);
      setResult({
        wpm: computeWpm(correct, seconds),
        cpm: Math.round((typed.length / Math.max(seconds, 1)) * 60),
        accuracy: total === 0 ? 100 : Math.round((correct / total) * 100),
        correctChars: correct,
        totalChars: total,
        seconds,
        marks: [],
      });
    },
    [stopTimer, target, typed],
  );

  // 计时器：只在 running 时存在
  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(s);
      setLiveWpm(computeWpm(typed.length, s));
      if (s >= duration) finish(duration);
    }, 250);
    return () => stopTimer();
  }, [running, duration, typed.length, finish, stopTimer]);

  const handleStart = () => {
    setTarget(pickText(lang, Math.floor(Date.now() / 60000)));
    setTyped("");
    setResult(null);
    setElapsed(0);
    setLiveWpm(0);
    setRunning(true);
  };

  const handleStop = () => {
    if (!running) return;
    finish(elapsed);
  };

  const remaining = Math.max(0, duration - elapsed);
  const progress = Math.min(100, (elapsed / duration) * 100);

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">Text language</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as "en" | "zh")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zh">中文</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Test length</Label>
            <Select
              value={String(duration)}
              onValueChange={(v) => setDuration(Number(v) as Duration)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 seconds</SelectItem>
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">60 seconds</SelectItem>
                <SelectItem value="120">2 minutes</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!running && !result ? (
            <Button onClick={handleStart} size="lg">
              Start test
            </Button>
          ) : null}
          {running ? (
            <Button onClick={handleStop} size="lg" variant="outline">
              Finish now
            </Button>
          ) : null}
          {result ? (
            <Button onClick={handleStart} size="lg">
              Test again
            </Button>
          ) : null}

          {running ? (
            <div className="flex items-center gap-4 text-sm">
              <span>
                <strong>{remaining}</strong>s left
              </span>
              <span>
                <strong>{liveWpm}</strong> WPM live
              </span>
            </div>
          ) : null}
        </div>

        {running ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </Card>

      <Card className="p-5">
        <p className="mb-3 text-sm font-semibold">Type the text below</p>
        <div className="rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
          {target.split("").map((ch, i) => {
            const mark = marks[i];
            const cls =
              mark === "ok"
                ? "text-green-600"
                : mark === "bad"
                  ? "bg-red-200 text-red-900"
                  : mark === "miss"
                    ? "bg-amber-200 text-amber-900"
                    : "text-muted-foreground";
            return (
              <span key={i} className={cls}>
                {ch === " " ? "\u00a0" : ch}
              </span>
            );
          })}
        </div>

        <Textarea
          value={typed}
          onChange={(e) => {
            if (!running) return;
            setTyped(e.target.value);
          }}
          disabled={!running}
          placeholder={running ? "Start typing…" : "Press Start test to begin"}
          rows={5}
          className="mt-4 font-mono"
          spellCheck={false}
          autoFocus={running}
        />
      </Card>

      {result ? (
        <Card className="p-5">
          <p className="mb-4 text-sm font-semibold">Your result</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="WPM" value={String(result.wpm)} />
            <Stat label="CPM" value={String(result.cpm)} />
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
            <Stat label="Time used" value={`${result.seconds}s`} />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {result.correctChars} of {result.totalChars} characters correct. WPM counts five
            characters as one word, the standard used by most typing tests — so a 40 WPM result is
            about 200 characters a minute.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={async () => {
              const lines = [
                `WPM: ${result.wpm}`,
                `CPM: ${result.cpm}`,
                `Accuracy: ${result.accuracy}%`,
                `Time: ${result.seconds}s`,
              ].join("\n");
              try {
                await navigator.clipboard.writeText(lines);
                toast.success("Result copied");
              } catch {
                toast.error("Copy failed");
              }
            }}
          >
            Copy result
          </Button>
        </Card>
      ) : null}

      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">How the numbers work</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li>WPM counts five characters as one word — the convention typing tests share, so results are comparable.</li>
          <li>CPM is raw characters per minute and is roughly five times the WPM figure.</li>
          <li>
            Accuracy is correct characters divided by everything you produced, so speed bought with
            mistakes shows up here rather than flattering your WPM.
          </li>
          <li>Everything runs in this tab. There is no account, no upload, and no stored history of your results.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}