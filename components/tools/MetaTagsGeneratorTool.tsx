"use client";

/**
 * Meta Tags Generator（SEO meta 标签生成器）
 *
 * 需求依据（Bing Suggest 2026-10-15，24 条建议）：
 *   meta tags generator / open graph meta tags generator /
 *   meta content tag generator / meta tags font generator ...
 *   —— 这些都是「生成器」意图，浏览器内完全可满足，不需要装插件。
 *
 * 纯前端：只生成文本，不请求任何接口（不调 fonts.googleapis.com 去探测字体是否存在，
 * 那既是上传也是无谓的网络依赖）。字体检测改为提示用户自行确认。
 */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export interface MetaInput {
  title: string;
  description: string;
  url: string;
  siteName: string;
  image: string;
  keywords: string;
  author: string;
  locale: string;
  twitterCard: "summary" | "summary_large_image";
  twitterSite: string;
  includeRobots: boolean;
  includeCanonical: boolean;
  includeOg: boolean;
  includeTwitter: boolean;
  themeColor: string;
}

export const EMPTY_META: MetaInput = {
  title: "",
  description: "",
  url: "",
  siteName: "",
  image: "",
  keywords: "",
  author: "",
  locale: "en_US",
  twitterCard: "summary_large_image",
  twitterSite: "",
  includeRobots: true,
  includeCanonical: true,
  includeOg: true,
  includeTwitter: true,
  themeColor: "",
};

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * 生成标签。导出以便 Node 端单测（组件是 .tsx）。
 * 属性值一律转义 —— 用户会把生成结果原样贴进 HTML，
 * 一个未转义的引号就能提前闭合属性。
 */
export function generateMetaTags(m: MetaInput): string {
  const out: string[] = [];

  if (m.includeRobots && m.title) out.push('<meta name="robots" content="index, follow">');

  if (m.includeCanonical && m.url) out.push(`<link rel="canonical" href="${esc(m.url)}">`);

  out.push(`<title>${esc(m.title || "Page title")}</title>`);
  out.push(`<meta name="description" content="${esc(m.description)}">`);

  if (m.keywords) {
    out.push(`<meta name="keywords" content="${esc(m.keywords)}">`);
  }
  if (m.author) out.push(`<meta name="author" content="${esc(m.author)}">`);
  if (m.themeColor) out.push(`<meta name="theme-color" content="${esc(m.themeColor)}">`);

  if (m.includeOg) {
    out.push('<meta property="og:type" content="website">');
    out.push(`<meta property="og:title" content="${esc(m.title)}">`);
    out.push(`<meta property="og:description" content="${esc(m.description)}">`);
    if (m.url) out.push(`<meta property="og:url" content="${esc(m.url)}">`);
    if (m.siteName) out.push(`<meta property="og:site_name" content="${esc(m.siteName)}">`);
    if (m.image) out.push(`<meta property="og:image" content="${esc(m.image)}">`);
    if (m.locale) out.push(`<meta property="og:locale" content="${esc(m.locale)}">`);
  }

  if (m.includeTwitter) {
    out.push(`<meta name="twitter:card" content="${m.twitterCard}">`);
    out.push(`<meta name="twitter:title" content="${esc(m.title)}">`);
    out.push(`<meta name="twitter:description" content="${esc(m.description)}">`);
    if (m.image) out.push(`<meta name="twitter:image" content="${esc(m.image)}">`);
    if (m.twitterSite)
      out.push(`<meta name="twitter:site" content="${esc(m.twitterSite)}">`);
  }

  return out.join("\n");
}

