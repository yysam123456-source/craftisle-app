import { toolMeta, CATEGORIES, type ToolMeta } from "@/lib/tools";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft, Check, X } from "lucide-react";

// Competitor data: which Craftisle tools compete with which competitor
const COMPETITOR_MAP: Record<string, { name: string; url: string; tools: string[]; description: string }> = {
  "smallpdf": {
    name: "Smallpdf",
    url: "https://smallpdf.com",
    tools: ["pdf-merger", "pdf-splitter", "pdf-compressor", "image-to-pdf", "pdf-to-image"],
    description: "Smallpdf is a popular PDF tool suite with Freemium model and file size limits on free tier.",
  },
  "ilovepdf": {
    name: "iLovePDF",
    url: "https://www.ilovepdf.com",
    tools: ["pdf-merger", "pdf-splitter", "pdf-compressor", "image-to-pdf", "pdf-to-image"],
    description: "iLovePDF offers PDF tools with a clean interface, but requires signup for batch processing.",
  },
  "jsonformatter": {
    name: "JSONFormatter.org",
    url: "https://jsonformatter.org",
    tools: ["json-formatter"],
    description: "JSONFormatter.org is a dedicated JSON tool, but shows ads and has no related dev tools.",
  },
  "regex101": {
    name: "Regex101",
    url: "https://regex101.com",
    tools: ["regex"],
    description: "Regex101 is a powerful regex tester, but requires account to save patterns.",
  },
  "qrcode-generator": {
    name: "QR Code Generator (the-qrcode-generator.com)",
    url: "https://www.the-qrcode-generator.com",
    tools: ["qrcode"],
    description: "Many QR code sites add watermarks or limit customization. Craftisle offers full customization free.",
  },
  "base64encode": {
    name: "Base64Encode.org",
    url: "https://base64encode.org",
    tools: ["base64"],
    description: "Base64Encode.org is simple but has no file upload support. Craftisle supports drag-and-drop files.",
  },
};

interface Props {
  params: Promise<{ competitor: string }>;
}

export async function generateStaticParams() {
  return Object.keys(COMPETITOR_MAP).map((competitor) => ({ competitor }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { competitor } = await params;
  const data = COMPETITOR_MAP[competitor];
  if (!data) return {};

  const url = `https://craftisle.com/compare/${competitor}`;
  return {
    title: `${data.name} Alternative — Free Online Tools | Craftisle`,
    description: `Looking for a ${data.name} alternative? Craftisle offers 60+ free online tools — no signup, no file size limits, 100% browser-based.`,
    keywords: [
      `${data.name} alternative`,
      `free ${data.name} alternative`,
      `${data.name} vs Craftisle`,
      "free online tools no signup",
      "better than " + data.name.toLowerCase(),
      "Craftisle alternative",
    ],
    openGraph: {
      title: `${data.name} Alternative — Free Online Tools | Craftisle`,
      description: `Free ${data.name} alternative. No signup, no limits.`,
      url,
      type: "website",
      locale: "en_US",
    },
    alternates: { canonical: url },
  };
}

export default async function ComparePage({ params }: Props) {
  const { competitor } = await params;
  const data = COMPETITOR_MAP[competitor];
  if (!data) notFound();

  const matchedTools = data.tools
    .map((id) => ({ id, meta: toolMeta[id] }))
    .filter((t) => t.meta) as { id: string; meta: ToolMeta }[];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/compare" className="hover:text-foreground">Compare</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{data.name}</span>
      </nav>

      <Link
        href="/compare"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Comparisons
      </Link>

      <header className="space-y-4 mb-10">
        <Badge variant="secondary">Comparison</Badge>
        <h1 className="text-3xl font-bold tracking-tight">
          {data.name} Alternative: Free Online Tools by Craftisle
        </h1>
        <p className="text-lg text-muted-foreground">
          {data.description} Craftisle offers a free, no-signup alternative
          with 60+ tools in one place.
        </p>
      </header>

      {/* Comparison Table */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Feature</th>
                <th className="text-center p-3">{data.name}</th>
                <th className="text-center p-3 bg-primary/5">Craftisle</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3 font-medium">Signup Required</td>
                <td className="text-center p-3"><X className="inline h-4 w-4 text-red-500" /></td>
                <td className="text-center p-3 bg-primary/5"><Check className="inline h-4 w-4 text-green-500" /> No</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Free to Use</td>
                <td className="text-center p-3"><Check className="inline h-4 w-4 text-green-500" /> Partial</td>
                <td className="text-center p-3 bg-primary/5"><Check className="inline h-4 w-4 text-green-500" /> Fully Free</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">File Size Limits</td>
                <td className="text-center p-3"><X className="inline h-4 w-4 text-red-500" /> Yes</td>
                <td className="text-center p-3 bg-primary/5"><Check className="inline h-4 w-4 text-green-500" /> Browser-limited only</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Number of Tools</td>
                <td className="text-center p-3">Limited</td>
                <td className="text-center p-3 bg-primary/5 font-semibold">60+</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Data Privacy</td>
                <td className="text-center p-3">Server upload</td>
                <td className="text-center p-3 bg-primary/5 font-semibold">100% Client-side</td>
              </tr>
              <tr className="border-b">
                <td className="p-3 font-medium">Ads</td>
                <td className="text-center p-3"><X className="inline h-4 w-4 text-red-500" /> Yes</td>
                <td className="text-center p-3 bg-primary/5">Minimal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Matched Tools */}
      {matchedTools.length > 0 && (
        <section className="space-y-4 mb-10">
          <h2 className="text-2xl font-semibold">
            {data.name} Alternatives on Craftisle
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {matchedTools.map(({ id, meta }) => (
              <div key={id} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{meta.icon}</span>
                  <h3 className="font-semibold">{meta.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{meta.desc}</p>
                <Link href={`/tools/${id}`}>
                  <Button size="sm">Open Tool →</Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl border bg-primary/5 p-6 text-center space-y-4">
        <h2 className="text-xl font-semibold">Try Craftisle — Free, No Signup</h2>
        <p className="text-muted-foreground text-sm">
          60+ free online tools. 100% browser-based. No limits.
        </p>
        <Link href="/tools">
          <Button size="lg">Browse All Tools →</Button>
        </Link>
      </section>
    </div>
  );
}
