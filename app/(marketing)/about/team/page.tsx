import Link from "next/link";
import { constructMetadata } from "@/lib/utils";

export const metadata = constructMetadata({
  title: "Our Team",
  description:
    "Meet the Craftisle team — building free, privacy-first online tools for everyone.",
  canonical: "https://craftisle.com/about/team",
});

const teamMembers = [
  {
    name: "Craftisle Team",
    role: "Core Contributors",
    bio: "We build free, browser-based tools that respect your privacy. No signup, no tracking, no nonsense.",
    avatar: "/logo.png",
  },
];

const advisors = [
  {
    name: "Open Source Community",
    role: "Contributors",
    bio: "Developers and designers who help improve Craftisle through feedback, bug reports, and feature suggestions.",
  },
];

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 space-y-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/about" className="hover:text-primary">
          About
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Team</span>
      </nav>

      {/* Page Header */}
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          Our Team
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Craftisle is built by a small, passionate team focused on
          making powerful tools accessible to everyone — free, private, and
          open.
        </p>
      </header>

      {/* Team Members */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Core Team</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl border bg-card p-6 space-y-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                  👨💻
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary">{member.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Advisors / Community */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Community</h2>
        <div className="rounded-2xl border bg-card p-6 space-y-4">
          <p className="text-muted-foreground">
            Craftisle is shaped by feedback from thousands of users
            worldwide. We believe great tools are built in public, with
            the community.
          </p>
          <div className="flex flex-wrap gap-2">
            {advisors.map((advisor) => (
              <div
                key={advisor.name}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                <span className="font-medium">{advisor.name}</span>
                <span className="text-muted-foreground ml-2">
                  — {advisor.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join / Contribute CTA */}
      <section className="rounded-2xl border bg-primary/5 p-8 text-center space-y-4">
        <h2 className="text-xl font-semibold">Want to Contribute?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Craftisle is open-source. Report bugs, suggest features, or
          contribute code on GitHub.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="https://github.com/craftisle/craftisle-app" target="_blank">
            <button className="rounded-lg bg-foreground text-background px-5 py-2 text-sm font-medium hover:opacity-90">
              View on GitHub
            </button>
          </Link>
          <Link href="/tools">
            <button className="rounded-lg border px-5 py-2 text-sm font-medium hover:bg-accent">
              Try Our Tools
            </button>
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "Our Team — Craftisle",
            description:
              "Meet the Craftisle team — building free, privacy-first online tools.",
            url: "https://craftisle.com/about/team",
            mainEntity: {
              "@type": "Organization",
              name: "Craftisle",
              url: "https://craftisle.com",
              logo: "https://craftisle.com/logo.png",
            },
          }),
        }}
      />
    </div>
  );
}
