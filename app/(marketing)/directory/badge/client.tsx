"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

const BADGE_HTML = (
  resourceSlug: string,
  resourceName: string,
) => `<a href="https://craftisle.com/directory/resource/${resourceSlug}" target="_blank" rel="dofollow">
  <img
    src="https://craftisle.com/badges/listed-on-craftisle.svg"
    alt="Listed on Craftisle"
    style="height: 32px;"
  />
</a>`;

const BADGE_MARKDOWN = (
  resourceSlug: string,
  resourceName: string,
) => `[![Listed on Craftisle](https://craftisle.com/badges/listed-on-craftisle.svg)](https://craftisle.com/directory/resource/${resourceSlug})`;

export default function BadgePage() {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [resourceName, setResourceName] = useState("");
  const [resourceSlug, setResourceSlug] = useState("");

  const htmlCode = BADGE_HTML(resourceSlug, resourceName);
  const mdCode = BADGE_MARKDOWN(resourceSlug, resourceName);

  async function copyToClipboard(text: string, type: "html" | "md") {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "html") {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else {
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
      }
    } catch {
      // fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      if (type === "html") {
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } else {
        setCopiedMd(true);
        setTimeout(() => setCopiedMd(false), 2000);
      }
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Craftisle Badge</h1>
      <p className="text-gray-600 mb-8">
        If your open-source project is listed on Craftisle, show it off!
        Add this badge to your READM or website.
      </p>

      {/* 预览 */}
      <Card className="p-6 mb-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Badge Preview</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg bg-muted/20">
          <span className="text-green-600">✓</span>
          <span className="text-sm font-medium">Listed on Craftisle</span>
        </div>
      </Card>

      {/* 资源信息 */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Resource</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Resource Name</label>
            <input
              type="text"
              placeholder="e.g. My Awesome Tool"
              value={resourceName}
              onChange={(e) => setResourceName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Resource Slug</label>
            <input
              type="text"
              placeholder="e.g. my-awesome-tool"
              value={resourceSlug}
              onChange={(e) => setResourceSlug(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </Card>

      {/* HTML 代码 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">HTML</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(htmlCode, "html")}
          >
            {copiedHtml ? (
              <Check className="w-4 h-4 mr-1 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copiedHtml ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="bg-muted/30 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{htmlCode}</code>
        </pre>
      </Card>

      {/* Markdown 代码 */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Markdown</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(mdCode, "md")}
          >
            {copiedMd ? (
              <Check className="w-4 h-4 mr-1 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            {copiedMd ? "Copied!" : "Copy"}
          </Button>
        </div>
        <pre className="bg-muted/30 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{mdCode}</code>
        </pre>
      </Card>

      <p className="text-xs text-gray-400 text-center">
        The badge image is hosted by Craftisle. By using this badge, you agree to link back to Craftisle.
      </p>
    </div>
  );
}
