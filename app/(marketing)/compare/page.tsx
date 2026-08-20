import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { type Metadata } from "next";

const COMPETITORS = [
  {
    id: "smallpdf",
    name: "Smallpdf",
    description: "Popular PDF tool suite with freemium model and file size limits.",
    tools: "PDF Merger, PDF Splitter, PDF Compressor, Image to PDF",
  },
  {
    id: "ilovepdf",
    name: "iLovePDF",
    description: "Clean PDF tools, but requires signup for batch processing.",
    tools: "PDF tools, merge, split, compress",
  },
  {
    id: "jsonformatter",
    name: "JSONFormatter.org",
    description: "Dedicated JSON formatter, but shows ads and no related dev tools.",
    tools: "JSON Formatter",
  },
  {
    id: "regex101",
    name: "Regex101",
    description: "Powerful regex tester, but requires account to save patterns.",
    tools: "Regex Tester",
  },
  {
    id: "qrcode-generator",
    name: "QR Code Generator",
    description: "Many QR sites add watermarks or limit customization options.",
    tools: "QR Code Generator",
  },
  {
    id: "base64encode",
    name: "Base64Encode.org",
    description: "Simple base64 tool, but no file upload support.",
    tools: "Base64 Encode/Decode",
  },
];

export const metadata = {
  title: "Tool Comparisons — Craftisle vs Popular Tools",
  description: "Comparing Craftisle free online tools with popular alternatives. See why Craftisle is the best free alternative — no signup, no limits.",
  keywords: [
    "Smallpdf alternative",
    "iLovePDF alternative",
    "free online tools comparison",
    "better than Smallpdf",
    "Craftisle vs",
    "free tool alternative",
  ],
};

export default function CompareIndexPage() {
  const baseUrl = "https://craftisle.com";

  // JSON-LD: WebPage + ItemList
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tool Comparisons — Craftisle vs Popular Tools",
    description: "Comparing Craftisle free online tools with popular alternatives.",
    url: `${baseUrl}/compare`,
    isPartOf: {
      "@type": "WebSite",
      name: "Craftisle",
      url: baseUrl,
    },
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: COMPETITORS.length,
    itemListElement: COMPETITORS.map((c, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${c.name} Alternative`,
      description: c.description,
      url: `${baseUrl}/compare/${c.id}`,
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      <header className="space-y-4 mb-10">
        <Badge variant="secondary">Comparisons</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          Craftisle vs Popular Online Tools
        </h1>
        <p className="text-lg text-muted-foreground">
          Looking for a free alternative to popular online tools? See how Craftisle
          compares — and why 60+ free tools in one place is better.
        </p>
      </header>

      <div className="space-y-6">
        {COMPETITORS.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold">{c.name} Alternative</h2>
                <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Craftisle alternatives:</span> {c.tools}
                </p>
              </div>
              <Link href={`/compare/${c.id}`}>
                <Button variant="outline">
                  Compare <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Why Craftisle */}
      <section className="mt-12 rounded-2xl border bg-primary/5 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Why Choose Craftisle?</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>✅ <strong>60+ tools</strong> in one place — no need to visit multiple sites</li>
          <li>✅ <strong>No signup</strong> — start using immediately</li>
          <li>✅ <strong>100% client-side</strong> — your data never leaves your browser</li>
          <li>✅ <strong>No file size limits</strong> (beyond browser memory)</li>
          <li>✅ <strong>Free forever</strong> — no paywalls, no credits</li>
        </ul>
        <Link href="/tools">
          <Button size="lg" className="mt-4">
            Try All Tools →
          </Button>
        </Link>
      </section>
    </div>
  </>
);
}