export default function MetaTagsGeneratorTool() {
  const [m, setM] = useState<MetaInput>(EMPTY_META);
  const output = useMemo(() => generateMetaTags(m), [m]);

  const set = <K extends keyof MetaInput>(k: K, v: MetaInput[K]) =>
    setM((p) => ({ ...p, [k]: v }));

  const titleLen = m.title.length;
  const descLen = m.description.length;

  return (
    <div className="space-y-5">
      <Card className="p-5 space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold">Page title</Label>
          <Input value={m.title} onChange={(e) => set("title", e.target.value)} placeholder="My page title" />
          <p className={`text-xs ${titleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
            {titleLen} characters{titleLen > 60 ? " — over 60 will be truncated in results" : " (aim for 50–60)"}
          </p>
        </div>

        <div className="space-y-2">
          <Label className="font-semibold">Meta description</Label>
          <Textarea
            value={m.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="One or two sentences describing the page."
            rows={3}
          />
          <p className={`text-xs ${descLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
            {descLen} characters{descLen > 160 ? " — over 160 will be truncated in results" : " (aim for 150–160)"}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">Page URL</Label>
            <Input value={m.url} onChange={(e) => set("url", e.target.value)} placeholder="https://example.com/page" />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Site name</Label>
            <Input value={m.siteName} onChange={(e) => set("siteName", e.target.value)} placeholder="Example" />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Share image URL</Label>
            <Input value={m.image} onChange={(e) => set("image", e.target.value)} placeholder="https://example.com/og.png" />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Locale</Label>
            <Input value={m.locale} onChange={(e) => set("locale", e.target.value)} placeholder="en_US" />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Author</Label>
            <Input value={m.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Keywords (comma separated)</Label>
            <Input value={m.keywords} onChange={(e) => set("keywords", e.target.value)} />
            <p className="text-xs text-muted-foreground">
              Google ignores this tag. It is included because other engines and some internal search
              tools still read it — not because it will rank you.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Theme colour</Label>
            <Input value={m.themeColor} onChange={(e) => set("themeColor", e.target.value)} placeholder="#ffffff" />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Twitter card type</Label>
            <select
              value={m.twitterCard}
              onChange={(e) => set("twitterCard", e.target.value as MetaInput["twitterCard"])}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="summary_large_image">summary_large_image</option>
              <option value="summary">summary</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">Twitter @handle</Label>
            <Input value={m.twitterSite} onChange={(e) => set("twitterSite", e.target.value)} placeholder="@handle" />
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={m.includeCanonical} onCheckedChange={(v) => set("includeCanonical", v)} />
            <span>
              canonical link
              <span className="block text-xs text-muted-foreground">tells search engines which URL is the real one</span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={m.includeOg} onCheckedChange={(v) => set("includeOg", v)} />
            <span>
              Open Graph
              <span className="block text-xs text-muted-foreground">how the page looks when shared on Facebook, Slack, LinkedIn</span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={m.includeTwitter} onCheckedChange={(v) => set("includeTwitter", v)} />
            <span>
              Twitter cards
              <span className="block text-xs text-muted-foreground">X / Twitter previews</span>
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={m.includeRobots} onCheckedChange={(v) => set("includeRobots", v)} />
            <span>
              robots
              <span className="block text-xs text-muted-foreground">omit while staging to keep the page out of the index</span>
            </span>
          </label>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Label className="font-semibold">Generated tags</Label>
          <Button
            size="sm"
            variant="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(output);
                toast.success("Copied — paste into the <head>.");
              } catch {
                toast.error("Copy failed");
              }
            }}
          >
            Copy
          </Button>
        </div>
        <pre className="overflow-x-auto rounded-lg bg-muted/50 p-4 font-mono text-xs leading-relaxed">
          {output}
        </pre>
      </Card>

      <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="mb-1 font-medium text-foreground">What these tags actually do</p>
        <ul className="list-disc space-y-1 pl-5 text-xs">
          <li><code className="mx-1">title</code> and <code className="mx-1">description</code> are the two that affect how your page appears in results.</li>
          <li>Open Graph and Twitter cards control link previews when someone shares the URL — they do not affect ranking.</li>
          <li>canonical is the important one for duplicates: it tells search engines which of several identical URLs to index.</li>
          <li>keywords is included but Google has ignored it since 2009. Nothing here is sent anywhere; it all happens in your browser.</li>
        </ul>
      </div>
    </div>
  );
}