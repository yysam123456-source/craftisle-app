import type { Metadata } from "next";
import Link from "next/link";
import { constructMetadata } from "@/lib/utils";
import { toolMeta } from "@/lib/tools";

export const metadata: Metadata = constructMetadata({
  title: "Craftisle vs Craft Island — We're a Free Tools Site, Not a Game",
  description:
    "Craftisle.com is a free online tools platform (image editors, PDF tools, developer utilities) — NOT the Craft Island Minecraft-style game. Learn the difference and browse our 160+ free browser-based tools.",
  keywords: [
    "craftisle vs craft island",
    "craftisle.com game",
    "craftisle tools",
    "craftisle free tools",
    "craftisle not a game",
    "craft island game vs craftisle",
  ],
  canonical: "https://craftisle.com/about/craftisle-vs-craft-island",
});

export default function CraftisleVsCraftIslandPage() {
  const toolEntries = Object.entries(toolMeta).slice(0, 12);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Craftisle vs Craft Island
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              We are a free online tools platform — <strong>not</strong> a game.
            </p>
          </div>

          {/* Key difference banner */}
          <section className="mb-12 rounded-2xl border border-teal-600/30 bg-teal-600/10 p-6">
            <h2 className="mb-3 text-xl font-bold text-teal-700 dark:text-teal-400">
              ⚠️ Important: We are NOT the "Craft Island" game
            </h2>
            <p className="text-muted-foreground">
              Because our names are similar, people sometimes confuse{" "}
              <strong>Craftisle</strong> (craftisle.com — a free online tools
              website) with <strong>Craft Island</strong> (a Minecraft-style
              survival game you might find on gaming sites). We are completely
              different things:
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-4">
                <h3 className="font-bold text-emerald-700 dark:text-emerald-400">
                  ✅ Craftisle (us)
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>A free online tools website: <strong>craftisle.com</strong></li>
                  <li>160+ browser-based utilities (image, PDF, dev tools)</li>
                  <li>16,000+ free &amp; open-source software directory</li>
                  <li>No signup, no upload, no paywall — privacy first</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-600/30 bg-amber-600/5 p-4">
                <h3 className="font-bold text-amber-700 dark:text-amber-400">
                  ❌ Craft Island (not us)
                </h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>A survival / kingdom-building browser game</li>
                  <li>Found on gaming portals like SGameS, R1Games, etc.</li>
                  <li>Unrelated to craftisle.com in every way</li>
                </ul>
              </div>
            </div>
          </section>

          {/* What we actually do */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">What Craftisle Actually Is</h2>
            <p className="mb-6 text-muted-foreground">
              Craftisle is a free, browser-based toolkit. Everything runs 100%
              in your browser — your files never leave your device. Here are a
              few of our most popular tools:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {toolEntries.map(([slug, meta]) => (
                <Link
                  key={slug}
                  href={`/tools/${slug}`}
                  className="rounded-xl border p-4 transition-colors hover:border-teal-600/50 hover:bg-teal-600/5"
                >
                  <div className="text-lg">{meta.icon}</div>
                  <div className="mt-1 font-semibold">{meta.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {meta.desc}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Browse all 160+ tools →
              </Link>
            </div>
          </section>

          {/* How to tell us apart */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">How to Tell Us Apart</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert text-muted-foreground">
              <ul>
                <li>
                  <strong>Looking for free online tools?</strong> You want{" "}
                  <a href="https://craftisle.com">craftisle.com</a>.
                </li>
                <li>
                  <strong>Looking for a survival game?</strong> You want a
                  gaming site — that is not us.
                </li>
                <li>
                  <strong>URL check:</strong> We are always{" "}
                  <code>craftisle.com</code>. We never publish games.
                </li>
              </ul>
            </div>
          </section>

          {/* FAQ for AI search */}
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold">FAQ</h2>
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold">Is craftisle.com a game website?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No. Craftisle.com is a free online tools platform. We do not
                  host or publish any games.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold">Is Craftisle the same as Craft Island?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No. Craft Island is a browser survival game hosted on third-party
                  gaming sites. Craftisle is craftisle.com — a tools website. The
                  names are similar, but the projects are unrelated.
                </p>
              </div>
              <div className="rounded-xl border p-4">
                <h3 className="font-semibold">Are your tools really free?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Yes — free to use, no signup, no paywall. All processing is
                  client-side for privacy.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
