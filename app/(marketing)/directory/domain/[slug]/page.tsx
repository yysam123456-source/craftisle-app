import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";
import { constructMetadata } from "@/lib/utils";
import { getAllCategories } from "@/lib/fmhy-data";
import { getDomainGroups } from "@/lib/category-domains";
import { DOMAINS, getDomainForCategoryId, formatCategoryName } from "@/lib/unified-categories";
import { notFound } from "next/navigation";

interface DomainPageProps {
  params: Promise<{ slug: string }>;
}

const DATE_MODIFIED = "2026-06-09";

export async function generateStaticParams() {
  return DOMAINS.map((d) => ({ slug: d.id }));
}

export async function generateMetadata({
  params,
}: DomainPageProps): Promise<Metadata> {
  const { slug } = await params;
  const domain = DOMAINS.find((d) => d.id === slug);
  if (!domain) return constructMetadata({ title: "Domain Not Found" });

  const allCats = getAllCategories();
  const domainCats = allCats.filter((c) => getDomainForCategoryId(c.id) === slug);
  const totalResources = domainCats.reduce((sum, c) => sum + (c.count || 0), 0);

  const domainKeywords: Record<string, string[]> = {
    "ai-ml": [
      "best free AI tools 2026",
      "free machine learning tools no signup",
      "ChatGPT alternative free",
      "free AI image generator",
      "Midjourney alternative free",
    ],
    devops: [
      "best free DevOps tools 2026",
      "free CI/CD tools no credit card",
      "Kubernetes alternative free",
      "free Docker alternative",
      "best free cloud monitoring tools",
    ],
    "dev-programming": [
      "best free developer tools 2026",
      "free coding tools no signup",
      "Visual Studio Code alternative free",
      "best free API testing tools",
      "Postman alternative free",
    ],
    "design-media": [
      "best free design tools 2026",
      "free image editor no signup",
      "Photoshop alternative free",
      "best free video editor no watermark",
      "Figma alternative free",
    ],
    security: [
      "best free security tools 2026",
      "free VPN no signup",
      "NordVPN alternative free",
      "best free password manager",
      "free antivirus alternative",
    ],
    "edu-learning": [
      "best free learning platforms 2026",
      "free coding courses no signup",
      "Codecademy alternative free",
      "best free certification courses",
      "free programming tutorials",
    ],
    "comm-social": [
      "best free communication tools 2026",
      "free team chat no signup",
      "Slack alternative free",
      "best free video conferencing",
      "Zoom alternative free",
    ],
    "prod-office": [
      "best free productivity tools 2026",
      "free project management no signup",
      "Trello alternative free",
      "best free note taking app",
      "Notion alternative free",
    ],
    cloud: [
      "best free cloud platform 2026",
      "free AWS alternative no credit card",
      "DigitalOcean alternative free",
      "best free VPS hosting",
      "free S3 storage alternative",
    ],
    media: [
      "best free media tools 2026",
      "free video player no ads",
      "VLC alternative free",
      "best free streaming tools",
      "Spotify alternative free",
    ],
    misc: [
      "best free online tools 2026",
      "free utility tools no signup",
      "best free browser-based tools",
      "free alternative to paid software",
    ],
  };

  return constructMetadata({
    title: `Best Free ${domain.name} Tools & Resources 2026`,
    description: `Browse ${totalResources}+ free ${domain.name.toLowerCase()} tools, APIs, and software. 100% free, no signup. Best alternative to paid ${domain.name} tools.`,
    image: `/og/domain-${slug}.png`,
    keywords: domainKeywords[slug] || [
      `best free ${domain.name.toLowerCase()} tools 2026`,
      `free ${domain.name.toLowerCase()} resources`,
      `${domain.name.toLowerCase()} software free no signup`,
      `free alternative to paid ${domain.name.toLowerCase()} tools`,
      "free developer tools",
    ],
  });
}

export default async function DomainPage({ params }: DomainPageProps) {
  const { slug } = await params;
  const domain = DOMAINS.find((d) => d.id === slug);
  if (!domain) notFound();

  const allCats = getAllCategories();
  const domainCats = allCats.filter(
    (c) => getDomainForCategoryId(c.id) === slug,
  );
  const totalResources = domainCats.reduce(
    (sum, c) => sum + (c.count || 0),
    0,
  );

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${domain.name} Resources`,
    description: domain.description,
    url: `https://craftisle.app/directory/domain/${slug}`,
    dateModified: DATE_MODIFIED,
    publisher: {
      "@type": "Organization",
      name: "Craftisle",
      url: "https://craftisle.app",
    },
    numberOfItems: totalResources,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://craftisle.app" },
        { "@type": "ListItem", position: 2, name: "Directory", item: "https://craftisle.app/directory" },
        { "@type": "ListItem", position: 3, name: domain.name, item: `https://craftisle.app/directory/domain/${slug}` },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="border-b bg-muted/30 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/directory" className="hover:text-primary">Directory</Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{domain.name}</span>
          </nav>

          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${DOMAINS.find(d => d.id === slug)?.color || "from-gray-500 to-slate-600"} flex items-center justify-center text-3xl shrink-0`}>
              {domain.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {domain.name}
              </h1>
              <p className="mt-2 text-muted-foreground">{domain.description}</p>
              <div className="flex gap-3 mt-2">
                <Badge variant="secondary">{domainCats.length} categories</Badge>
                <Badge variant="secondary">{totalResources.toLocaleString()} resources</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category List */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-6">
            All {domain.name} Categories
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domainCats.map((cat) => (
              <Link
                key={cat.id}
                href={`/directory/${cat.id}`}
                className="group rounded-xl border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{cat.icon || "📦"}</span>
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {cat.name || formatCategoryName(cat.id)}
                  </h3>
                </div>
                {cat.description ? (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {cat.description}
                  </p>
                ) : null}
                <Badge variant="secondary" className="text-xs">
                  {cat.count?.toLocaleString() || 0} resources
                </Badge>
              </Link>
            ))}
          </div>

          {/* FAQ */}
          <section className="py-12 border-t">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold mb-6">
                FAQ: {domain.name} Resources
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <h3 className="font-semibold mb-2">
                    What are the best free {domain.name.toLowerCase()} tools in 2026?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Browse our curated list of {totalResources}+ free {domain.name.toLowerCase()} tools and resources.
                    All are free to use, no signup required.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    How to find free {domain.name.toLowerCase()} alternatives to paid software?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Use our directory to discover free alternatives to paid {domain.name.toLowerCase()} software.
                    Each resource is tagged with its source (FMHY, free-for-dev, self-hosted, public-APIs).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">
                    Are these {domain.name.toLowerCase()} tools really free?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Yes — all tools listed are free (with optional paid tiers). We verify each entry before adding it to the directory.
                    No credit card required for any listed tool.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link
              href="/directory"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              ← Back to all categories
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
