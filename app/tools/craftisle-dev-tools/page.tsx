import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/utils";
import { PAGE_META } from "@/lib/seo/page-meta";

export const metadata: Metadata = constructMetadata({
  title: PAGE_META["/tools/craftisle-dev-tools"].title,
  description: PAGE_META["/tools/craftisle-dev-tools"].description,
  keywords: [
    "craftisle developer tools",
    "free online json formatter",
    "regex visualizer online",
    "cron expression generator",
    "jwt decoder online",
    "base64 encoder",
    "html formatter online",
  ],
  canonical: "https://craftisle.com/tools/craftisle-dev-tools",
});

const DEV_TOOLS = [
  { slug: "json-formatter", title: "JSON Formatter & Validator", desc: "Format, validate and prettify JSON with tree view." },
  { slug: "regex", title: "Regex Tester", desc: "Test regular expressions with real-time highlighting." },
  { slug: "regex-vis", title: "Regex Visualizer", desc: "Visualize regex patterns as interactive graphs." },
  { slug: "cron", title: "Cron Expression Generator", desc: "Build and parse cron expressions in plain language." },
  { slug: "jwt", title: "JWT Decoder", desc: "Decode JWT tokens and inspect payloads client-side." },
  { slug: "base64", title: "Base64 Encoder/Decoder", desc: "Encode and decode Base64 strings instantly." },
  { slug: "html-formatter", title: "HTML Formatter", desc: "Prettify and minify HTML with indentation." },
  { slug: "sql-formatter", title: "SQL Formatter", desc: "Format SQL queries for readability." },
  { slug: "yaml-formatter", title: "YAML Formatter", desc: "Validate and format YAML configuration files." },
  { slug: "csv-json", title: "CSV ⇄ JSON Converter", desc: "Convert between CSV and JSON with type detection." },
  { slug: "byte-converter", title: "Byte Converter", desc: "Convert between bytes, KB, MB, GB and more." },
  { slug: "url-encode", title: "URL Encoder/Decoder", desc: "Encode and decode URL components." },
];

export default function CraftisleDevToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Craftisle Developer Tools
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Free online developer utilities from Craftisle — JSON, regex,
              cron, JWT, Base64 and more.{" "}
              <strong>Runs entirely in your browser. No upload, no signup.</strong>
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEV_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group rounded-xl border p-5 transition-all hover:border-teal-600/50 hover:shadow-md"
              >
                <h2 className="font-semibold group-hover:text-teal-700 dark:group-hover:text-teal-400">
                  {tool.title}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{tool.desc}</p>
              </Link>
            ))}
          </div>

          <section className="mt-14 rounded-2xl border border-teal-600/30 bg-teal-600/5 p-6 text-center">
            <h2 className="text-xl font-bold">Powerful, private, and free</h2>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Every Craftisle developer tool processes data locally in your
              browser — perfect for handling sensitive code, tokens and
              configuration without sending anything to a server.
            </p>
            <Link
              href="/tools"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Browse all 160+ tools →
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
